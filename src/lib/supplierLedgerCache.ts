import type { SupplierLedger } from '@/types/accounting';

// Cache en mémoire, vivant tant que l'onglet reste ouvert (pas de localStorage)
const cache = new Map<string, SupplierLedger[]>();

export function getSupplierLedgerCache(clientId: string): SupplierLedger[] | undefined {
	return cache.get(clientId);
}

export function setSupplierLedgerCache(clientId: string, entries: SupplierLedger[]): void {
	cache.set(clientId, entries);
}

export function clearSupplierLedgerCache(clientId: string): void {
	cache.delete(clientId);
}

