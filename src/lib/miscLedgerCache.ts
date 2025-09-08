import type { MiscellaneousLedger } from '@/types/accounting';

// Cache en mémoire + persistance localStorage
const cache = new Map<string, MiscellaneousLedger[]>();

// Table Supabase (normalisée) pour la persistance des comptes divers
// Ajustez le nom si différent dans Supabase
const MISC_LEDGER_TABLE = 'misc_ledger';

async function getSupabase() {
	try {
		const mod = await import('@/lib/supabase/client');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (mod as any).supabaseBrowser as any;
	} catch {
		return null;
	}
}

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

	// Persistance asynchrone vers Supabase
	void persistMiscLedgerToSupabase(clientId, entries);
}

export function clearMiscLedgerCache(clientId: string): void {
	cache.delete(clientId);
	if (typeof window !== 'undefined') {
		try { window.localStorage.removeItem(LS_KEY(clientId)); } catch {}
	}
	// Supprimer aussi côté Supabase
	void clearMiscLedgerSupabase(clientId);
}

// --- Fonctions Supabase ---
export async function fetchMiscLedgerFromSupabase(clientId: string): Promise<MiscellaneousLedger[] | undefined> {
	try {
	const sb = await getSupabase();
	if (!sb) return undefined;
		const { data, error } = await sb
			.from(MISC_LEDGER_TABLE)
			.select('*')
			.eq('client_id', clientId)
			.order('date', { ascending: true });

		if (error || !data) return undefined;

		const revived = (data as any[]).map(row => {
			const debit = Number(row.debit || 0);
			const credit = Number(row.credit || 0);
			const balance = row.balance != null ? Number(row.balance) : (debit - credit);
			const entry: MiscellaneousLedger = {
				_id: row.id,
				date: row.date ? new Date(row.date as string) : null,
				accountNumber: row.account_number || '',
				accountName: row.account_name || '',
				description: row.description || '',
				debit,
				credit,
				balance,
				reference: row.reference || '',
				clientId: row.client_id,
				type: 'miscellaneous',
				category: row.category || '',
				createdAt: row.created_at ? new Date(row.created_at as string) : new Date(),
				importIndex: row.import_index ?? undefined,
				aiMeta: row.ai_meta ?? undefined,
			};
			return entry;
		});
		cache.set(clientId, revived);
		if (typeof window !== 'undefined') {
			try { window.localStorage.setItem(LS_KEY(clientId), JSON.stringify(revived)); } catch {}
		}
		return revived;
	} catch (e) {
		console.warn('Erreur Supabase (fetch misc):', e);
		return undefined;
	}
}

export async function persistMiscLedgerToSupabase(clientId: string, entries: MiscellaneousLedger[]): Promise<void> {
	try {
	const sb = await getSupabase();
	if (!sb) return;
		// Stratégie simple: remplacer les lignes du client par l'état courant
		const { error: delErr } = await sb.from(MISC_LEDGER_TABLE).delete().eq('client_id', clientId);
		if (delErr) {
			console.warn('Erreur Supabase (delete before insert misc):', delErr);
		}

		const toDbRows = entries.map((e) => ({
			id: ensureUUID(e._id),
			date: e.date ? formatDateOnly(e.date) : null,
			account_number: e.accountNumber || null,
			account_name: e.accountName || null,
			description: e.description || null,
			debit: e.debit ?? 0,
			credit: e.credit ?? 0,
			balance: e.balance ?? ((e.debit ?? 0) - (e.credit ?? 0)),
			reference: e.reference || null,
			client_id: clientId,
			category: e.category || null,
			import_index: e.importIndex ?? null,
			ai_meta: e.aiMeta ?? null,
			created_at: (e.createdAt || new Date()).toISOString(),
		}));

		if (toDbRows.length > 0) {
			const { error: insErr } = await sb.from(MISC_LEDGER_TABLE).insert(toDbRows);
			if (insErr) console.warn('Erreur Supabase (insert misc):', insErr);
		}
	} catch (e) {
		console.warn('Erreur Supabase (upsert misc):', e);
	}
}

export async function clearMiscLedgerSupabase(clientId: string): Promise<void> {
	try {
	const sb = await getSupabase();
	if (!sb) return;
	const { error } = await sb
			.from(MISC_LEDGER_TABLE)
			.delete()
			.eq('client_id', clientId);
		if (error) console.warn('Erreur Supabase (delete misc):', error);
	} catch (e) {
		console.warn('Erreur Supabase (delete misc):', e);
	}
}

	// Utilitaires
	function ensureUUID(id?: string): string {
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		if (id && uuidRegex.test(id)) return id;
		if (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.randomUUID) {
			return (globalThis as any).crypto.randomUUID();
		}
		const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		return `${s4()}${s4()}-${s4()}-4${s4().substr(0,3)}-a${s4().substr(0,3)}-${s4()}${s4()}${s4()}`;
	}

	function formatDateOnly(d: Date): string {
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

