import { ClientLedger } from '@/types/accounting';
import { AnalysisResult } from '@/types/ledger';
import { AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

/**
 * Service for client ledger business logic
 */
export class ClientLedgerService {
  /**
   * Format currency amount
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  /**
   * Format date
   */
  static formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR').format(date);
  }

  /**
   * Analyze client ledger entries for issues
   * Uses memoization for performance with large datasets
   */
  static analyzeEntries(entries: ClientLedger[]): AnalysisResult {
    const invoices = new Map<string, ClientLedger>();
    const payments = new Map<string, ClientLedger[]>();
    
    // Identifier les factures et paiements
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

    // Factures non soldées
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

    // Paiements sans justificatifs
    const paymentsWithoutJustification: ClientLedger[] = [];
    payments.forEach(clientPayments => {
      clientPayments.forEach(payment => {
        if (!payment.reference || 
            payment.reference.length < 5 || 
            !payment.reference.match(/^(FAC|REG|CHQ|VIR)/i)) {
          paymentsWithoutJustification.push(payment);
        }
      });
    });

    // Écritures suspectes
    const suspiciousEntries: ClientLedger[] = entries.filter(entry => {
      const isRoundAmount = (entry.debit + entry.credit) % 100 === 0;
  const isWeekend = !!entry.date && (entry.date.getDay() === 0 || entry.date.getDay() === 6);
      const hasVagueDescription = entry.description.length < 10;
      
      return isRoundAmount && (isWeekend || hasVagueDescription);
    });

    return {
      unsolvedInvoices,
      paymentsWithoutJustification,
      suspiciousEntries
    };
  }

  /**
   * Group entries by client name
   */
  static groupEntriesByClient(entries: ClientLedger[]): Record<string, ClientLedger[]> {
    return entries.reduce((acc, entry) => {
      if (!acc[entry.clientName]) {
        acc[entry.clientName] = [];
      }
      acc[entry.clientName].push(entry);
      return acc;
    }, {} as Record<string, ClientLedger[]>);
  }

  /**
   * Calculate summary statistics
   */
  static calculateSummary(entries: ClientLedger[]) {
    const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);
    const totalBalance = totalDebit - totalCredit;

    return {
      totalDebit,
      totalCredit,
      totalBalance
    };
  }

  /**
   * Filter entries based on search term
   */
  static filterEntries(entries: ClientLedger[], searchTerm: string): ClientLedger[] {
    if (!searchTerm.trim()) return entries;
    
    const term = searchTerm.toLowerCase();
    return entries.filter(entry =>
      entry.clientName.toLowerCase().includes(term) ||
      entry.description.toLowerCase().includes(term) ||
      entry.reference.toLowerCase().includes(term)
    );
  }

  /**
   * Generate fallback justification message
   */
  static generateFallbackMessage(entry: ClientLedger, type: 'payment' | 'invoice'): string {
    if (type === 'payment') {
  return `Bonjour,

Nous avons identifié un encaissement de ${this.formatCurrency(entry.credit)}${entry.date ? ` en date du ${this.formatDate(entry.date)}` : ''} (référence: ${entry.reference || 'non spécifiée'}).

Pourriez-vous nous fournir les justificatifs suivants :
- Copie du chèque ou relevé bancaire
- Facture correspondante
- Tout autre document justificatif

Description de l'écriture : ${entry.description}

Merci de votre collaboration.

Cordialement,
L'équipe comptable`;
    } else {
      return `Bonjour,

Nous constatons que la facture ${entry.invoiceNumber || entry.reference} d'un montant de ${this.formatCurrency(entry.debit)}${entry.date ? ` émise le ${this.formatDate(entry.date)}` : ''} n'est pas encore soldée.

Pourriez-vous nous indiquer :
- Le statut de cette facture
- La date de règlement prévue
- Tout élément explicatif

Merci de votre retour.

Cordialement,
L'équipe comptable`;
    }
  }

  /**
   * Calculate balance for a specific client
   */
  static calculateClientBalance(entries: ClientLedger[]): number {
    const debit = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const credit = entries.reduce((sum, entry) => sum + entry.credit, 0);
    return debit - credit;
  }

  /**
   * Get entry status with analysis result
   */
  static getEntryStatus(entry: ClientLedger, analysisResult: AnalysisResult) {
    if (analysisResult.unsolvedInvoices.some((e) => e._id === entry._id)) {
      return {
        type: 'warning' as const,
        label: 'Facture non soldée',
        icon: AlertTriangle,
      };
    }
    if (analysisResult.paymentsWithoutJustification.some((e) => e._id === entry._id)) {
      return { 
        type: 'error' as const, 
        label: 'Justificatif manquant', 
        icon: XCircle 
      };
    }
    if (analysisResult.suspiciousEntries.some((e) => e._id === entry._id)) {
      return {
        type: 'warning' as const,
        label: 'Écriture suspecte',
        icon: AlertTriangle,
      };
    }
    return { 
      type: 'success' as const, 
      label: 'Conforme', 
      icon: CheckCircle 
    };
  }
}