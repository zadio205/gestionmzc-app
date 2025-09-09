import { useState, useMemo, useCallback, useEffect } from 'react';
import { SupplierLedger } from '@/types/accounting';
import { ImportedRow } from '@/types/ledger';
import { useNotification } from '@/contexts/NotificationContextSimple';
import { CSVSanitizer } from '@/utils/csvSanitizer';
import { enrichImportedSupplierLedger } from '@/services/aiAdapter';
import { dedupBySignature, getSupplierLedgerSignature } from '@/utils/ledgerDedup';
import { 
  fetchSupplierLedgerFromSupabase, 
  saveSupplierLedgerToSupabase, 
  clearSupplierLedgerCache 
} from '@/lib/supplierLedgerCache';

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
  const { showNotification } = useNotification();

  const allEntries = useMemo(() => (
    [...importedEntries]
  ), [importedEntries]);

  const filteredEntries = useMemo(() => {
    const compareBySupplierName = (a: SupplierLedger, b: SupplierLedger) => {
      const an = (a.supplierName || '').toString();
      const bn = (b.supplierName || '').toString();
      const cmp = an.localeCompare(bn, undefined, { numeric: true, sensitivity: 'base' });
      if (cmp !== 0) return cmp;
      const ad = a.date ? new Date(a.date).getTime() : 0;
      const bd = b.date ? new Date(b.date).getTime() : 0;
      return ad - bd;
    };

    if (!searchTerm.trim()) return [...allEntries].sort(compareBySupplierName);
    
    const term = searchTerm.toLowerCase();
    return allEntries
      .filter(entry =>
        (entry.supplierName || '').toLowerCase().includes(term) ||
        (entry.description || '').toLowerCase().includes(term) ||
        (entry.reference || '').toLowerCase().includes(term)
      )
      .sort(compareBySupplierName);
  }, [allEntries, searchTerm]);

  const summary: LedgerSummary = useMemo(() => {
    const debit = filteredEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const credit = filteredEntries.reduce((sum, entry) => sum + entry.credit, 0);
    return {
      totalDebit: debit,
      totalCredit: credit,
      totalBalance: debit - credit,
    };
  }, [filteredEntries]);

  // Charger les entrées persistées au montage
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!clientId) return;
        
        const entries = await fetchSupplierLedgerFromSupabase(clientId);
        if (cancelled) return;
        
        const mapped: SupplierLedger[] = (entries || []).map((e: any) => ({
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
      } catch (error) {
        console.error('Erreur lors du chargement du grand livre fournisseurs:', error);
      }
    };
    
    load();
    return () => { cancelled = true; };
  }, [clientId]);

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
        showNotification('Aucune donnée à importer', 'error');
        return;
      }

      showNotification('Import en cours...', 'info');
      
      const sanitizer = new CSVSanitizer();
      const sanitized = sanitizer.sanitizeSupplierLedgerImport(importedData);
      
      const converted: SupplierLedger[] = sanitized.map((row, index) => ({
        _id: `import_${Date.now()}_${index}`,
        date: row.date || null,
        accountNumber: row.accountNumber || '',
        accountName: row.accountName || '',
        supplierName: row.supplierName || '',
        description: row.description || '',
        debit: Number(row.debit) || 0,
        credit: Number(row.credit) || 0,
        balance: Number(row.balance) || 0,
        reference: row.reference || '',
        clientId,
        type: 'supplier' as const,
        billNumber: row.billNumber || '',
        createdAt: new Date(),
        importIndex: index
      }));

      // Enrichissement IA si disponible
      let enriched = converted;
      try {
        enriched = await enrichImportedSupplierLedger(converted);
      } catch (aiError) {
        console.warn('Enrichissement IA échoué, utilisation des données de base:', aiError);
      }

      // Déduplication
      const existing = importedEntries;
      const deduplicated = dedupBySignature(
        [...existing, ...enriched],
        getSupplierLedgerSignature
      );

      const newCount = deduplicated.length - existing.length;

      setImportedEntries(deduplicated);
      
      // Sauvegarder en cache
      try {
        await saveSupplierLedgerToSupabase(clientId, deduplicated);
      } catch (saveError) {
        console.warn('Sauvegarde en cache échouée:', saveError);
      }

      showNotification(
        `${newCount} nouvelles entrées importées avec succès`,
        'success'
      );
      
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      showNotification(
        `Erreur lors de l'import: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        'error'
      );
    }
  }, [clientId, importedEntries, showNotification]);

  const reloadFromDb = useCallback(async () => {
    try {
      const mapped: SupplierLedger[] = (entries || []).map((e: any) => ({
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
      showNotification('Données rechargées depuis la base', 'success');
    } catch (error) {
      console.error('Erreur lors du rechargement:', error);
      showNotification('Erreur lors du rechargement', 'error');
    }
  }, [clientId, showNotification]);

  const clearForClient = useCallback(async () => {
    try {
      await clearSupplierLedgerCache(clientId);
      setImportedEntries([]);
      showNotification('Données supprimées', 'success');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showNotification('Erreur lors de la suppression', 'error');
    }
  }, [clientId, showNotification]);

  return {
    searchTerm,
    setSearchTerm,
    selectedPeriod,
    setSelectedPeriod,
    entries: allEntries,
    filteredEntries,
    summary,
    showAnalysis,
    setShowAnalysis,
    selectedEntries,
    setSelectedEntries,
    llmSuggestions,
    setLlmSuggestions,
    handleImport,
    reloadFromDb,
    clearForClient
  };
};