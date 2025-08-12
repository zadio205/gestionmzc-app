import { useState, useMemo, useCallback } from 'react';
import { ClientLedger } from '@/types/accounting';
import { useNotification } from '@/contexts/NotificationContextSimple';

export const useClientLedgerData = (clientId: string) => {
  const [importedEntries, setImportedEntries] = useState<ClientLedger[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('2024-01');
  const { showNotification } = useNotification();

  const allEntries = useMemo(() => (
    [...importedEntries]
  ), [importedEntries]);

  const filteredEntries = useMemo(() => 
    allEntries.filter(entry =>
      entry.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reference.toLowerCase().includes(searchTerm.toLowerCase())
    ), [allEntries, searchTerm]
  );

  const totals = useMemo(() => {
    const debit = filteredEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const credit = filteredEntries.reduce((sum, entry) => sum + entry.credit, 0);
    return {
      totalDebit: debit,
      totalCredit: credit,
      totalBalance: debit - credit
    };
  }, [filteredEntries]);

  const entriesByClient = useMemo(() => 
    filteredEntries.reduce((acc, entry) => {
      if (!acc[entry.clientName]) {
        acc[entry.clientName] = [];
      }
      acc[entry.clientName].push(entry);
      return acc;
    }, {} as Record<string, ClientLedger[]>)
  , [filteredEntries]);

  const handleImport = useCallback((importedData: any[]) => {
    console.log('🔍 Données clients importées:', importedData);
    
    const newEntries: ClientLedger[] = importedData
      .filter(row => row.isValid)
      .map((row, index) => {
        // Logique d'import existante...
        const findColumnValue = (possibleNames: string[]) => {
          for (const name of possibleNames) {
            if (row.data[name] !== undefined && row.data[name] !== null) {
              return String(row.data[name]).trim();
            }
          }
          return '';
        };
        
        const dateStr = findColumnValue(['Date', 'date']);
        const accountNumber = findColumnValue(['N° Compte', 'Compte', 'accountNumber']);
        const rawClientName = findColumnValue(['Nom Client', 'Client', 'clientName', 'Nom client', 'nom client']);
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
        const description = findColumnValue(['Description', 'Libellé', 'description']);
        const reference = findColumnValue(['Référence', 'Reference', 'Ref', 'reference']);
        const debitStr = findColumnValue(['Débit', 'Debit', 'debit']);
        const creditStr = findColumnValue(['Crédit', 'Credit', 'credit']);
  // accountNumber déjà extrait ci-dessus
        
        const debit = parseFloat(String(debitStr || '0').replace(/[^\d.-]/g, '')) || 0;
        const credit = parseFloat(String(creditStr || '0').replace(/[^\d.-]/g, '')) || 0;
        
        let date: Date | null = null;
        if (dateStr) {
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            date = parsedDate;
          }
        }
        
        return {
          _id: `imported-${Date.now()}-${index}`,
          date,
          accountNumber,
          accountName: clientName,
          description,
          debit,
          credit,
          balance: debit - credit,
          reference,
          clientId,
          type: 'client' as const,
          clientName,
          invoiceNumber: findColumnValue(['N° Facture', 'Facture', 'invoiceNumber']),
          createdAt: new Date(),
          importIndex: row.index - 1
        };
      });

    setImportedEntries(newEntries);
    
    if (newEntries.length > 0) {
      showNotification({
        type: 'success',
        title: 'Import clients réussi',
        message: `${newEntries.length} entrée${newEntries.length > 1 ? 's' : ''} de grand livre clients importée${newEntries.length > 1 ? 's' : ''} avec succès.`,
        duration: 5000
      });
    }
  }, [clientId, showNotification]);

  return {
    allEntries,
    filteredEntries,
    entriesByClient,
    totals,
    searchTerm,
    setSearchTerm,
    selectedPeriod,
    setSelectedPeriod,
    handleImport
  };
};