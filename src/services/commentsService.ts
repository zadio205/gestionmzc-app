import { supabaseBrowser } from '@/lib/supabase/client';
import type { LedgerComment, LedgerType } from '@/types/comments';
import { logger } from '@/utils/logger';


// Table Supabase de stockage des commentaires
const TABLE = 'ledger_comments';

// Petit cache mémoire par clé (clientId|entryId)
const mem = new Map<string, LedgerComment[]>();

const keyOf = (clientId: string, entryId: string) => `${clientId}|${entryId}`;

function revive(row: any): LedgerComment {
  return {
    id: row.id,
    entryId: row.entry_id,
    clientId: row.client_id,
    ledgerType: row.ledger_type,
    author: row.author || 'Utilisateur',
    authorType: row.author_type || undefined,
    content: row.content,
    priority: (row.priority as any) || 'medium',
    isInternal: !!row.is_internal,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  };
}

export async function listComments(clientId: string, entryId: string, ledgerType: LedgerType): Promise<LedgerComment[]> {
  const cacheKey = keyOf(clientId, entryId);
  if (mem.has(cacheKey)) return mem.get(cacheKey)!;

  try {
    const { data, error } = await supabaseBrowser
      .from(TABLE)
      .select('*')
      .eq('client_id', clientId)
      .eq('entry_id', entryId)
      .eq('ledger_type', ledgerType)
      .order('created_at', { ascending: true });
    if (error) {
      logger.warn('Supabase listComments error', { error, clientId, entryId, ledgerType });
      return [];
    }
    const revived = (data || []).map(revive);
    mem.set(cacheKey, revived);
    return revived;
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    logger.warn('listComments failed', { error: err, clientId, entryId, ledgerType });
    return [];
  }
}

export async function addComment(params: {
  clientId: string;
  entryId: string;
  ledgerType: LedgerType;
  content: string;
  author?: string;
  authorType?: 'client' | 'collaborateur' | 'admin';
  priority?: 'low' | 'medium' | 'high';
  isInternal?: boolean;
}): Promise<LedgerComment | null> {
  const { clientId, entryId, ledgerType, content, author, authorType, priority = 'medium', isInternal = false } = params;
  try {
    const payload = {
      id: (globalThis as any)?.crypto?.randomUUID?.() ?? undefined,
      client_id: clientId,
      entry_id: entryId,
      ledger_type: ledgerType,
      content,
      author: author || null,
      author_type: authorType || null,
      priority,
      is_internal: isInternal,
    };
    const { data, error } = await supabaseBrowser
      .from(TABLE)
      .insert(payload)
      .select('*')
      .single();
    if (error) {
      logger.warn('Supabase addComment error', { error, clientId, entryId, ledgerType });
      return null;
    }
    const created = revive(data);
    const cacheKey = keyOf(clientId, entryId);
    const arr = mem.get(cacheKey) || [];
    mem.set(cacheKey, [...arr, created]);
    return created;
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    logger.warn('addComment failed', { error: err, clientId, entryId, ledgerType });
    return null;
  }
}

export function invalidateCommentsCache(clientId: string, entryId: string) {
  mem.delete(keyOf(clientId, entryId));
}
