import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClientLedger } from '@/types/accounting';
import { ImportedRow } from '@/types/ledger';
import { useNotification } from '@/contexts/NotificationContextSimple';
import { CSVSanitizer } from '@/utils/csvSanitizer';
import { enrichImportedClientLedger } from '@/services/aiAdapter';
import { dedupBySignature, getClientLedgerSignature } from '@/utils/ledgerDedup';
import { clientLedgerRepository } from '@/repositories/ClientLedgerRepository';
import { createCacheFromPreset } from '@/lib/cache';
import {
  clearClientLedger,
  clearLedgerCache,
  getLedgerCache,
  listClientLedger,
  saveClientLedger,
  setLedgerCache
} from '@/lib/ledgerCache';
import { clientLedgersToLedgerEntries, ledgerEntriesToClientLedgers } from '@/utils/ledgerTypeAdapter';

interface LedgerSummary {
  totalDebit: number;
  totalCredit: number;
  totalBalance: number;
}

export const useClientLedgerState = (clientId: string) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('2024-01');
  const [importedEntries, setImportedEntries] = useState<ClientLedger[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [llmSuggestions, setLlmSuggestions] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'accountNumber' | 'accountName'>('accountNumber');
  const { showNotification } = useNotification();

  const allEntries = useMemo(() => (
    [...importedEntries]
  ), [importedEntries]);

  const filteredEntries = useMemo(() => {
    // Comparateur: tri par N° Compte (accountNumber) ou par Nom de compte (clientName) ascendant puis par date croissante
    const compareFn = (a: ClientLedger, b: ClientLedger) => {
      let cmp = 0;
      if (sortBy === 'accountNumber') {
        const an = (a.accountNumber || '').toString();
        const bn = (b.accountNumber || '').toString();
        cmp = an.localeCompare(bn, undefined, { numeric: true, sensitivity: 'base' });
      } else {
        const an = (a.clientName || '').toString();
        const bn = (b.clientName || '').toString();
        cmp = an.localeCompare(bn, undefined, { sensitivity: 'base' });
      }
      if (cmp !== 0) return cmp;
      const ad = a.date ? new Date(a.date).getTime() : 0;
      const bd = b.date ? new Date(b.date).getTime() : 0;
      return ad - bd;
    };

    if (!searchTerm.trim()) return [...allEntries].sort(compareFn);
    
    const term = searchTerm.toLowerCase();
    return allEntries
      .filter(entry =>
        (entry.clientName || '').toLowerCase().includes(term) ||
        (entry.description || '').toLowerCase().includes(term) ||
        (entry.reference || '').toLowerCase().includes(term)
      )
      .sort(compareFn);
  }, [allEntries, searchTerm, sortBy]);

  // Calculer les entrées visibles (avec montants non nuls)
  const visibleEntries = useMemo(() => {
    return filteredEntries.filter(entry => {
      const hasAmount = (entry.debit || 0) !== 0 || (entry.credit || 0) !== 0;
      return hasAmount;
    });
  }, [filteredEntries]);

  const summary: LedgerSummary = useMemo(() => {
    const debit = filteredEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const credit = filteredEntries.reduce((sum, entry) => sum + entry.credit, 0);
    return {
      totalDebit: debit,
      totalCredit: credit,
      totalBalance: debit - credit,
    };
  }, [filteredEntries]);

  const entriesByClient = useMemo(() =>
    filteredEntries.reduce((acc, entry) => {
      const key = entry.clientName || '(Sans nom)';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(entry);
      return acc;
    }, {} as Record<string, ClientLedger[]>),
    [filteredEntries]
  );

  // Load persisted entries on mount (prioritize in-memory cache, then DB)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!clientId) return;
        // 1) Cache mémoire si disponible (évite le flicker en navigation intra-SPA)
        const cached = getLedgerCache(clientId);
        if (cached && !cancelled) {
          setImportedEntries(ledgerEntriesToClientLedgers(cached));
        }
        const { entries } = await listClientLedger(clientId);
        if (cancelled) return;
        // Map DB entries to ClientLedger type (ensure Date)
        const mapped: ClientLedger[] = (entries || []).map((e: any) => ({
          _id: String(e._id),
          date: e.date ? new Date(e.date) : null,
          accountNumber: e.accountNumber || '',
          accountName: e.accountName || '',
          description: e.description || '',
          debit: Number(e.debit) || 0,
          credit: Number(e.credit) || 0,
          balance: Number(e.balance) || 0,
          reference: e.reference || '',
          clientId: e.clientId,
          type: 'client',
          clientName: e.clientName || '',
          invoiceNumber: e.invoiceNumber,
          createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
          isImported: e.isImported !== false,
          aiMeta: e.aiMeta,
        }));
        // Si la DB renvoie vide mais on a un cache non vide, on garde le cache
        const cachedAfter = getLedgerCache(clientId);
        if (mapped.length === 0 && cachedAfter && cachedAfter.length > 0) {
          setImportedEntries(ledgerEntriesToClientLedgers(cachedAfter));
          setLedgerCache(clientId, cachedAfter);
          showNotification?.({
            type: 'warning',
            title: 'Données non trouvées en base',
            message: "Affichage des écritures depuis le cache temporaire de la session.",
            duration: 4000,
          });
        } else {
          setImportedEntries(mapped);
          setLedgerCache(clientId, clientLedgersToLedgerEntries(mapped));
        }
      } catch (err) {
        console.warn('Chargement grand livre échoué:', err);
        showNotification?.({
          type: 'warning',
          title: 'Lecture DB échouée',
          message: "Impossible de lire la base (auth requise). Les écritures ne peuvent pas être affichées.",
          duration: 4000,
        });
      }
    };
    load();
    return () => { cancelled = true; };
  }, [clientId]);

  const reloadFromDb = useCallback(async () => {
    try {
      const { entries } = await listClientLedger(clientId);
      const mapped: ClientLedger[] = (entries || []).map((e: any) => ({
        _id: String(e._id),
        date: e.date ? new Date(e.date) : null,
        accountNumber: e.accountNumber || '',
        accountName: e.accountName || '',
        description: e.description || '',
        debit: Number(e.debit) || 0,
        credit: Number(e.credit) || 0,
        balance: Number(e.balance) || 0,
        reference: e.reference || '',
        clientId: e.clientId,
        type: 'client',
        clientName: e.clientName || '',
        invoiceNumber: e.invoiceNumber,
        createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
        isImported: e.isImported !== false,
        aiMeta: e.aiMeta,
      }));
      const cached = getLedgerCache(clientId);
      if (mapped.length === 0 && cached && cached.length > 0) {
        setImportedEntries(ledgerEntriesToClientLedgers(cached));
        setLedgerCache(clientId, cached);
        return 0;
      } else {
        setImportedEntries(mapped);
        setLedgerCache(clientId, clientLedgersToLedgerEntries(mapped));
        return mapped.length;
      }
    } catch (e) {
      console.warn('Reload échoué:', e);
      return -1;
    }
  }, [clientId]);

  const clearForClient = useCallback(async () => {
    try {
      await clearClientLedger(clientId);
      setImportedEntries([]);
      clearLedgerCache(clientId);
      showNotification({ type: 'success', title: 'Grand livre vidé', message: 'Toutes les écritures ont été supprimées.', duration: 3000 });
    } catch (e) {
      showNotification({ type: 'error', title: 'Erreur', message: 'Impossible de vider le grand livre.', duration: 4000 });
    }
  }, [clientId, showNotification]);

  const handleImport = useCallback(async (importedData: ImportedRow[]) => {
    try {
      // Enhanced validation
      if (!importedData) {
        throw new Error("Données d'import non définies");
      }
      
      if (!Array.isArray(importedData)) {
        throw new Error("Format de données invalide - tableau attendu");
      }
      
      if (importedData.length === 0) {
        showNotification({
          type: "error",
          title: "Erreur d'import",
          message: "Aucune donnée valide trouvée dans le fichier",
          duration: 5000,
        });
        return;
      }

      // Validate clientId
      if (!clientId || typeof clientId !== 'string' || clientId.trim().length === 0) {
        throw new Error("Identifiant client invalide");
      }

      // Fonction simplifiée pour créer les nouvelles entrées
      const newEntries: ClientLedger[] = importedData
        .filter(r => r?.isValid)
        .map((row, idx) => {
          const data = row.data || {};
          return {
            _id: `imported-${Date.now()}-${idx}`,
            date: data.date ? new Date(String(data.date)) : null,
            accountNumber: String(data.accountNumber || ''),
            accountName: String(data.accountName || ''),
            description: String(data.description || ''),
            debit: Number(data.debit) || 0,
            credit: Number(data.credit) || 0,
            balance: (Number(data.debit) || 0) - (Number(data.credit) || 0),
            reference: String(data.reference || ''),
            clientId,
            type: 'client' as const,
            clientName: String(data.clientName || ''),
            invoiceNumber: String(data.invoiceNumber || ''),
            createdAt: new Date(),
            isImported: true,
          };
        });

      // Enrichissement IA des écritures importées
      let enrichedEntries = newEntries;
      try {
        enrichedEntries = await enrichImportedClientLedger(newEntries);
      } catch (e) {
        // Si l'IA n'est pas disponible, on continue sans enrichissement
        console.warn('Enrichissement IA indisponible, import sans annotations IA.');
      }

      // Déduplication: combiner les entrées existantes importées avec les nouvelles
      const existingSigs = new Set(importedEntries.map(getClientLedgerSignature));
      const { unique } = dedupBySignature(enrichedEntries, getClientLedgerSignature, existingSigs);
      const addedCount = unique.length;
      const duplicateCount = enrichedEntries.length - addedCount;
      
      // Mettre à disposition immédiatement en mémoire + cache (avant persistence)
      if (addedCount > 0) {
        const merged = [...importedEntries, ...unique];
        setImportedEntries(merged);
        setLedgerCache(clientId, clientLedgersToLedgerEntries(merged));
      }
      
      // Persist to DB puis rafraîchir depuis la DB (source de vérité)
      try {
        // Ignorer l'enregistrement des lignes sans N° Compte (pas de valeur par défaut)
        const toSave = unique.filter(e => (e.accountNumber || '').trim().length > 0);
        const skippedNoAccount = unique.length - toSave.length;
        
        if (skippedNoAccount > 0) {
          showNotification?.({
            type: 'warning',
            title: 'Lignes ignorées',
            message: `${skippedNoAccount} ligne(s) sans N° Compte ne seront pas enregistrées en base.`,
            duration: 5000,
          });
        }
        
        // Si aucune écriture valide à enregistrer, éviter l'appel API (sinon 400)
        if (toSave.length === 0) {
          showNotification?.({
            type: 'warning',
            title: 'Aucune écriture enregistrée',
            message: "Toutes les lignes importées sont sans N° Compte. Rien à persister en base.",
            duration: 5000,
          });
          return; // on sort proprement, les données restent visibles en mémoire
        }
        
        const ledgerEntries = clientLedgersToLedgerEntries(toSave);
        const res = await saveClientLedger(ledgerEntries);
        
        // Recharger depuis la base pour s'aligner sur l'état persistant
        const count = await reloadFromDb();
        
        showNotification?.({
          type: 'success',
          title: 'Sauvegarde en base',
          message: `${toSave.length} entrée(s) sauvegardée(s)`,
          duration: 4000,
        });
        
        if (count === 0) {
          // Si la base ne renvoie rien, indiquer qu'aucune écriture persistée n'est disponible
          showNotification?.({
            type: 'warning',
            title: 'Aucune écriture depuis la base',
            message: "L'import est enregistré, mais aucune écriture n'a été retournée par la DB pour l'instant. Affichage des données importées en mémoire.",
            duration: 5000,
          });
        } else if (count < 0) {
          // En cas d'échec reload, on n'a pas de garantie de persistance; l'état existant reste inchangé
        }
      } catch (e: any) {
        console.warn('Sauvegarde en base échouée (les données restent en mémoire):', e);
        showNotification?.({
          type: 'error',
          title: 'Enregistrement DB échoué',
          message: (e?.message as string) || "Les écritures restent en mémoire locale. Vérifiez votre connexion et l'authentification.",
          duration: 5000,
        });
      }

      if (addedCount > 0) {
        showNotification({
          type: "success",
          title: "Import clients réussi",
          message: `${addedCount} entrée${addedCount > 1 ? "s" : ""} importée${addedCount > 1 ? "s" : ""} avec succès.`,
          duration: 5000,
        });
      }
      
      if (duplicateCount > 0) {
        showNotification({
          type: "warning",
          title: "Doublons ignorés",
          message: `${duplicateCount} doublon${duplicateCount > 1 ? "s" : ""} détecté${duplicateCount > 1 ? "s" : ""} et ignoré${duplicateCount > 1 ? "s" : ""}.`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'import:", error);
      showNotification({
        type: "error",
        title: "Erreur d'import",
        message: "Une erreur est survenue lors du traitement du fichier",
        duration: 5000,
      });
    }
  }, [clientId, showNotification, importedEntries, reloadFromDb]);

  // Marquer une écriture comme justifiée (après upload justificatif)
  const markEntryAsJustified = useCallback((entryId: string) => {
    setImportedEntries(prev => prev.map(e => {
      if (e._id !== entryId) return e;
      // S'assurer que la référence est considérée comme valide (prefixe FAC|REG|CHQ|VIR)
      const ref = e.reference && e.reference.length >= 5 ? e.reference : (e.credit > 0 ? 'REG-JUSTIF' : 'FAC-JUSTIF');
      return { ...e, reference: ref };
    }));
  }, []);

  return {
    // State
    searchTerm,
    setSearchTerm,
    selectedPeriod,
    setSelectedPeriod,
    showAnalysis,
    setShowAnalysis,
    selectedEntries,
    setSelectedEntries,
    llmSuggestions,
    setLlmSuggestions,
    sortBy,
    setSortBy,
    
    // Computed values
    entries: allEntries,
    filteredEntries,
    visibleEntries,
    summary,
    entriesByClient,
    
    // Actions
    handleImport,
    markEntryAsJustified,
    reloadFromDb,
    clearForClient,
  };
};