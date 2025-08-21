'use client';

import React, { useEffect, useState } from 'react';
import { Search, Filter, Download, Calendar, Mail, Upload, Eye, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { SupplierLedger } from '@/types/accounting';
import type { ImportedRow as SharedImportedRow } from '@/types/accounting';
import { enrichEntriesAI } from '@/services/aiAdapter';
import FileImporter from '@/components/ui/FileImporter';
import UploadJustificatifModal from './UploadJustificatifModal';
import { useNotification } from '@/contexts/NotificationContextSimple';
import { CSVSanitizer } from '@/utils/csvSanitizer';
import { dedupBySignature, getSupplierLedgerSignature } from '@/utils/ledgerDedup';
import { getSupplierLedgerCache, setSupplierLedgerCache, clearSupplierLedgerCache } from '@/lib/supplierLedgerCache';

interface SuppliersLedgerPageProps {
  clientId: string;
}

const SuppliersLedgerPage: React.FC<SuppliersLedgerPageProps> = ({ clientId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('2024-01');
  const [importedEntries, setImportedEntries] = useState<SupplierLedger[]>([]);
  const { showNotification } = useNotification();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadContext, setUploadContext] = useState<{ entryId: string; clientId: string } | null>(null);
  const handleClearImport = () => {
    try { clearSupplierLedgerCache(clientId); } catch {}
    setImportedEntries([]);
  };

  // Plus de données d’exemple: la page n’affiche que les entrées importées
  // Charger depuis le cache mémoire comme pour les clients
  useEffect(() => {
    if (!clientId) return;
    const cached = getSupplierLedgerCache(clientId);
    if (cached && cached.length > 0) {
      setImportedEntries(cached);
    }
  }, [clientId]);
  const supplierLedgerEntries: SupplierLedger[] = [];

  // Fermer les modals internes si le parent se ferme
  useEffect(() => {
    const closeAll = () => {
      setUploadModalOpen(false);
      setUploadContext(null);
    };
    window.addEventListener('close-all-modals', closeAll as any);
    return () => window.removeEventListener('close-all-modals', closeAll as any);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    return date ? new Intl.DateTimeFormat('fr-FR').format(date) : '';
  };

  const handleImport = async (importedData: SharedImportedRow[]) => {
    console.log('🔍 Données fournisseurs importées:', importedData);
    
    let lastSupplierName = '';
    let lastAccountNumber = '';
    const newEntries: (SupplierLedger | null)[] = importedData
      .filter(row => row.isValid)
      .map((row, index) => {
        console.log(`🔍 Traitement ligne fournisseur ${row.index}:`, row.data);
        
        // Normalisation des en-têtes pour une recherche robuste (casse/accents/espaces)
        const normalize = (s: string) =>
          String(s || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '') // retire accents
            .replace(/^\uFEFF/, '') // retire BOM
            .replace(/[\u00a0\t]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const headerMap: Record<string, string> = {};
        Object.keys(row.data || {}).forEach((key) => {
          headerMap[normalize(key)] = key;
        });
        const headerKeysNorm = Object.keys(headerMap);
        const valuesList: string[] = Object.values(row.data || {}).map(v => String(v ?? ''));
        const extractFromAnyCell = (pattern: RegExp): string => {
          for (const v of valuesList) {
            const m = v.match(pattern);
            if (m && m[1]) return m[1].trim();
          }
          return '';
        };

        const fuzzyLookup = (candidates: string[]): string | '' => {
          // 1) Exact match on normalized
          for (const name of candidates) {
            const normName = normalize(name);
            if (headerMap[normName] !== undefined) {
              const k = headerMap[normName];
              const v = row.data[k];
              if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
            }
          }
          // 2) Includes match (either way, tolerate ponctuation)
          for (const name of candidates) {
            const normName = normalize(name);
            const key = headerKeysNorm.find(h => h.includes(normName) || normName.includes(h));
            if (key) {
              const orig = headerMap[key];
              const v = row.data[orig];
              if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
            }
          }
          return '';
        };
        const findColumnValue = (possibleNames: string[], fallbackHint?: 'ref' | 'supplier' | 'accountName' | 'accountNumber' | 'desc' | 'debit' | 'credit') => {
          const direct = fuzzyLookup(possibleNames);
          if (direct) return direct;
          if (fallbackHint) {
            const picker = (pred: (h: string) => boolean) => {
              const key = headerKeysNorm.find(pred);
              if (!key) return '';
              const v = row.data[headerMap[key]];
              return v !== undefined && v !== null && String(v).trim() !== '' ? String(v).trim() : '';
            };
            if (fallbackHint === 'ref') return picker(h => /(\bref\b|reference|piece|numero|num)/i.test(h));
            if (fallbackHint === 'supplier') return picker(h => /(fournisseur|supplier|raison sociale|rs)/i.test(h));
            if (fallbackHint === 'accountName') return picker(h => /(nom|libelle|intitule).*(compte)|compte.*(nom|libelle|intitule)/i.test(h));
            if (fallbackHint === 'accountNumber') return picker(h => /(code\s*compte|numero\s*compte|numero de compte|n[°o]?\s*compte|compte\s*(code|n[°o]?|num|numero))/i.test(h));
            if (fallbackHint === 'desc') return picker(h => /(libelle|description|designation|intitule)/i.test(h));
            if (fallbackHint === 'debit') return picker(h => /(\bmvt\s*debit\b|mouvement\s*debit|montant\s*debit|\bdebit\b)/i.test(h));
            if (fallbackHint === 'credit') return picker(h => /(\bmvt\s*credit\b|mouvement\s*credit|montant\s*credit|\bcredit\b)/i.test(h));
          }
          return '';
        };
        
        const dateStr = findColumnValue(['Date', 'date']);
        let supplierName = CSVSanitizer.sanitizeString(
          findColumnValue([
            'Nom Fournisseur', 'Fournisseur', 'Nom du fournisseur', 'Raison sociale', 'Fournisseur Nom', 'Nom compte', 'Nom du compte', 'supplierName'
          ], 'supplier')
        );
        // Essayer d'extraire depuis une cellule libre (ex: "Nom compte: …") si non trouvé
        if (!supplierName) {
          const extracted = extractFromAnyCell(/(?:nom\s*compte|nom du compte|fournisseur|raison\s*sociale)\s*[:\-]?\s*(.+)/i);
          if (extracted) supplierName = CSVSanitizer.sanitizeString(extracted);
        }
        let accountNumber = CSVSanitizer.sanitizeString(
          findColumnValue([
            'N° Compte', 'Compte N°', 'No Compte', 'N° compte', 'N° Compte', 'Numéro compte', 'Numéro de compte', 'Code Compte', 'Code compte', 'accountNumber'
          ], 'accountNumber')
        );
        if (!accountNumber) {
          const extractedAcc = extractFromAnyCell(/(?:n[°o]?\s*compte|code\s*compte|numero\s*compte|num[\.]?\s*compte)\s*[:\-]?\s*([A-Za-z0-9\- ]+)/i);
          if (extractedAcc) accountNumber = CSVSanitizer.sanitizeString(extractedAcc);
        }
        const description = CSVSanitizer.sanitizeString(
          findColumnValue(['Description', 'Libellé', 'Libellé détaillé', 'Intitulé', 'Désignation', 'description', 'libelle'], 'desc')
        );
  const reference = '';
        const debitStr = findColumnValue(['Débit', 'Debit', 'debit', 'Débits', 'débits', 'Montant débit', 'montant débit', 'montant debit', 'Mvt Débit', 'Mouvement Débit'], 'debit');
        const creditStr = findColumnValue(['Crédit', 'Credit', 'credit', 'Crédits', 'crédits', 'Montant crédit', 'montant crédit', 'montant credit', 'Mvt Crédit', 'Mouvement Crédit'], 'credit');
 
        

  // Carry-forward des champs groupés (Excel n’indique qu’une fois en tête de section)
  if (!supplierName && lastSupplierName) supplierName = lastSupplierName;
  if (!accountNumber && lastAccountNumber) accountNumber = lastAccountNumber;
  if (supplierName) lastSupplierName = supplierName;
  if (accountNumber) lastAccountNumber = accountNumber;
        
        // Nettoyer les valeurs numériques (support virgule FR)
  const debit = CSVSanitizer.sanitizeNumeric(debitStr);
  const credit = CSVSanitizer.sanitizeNumeric(creditStr);
        
        // Parser la date (formats FR et ISO)
        const date = CSVSanitizer.sanitizeDate(dateStr);
        
        console.log(`✅ Ligne fournisseur ${row.index} traitée:`, {
          dateStr, supplierName, description, debit, credit
        });
        
        // Si la ligne est une ligne d'entête (extrait Nom/N° compte) sans montants, on ne crée pas d'écriture
        const headerOnly = (debit === 0 && credit === 0) && (
          !!extractFromAnyCell(/(?:nom\s*compte|nom du compte|fournisseur|raison\s*sociale)\s*[:\-]?\s*(.+)/i) ||
          !!extractFromAnyCell(/(?:n[°o]?\s*compte|code\s*compte|numero\s*compte|num[\.]?\s*compte)\s*[:\-]?\s*([A-Za-z0-9\- ]+)/i)
        );
        if (headerOnly) return null;

        return {
          _id: `imported-${Date.now()}-${index}`,
          date,
          accountNumber,
          accountName: supplierName,
          description,
          debit,
          credit,
          balance: debit - credit,
          reference,
          clientId,
          type: 'supplier' as const,
          supplierName,
          billNumber: findColumnValue(['N° Facture', 'Facture', 'billNumber']),
          createdAt: new Date(),
          importIndex: row.index - 1
        };
      });
    const newEntriesFiltered: SupplierLedger[] = newEntries.filter((e): e is SupplierLedger => !!e);
    console.log('✅ Entrées fournisseurs traitées:', newEntriesFiltered);
    // Enrichissement IA
    let enriched = newEntriesFiltered;
    try {
      enriched = await enrichEntriesAI(newEntriesFiltered);
    } catch (e) {
      console.warn('Enrichissement IA (fournisseurs) indisponible');
    }
  // Déduplication avec l’existant
  const existingSigs = new Set(importedEntries.map(getSupplierLedgerSignature));
  const { unique } = dedupBySignature(enriched, getSupplierLedgerSignature, existingSigs);
  const addedCount = unique.length;
  const duplicateCount = enriched.length - addedCount;
    
    // Notification de succès
    if (addedCount > 0) {
      showNotification({
        type: 'success',
        title: 'Import fournisseurs réussi',
        message: `${addedCount} entrée${addedCount > 1 ? 's' : ''} de grand livre fournisseurs importée${addedCount > 1 ? 's' : ''} avec succès.`,
        duration: 5000
      });
    }
    if (duplicateCount > 0) {
      showNotification({
        type: 'warning',
        title: 'Doublons ignorés',
        message: `${duplicateCount} doublon${duplicateCount > 1 ? 's' : ''} détecté${duplicateCount > 1 ? 's' : ''} et ignoré${duplicateCount > 1 ? 's' : ''}.`,
        duration: 5000,
      });
    }
  const merged = [...importedEntries, ...unique];
  setImportedEntries(merged);
  try { setSupplierLedgerCache(clientId, merged); } catch {}
  };

  // N’afficher que les entrées importées
  const allSupplierLedgerEntries = [...importedEntries];

  const filteredEntries = allSupplierLedgerEntries.filter(entry =>
    entry.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
  entry.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDebit = filteredEntries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredit = filteredEntries.reduce((sum, entry) => sum + entry.credit, 0);
  const totalBalance = totalDebit - totalCredit;

  // Grouper les entrées par fournisseur
  const entriesBySupplier = filteredEntries.reduce((acc, entry) => {
    if (!acc[entry.supplierName]) {
      acc[entry.supplierName] = [];
    }
    acc[entry.supplierName].push(entry);
    return acc;
  }, {} as Record<string, SupplierLedger[]>);

  // La règle fournisseurs : règlements en Débit, factures en Crédit
  // Le calcul détaillé par fournisseur se fait dans le rendu (accès aux totaux du groupe)

  const generateJustificationMessage = (entry: SupplierLedger) => {
    const isPayment = (entry.debit || 0) > 0; // Fournisseurs: débit = règlement
    const amount = isPayment ? entry.debit : entry.credit;
    const header = isPayment ? 'règlement' : 'facture';
    const dateStr = entry.date ? formatDate(entry.date) : '';
  return `Bonjour,%0D%0A%0D%0ANous avons identifié un ${header} de ${formatCurrency(amount || 0)}${dateStr ? ` en date du ${dateStr}` : ''}.%0D%0A%0D%0APourriez-vous nous fournir les justificatifs correspondants ?%0D%0A%0D%0ADescription : ${entry.description || ''}%0D%0A%0D%0AMerci de votre collaboration.%0D%0A%0D%0ACordialement,%0D%0AL'équipe comptable`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header avec filtres */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Grand livre des fournisseurs</h2>
                      </div>
          
          <div className="flex items-center space-x-4">
            
            
            <div className="flex items-center space-x-2">
              <FileImporter
                onImport={handleImport}
                expectedColumns={['Date', 'Nom compte', 'N° Compte', 'Libellé', 'Débit', 'Crédit']}
                title="Importer les écritures fournisseurs"
                description="Importez les données du grand livre fournisseurs depuis un fichier Excel ou CSV"
                helpType="suppliers"
              />
              <button className="flex items-center space-x-2 px-3 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700">
                <Download className="w-4 h-4" />
                <span>Exporter</span>
              </button>
              <button
                onClick={handleClearImport}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                title="Effacer les écritures importées"
              >
                <span>Effacer</span>
              </button>
              
            </div>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher par fournisseur ou description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Résumé */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-orange-700">Total Débits</p>
            <p className="text-lg font-semibold text-orange-900">{formatCurrency(totalDebit)}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-red-700">Total Crédits</p>
            <p className="text-lg font-semibold text-red-900">{formatCurrency(totalCredit)}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-purple-700">Solde (Dettes)</p>
            <p className={`text-lg font-semibold ${
              totalBalance <= 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {formatCurrency(Math.abs(totalBalance))}
              {totalBalance < 0 ? ' (À payer)' : ' (Créditeur)'}
            </p>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {Object.entries(entriesBySupplier).map(([supplierName, entries]) => {
            const supplierDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
            const supplierCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);
            const supplierBalance = supplierDebit - supplierCredit;

            // Règles statut fournisseurs:
            // - Débit (règlement): justificatif manquant
            // - Crédit (facture): facture non réglée si crédits > débits
            // - Sinon: IA peut marquer "écriture suspecte", sinon conforme
            const getEntryStatus = (entry: SupplierLedger) => {
              if ((entry.debit || 0) > 0) {
                return { type: 'error' as const, label: 'Justificatif manquant', icon: XCircle };
              }
              if ((entry.credit || 0) > 0 && supplierCredit > supplierDebit) {
                return { type: 'warning' as const, label: 'Facture non réglée', icon: AlertTriangle };
              }
              if (entry.aiMeta && (entry.aiMeta.suspiciousLevel === 'medium' || entry.aiMeta.suspiciousLevel === 'high')) {
                return { type: 'warning' as const, label: 'Écriture suspecte', icon: AlertTriangle };
              }
              return { type: 'success' as const, label: 'Conforme', icon: CheckCircle };
            };

            return (
              <div key={supplierName} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-orange-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{supplierName}</h3>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-600">
                        Solde: <span className={`font-semibold ${
                          supplierBalance <= 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatCurrency(Math.abs(supplierBalance))}
                          {supplierBalance < 0 ? ' (À payer)' : ''}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Nom compte</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">N° Compte</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Libellé</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider tabular-nums w-28">Débit</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider tabular-nums w-28">Crédit</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider tabular-nums w-28">Solde</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Statut</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {entries.map((entry) => (
                        <tr key={entry._id} className={`hover:bg-gray-50 ${entry.importIndex !== undefined ? 'bg-orange-50' : ''}`}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 w-28">{entry.date ? formatDate(entry.date) : ''}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 w-48">
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {entry.supplierName || ''}
                              {entry.aiMeta && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                                    entry.aiMeta.suspiciousLevel === 'high'
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : entry.aiMeta.suspiciousLevel === 'medium'
                                      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                      : 'bg-green-50 text-green-700 border-green-200'
                                  }`}
                                  title={`Analyse IA: ${entry.aiMeta.suspiciousLevel}\n- ${(entry.aiMeta.reasons || []).join('\n- ')}`}
                                >
                                  IA {entry.aiMeta.suspiciousLevel}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 w-32">{entry.accountNumber || ''}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            <div className="font-medium">{entry.description || ''}</div>
                          </td>
                          {(() => {
                            const isAmountEmpty = ((entry.debit || 0) === 0) && ((entry.credit || 0) === 0);
                            return (
                              <>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-right tabular-nums w-28">
                                  {isAmountEmpty ? '' : (entry.debit > 0 ? (
                                    <span className="text-red-600 font-medium">{formatCurrency(entry.debit)}</span>
                                  ) : '')}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-right tabular-nums w-28">
                                  {isAmountEmpty ? '' : (entry.credit > 0 ? (
                                    <span className="text-green-600 font-medium">{formatCurrency(entry.credit)}</span>
                                  ) : '')}
                                </td>
            <td className={`px-3 py-2 whitespace-nowrap text-sm text-right font-medium tabular-nums w-28 ${
                                  entry.balance < 0 ? 'text-red-600' : entry.balance > 0 ? 'text-green-600' : 'text-gray-900'
                                }`}>
                                  {isAmountEmpty ? '' : (
                                    <>
                                      {formatCurrency(Math.abs(entry.balance))}
                                      {entry.balance < 0 && ' (Dû)'}
                                    </>
                                  )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap w-40">
                                  {!isAmountEmpty && (() => {
                                    const status = getEntryStatus(entry);
                                    const Icon = status.icon;
                                    return (
                                      <div className="flex items-center space-x-2">
                                        <Icon className={`w-4 h-4 ${status.type === 'success' ? 'text-green-500' : status.type === 'warning' ? 'text-yellow-500' : 'text-red-500'}`} />
                                        <span className={`text-xs px-2 py-1 rounded-full ${status.type === 'success' ? 'bg-green-100 text-green-800' : status.type === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{status.label}</span>
                                      </div>
                                    );
                                  })()}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-center w-28">
                                  {!isAmountEmpty && (() => {
                                    const status = getEntryStatus(entry);
                                    return (
                                      <div className="flex items-center justify-center space-x-2">
                                        {status.label === 'Justificatif manquant' && (
                                          <a
                                            href={`mailto:?subject=Demande%20de%20justificatif&body=${generateJustificationMessage(entry)}`}
                                            className="text-amber-600 hover:text-amber-800 p-1 rounded"
                                            title="Demander justificatif"
                                          >
                                            <Mail className="w-4 h-4" />
                                          </a>
                                        )}
                                        {status.label === 'Justificatif manquant' && (
                                          <button
                                            onClick={() => { setUploadContext({ entryId: entry._id, clientId: entry.clientId }); setUploadModalOpen(true); }}
                                            className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                            title="Ajouter justificatif"
                                          >
                                            <Upload className="w-4 h-4" />
                                          </button>
                                        )}
                                        <button
                                          className="text-gray-600 hover:text-gray-800 p-1 rounded"
                                          title="Voir détails"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </button>
                                      </div>
                                    );
                                  })()}
                                </td>
                              </>
                            );
                          })()}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {filteredEntries.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8">
              <div className="text-center text-gray-500">
                <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium">Aucune écriture trouvée</p>
                <p className="text-sm">
                  {searchTerm 
                    ? 'Aucune écriture ne correspond à votre recherche.' 
                    : 'Aucune écriture fournisseur pour cette période.'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      {uploadModalOpen && uploadContext && (
        <UploadJustificatifModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          clientId={uploadContext.clientId}
          entryId={uploadContext.entryId}
          onUploaded={() => { /* TODO: marquer l’entrée comme justifiée si un champ existe */ }}
        />
      )}
    </div>
  );
};

export default SuppliersLedgerPage;