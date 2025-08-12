import { useState, useCallback } from 'react';
import { ClientLedger } from '@/types/accounting';
import { ImportedRow } from '@/types/ledger';
import { useNotification } from '@/contexts/NotificationContextSimple';
import { CSVSanitizer } from '@/utils/csvSanitizer';
import { CSV_COLUMN_MAPPINGS, NOTIFICATION_DURATIONS } from '@/constants/clientLedgerConstants';

/**
 * Hook for handling client ledger data import
 */
export const useClientLedgerImport = (clientId: string) => {
  const [importedEntries, setImportedEntries] = useState<ClientLedger[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const { showNotification } = useNotification();

  const findColumnValue = useCallback((row: Record<string, unknown>, possibleNames: readonly string[]) => {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== null) {
        return String(row[name]).trim();
      }
    }
    return "";
  }, []);

  const validateImportData = useCallback((importedData: ImportedRow[]) => {
    if (!importedData) {
      throw new Error("Données d'import non définies");
    }
    
    if (!Array.isArray(importedData)) {
      throw new Error("Format de données invalide - tableau attendu");
    }
    
    if (importedData.length === 0) {
      throw new Error("Aucune donnée valide trouvée dans le fichier");
    }

    if (!clientId || typeof clientId !== 'string' || clientId.trim().length === 0) {
      throw new Error("Identifiant client invalide");
    }
  }, [clientId]);

  const transformImportedRow = useCallback((row: ImportedRow, index: number): ClientLedger => {
    const dateStr = findColumnValue(row.data, CSV_COLUMN_MAPPINGS.date);
  const accountNumber = CSVSanitizer.sanitizeString(
      findColumnValue(row.data, CSV_COLUMN_MAPPINGS.accountNumber)
    );
    const rawClientName = CSVSanitizer.sanitizeString(
      findColumnValue(row.data, CSV_COLUMN_MAPPINGS.clientName)
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
      findColumnValue(row.data, CSV_COLUMN_MAPPINGS.description)
    );
    const debitStr = findColumnValue(row.data, CSV_COLUMN_MAPPINGS.debit);
    const creditStr = findColumnValue(row.data, CSV_COLUMN_MAPPINGS.credit);
    const reference = CSVSanitizer.sanitizeString(
      findColumnValue(row.data, CSV_COLUMN_MAPPINGS.reference)
    );

    const debit = CSVSanitizer.sanitizeNumeric(debitStr);
    const credit = CSVSanitizer.sanitizeNumeric(creditStr);
    const date = CSVSanitizer.sanitizeDate(dateStr);

    return {
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
      clientName,
      invoiceNumber: findColumnValue(row.data, CSV_COLUMN_MAPPINGS.invoiceNumber),
      createdAt: new Date(),
      isImported: true,
    };
  }, [clientId, findColumnValue]);

  const handleImport = useCallback(async (importedData: ImportedRow[]) => {
    setIsImporting(true);
    
    try {
      validateImportData(importedData);

      const newEntries: ClientLedger[] = importedData
        .filter((row) => row?.isValid)
        .map(transformImportedRow);

      setImportedEntries(newEntries);

      if (newEntries.length > 0) {
        showNotification({
          type: "success",
          title: "Import clients réussi",
          message: `${newEntries.length} entrée${
            newEntries.length > 1 ? "s" : ""
          } de grand livre clients importée${
            newEntries.length > 1 ? "s" : ""
          } avec succès.`,
          duration: NOTIFICATION_DURATIONS.SUCCESS,
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'import:", error);
      showNotification({
        type: "error",
        title: "Erreur d'import",
        message: error instanceof Error ? error.message : "Une erreur est survenue lors du traitement du fichier",
        duration: NOTIFICATION_DURATIONS.ERROR,
      });
    } finally {
      setIsImporting(false);
    }
  }, [validateImportData, transformImportedRow, showNotification]);

  const clearImportedEntries = useCallback(() => {
    setImportedEntries([]);
  }, []);

  return {
    importedEntries,
    isImporting,
    handleImport,
    clearImportedEntries
  };
};