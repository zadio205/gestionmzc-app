import type { SupplierLedger } from '@/types/accounting';

// Cache en mémoire (pour la session courante)
const cache = new Map<string, SupplierLedger[]>();

const LS_KEY = (clientId: string) => `supplierLedgerCache:${clientId}`;

function reviveEntry(raw: any): SupplierLedger {
	return {
		...raw,
		date: raw.date ? new Date(raw.date) : null,
		createdAt: raw.createdAt ? new Date(raw.createdAt) : undefined,
	} as SupplierLedger;
}

export function getSupplierLedgerCache(clientId: string): SupplierLedger[] | undefined {
	// 1) Mémoire
	const inMemory = cache.get(clientId);
	if (inMemory && inMemory.length > 0) return inMemory;
	// 2) localStorage
	if (typeof window !== 'undefined') {
		try {
			const raw = window.localStorage.getItem(LS_KEY(clientId));
			if (raw) {
				const parsed = JSON.parse(raw) as any[];
				const revived = parsed.map(reviveEntry);
				cache.set(clientId, revived);
				return revived;
			}
		} catch {
			// ignore
		}
	}
	return undefined;
}

export function setSupplierLedgerCache(clientId: string, entries: SupplierLedger[]): void {
	cache.set(clientId, entries);
	if (typeof window !== 'undefined') {
		try {
			window.localStorage.setItem(LS_KEY(clientId), JSON.stringify(entries));
		} catch {
			// ignore quota/security errors
		}
	}
}

export function clearSupplierLedgerCache(clientId: string): void {
	cache.delete(clientId);
	if (typeof window !== 'undefined') {
		try { window.localStorage.removeItem(LS_KEY(clientId)); } catch {}
	}
}

