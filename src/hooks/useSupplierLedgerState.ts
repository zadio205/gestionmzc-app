import { useCallback, useEffect, useMemo, useState } from 'react';
import { SupplierLedger } from '@/types/accounting';
import { ImportedRow } from '@/types/ledger';
import { useNotification } from '@/contexts/NotificationContextSimple';
import { CSVSanitizer } from '@/utils/csvSanitizer';
import { enrichImportedSupplierLedger } from '@/services/aiAdapter';
import { dedupBySignature, getSupplierLedgerSignature } from '@/utils/ledgerDedup';
// Temporary cache functions using localStorage
const fetchSupplierLedgerFromSupabase = async (clientId: string) => {
  try {
    const response = await fetch(`/api/supplier-ledger?clientId=${clientId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching supplier ledger:', error);
    return [];
  }
};

const getSupplierLedgerCache = (clientId: string) => {
  if (typeof window === 'undefined') return [];
  try {
    const cached = localStorage.getItem(`supplierLedgerCache:${clientId}`);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.warn('Failed to get supplier ledger cache:', error);
    return [];
  }
};

const setSupplierLedgerCache = (clientId: string, entries: any[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`supplierLedgerCache:${clientId}`, JSON.stringify(entries));
  } catch (error) {
    console.warn('Failed to cache supplier ledger:', error);
  }
};

const clearSupplierLedgerCache = async (clientId: string) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`supplierLedgerCache:${clientId}`);
  } catch (error) {
    console.warn('Failed to clear supplier ledger cache:', error);
  }
};

interface LedgerSummary {
  totalDebit: number;
  totalCredit: number;
  totalBalance: number;
}

export const useSupplierLedgerState = (clientId: string) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('2024-01');
  const [importedEntries, setImportedEntries] = useState<SupplierLedger[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [llmSuggestions, setLlmSuggestions] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'accountNumber' | 'accountName'>('accountNumber');
  const { showNotification } = useNotification();

  const allEntries = useMemo(() => (
    [...importedEntries]
  ), [importedEntries]);

  const filteredEntries = useMemo(() => {
    const compareFn = (a: SupplierLedger, b: SupplierLedger) => {
      let cmp = 0;
      if (sortBy === 'accountNumber') {
        const an = (a.accountNumber || '').toString();
        const bn = (b.accountNumber || '').toString();
        cmp = an.localeCompare(bn, undefined, { numeric: true, sensitivity: 'base' });
      } else {
        const an = (a.supplierName || '').toString();
        const bn = (b.supplierName || '').toString();
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
        (entry.supplierName || '').toLowerCase().includes(term) ||
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

  // Charger les entrées persistées au montage (local d'abord, puis Supabase)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!clientId) return;

        // 1) Hydratation immédiate depuis cache local/mémoire si disponible
        const cached = getSupplierLedgerCache(clientId);
        if (!cancelled && cached && cached.length > 0) {
          setImportedEntries(cached);
        }

        // 2) Rafraîchissement depuis Supabase
        const entries = await fetchSupplierLedgerFromSupabase(clientId);
        if (cancelled) return;

        if (entries && entries.length > 0) {
          const mapped: SupplierLedger[] = entries.map((e: any) => ({
            _id: String(e._id),
            date: e.date ? new Date(e.date) : null,
            accountNumber: e.accountNumber || '',
            accountName: e.accountName || '',
            supplierName: e.supplierName || '',
            description: e.description || '',
            debit: Number(e.debit) || 0,
            credit: Number(e.credit) || 0,
            balance: Number(e.balance) || 0,
            reference: e.reference || '',
            clientId: e.clientId,
            type: 'supplier' as const,
            billNumber: e.billNumber || '',
            createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
            importIndex: e.importIndex,
            aiMeta: e.aiMeta || undefined
          }));
          setImportedEntries(mapped);
        } else if (!cached || cached.length === 0) {
          // Aucun résultat Supabase et pas de cache: s'assurer d'état vide
          setImportedEntries([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du grand livre fournisseurs:', error);
      }
    };
    
    load();
    return () => { cancelled = true; };
  }, [clientId]);

  // Synchroniser le cache local et la mémoire dès que les entrées changent
  useEffect(() => {
    if (!clientId) return;
    try {
      if (importedEntries && importedEntries.length > 0) {
        setSupplierLedgerCache(clientId, importedEntries);
      }
    } catch (e) {
      // ignore erreur de quota/localStorage indispo
    }
  }, [clientId, importedEntries]);

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
          type: 'error',
          title: 'Erreur d\'import',
          message: 'Aucune donnée à importer'
        });
        return;
      }

      showNotification({
        type: 'info',
        title: 'Import',
        message: 'Import en cours...'
      });
      
      // Conversion robuste des données importées (prise en compte formats FR)
      const getFirst = (obj: Record<string, any>, keys: string[]): any => {
        for (const k of keys) {
          if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).toString().trim() !== '') {
            return obj[k];
          }
        }
        return undefined;
      };

      const converted: SupplierLedger[] = importedData.map((row, index) => {
        const data = (row?.data || {}) as Record<string, any>;

        const rawDate = getFirst(data, ['date', 'Date', 'DATE']);
        const parsedDate = rawDate ? CSVSanitizer.sanitizeDate(String(rawDate)) : null;

        const rawDebit = getFirst(data, ['debit', 'Débit', 'DEBIT', 'montant debit', 'montant_debit', 'Montant Débit']);
        const rawCredit = getFirst(data, ['credit', 'Crédit', 'CREDIT', 'montant credit', 'montant_crédit', 'Montant Crédit']);
        const rawBalance = getFirst(data, ['balance', 'Solde', 'solde', 'BALANCE']);

        const debit = CSVSanitizer.sanitizeNumeric(String(rawDebit ?? '0'));
        const credit = CSVSanitizer.sanitizeNumeric(String(rawCredit ?? '0'));
        // Si pas de solde fourni, calculer à partir débit/crédit
        const balance = rawBalance !== undefined ? CSVSanitizer.sanitizeNumeric(String(rawBalance)) : (debit - credit);

        const accountNumber = getFirst(data, ['accountNumber', 'N° Compte', 'Compte', 'Numéro Compte']) ?? '';
        const accountName = getFirst(data, ['accountName', 'Nom Compte', 'Intitulé Compte']) ?? '';
        const supplierName = getFirst(data, ['supplierName', 'Nom Fournisseur', 'Fournisseur', 'Fournisseur Nom']) ?? (accountName || '');
        const description = getFirst(data, ['description', 'Description', 'Libellé', 'Libelle']) ?? '';
        const reference = getFirst(data, ['reference', 'Référence', 'Reference', 'Ref']) ?? '';
        const billNumber = getFirst(data, ['billNumber', 'N° Facture', 'Numero Facture', 'Numéro Facture']) ?? '';

        return {
          _id: `import_${Date.now()}_${index}`,
          date: parsedDate,
          accountNumber: String(accountNumber || ''),
          accountName: String(accountName || ''),
          supplierName: String(supplierName || ''),
          description: String(description || ''),
          debit,
          credit,
          balance,
          reference: String(reference || ''),
          clientId,
          type: 'supplier' as const,
          billNumber: String(billNumber || ''),
          createdAt: new Date(),
          importIndex: index
        };
      });

      // Enrichissement IA si disponible
      let enriched = converted;
      try {
        enriched = await enrichImportedSupplierLedger(converted);
      } catch (aiError) {
        console.warn('Enrichissement IA échoué, utilisation des données de base:', aiError);
      }

      // Déduplication
      const existing = importedEntries;
      const dedupResult = dedupBySignature(
        [...existing, ...enriched],
        getSupplierLedgerSignature
      );
      const deduplicated = dedupResult.unique;

      const newCount = deduplicated.length - existing.length;

      setImportedEntries(deduplicated);

      // Sauvegarder en cache hybride (mémoire + localStorage) et persistance Supabase en arrière-plan
      try {
        setSupplierLedgerCache(clientId, deduplicated);
      } catch (saveError) {
        console.warn('Sauvegarde en cache échouée:', saveError);
      }

      showNotification({
        type: 'success',
        title: 'Import réussi',
        message: `${newCount} nouvelles entrées importées avec succès`
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      showNotification({
        type: 'error',
        title: 'Erreur d\'import',
        message: `Erreur lors de l'import: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    }
  }, [clientId, importedEntries, showNotification]);

  const reloadFromDb = useCallback(async () => {
    try {
      const entries = await fetchSupplierLedgerFromSupabase(clientId);
      if (entries && entries.length > 0) {
        const mapped: SupplierLedger[] = entries.map((e: any) => ({
          _id: String(e._id),
          date: e.date ? new Date(e.date) : null,
          accountNumber: e.accountNumber || '',
          accountName: e.accountName || '',
          supplierName: e.supplierName || '',
          description: e.description || '',
          debit: Number(e.debit) || 0,
          credit: Number(e.credit) || 0,
          balance: Number(e.balance) || 0,
          reference: e.reference || '',
          clientId: e.clientId,
          type: 'supplier' as const,
          billNumber: e.billNumber || '',
          createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
          importIndex: e.importIndex,
          aiMeta: e.aiMeta || undefined
        }));
        setImportedEntries(mapped);
      }
      showNotification({
        type: 'success',
        title: 'Rechargement',
        message: 'Données rechargées depuis la base'
      });
    } catch (error) {
      console.error('Erreur lors du rechargement:', error);
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors du rechargement'
      });
    }
  }, [clientId, showNotification]);

  const clearForClient = useCallback(async () => {
    try {
      await clearSupplierLedgerCache(clientId);
      setImportedEntries([]);
      showNotification({
        type: 'success',
        title: 'Suppression',
        message: 'Données supprimées'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la suppression'
      });
    }
  }, [clientId, showNotification]);

  return {
    searchTerm,
    setSearchTerm,
    selectedPeriod,
    setSelectedPeriod,
    entries: allEntries,
    filteredEntries,
    visibleEntries,
    summary,
    showAnalysis,
    setShowAnalysis,
    selectedEntries,
    setSelectedEntries,
    llmSuggestions,
    setLlmSuggestions,
    sortBy,
    setSortBy,
    handleImport,
    reloadFromDb,
    clearForClient
  };
};