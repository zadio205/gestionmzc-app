import type { SupplierLedger } from '@/types/accounting';

// Cache en mémoire (pour la session courante)
const cache = new Map<string, SupplierLedger[]>();

// Table Supabase (normalisée) pour la persistance des écritures fournisseurs
// Ajustez le nom si différent dans votre projet Supabase
const SUPPLIER_LEDGER_TABLE = 'supplier_ledger';

async function getSupabase() {
	try {
		const mod = await import('@/lib/supabase/client');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (mod as any).supabaseBrowser as any;
	} catch {
		return null;
	}
}

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

	// Persistance asynchrone dans Supabase (fire-and-forget)
	void persistSupplierLedgerToSupabase(clientId, entries);
}

export function clearSupplierLedgerCache(clientId: string): void {
	cache.delete(clientId);
	if (typeof window !== 'undefined') {
		try { window.localStorage.removeItem(LS_KEY(clientId)); } catch {}
	}
	// Supprimer aussi côté Supabase (asynchrone)
	void clearSupplierLedgerSupabase(clientId);
}

// --- Fonctions Supabase ---

export async function fetchSupplierLedgerFromSupabase(clientId: string): Promise<SupplierLedger[] | undefined> {
	try {
	const sb = await getSupabase();
	if (!sb) return undefined;
		const { data, error } = await sb
			.from(SUPPLIER_LEDGER_TABLE)
			.select('*')
			.eq('client_id', clientId)
			.order('date', { ascending: true });

		if (error || !data) return undefined;

		const revived = (data as any[]).map(row => {
			const debit = Number(row.debit || 0);
			const credit = Number(row.credit || 0);
			const balance = row.balance != null ? Number(row.balance) : (debit - credit);
			const entry: SupplierLedger = {
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
				type: 'supplier',
				supplierName: row.supplier_name || row.account_name || '',
				billNumber: row.bill_number || undefined,
				createdAt: row.created_at ? new Date(row.created_at as string) : new Date(),
				importIndex: row.import_index ?? undefined,
				aiMeta: row.ai_meta ?? undefined,
			};
			return entry;
		});
		// Hydrater le cache mémoire et localStorage pour accélérer les prochains chargements
		cache.set(clientId, revived);
		if (typeof window !== 'undefined') {
			try { window.localStorage.setItem(LS_KEY(clientId), JSON.stringify(revived)); } catch {}
		}
		return revived;
	} catch (e) {
		console.warn('Erreur Supabase (fetch suppliers):', e);
		return undefined;
	}
}

export async function persistSupplierLedgerToSupabase(clientId: string, entries: SupplierLedger[]): Promise<void> {
	try {
		const sb = await getSupabase();
		if (!sb) return;
		// Remplacer les entrées existantes de ce client par l'état courant (stratégie simple)
		const { error: delErr } = await sb.from(SUPPLIER_LEDGER_TABLE).delete().eq('client_id', clientId);
		if (delErr) {
			console.warn('Erreur Supabase (delete before insert suppliers):', delErr);
			// On continue quand même pour tenter l'insertion
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
			supplier_name: e.supplierName || e.accountName || null,
			bill_number: e.billNumber || null,
			import_index: e.importIndex ?? null,
			ai_meta: e.aiMeta ?? null,
			created_at: (e.createdAt || new Date()).toISOString(),
		}));

		if (toDbRows.length > 0) {
			const { error: insErr } = await sb.from(SUPPLIER_LEDGER_TABLE).insert(toDbRows);
			if (insErr) console.warn('Erreur Supabase (insert suppliers):', insErr);
		}
	} catch (e) {
		console.warn('Erreur Supabase (upsert suppliers):', e);
	}
}

export async function clearSupplierLedgerSupabase(clientId: string): Promise<void> {
	try {
		const sb = await getSupabase();
		if (!sb) return;
		const { error } = await sb
			.from(SUPPLIER_LEDGER_TABLE)
			.delete()
			.eq('client_id', clientId);
		if (error) console.warn('Erreur Supabase (delete suppliers):', error);
	} catch (e) {
		console.warn('Erreur Supabase (delete suppliers):', e);
	}
}

// Utilitaires
function ensureUUID(id?: string): string {
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	if (id && uuidRegex.test(id)) return id;
	if (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.randomUUID) {
		return (globalThis as any).crypto.randomUUID();
	}
	// Fallback simple (non sécurisé) si randomUUID indisponible
	const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	return `${s4()}${s4()}-${s4()}-4${s4().substr(0,3)}-a${s4().substr(0,3)}-${s4()}${s4()}${s4()}`;
}

function formatDateOnly(d: Date): string {
	// YYYY-MM-DD
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

