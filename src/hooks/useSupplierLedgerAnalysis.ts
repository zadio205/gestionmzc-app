import { useMemo } from 'react';
import { SupplierLedger } from '@/types/accounting';

interface SupplierAnalysisResult {
  unsolvedBills: SupplierLedger[];
  paymentsWithoutJustification: SupplierLedger[];
  suspiciousEntries: SupplierLedger[];
}

export const useSupplierLedgerAnalysis = (entries: SupplierLedger[]): SupplierAnalysisResult => {
  return useMemo(() => {
    // Early return for empty entries
    if (!entries.length) {
      return {
        unsolvedBills: [],
        paymentsWithoutJustification: [],
        suspiciousEntries: []
      };
    }

    const bills = new Map<string, SupplierLedger>();
    const paymentsBySupplier = new Map<string, SupplierLedger[]>();
    const paymentsByBillNumber = new Map<string, SupplierLedger[]>();
    const unsolvedBills: SupplierLedger[] = [];
    const paymentsWithoutJustification: SupplierLedger[] = [];
    const suspiciousEntries: SupplierLedger[] = [];
    
    // First pass: catalog all entries
    entries.forEach(entry => {
      // Track bills (factures fournisseurs - débit)
      if (entry.debit > 0) {
        if (entry.billNumber) {
          bills.set(entry.billNumber, entry);
        }
      }
      
      // Track payments (règlements - crédit)
      if (entry.credit > 0) {
        // Group by supplier
        const supplierKey = entry.supplierName;
        if (!paymentsBySupplier.has(supplierKey)) {
          paymentsBySupplier.set(supplierKey, []);
        }
        paymentsBySupplier.get(supplierKey)!.push(entry);
        
        // Group by bill number if available
        if (entry.billNumber) {
          if (!paymentsByBillNumber.has(entry.billNumber)) {
            paymentsByBillNumber.set(entry.billNumber, []);
          }
          paymentsByBillNumber.get(entry.billNumber)!.push(entry);
        }
        
        // Check for missing justification (justificatif manquant)
        const hasValidReference = entry.reference && 
          entry.reference.length >= 5 && 
          entry.reference.match(/^(FACT|REG|CHQ|VIR|BON|PAY)/i);
        
        const hasValidBillNumber = entry.billNumber && entry.billNumber.trim().length > 0;
        
        // Un paiement sans justificatif = pas de référence valide ET pas de numéro de facture
        if (!hasValidReference && !hasValidBillNumber) {
          paymentsWithoutJustification.push(entry);
        }
      }
      
      // Check for suspicious entries
      const amount = entry.debit + entry.credit;
      const isRoundAmount = amount > 0 && amount % 100 === 0;
      const isWeekend = !!entry.date && (entry.date.getDay() === 0 || entry.date.getDay() === 6);
      const hasVagueDescription = entry.description.length < 10;
      const isHighAmount = amount > 10000;
      
      if ((isRoundAmount && isHighAmount) || (isWeekend && hasVagueDescription)) {
        suspiciousEntries.push(entry);
      }
    });

    // Second pass: identify unsolved bills (factures non réglées)
    bills.forEach((bill, billNumber) => {
      // Check if this specific bill has been paid
      const paymentsForBill = paymentsByBillNumber.get(billNumber) || [];
      const totalPaidForBill = paymentsForBill.reduce((sum, payment) => sum + payment.credit, 0);
      
      // If no specific payments found, check payments by supplier
      let totalPaidBySupplier = 0;
      if (paymentsForBill.length === 0) {
        const supplierPayments = paymentsBySupplier.get(bill.supplierName) || [];
        totalPaidBySupplier = supplierPayments.reduce((sum, payment) => sum + payment.credit, 0);
      }
      
      const totalPaid = Math.max(totalPaidForBill, totalPaidBySupplier);
      
      // Une facture est non réglée si le montant payé est inférieur au montant de la facture
      // Avec une tolérance de 1€ pour les arrondis
      if (bill.debit > totalPaid + 1) {
        unsolvedBills.push(bill);
      }
    });

    // Also check for bills without bill numbers that might be unpaid
    entries.forEach(entry => {
      if (entry.debit > 0 && !entry.billNumber) {
        // Check if there are payments for this supplier
        const supplierPayments = paymentsBySupplier.get(entry.supplierName) || [];
        const totalPaidToSupplier = supplierPayments.reduce((sum, payment) => sum + payment.credit, 0);
        
        // If this entry seems unpaid, add it to unsolved bills
        if (entry.debit > totalPaidToSupplier + 1) {
          unsolvedBills.push(entry);
        }
      }
    });

    return {
      unsolvedBills,
      paymentsWithoutJustification,
      suspiciousEntries
    };
  }, [entries]);
};