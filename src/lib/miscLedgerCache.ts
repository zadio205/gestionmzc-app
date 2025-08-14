import type { MiscellaneousLedger } from '@/types/accounting';

// Cache en mémoire pour les comptes divers
const cache = new Map<string, MiscellaneousLedger[]>();

export function getMiscLedgerCache(clientId: string): MiscellaneousLedger[] | undefined {
	return cache.get(clientId);
}

export function setMiscLedgerCache(clientId: string, entries: MiscellaneousLedger[]): void {
	cache.set(clientId, entries);
}

export function clearMiscLedgerCache(clientId: string): void {
	cache.delete(clientId);
}

