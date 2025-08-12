import { ClientLedger } from '@/types/accounting';

export interface AnalysisStrategy {
  analyze(entries: ClientLedger[]): ClientLedger[];
  getDescription(): string;
}

export class UnsolvedInvoicesStrategy implements AnalysisStrategy {
  analyze(entries: ClientLedger[]): ClientLedger[] {
    const invoices = new Map<string, ClientLedger>();
    const payments = new Map<string, ClientLedger[]>();
    
    // Group invoices and payments by client
    entries.forEach(entry => {
      if (entry.debit > 0 && entry.invoiceNumber) {
        invoices.set(entry.invoiceNumber, entry);
      }
      if (entry.credit > 0) {
        const key = entry.clientName;
        if (!payments.has(key)) payments.set(key, []);
        payments.get(key)!.push(entry);
      }
    });

    // Find unsolved invoices
    const unsolvedInvoices: ClientLedger[] = [];
    invoices.forEach((invoice) => {
      const clientPayments = payments.get(invoice.clientName) || [];
      const totalPaid = clientPayments.reduce((sum, p) => sum + p.credit, 0);
      const totalInvoiced = Array.from(invoices.values())
        .filter(inv => inv.clientName === invoice.clientName)
        .reduce((sum, inv) => sum + inv.debit, 0);
      
      if (totalInvoiced > totalPaid) {
        unsolvedInvoices.push(invoice);
      }
    });

    return unsolvedInvoices;
  }

  getDescription(): string {
    return 'Factures émises sans règlement complet';
  }
}

export class MissingJustificationStrategy implements AnalysisStrategy {
  analyze(entries: ClientLedger[]): ClientLedger[] {
    return entries.filter(entry => {
      if (entry.credit <= 0) return false;
      
      return !entry.reference || 
             entry.reference.length < 5 || 
             !entry.reference.match(/^(FAC|REG|CHQ|VIR)/i);
    });
  }

  getDescription(): string {
    return 'Encaissements sans justificatifs clairs';
  }
}

export class SuspiciousEntriesStrategy implements AnalysisStrategy {
  analyze(entries: ClientLedger[]): ClientLedger[] {
    return entries.filter(entry => {
      const isRoundAmount = (entry.debit + entry.credit) % 100 === 0;
  const isWeekend = !!entry.date && (entry.date.getDay() === 0 || entry.date.getDay() === 6);
      const hasVagueDescription = entry.description.length < 10;
      
      return isRoundAmount && (isWeekend || hasVagueDescription);
    });
  }

  getDescription(): string {
    return 'Écritures nécessitant une vérification';
  }
}