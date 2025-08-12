import type { ClientLedger } from '@/types/accounting';

// Cache en mémoire, vivant tant que l'onglet reste ouvert (pas de localStorage)
const cache = new Map<string, ClientLedger[]>();

export function getLedgerCache(clientId: string): ClientLedger[] | undefined {
  return cache.get(clientId);
}

export function setLedgerCache(clientId: string, entries: ClientLedger[]): void {
  cache.set(clientId, entries);
}

export function clearLedgerCache(clientId: string): void {
  cache.delete(clientId);
}
