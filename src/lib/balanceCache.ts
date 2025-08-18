import type { BalanceItem } from '@/types/accounting';

// Cache mémoire par client et période (clé: `${clientId}::${period||''}`)
const cache = new Map<string, BalanceItem[]>();

const keyFor = (clientId: string, period?: string) => `${clientId}::${period || ''}`;

export function getBalanceCache(clientId: string, period?: string): BalanceItem[] | undefined {
  return cache.get(keyFor(clientId, period));
}

export function setBalanceCache(clientId: string, entries: BalanceItem[], period?: string): void {
  cache.set(keyFor(clientId, period), entries);
}

export function clearBalanceCache(clientId: string, period?: string): void {
  cache.delete(keyFor(clientId, period));
}
