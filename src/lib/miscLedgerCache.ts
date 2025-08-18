import type { MiscellaneousLedger } from '@/types/accounting';

// Cache en mémoire + persistance localStorage
const cache = new Map<string, MiscellaneousLedger[]>();

const LS_KEY = (clientId: string) => `miscLedgerCache:${clientId}`;

function reviveEntry(raw: any): MiscellaneousLedger {
	return {
		...raw,
		date: raw.date ? new Date(raw.date) : null,
		createdAt: raw.createdAt ? new Date(raw.createdAt) : undefined,
	} as MiscellaneousLedger;
}

export function getMiscLedgerCache(clientId: string): MiscellaneousLedger[] | undefined {
	const inMemory = cache.get(clientId);
	if (inMemory && inMemory.length > 0) return inMemory;
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

export function setMiscLedgerCache(clientId: string, entries: MiscellaneousLedger[]): void {
	cache.set(clientId, entries);
	if (typeof window !== 'undefined') {
		try {
			window.localStorage.setItem(LS_KEY(clientId), JSON.stringify(entries));
		} catch {
			// ignore
		}
	}
}

export function clearMiscLedgerCache(clientId: string): void {
	cache.delete(clientId);
	if (typeof window !== 'undefined') {
		try { window.localStorage.removeItem(LS_KEY(clientId)); } catch {}
	}
}

