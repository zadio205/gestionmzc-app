import { useCallback, useEffect, useMemo, useState } from 'react';
import { MiscellaneousLedger } from '@/types/accounting';
import { ImportedRow } from '@/types/ledger';
import { useNotification } from '@/contexts/NotificationContextSimple';
import { CSVSanitizer } from '@/utils/csvSanitizer';
import { enrichEntriesAI } from '@/services/aiAdapter';
import { dedupBySignature, getMiscLedgerSignature } from '@/utils/ledgerDedup';
// Temporary cache functions using localStorage
const fetchMiscLedgerFromSupabase = async (clientId: string) => {
  try {
    const response = await fetch(`/api/misc-ledger?clientId=${clientId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching misc ledger:', error);
    return [];
  }
};

const setMiscLedgerCache = (clientId: string, entries: any[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`miscLedgerCache:${clientId}`, JSON.stringify(entries));
  } catch (error) {
    console.warn('Failed to cache misc ledger:', error);
  }
};

const clearMiscLedgerCache = (clientId: string) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`miscLedgerCache:${clientId}`);
  } catch (error) {
    console.warn('Failed to clear misc ledger cache:', error);
  }
};
import { logger } from '@/utils/logger';

interface LedgerSummary {
  totalDebit: number;
  totalCredit: number;
  totalBalance: number;
}

export const useMiscLedgerState = (clientId: string) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('2024-01');
  const [importedEntries, setImportedEntries] = useState<MiscellaneousLedger[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [llmSuggestions, setLlmSuggestions] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'accountNumber' | 'accountName'>('accountNumber');
  const { showNotification } = useNotification();

  const allEntries = useMemo(() => (
    [...importedEntries]
  ), [importedEntries]);

  const filteredEntries = useMemo(() => {
    const compareFn = (a: MiscellaneousLedger, b: MiscellaneousLedger) => {
      let cmp = 0;
      if (sortBy === 'accountNumber') {
        const an = (a.accountNumber || '').toString();
        const bn = (b.accountNumber || '').toString();
        cmp = an.localeCompare(bn, undefined, { numeric: true, sensitivity: 'base' });
      } else {
        const an = (a.accountName || '').toString();
        const bn = (b.accountName || '').toString();
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
        (entry.accountName || '').toLowerCase().includes(term) ||
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

  // Load persisted entries on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // Charger depuis le cache local d'abord pour un affichage immédiat
        if (typeof window !== 'undefined') {
          try {
            const cacheKey = `miscLedgerCache:${clientId}`;
            const cached = window.localStorage.getItem(cacheKey);
            if (cached) {
              const parsed = JSON.parse(cached);
              const mapped: MiscellaneousLedger[] = parsed.map((e: any) => ({
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
                type: 'miscellaneous' as const,
                category: e.category || '',
                createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
                importIndex: e.importIndex,
                aiMeta: e.aiMeta || undefined
              }));
              if (!cancelled) setImportedEntries(mapped);
            }
          } catch (e) {
            logger.warn('Erreur lecture cache local', { clientId }, e instanceof Error ? e : new Error(String(e)));
          }
        }

        // Puis charger depuis Supabase pour synchroniser
        const entries = await fetchMiscLedgerFromSupabase(clientId);
        if (cancelled) return;
        
        if (entries && entries.length > 0) {
          const mapped: MiscellaneousLedger[] = entries.map((e: any) => ({
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
            type: 'miscellaneous' as const,
            category: e.category || '',
            createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
            importIndex: e.importIndex,
            aiMeta: e.aiMeta || undefined
          }));
          
          setImportedEntries(mapped);
          // Mettre à jour le cache localStorage pour la prochaine visite
          if (typeof window !== 'undefined') {
            try {
              window.localStorage.setItem(`miscLedgerCache:${clientId}`, JSON.stringify(mapped));
            } catch (e) {
              logger.warn('Erreur mise à jour cache local', { clientId }, e instanceof Error ? e : new Error(String(e)));
            }
          }
        }
      } catch (error) {
        logger.error('Erreur lors du chargement du grand livre divers', { clientId }, error instanceof Error ? error : new Error(String(error)));
      }
    };
    
    load();
    return () => { cancelled = true; };
  }, [clientId]);

  const reloadFromDb = useCallback(async () => {
    try {
      const entries = await fetchMiscLedgerFromSupabase(clientId);
      const mapped: MiscellaneousLedger[] = (entries || []).map((e: any) => ({
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
        type: 'miscellaneous' as const,
        category: e.category || '',
        createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
        importIndex: e.importIndex,
        aiMeta: e.aiMeta || undefined
      }));
      
      setImportedEntries(mapped);
      // Mettre à jour le cache localStorage
      if (mapped.length > 0) {
        setMiscLedgerCache(clientId, mapped);
      }
      showNotification({ type: 'success', title: 'Succès', message: 'Données rechargées avec succès' });
    } catch (error) {
      logger.error('Erreur lors du rechargement', { clientId }, error instanceof Error ? error : new Error(String(error)));
      showNotification({ type: 'error', title: 'Erreur', message: 'Erreur lors du rechargement' });
    }
  }, [clientId, showNotification]);

  const clearForClient = useCallback(async () => {
    try {
      // Vider le cache (localStorage + mémoire) ET Supabase
      clearMiscLedgerCache(clientId);
      setImportedEntries([]);
      showNotification({ type: 'success', title: 'Succès', message: 'Grand livre vidé avec succès' });
    } catch (error) {
      logger.error('Erreur lors de la suppression', { clientId }, error instanceof Error ? error : new Error(String(error)));
      showNotification({ type: 'error', title: 'Erreur', message: 'Erreur lors de la suppression' });
    }
  }, [clientId, showNotification]);

  const handleImport = useCallback(async (importedData: ImportedRow[]) => {
    let lastAccountName = '';
    let lastAccountNumber = '';
    const newEntriesRaw: (MiscellaneousLedger | null)[] = importedData
      .filter((row) => row.isValid)
      .map((row, index) => {
        const normalize = (s: string) =>
          String(s || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .replace(/^\uFEFF/, "")
            .replace(/[\u00a0\t]+/g, " ")
            .replace(/\s+/g, " ")
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

        const fuzzyLookupExact = (candidates: string[]): string | '' => {
          for (const name of candidates) {
            const normName = normalize(name);
            if (headerMap[normName] !== undefined) {
              const k = headerMap[normName];
              const v = row.data[k];
              if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
            }
          }
          return '';
        };
        
        const fuzzyLookupInclusive = (candidates: string[], requireCompte?: boolean): string | '' => {
          for (const name of candidates) {
            const normName = normalize(name);
            const key = headerKeysNorm.find(h => {
              const match = h.includes(normName) || normName.includes(h);
              if (!match) return false;
              if (requireCompte) return /\bcompte\b/i.test(h);
              return true;
            });
            if (key) {
              const orig = headerMap[key];
              const v = row.data[orig];
              if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
            }
          }
          return '';
        };
        
        const findColumnValue = (possibleNames: string[], fallbackHint?: 'ref' | 'accountNumber' | 'accountName' | 'desc' | 'debit' | 'credit' | 'category') => {
          const direct = fallbackHint === 'accountName'
            ? (fuzzyLookupExact(possibleNames) || fuzzyLookupInclusive(possibleNames, true))
            : (fuzzyLookupExact(possibleNames) || fuzzyLookupInclusive(possibleNames));
          if (direct) return direct;
          if (fallbackHint) {
            const picker = (pred: (h: string) => boolean) => {
              const key = headerKeysNorm.find(pred);
              if (!key) return '';
              const v = row.data[headerMap[key]];
              return v !== undefined && v !== null && String(v).trim() !== '' ? String(v).trim() : '';
            };
            if (fallbackHint === 'ref') return picker(h => /(\bref\b|reference|piece|numero|num)/i.test(h));
            if (fallbackHint === 'accountNumber') return picker(h => /(code\s*compte|numero\s*compte|numero de compte|n[°o]?\s*compte|compte\s*(code|n[°o]?|num|numero))/i.test(h));
            if (fallbackHint === 'accountName') {
              return picker(h => (
                /\bcompte\b/i.test(h) && (/\bnom\b/i.test(h) || /intitul[eé]/i.test(h) || /\blibelle\s*compte\b/i.test(h) || /\bcompte\s*libelle\b/i.test(h))
              ));
            }
            if (fallbackHint === 'desc') return picker(h => /(description|libelle detaille|designation)/i.test(h));
            if (fallbackHint === 'debit') return picker(h => /(\bmvt\s*debit\b|mouvement\s*debit|montant\s*debit|\bdebit\b)/i.test(h));
            if (fallbackHint === 'credit') return picker(h => /(\bmvt\s*credit\b|mouvement\s*credit|montant\s*credit|\bcredit\b)/i.test(h));
            if (fallbackHint === 'category') return picker(h => /(categorie|category)/i.test(h));
          }
          return '';
        };

        const dateStr = findColumnValue(["Date", "date"]);
        let accountNumber = CSVSanitizer.sanitizeString(
          findColumnValue(["N° Compte", "Compte N°", "No Compte", "N°compte", "N°Compte", "Numéro compte", "Numéro de compte", "Code Compte", "Code compte", "accountNumber"], 'accountNumber')
        );
        let accountName = CSVSanitizer.sanitizeString(
          findColumnValue(["Nom compte", "Nom du compte", "Libellé compte", "Intitulé compte", "Intitulé du compte", "accountName"], 'accountName')
        );
        
        if (!accountName) {
          const extracted = extractFromAnyCell(/(?:nom\s*compte|nom du compte|libelle\s*compte|intitule\s*compte)\s*[:\-]?\s*(.+)/i);
          if (extracted) accountName = CSVSanitizer.sanitizeString(extracted);
        }
        if (!accountNumber) {
          const extractedAcc = extractFromAnyCell(/(?:n[°o]?\s*compte|code\s*compte|numero\s*compte|num[\.]?\s*compte)\s*[:\-]?\s*([A-Za-z0-9\- ]+)/i);
          if (extractedAcc) accountNumber = CSVSanitizer.sanitizeString(extractedAcc);
        }
        
        // Carry-forward
        if (!accountName && lastAccountName) accountName = lastAccountName;
        if (!accountNumber && lastAccountNumber) accountNumber = lastAccountNumber;
        if (accountName) lastAccountName = accountName;
        if (accountNumber) lastAccountNumber = accountNumber;
        
        const description = CSVSanitizer.sanitizeString(
          findColumnValue(["Description", "Libellé détaillé", "Libellé detaille", "Désignation", "Intitulé détaillé", "description", "libelle"], 'desc')
        );
        const reference = '';
        const debitStr = findColumnValue(["Débit", "Debit", "debit", "Débits", "débits", "Montant débit", "montant débit", "montant debit", "Mvt Débit", "Mouvement Débit"], 'debit');
        const creditStr = findColumnValue(["Crédit", "Credit", "credit", "Crédits", "crédits", "Montant crédit", "montant crédit", "montant credit", "Mvt Crédit", "Mouvement Crédit"], 'credit');
        const category = '';

        const debit = CSVSanitizer.sanitizeNumeric(debitStr);
        const credit = CSVSanitizer.sanitizeNumeric(creditStr);
        const date = CSVSanitizer.sanitizeDate(dateStr);

        const headerOnly = (debit === 0 && credit === 0) && (
          !!extractFromAnyCell(/(?:nom\s*compte|nom du compte|libelle\s*compte|intitule\s*compte)\s*[:\-]?\s*(.+)/i) ||
          !!extractFromAnyCell(/(?:n[°o]?\s*compte|code\s*compte|numero\s*compte|num[\.]?\s*compte)\s*[:\-]?\s*([A-Za-z0-9\- ]+)/i)
        );
        if (headerOnly) return null;

        return {
          _id: `imported-${Date.now()}-${index}`,
          date,
          accountNumber,
          accountName,
          description,
          debit,
          credit,
          balance: debit - credit,
          reference,
          clientId,
          type: "miscellaneous" as const,
          category,
          createdAt: new Date(),
          importIndex: row.index - 1,
        };
      });

    const newEntries = [...importedEntries, ...newEntriesRaw.filter((e): e is MiscellaneousLedger => !!e)];

    // Enrichissement IA
    let enriched = newEntries;
    try {
      enriched = await enrichEntriesAI(newEntries);
    } catch (e) {
      logger.warn('Enrichissement IA (comptes divers) indisponible', { clientId }, e instanceof Error ? e : new Error(String(e)));
    }
    
    // Déduplication
    const existingSigs = new Set(importedEntries.map(getMiscLedgerSignature));
    const { unique } = dedupBySignature(enriched, getMiscLedgerSignature, existingSigs);
    const addedCount = unique.length;
    const duplicateCount = enriched.length - addedCount;
    const merged = [...importedEntries, ...unique];
    
    setImportedEntries(merged);
    
    // Mettre à jour le cache (localStorage + mémoire) ET Supabase
    try {
      setMiscLedgerCache(clientId, merged);
    } catch (e) {
      logger.warn('Persistance échouée', { clientId }, e instanceof Error ? e : new Error(String(e)));
    }

    if (addedCount > 0) {
      showNotification({
        type: "success",
        title: "Import comptes divers réussi",
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
  }, [clientId, importedEntries, showNotification]);

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
