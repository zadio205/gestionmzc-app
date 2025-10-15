// Ce fichier est déprécié - utiliser src/lib/cache/unified/BalanceCache.ts à la place
import { balanceCache } from '@/lib/cache/unified/BalanceCache';
import type { BalanceItem } from '@/types/accounting';

// Fonctions de compatibilité pour la transition
export function getBalanceCache(clientId: string, period?: string): Promise<BalanceItem[] | undefined> {
  return balanceCache.get(clientId, period);
}

export function setBalanceCache(clientId: string, entries: BalanceItem[], period?: string): Promise<void> {
  return balanceCache.set(clientId, entries, period);
}

export function clearBalanceCache(clientId: string, period?: string): Promise<void> {
  return balanceCache.clear(clientId, period);
}

// Export du nouveau cache pour les nouveaux développements
export { balanceCache };
