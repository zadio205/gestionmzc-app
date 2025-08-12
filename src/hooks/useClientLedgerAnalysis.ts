import { useMemo } from 'react';
import { ClientLedger } from '@/types/accounting';

interface AnalysisResult {
  unsolvedInvoices: ClientLedger[];
  paymentsWithoutJustification: ClientLedger[];
  suspiciousEntries: ClientLedger[];
}

export const useClientLedgerAnalysis = (entries: ClientLedger[]): AnalysisResult => {
  return useMemo(() => {
    // Early return for empty entries
    if (!entries.length) {
      return {
        unsolvedInvoices: [],
        paymentsWithoutJustification: [],
        suspiciousEntries: []
      };
    }

    const invoices = new Map<string, ClientLedger>();
    const payments = new Map<string, ClientLedger[]>();
    const clientTotals = new Map<string, { invoiced: number; paid: number }>();
    const unsolvedInvoices: ClientLedger[] = [];
    const paymentsWithoutJustification: ClientLedger[] = [];
    const suspiciousEntries: ClientLedger[] = [];
    
    // Single pass through entries for better performance
    entries.forEach(entry => {
      // Track invoices and payments
      if (entry.debit > 0 && entry.invoiceNumber) {
        invoices.set(entry.invoiceNumber, entry);
      }
      
      if (entry.credit > 0) {
        const key = entry.clientName;
        if (!payments.has(key)) payments.set(key, []);
        payments.get(key)!.push(entry);
        
        // Check for missing justification during iteration
        if (!entry.reference || 
            entry.reference.length < 5 || 
            !entry.reference.match(/^(FAC|REG|CHQ|VIR)/i)) {
          paymentsWithoutJustification.push(entry);
        }
      }
      
      // Track client totals
      const clientName = entry.clientName;
      if (!clientTotals.has(clientName)) {
        clientTotals.set(clientName, { invoiced: 0, paid: 0 });
      }
      const totals = clientTotals.get(clientName)!;
      totals.invoiced += entry.debit;
      totals.paid += entry.credit;
      
      // Check for suspicious entries during iteration
      const isRoundAmount = (entry.debit + entry.credit) % 100 === 0;
  const isWeekend = !!entry.date && (entry.date.getDay() === 0 || entry.date.getDay() === 6);
      const hasVagueDescription = entry.description.length < 10;
      
      if (isRoundAmount && (isWeekend || hasVagueDescription)) {
        suspiciousEntries.push(entry);
      }
    });

    // Check for unsolved invoices using pre-calculated totals
    invoices.forEach((invoice) => {
      const totals = clientTotals.get(invoice.clientName);
      if (totals && totals.invoiced > totals.paid) {
        unsolvedInvoices.push(invoice);
      }
    });

    return {
      unsolvedInvoices,
      paymentsWithoutJustification,
      suspiciousEntries
    };
  }, [entries]);
};