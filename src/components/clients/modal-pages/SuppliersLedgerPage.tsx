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
    
    const newEntries: SupplierLedger[] = importedData
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

        const findColumnValue = (possibleNames: string[]) => {
          for (const name of possibleNames) {
            const originalKey = headerMap[normalize(name)];
            if (originalKey !== undefined && row.data[originalKey] !== null && row.data[originalKey] !== undefined) {
              const value = String(row.data[originalKey]).trim();
              if (value !== '') return value;
            }
          }
          return '';
        };
        
        const dateStr = findColumnValue(['Date', 'date']);
        const supplierName = CSVSanitizer.sanitizeString(
          findColumnValue(['Nom Fournisseur', 'Fournisseur', 'supplierName'])
        );
        const description = CSVSanitizer.sanitizeString(
          findColumnValue(['Description', 'Libellé', 'description', 'libelle'])
        );
        const reference = CSVSanitizer.sanitizeString(
          findColumnValue(['Référence', 'Reference', 'Ref', 'reference', 'référence'])
        );
        const debitStr = findColumnValue(['Débit', 'Debit', 'debit', 'débits', 'montant débit', 'montant debit']);
        const creditStr = findColumnValue(['Crédit', 'Credit', 'credit', 'crédits', 'montant crédit', 'montant credit']);
        const accountNumber = CSVSanitizer.sanitizeString(
          findColumnValue(['N° Compte', 'Compte', 'accountNumber', 'N°compte', 'N°Compte', 'Numéro compte'])
        );
        
        // Nettoyer les valeurs numériques (support virgule FR)
        const debit = CSVSanitizer.sanitizeNumeric(debitStr);
        const credit = CSVSanitizer.sanitizeNumeric(creditStr);
        
        // Parser la date (formats FR et ISO)
        const date = CSVSanitizer.sanitizeDate(dateStr);
        
        console.log(`✅ Ligne fournisseur ${row.index} traitée:`, {
          dateStr, supplierName, description, reference, debit, credit
        });
        
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

    console.log('✅ Entrées fournisseurs traitées:', newEntries);
    // Enrichissement IA
    let enriched = newEntries;
    try {
      enriched = await enrichEntriesAI(newEntries);
    } catch (e) {
      console.warn('Enrichissement IA (fournisseurs) indisponible');
    }
  // Déduplication avec l’existant
  const existingSigs = new Set(importedEntries.map(getSupplierLedgerSignature));
  const { unique } = dedupBySignature(enriched, getSupplierLedgerSignature, existingSigs);
  const addedCount = unique.length;
  const duplicateCount = enriched.length - addedCount;
  setImportedEntries([...importedEntries, ...unique]);
    
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
    entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.reference.toLowerCase().includes(searchTerm.toLowerCase())
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
    return `Bonjour,%0D%0A%0D%0ANous avons identifié un ${header} de ${formatCurrency(amount || 0)}${dateStr ? ` en date du ${dateStr}` : ''} (référence: ${entry.reference || 'non spécifiée'}).%0D%0A%0D%0APourriez-vous nous fournir les justificatifs correspondants ?%0D%0A%0D%0ADescription : ${entry.description || ''}%0D%0A%0D%0AMerci de votre collaboration.%0D%0A%0D%0ACordialement,%0D%0AL'équipe comptable`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header avec filtres */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Grand livre des fournisseurs</h2>
            <p className="text-sm text-gray-600">Suivi des dettes fournisseurs</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="2024-01">Janvier 2024</option>
                <option value="2023-12">Décembre 2023</option>
                <option value="2023-11">Novembre 2023</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <FileImporter
                onImport={handleImport}
                expectedColumns={['Date', 'Nom Fournisseur', 'Description', 'Référence', 'Débit', 'Crédit']}
                title="Importer les écritures fournisseurs"
                description="Importez les données du grand livre fournisseurs depuis un fichier Excel ou CSV"
                helpType="suppliers"
              />
              <button className="flex items-center space-x-2 px-3 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700">
                <Download className="w-4 h-4" />
                <span>Exporter</span>
              </button>
              {/* Bouton réinitialisation cache (optionnel) */}
              <button
                onClick={() => { setImportedEntries([]); try { clearSupplierLedgerCache(clientId); } catch {} }}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
              >
                <span>Vider</span>
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
              placeholder="Rechercher par fournisseur, description ou référence..."
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
            // - Débit (règlement): justificatif manquant si pas de référence
            // - Crédit (facture): facture non réglée si crédits > débits
            // - Sinon: IA peut marquer "écriture suspecte", sinon conforme
            const getEntryStatus = (entry: SupplierLedger) => {
              const hasRef = !!(entry.reference && entry.reference.trim().length > 0);
              if ((entry.debit || 0) > 0 && !hasRef) {
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
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Nom Client</th>
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
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 w-48"></td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 w-32">{entry.accountNumber || ''}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <span>{entry.description || ''}</span>
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
                          {(() => {
                            const isAmountEmpty = ((entry.debit || 0) === 0) && ((entry.credit || 0) === 0);
                            return (
                              <>
            <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-900 tabular-nums w-28">
                                  {isAmountEmpty ? '' : (entry.debit > 0 ? formatCurrency(entry.debit) : '')}
                                </td>
            <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-900 tabular-nums w-28">
                                  {isAmountEmpty ? '' : (entry.credit > 0 ? formatCurrency(entry.credit) : '')}
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