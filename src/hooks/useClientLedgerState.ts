import { useState, useMemo, useCallback, useEffect } from 'react';
import { ClientLedger } from '@/types/accounting';
import { ImportedRow } from '@/types/ledger';
import { useNotification } from '@/contexts/NotificationContextSimple';
import { CSVSanitizer } from '@/utils/csvSanitizer';
import { enrichImportedClientLedger } from '@/services/aiAdapter';
import { dedupBySignature, getClientLedgerSignature } from '@/utils/ledgerDedup';
import { listClientLedger, saveClientLedger, clearClientLedger } from '@/services/clientLedgerApi';
import { getLedgerCache, setLedgerCache, clearLedgerCache } from '@/lib/ledgerCache';

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
  const { showNotification } = useNotification();
  

  const allEntries = useMemo(() => (
    [...importedEntries]
  ), [importedEntries]);

  const filteredEntries = useMemo(() => {
    if (!searchTerm.trim()) return allEntries;
    
    const term = searchTerm.toLowerCase();
    return allEntries.filter(entry =>
      (entry.clientName || '').toLowerCase().includes(term) ||
      (entry.description || '').toLowerCase().includes(term) ||
      (entry.reference || '').toLowerCase().includes(term)
    );
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
          setImportedEntries(cached);
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
          setImportedEntries(cachedAfter);
          setLedgerCache(clientId, cachedAfter);
          showNotification?.({
            type: 'warning',
            title: 'Données non trouvées en base',
            message: "Affichage des écritures depuis le cache temporaire de la session.",
            duration: 4000,
          });
        } else {
          setImportedEntries(mapped);
          setLedgerCache(clientId, mapped);
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
        setImportedEntries(cached);
        setLedgerCache(clientId, cached);
        return 0;
      } else {
        setImportedEntries(mapped);
        setLedgerCache(clientId, mapped);
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

  const newEntriesRaw: ClientLedger[] = importedData
        .filter((row) => row?.isValid)
        .map((row, index) => {
          // Normalisation locale des clés d'en-tête pour recherche robuste
          const normalize = (s: string) =>
            String(s || '')
              .toLowerCase()
              .normalize('NFD')
              .replace(/\p{Diacritic}/gu, '') // retire accents
              .replace(/^\uFEFF/, '') // retire BOM éventuel
              .replace(/[\u00a0\t]+/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();

          const headerMap: Record<string, string> = {};
          Object.keys(row.data || {}).forEach((key) => {
            headerMap[normalize(key)] = key; // map normalisé -> clé originale
          });

          const findColumnValue = (possibleNames: string[]) => {
            for (const name of possibleNames) {
              const norm = normalize(name);
              const originalKey = headerMap[norm];
              if (originalKey !== undefined && row.data[originalKey] !== null && row.data[originalKey] !== undefined) {
                const value = String(row.data[originalKey]).trim();
                if (value !== '') return value;
              }
            }
            return "";
          };

          // Extraction des données selon le format CSV : Date,Nom Client,N° Compte,Libellé,Débit,Crédit,Référence
          const dateStr = findColumnValue(["Date", "date"]);
          const accountNumber = CSVSanitizer.sanitizeString(
            findColumnValue(["N° Compte", "Compte", "accountNumber", "N°compte", "N°Compte", "Numéro compte"])
          );
          const rawClientName = CSVSanitizer.sanitizeString(
            findColumnValue(["Nom Client", "Client", "clientName", "Nom client", "nom client"])
          );
          // Normalisation du nom client: vide si numérique, identique au compte, ou code-like (ex: C4100000, CDIV0001)
          const normalizeCompare = (s: string) => s.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
          const isNumericOnly = (s: string) => {
            const alnum = s.replace(/[^A-Za-z0-9]/g, '');
            return alnum.length > 0 && /^[0-9]+$/.test(alnum);
          };
          const looksLikeCode = (s: string) => /^[A-Z]{1,5}\d{4,}$/.test(normalizeCompare(s));
          const clientName = (!rawClientName ||
            isNumericOnly(rawClientName) ||
            (!!accountNumber && normalizeCompare(rawClientName) === normalizeCompare(accountNumber)) ||
            looksLikeCode(rawClientName)
          ) ? '' : rawClientName;
          const description = CSVSanitizer.sanitizeString(
            findColumnValue(["Libellé", "Description", "description", "libelle"])
          );
          const debitStr = findColumnValue(["Débit", "Debit", "debit", "débits", "montant débit", "montant debit"]);
          const creditStr = findColumnValue(["Crédit", "Credit", "credit", "crédits", "montant crédit", "montant credit"]);
          const reference = CSVSanitizer.sanitizeString(
            findColumnValue(["Référence", "Reference", "Ref", "reference", "référence"])
          );

          const debit = CSVSanitizer.sanitizeNumeric(debitStr);
          const credit = CSVSanitizer.sanitizeNumeric(creditStr);
          const date = CSVSanitizer.sanitizeDate(dateStr);

          const entry = {
            _id: `imported-${Date.now()}-${index}`,
            date,
            accountNumber: accountNumber,
            accountName: clientName,
            description,
            debit,
            credit,
            balance: debit - credit,
            reference,
            clientId,
            type: "client" as const,
            clientName: clientName,
            invoiceNumber: findColumnValue([
              "N° Facture",
              "Facture",
              "invoiceNumber",
            ]),
            createdAt: new Date(),
            isImported: true,
          };

          return entry;
        });

  // Enrichissement IA des écritures importées
  let newEntries = newEntriesRaw;
      try {
        newEntries = await enrichImportedClientLedger(newEntriesRaw);
      } catch (e) {
        // Si l'IA n'est pas disponible, on continue sans enrichissement
        console.warn('Enrichissement IA indisponible, import sans annotations IA.');
      }

  // Déduplication: combiner les entrées existantes importées avec les nouvelles
  const existingSigs = new Set(importedEntries.map(getClientLedgerSignature));
  const { unique } = dedupBySignature(newEntries, getClientLedgerSignature, existingSigs);
  const addedCount = unique.length;
  const duplicateCount = newEntries.length - addedCount;
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
        const res = await saveClientLedger(toSave.map(e => ({ ...e })));
        // Recharger depuis la base pour s'aligner sur l'état persistant
        const count = await reloadFromDb();
        showNotification?.({
          type: 'success',
          title: 'Sauvegarde en base',
          message: `${res.inserted} inséré(s), ${res.skipped} ignoré(s)`,
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
  }, [clientId, showNotification]);

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
    
    // Computed values
    entries: allEntries,
    filteredEntries,
    summary,
    entriesByClient,
    
    // Actions
    handleImport,
  markEntryAsJustified,
  reloadFromDb,
  clearForClient,
  };
};