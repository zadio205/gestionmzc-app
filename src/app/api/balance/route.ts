import { NextResponse } from 'next/server';
import type { BalanceItem } from '@/types/accounting';
import { supabaseServer } from '@/lib/supabase';
import { clearBalanceCache, getBalanceCache, setBalanceCache } from '@/lib/balanceCache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type BalanceInput = {
  accountNumber: string;
  accountName: string;
  debit: number;
  credit: number;
  balance: number;
  clientId: string;
  period?: string; // texte genre 2024-01
  createdAt?: Date | string;
  importIndex?: number;
  originalDebit?: string | number | null;
  originalCredit?: string | number | null;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientId = url.searchParams.get('clientId') || '';
  const period = url.searchParams.get('period') || undefined;
  if (!clientId) {
    return NextResponse.json({ items: [] }, { status: 200 });
  }

  // 1) Try persistent storage (Supabase)
  try {
  const supabase = supabaseServer();
  const table = await resolveBalanceTableServer(supabase);
  let query = supabase.from(table).select('*').eq('client_id', clientId);
    if (period) query = query.eq('period', period);
    const { data, error } = await query.order('account_number', { ascending: true });
    if (error) throw error;
    const now = new Date();
    const items: BalanceItem[] = (data || []).map((r: any, idx: number) => ({
      _id: String(r.id || crypto.randomUUID()),
      accountNumber: r.account_number || '',
      accountName: r.account_name || '',
      debit: Number(r.debit) || 0,
      credit: Number(r.credit) || 0,
      balance: Number(r.balance) || 0,
      clientId: r.client_id as string,
      period: r.period || '',
      createdAt: r.created_at ? new Date(r.created_at) : now,
      importIndex: r.import_index ?? undefined,
      originalDebit: undefined as any,
      originalCredit: undefined as any,
      // originalDebit / originalCredit non stockés en base par défaut
    }));
    setBalanceCache(clientId, items, period);
    return NextResponse.json({ items }, { status: 200 });
  } catch (_e) {
    // fallback to memory cache only
    const cached = getBalanceCache(clientId, period) || [];
    return NextResponse.json({ items: cached }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const items = (body?.items || []) as BalanceInput[];
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items requis (array non vide)' }, { status: 400 });
    }
    const clientId = items[0]?.clientId;
    if (!clientId || items.some(i => i.clientId !== clientId)) {
      return NextResponse.json({ error: 'Tous les items doivent partager un clientId valide' }, { status: 400 });
    }
    const period = items[0]?.period;

    // Normalize
    const now = new Date();
    const normalized: BalanceItem[] = items.map((i, idx) => ({
      _id: crypto.randomUUID(),
      accountNumber: i.accountNumber || '',
      accountName: i.accountName || '',
      debit: Number(i.debit) || 0,
      credit: Number(i.credit) || 0,
      balance: Number(i.balance) || 0,
      clientId: i.clientId,
      period: i.period || '',
      createdAt: i.createdAt ? new Date(i.createdAt) : now,
      importIndex: i.importIndex,
      originalDebit: i.originalDebit as any,
      originalCredit: i.originalCredit as any,
    }));

    // Upsert strategy: delete previous period rows for client then insert fresh set
    let inserted = 0;
    try {
  const supabase = supabaseServer();
  const table = await resolveBalanceTableServer(supabase);
      if (period) {
        await supabase.from(table).delete().eq('client_id', clientId).eq('period', period);
      } else {
        await supabase.from(table).delete().eq('client_id', clientId);
      }

      if (normalized.length > 0) {
  const payload = normalized.map(i => ({
          account_number: i.accountNumber,
          account_name: i.accountName,
          debit: i.debit,
          credit: i.credit,
          balance: i.balance,
          client_id: i.clientId,
          period: i.period || null,
          import_index: i.importIndex ?? null,
          created_at: i.createdAt ? i.createdAt.toISOString() : new Date().toISOString(),
        }));
  const { error } = await supabase.from(table).insert(payload);
        if (error) throw error;
        inserted = normalized.length;
      }
      setBalanceCache(clientId, normalized, period);
    } catch (_e) {
      // memory-only fallback
      setBalanceCache(clientId, normalized, period);
      inserted = normalized.length;
    }

    return NextResponse.json({ inserted }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const clientId = url.searchParams.get('clientId') || '';
  const period = url.searchParams.get('period') || undefined;
  if (!clientId) {
    return NextResponse.json({ error: 'clientId requis' }, { status: 400 });
  }

  let deleted = 0;
  try {
  const supabase = supabaseServer();
  const table = await resolveBalanceTableServer(supabase);
    let del = supabase.from(table).delete({ count: 'exact' }).eq('client_id', clientId);
    if (period) del = del.eq('period', period);
    const { count, error } = await del;
    if (error) throw error;
    deleted = count || 0;
  } catch (_e) {
    // ignore, rely on cache deletion
  }
  clearBalanceCache(clientId, period);
  return NextResponse.json({ deleted }, { status: 200 });
}

// Résolution serveur du nom de table avec vérification d'existence
async function resolveBalanceTableServer(supabase: ReturnType<typeof supabaseServer>): Promise<string> {
  // helper
  const exists = async (name: string) => {
    try {
      const { error } = await supabase.from(name).select('*').limit(0);
      return !error;
    } catch {
      return false;
    }
  };

  const preferred = process.env.NEXT_PUBLIC_BALANCE_TABLE?.trim();
  if (preferred && await exists(preferred)) return preferred;

  if (await exists('balance_items')) return 'balance_items';
  if (await exists('balance')) return 'balance';
  // défaut
  return preferred || 'balance_items';
}
