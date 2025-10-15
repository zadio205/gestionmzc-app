import { BaseRepository } from './BaseRepository';
import type { ClientLedger } from '@/types/accounting';

/**
 * Repository for client ledger entries
 */
export class ClientLedgerRepository extends BaseRepository<ClientLedger> {
  constructor() {
    super('client_ledger');
  }

  /**
   * Find entries by client name
   */
  async findByClient(clientName: string): Promise<ClientLedger[]> {
    return this.findWithFilters({
      ilike: { client_name: `%${clientName}%` },
      orderBy: [{ column: 'date', ascending: false }],
    });
  }

  /**
   * Find entries by date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    clientId?: string
  ): Promise<ClientLedger[]> {
    const filters: any = {
      gte: { date: startDate.toISOString() },
      lte: { date: endDate.toISOString() },
      orderBy: [{ column: 'date', ascending: false }],
    };

    if (clientId) {
      filters.eq = { client_id: clientId };
    }

    return this.findWithFilters(filters);
  }

  /**
   * Find unpaid invoices
   */
  async findUnpaidInvoices(clientId?: string): Promise<ClientLedger[]> {
    const filters: any = {
      gt: { debit: 0 },
      orderBy: [{ column: 'date', ascending: false }],
    };

    if (clientId) {
      filters.eq = { client_id: clientId };
    }

    // Find invoices with debit > 0 where total payments < debit
    const entries = await this.findWithFilters(filters);

    // Calculate balance for each client
    const clientBalances = new Map<string, number>();

    // First pass: calculate total debit and credit per client
    entries.forEach(entry => {
      const currentBalance = clientBalances.get(entry.clientName) || 0;
      clientBalances.set(entry.clientName, currentBalance + entry.debit - entry.credit);
    });

    // Filter entries where client still has outstanding balance
    return entries.filter(entry => {
      const balance = clientBalances.get(entry.clientName) || 0;
      return balance > 0 && entry.debit > 0; // Only include debit entries (invoices)
    });
  }

  /**
   * Find entries without proper justification
   */
  async findEntriesWithoutJustification(clientId?: string): Promise<ClientLedger[]> {
    const filters: any = {
      orderBy: [{ column: 'date', ascending: false }],
    };

    if (clientId) {
      filters.eq = { client_id: clientId };
    }

    const entries = await this.findWithFilters(filters);

    return entries.filter(entry => {
      // Check if payment entry lacks proper reference
      if (entry.credit > 0) {
        return !entry.reference ||
               entry.reference.length < 5 ||
               !entry.reference.match(/^(FAC|REG|CHQ|VIR)/i);
      }
      return false;
    });
  }

  /**
   * Find suspicious entries
   */
  async findSuspiciousEntries(clientId?: string): Promise<ClientLedger[]> {
    const filters: any = {
      orderBy: [{ column: 'date', ascending: false }],
    };

    if (clientId) {
      filters.eq = { client_id: clientId };
    }

    const entries = await this.findWithFilters(filters);

    return entries.filter(entry => {
      const isRoundAmount = (entry.debit + entry.credit) % 100 === 0;
      const isWeekend = entry.date && (entry.date.getDay() === 0 || entry.date.getDay() === 6);
      const hasVagueDescription = entry.description.length < 10;

      return isRoundAmount && (isWeekend || hasVagueDescription);
    });
  }

  /**
   * Get client balance summary
   */
  async getClientBalanceSummary(clientId: string): Promise<{
    totalDebit: number;
    totalCredit: number;
    balance: number;
    lastInvoiceDate?: Date;
    lastPaymentDate?: Date;
  }> {
    const entries = await this.findWithFilters({
      eq: { client_id: clientId },
      orderBy: [{ column: 'date', ascending: false }],
    });

    const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);
    const balance = totalDebit - totalCredit;

    const invoiceEntries = entries.filter(e => e.debit > 0);
    const paymentEntries = entries.filter(e => e.credit > 0);

