import { useMemo } from 'react';
import { ClientLedger, MiscellaneousLedger, SupplierLedger } from '@/types/accounting';

// Type union pour tous les types de ledger
type LedgerEntry = ClientLedger | SupplierLedger | MiscellaneousLedger;

interface AnalysisResult<T extends LedgerEntry> {
  unsolvedEntries: T[];
  paymentsWithoutJustification: T[];
  suspiciousEntries: T[];
}

export const useLedgerAnalysis = <T extends LedgerEntry>(entries: T[]): AnalysisResult<T> => {
  return useMemo(() => {
    // Early return for empty entries
    if (!entries.length) {
      return {
        unsolvedEntries: [],
        paymentsWithoutJustification: [],
        suspiciousEntries: []
      };
    }

    const unsolvedEntries: T[] = [];
    const paymentsWithoutJustification: T[] = [];
    const suspiciousEntries: T[] = [];

    entries.forEach((entry) => {
      // Détecter les entrées non soldées (débit > 0 sans crédit correspondant)
      if (entry.debit > 0 && entry.balance > 0) {
        unsolvedEntries.push(entry);
      }

      // Détecter les paiements sans justificatifs
      if (entry.credit > 0 && (!entry.reference || entry.reference.length < 5 || !entry.reference.match(/^(FAC|REG|CHQ|VIR)/i))) {
        paymentsWithoutJustification.push(entry);
      }

      // Détecter les entrées suspectes (montants ronds le weekend, descriptions courtes)
      const isRoundAmount = (entry.debit + entry.credit) % 100 === 0;
      const isWeekend = entry.date && (entry.date.getDay() === 0 || entry.date.getDay() === 6);
      const hasVagueDescription = entry.description.length < 10;
      
      if (isRoundAmount && (isWeekend || hasVagueDescription)) {
        suspiciousEntries.push(entry);
      }
    });

    return {
      unsolvedEntries,
      paymentsWithoutJustification,
      suspiciousEntries
    };
  }, [entries]);
};

// Hooks spécialisés pour la rétrocompatibilité
export const useClientLedgerAnalysis = (entries: ClientLedger[]) => {
  const result = useLedgerAnalysis(entries);
  return {
    unsolvedInvoices: result.unsolvedEntries,
    paymentsWithoutJustification: result.paymentsWithoutJustification,
    suspiciousEntries: result.suspiciousEntries
  };
};

export const useSupplierLedgerAnalysis = (entries: SupplierLedger[]) => {
  const result = useLedgerAnalysis(entries);
  return {
    unsolvedBills: result.unsolvedEntries,
    paymentsWithoutJustification: result.paymentsWithoutJustification,
    suspiciousEntries: result.suspiciousEntries
  };
};

export const useMiscLedgerAnalysis = (entries: MiscellaneousLedger[]) => {
  const result = useLedgerAnalysis(entries);
  return {
    unsolvedEntries: result.unsolvedEntries,
    paymentsWithoutJustification: result.paymentsWithoutJustification,
    suspiciousEntries: result.suspiciousEntries
  };
};