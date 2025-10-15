import { NextResponse } from 'next/server';
import type { ClientLedger } from '@/types/accounting';
// Simple in-memory cache for API routes
const ledgerCache = new Map<string, any[]>();

const getLedgerCache = (clientId: string): any[] | undefined => {
  return ledgerCache.get(clientId);
};

const setLedgerCache = (clientId: string, entries: any[]): void => {
  ledgerCache.set(clientId, entries);
};

const clearLedgerCache = (clientId: string): void => {
  ledgerCache.delete(clientId);
};
import { dedupBySignature, getClientLedgerSignature } from '@/utils/ledgerDedup';
import { supabaseServer } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type LedgerEntryInput = {
	date: Date | string | null;
	accountNumber: string;
	accountName: string;
	description: string;
	debit: number;
	credit: number;
	balance: number;
	reference: string;
	clientId: string;
	type?: 'client';
	clientName: string;
	invoiceNumber?: string;
	createdAt?: Date | string;
	isImported?: boolean;
	importIndex?: number;
	aiMeta?: {
		suspiciousLevel?: 'low' | 'medium' | 'high';
		reasons?: string[];
		suggestions?: string[];
	};
};

export async function GET(request: Request) {
	const url = new URL(request.url);
		const clientId = url.searchParams.get('clientId') || '';
		if (!clientId) {
			// Renvoyer liste vide pour ne pas faire planter l'UI
			return NextResponse.json({ entries: [] }, { status: 200 });
		}

	// 1) Tenter lecture depuis Supabase (source persistante)
	try {
		const supabase = supabaseServer();
		const { data, error } = await supabase
			.from('client_ledger')
			.select('*')
			.eq('client_id', clientId)
			.order('date', { ascending: true });
		if (error) throw error;
		const now = new Date();
			// Helper pour typer correctement aiMeta
			const toAiMeta = (raw: any): ClientLedger['aiMeta'] | undefined => {
				if (!raw) return undefined;
				const suspicious = (raw.suspiciousLevel || 'low') as 'low' | 'medium' | 'high';
				const reasons = Array.isArray(raw.reasons) ? raw.reasons : [];
				const suggestions = Array.isArray(raw.suggestions) ? raw.suggestions : [];
				return { suspiciousLevel: suspicious, reasons, suggestions };
			};

			const mapped: ClientLedger[] = (data || []).map((r: any) => ({
			_id: String(r.id || crypto.randomUUID()),
			date: r.date ? new Date(r.date) : null,
			accountNumber: r.account_number || '',
			accountName: r.account_name || '',
			description: r.description || '',
			debit: Number(r.debit) || 0,
			credit: Number(r.credit) || 0,
			balance: Number(r.balance) || 0,
			reference: r.reference || '',
			clientId: r.client_id as string,
			type: 'client',
			clientName: r.client_name || '',
			invoiceNumber: r.invoice_number || undefined,
			createdAt: r.created_at ? new Date(r.created_at) : now,
			importIndex: r.import_index ?? undefined,
			isImported: (r.is_imported ?? true) as boolean,
			aiMeta: toAiMeta(r.ai_meta),
		}));
		// Met à jour le cache mémoire pour des accès rapides
		setLedgerCache(clientId, mapped);
		return NextResponse.json({ entries: mapped }, { status: 200 });
		} catch (_e) {
			// 2) Repli sur cache mémoire (session)
			const cached = getLedgerCache(clientId) || [];
			return NextResponse.json({ entries: cached }, { status: 200 });
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json().catch(() => null);
		const entries = (body?.entries || []) as LedgerEntryInput[];
		if (!Array.isArray(entries) || entries.length === 0) {
			return NextResponse.json({ error: 'entries requis (array non vide)' }, { status: 400 });
		}

		const clientId = entries[0]?.clientId;
		if (!clientId || entries.some(e => e.clientId !== clientId)) {
			return NextResponse.json({ error: 'Tous les entries doivent partager un clientId valide' }, { status: 400 });
		}

			const now = new Date();
			const normalizeAiMeta = (
				input: LedgerEntryInput['aiMeta']
			): ClientLedger['aiMeta'] | undefined => {
				if (!input) return undefined;
				const suspicious = (input.suspiciousLevel || 'low') as 'low' | 'medium' | 'high';
				const reasons = Array.isArray(input.reasons) ? input.reasons : [];
				const suggestions = Array.isArray(input.suggestions) ? input.suggestions : [];
				return { suspiciousLevel: suspicious, reasons, suggestions };
			};

			const normalized: ClientLedger[] = entries.map((e, idx) => ({
			_id: crypto.randomUUID(),
			date: e.date ? new Date(e.date) : null,
			accountNumber: e.accountNumber,
			accountName: e.accountName,
			description: e.description,
			debit: Number(e.debit) || 0,
			credit: Number(e.credit) || 0,
			balance: Number(e.balance) || 0,
			reference: e.reference,
			clientId: e.clientId,
			type: 'client',
			clientName: e.clientName,
			invoiceNumber: e.invoiceNumber,
			createdAt: e.createdAt ? new Date(e.createdAt) : now,
			importIndex: (e as any).importIndex,
			isImported: e.isImported ?? true,
			aiMeta: normalizeAiMeta(e.aiMeta),
		}));

		// Déduplication basée sur la base + cache mémoire
		let existingSigs = new Set<string>();
		try {
			const supabase = supabaseServer();
			const { data, error } = await supabase
				.from('client_ledger')
				.select('date, account_number, description, reference, debit, credit, client_id')
				.eq('client_id', clientId);
			if (error) throw error;
			const existingFromDb: ClientLedger[] = (data || []).map((r: any) => ({
				_id: crypto.randomUUID(),
				date: r.date ? new Date(r.date) : null,
				accountNumber: r.account_number || '',
				accountName: '',
				description: r.description || '',
				debit: Number(r.debit) || 0,
				credit: Number(r.credit) || 0,
				balance: 0,
				reference: r.reference || '',
				clientId: r.client_id,
				type: 'client',
				clientName: '',
				createdAt: now,
			} as ClientLedger));
			existingSigs = new Set(existingFromDb.map(getClientLedgerSignature));
		} catch (_e) {
			// ignore, fallback memory only
		}
		// Ajouter les signatures du cache mémoire serveur
		const prev = getLedgerCache(clientId) || [];
		for (const sig of prev.map(getClientLedgerSignature)) existingSigs.add(sig);

		const { unique } = dedupBySignature(normalized, getClientLedgerSignature, existingSigs);
		const duplicatesCount = normalized.length - unique.length;

		// Insertion en base si possible, sinon repli mémoire
		let inserted = 0;
		try {
			const supabase = supabaseServer();
			if (unique.length > 0) {
				const payload = unique.map(e => ({
					date: e.date ? e.date.toISOString().slice(0, 10) : null,
					account_number: e.accountNumber,
					account_name: e.accountName,
					description: e.description,
					debit: e.debit,
					credit: e.credit,
					balance: e.balance,
					reference: e.reference,
					client_id: e.clientId,
					client_name: e.clientName,
					invoice_number: e.invoiceNumber ?? null,
					import_index: e.importIndex ?? null,
					is_imported: e.isImported ?? true,
					ai_meta: e.aiMeta ?? null,
					created_at: e.createdAt ? e.createdAt.toISOString() : new Date().toISOString(),
				}));
				const { error } = await supabase.from('client_ledger').insert(payload);
				if (error) throw error;
				inserted = unique.length;
			}
			// mettre en cache mémoire serveur pour GET immédiat
			const next = [...prev, ...unique];
			setLedgerCache(clientId, next);
		} catch (_e) {
			// Repli: uniquement cache mémoire serveur
			const next = [...prev, ...unique];
			setLedgerCache(clientId, next);
			inserted = unique.length;
		}

		return NextResponse.json({ inserted, skipped: duplicatesCount }, { status: 200 });
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 });
	}
}

export async function DELETE(request: Request) {
	const url = new URL(request.url);
	const clientId = url.searchParams.get('clientId') || '';
	if (!clientId) {
		return NextResponse.json({ error: 'clientId requis' }, { status: 400 });
	}

	let deleted = 0;
	try {
		const supabase = supabaseServer();
		const { count, error } = await supabase
			.from('client_ledger')
			.delete({ count: 'exact' })
			.eq('client_id', clientId);
		if (error) throw error;
		deleted = count || 0;
	} catch (_e) {
		// ignore and rely on cache deletion
	}
	const prev = getLedgerCache(clientId) || [];
	clearLedgerCache(clientId);
	return NextResponse.json({ deleted: deleted || prev.length }, { status: 200 });
}