    const lastInvoiceDate = invoiceEntries.length > 0 && invoiceEntries[0].date
      ? new Date(invoiceEntries[0].date)
      : undefined;
    const lastPaymentDate = paymentEntries.length > 0 && paymentEntries[0].date
      ? new Date(paymentEntries[0].date)
      : undefined;

    return {
      totalDebit,
      totalCredit,
      balance,
      lastInvoiceDate,
      lastPaymentDate,
    };
  }

  /**
   * Get all unique client names
   */
  async getUniqueClientNames(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('client_name')
        .not('client_name', 'is', null);

      if (error) throw error;

      const uniqueNames = [...new Set(data?.map(entry => entry.client_name).filter(Boolean))];
      return uniqueNames.sort();
    } catch (error) {
      console.error('Error getting unique client names:', error);
      return [];
    }
  }

  /**
   * Get monthly statistics
   */
  async getMonthlyStatistics(year: number, month: number): Promise<{
    totalInvoices: number;
    totalPayments: number;
    totalRevenue: number;
    uniqueClients: number;
    averageInvoiceAmount: number;
  }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const entries = await this.findByDateRange(startDate, endDate);

    const invoices = entries.filter(e => e.debit > 0);
    const payments = entries.filter(e => e.credit > 0);
    const uniqueClients = new Set(invoices.map(i => i.clientName)).size;

    const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.debit, 0);
    const averageInvoiceAmount = invoices.length > 0 ? totalRevenue / invoices.length : 0;

    return {
      totalInvoices: invoices.length,
      totalPayments: payments.length,
      totalRevenue,
      uniqueClients,
      averageInvoiceAmount,
    };
  }

  /**
   * Batch update client names
   */
  async batchUpdateClientNames(updates: Array<{
    oldName: string;
    newName: string;
  }>): Promise<boolean> {
    try {
      for (const { oldName, newName } of updates) {
        const { error } = await this.supabase
          .from(this.tableName)
          .update({ client_name: newName })
          .eq('client_name', oldName);

        if (error) throw error;
      }
      return true;
    } catch (error) {
      console.error('Error batch updating client names:', error);
      return false;
    }
  }

  /**
   * Search entries with advanced criteria
   */
  async search(criteria: {
    query?: string;
    clientName?: string;
    dateRange?: { start: Date; end: Date };
    amountRange?: { min: number; max: number };
    invoiceNumber?: string;
    status?: 'paid' | 'pending' | 'overdue';
  }): Promise<ClientLedger[]> {
    const filters: any = {};

    if (criteria.clientName) {
      filters.ilike = { client_name: `%${criteria.clientName}%` };
    }

    if (criteria.dateRange) {
      filters.gte = { date: criteria.dateRange.start.toISOString() };
      filters.lte = { date: criteria.dateRange.end.toISOString() };
    }

    if (criteria.amountRange) {
      filters.gte = { debit: criteria.amountRange.min };
      filters.lte = { debit: criteria.amountRange.max };
    }

    if (criteria.invoiceNumber) {
      filters.ilike = { invoice_number: `%${criteria.invoiceNumber}%` };
    }

    if (criteria.query) {
      filters.or = `client_name.ilike.%${criteria.query}%,description.ilike.%${criteria.query}%,reference.ilike.%${criteria.query}%,invoice_number.ilike.%${criteria.query}%`;
    }

    filters.orderBy = [{ column: 'date', ascending: false }];

    let entries = await this.findWithFilters(filters);

    // Apply status filtering (needs additional logic)
    if (criteria.status) {
      entries = entries.filter(entry => {
        // This is simplified - in a real implementation, you'd want to
        // calculate the actual balance for each client
        const balance = entry.debit - entry.credit;

        switch (criteria.status) {
          case 'paid':
            return entry.credit >= entry.debit;
          case 'pending':
            return entry.debit > entry.credit && entry.debit - entry.credit <= 30;
          case 'overdue':
            return entry.debit > entry.credit && entry.debit - entry.credit > 30;
          default:
            return true;
        }
      });
    }

    return entries;
  }
}

// Singleton instance
export const clientLedgerRepository = new ClientLedgerRepository();