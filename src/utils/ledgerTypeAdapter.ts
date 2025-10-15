/**
 * Adapteur pour convertir entre les types LedgerEntry et ClientLedger
 */
import type { LedgerEntry } from '@/types/ledger';
import type { ClientLedger } from '@/types/accounting';

/**
 * Convertit un LedgerEntry en ClientLedger
 */
export function ledgerEntryToClientLedger(entry: LedgerEntry): ClientLedger {
  // Convertir la date en objet Date si c'est une chaîne
  const convertedDate = entry.date ? 
    (typeof entry.date === 'string' ? new Date(entry.date) : entry.date) 
    : null;

  return {
    _id: entry._id,
    date: convertedDate,
    accountNumber: entry.account || '',
    accountName: entry.label || '',
    description: entry.description || '',
    debit: entry.debit,
    credit: entry.credit,
    balance: entry.balance || 0,
    reference: entry.reference || '',
    clientId: entry.clientId,
    type: 'client' as const,
    clientName: '', // À remplir si disponible
    invoiceNumber: entry.invoiceNumber,
    createdAt: entry.createdAt,
    isImported: true,
  };
}

/**
 * Convertit un ClientLedger en LedgerEntry
 */
export function clientLedgerToLedgerEntry(entry: ClientLedger): LedgerEntry {
  return {
    _id: entry._id,
    date: entry.date,
    label: entry.accountName,
    debit: entry.debit,
    credit: entry.credit,
    balance: entry.balance,
    type: entry.type,
    clientId: entry.clientId,
    account: entry.accountNumber,
    reference: entry.reference,
    description: entry.description,
    category: undefined,
    status: 'validated',
    invoiceNumber: entry.invoiceNumber,
    createdAt: entry.createdAt,
    updatedAt: new Date(),
  };
}

/**
 * Convertit un tableau de LedgerEntry en ClientLedger
 */
export function ledgerEntriesToClientLedgers(entries: LedgerEntry[]): ClientLedger[] {
  return entries.map(ledgerEntryToClientLedger);
}

/**
 * Convertit un tableau de ClientLedger en LedgerEntry
 */
export function clientLedgersToLedgerEntries(entries: ClientLedger[]): LedgerEntry[] {
  return entries.map(clientLedgerToLedgerEntry);
}