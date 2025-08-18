import type { BalanceItem } from '@/types/accounting';
import { supabaseBrowser } from '@/lib/supabase/client';

// Détection automatique du nom de table entre 'balance' et 'balance_items'
let RESOLVED_TABLE: string | null = null;
const STORAGE_KEY = 'resolved_balance_table';

function saveResolved(table: string) {
  RESOLVED_TABLE = table;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(STORAGE_KEY, table);
    }
  } catch {
    // ignore storage errors
  }
}

function loadResolved(): string | null {
  if (RESOLVED_TABLE) return RESOLVED_TABLE;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const v = sessionStorage.getItem(STORAGE_KEY);
      if (v) {
        RESOLVED_TABLE = v;
        return v;
      }
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

function clearResolved() {
  RESOLVED_TABLE = null;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

async function tableExists(table: string): Promise<boolean> {
  try {
    // Requête légère: limit 0
    const { error } = await supabaseBrowser.from(table).select('*').limit(0);
    if (error) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function resolveBalanceTable(): Promise<string> {
  // 1) memo/sessionStorage
  const cached = loadResolved();
  if (cached) {
    const ok = await tableExists(cached);
    if (ok) return cached;
    // invalider et poursuivre
    clearResolved();
  }

  // 2) env override si valide
  const preferred = process.env.NEXT_PUBLIC_BALANCE_TABLE?.trim();
  if (preferred) {
    const ok = await tableExists(preferred);
    if (ok) {
      console.info(`[balance] Table résolue (env): ${preferred}`);
      saveResolved(preferred);
      return preferred;
    } else {
      console.warn(`[balance] Table '${preferred}' introuvable, fallback vers 'balance_items'`);
    }
  }

  // 3) fallback: privilégier 'balance_items' puis 'balance'
  const candidates = ['balance_items', 'balance'];
  for (const name of candidates) {
    const ok = await tableExists(name);
    if (ok) {
      console.info(`[balance] Table résolue: ${name}`);
      saveResolved(name);
      return name;
    }
  }

  // 4) défaut: balance_items (même si pas présent, on mémorise pour cohérence logs)
  console.info('[balance] Table par défaut: balance_items');
  saveResolved('balance_items');
  return 'balance_items';
}

export async function getResolvedBalanceTable(): Promise<string> {
  return resolveBalanceTable();
}

function isTableMissingError(err: any): boolean {
  if (!err) return false;
  const code = err.code || err?.error?.code;
  const msg = err.message || err?.error?.message || '';
  return code === 'PGRST205' || /Could not find the table/i.test(msg);
}

function reviveItem(raw: any): BalanceItem {
  return {
    _id: String(raw.id || crypto.randomUUID()),
    accountNumber: raw.account_number || '',
    accountName: raw.account_name || '',
    debit: Number(raw.debit) || 0,
    credit: Number(raw.credit) || 0,
    balance: Number(raw.balance) || 0,
    clientId: raw.client_id,
    period: raw.period || '',
    createdAt: raw.created_at ? new Date(raw.created_at) : new Date(),
    importIndex: raw.import_index ?? undefined,
  } as BalanceItem;
}

export async function getBalanceLocalCache(clientId: string, period?: string): Promise<BalanceItem[] | undefined> {
  try {
    console.log(`🔍 Chargement cache balance pour client ${clientId}, période ${period}`);
    
  const supabase = supabaseBrowser;
  let table = await resolveBalanceTable();
  let query = supabase.from(table).select('*').eq('client_id', clientId);
    
    if (period) {
      query = query.eq('period', period);
    }
    
    const { data, error } = await query.order('account_number', { ascending: true });

    if (error) {
      if (isTableMissingError(error)) {
        console.info(`[balance] Table ${table} introuvable (get), tentative fallback vers 'balance_items'...`);
        // invalider la résolution et basculer
        saveResolved('balance_items');
        table = await resolveBalanceTable();
        let retryQ = supabase.from(table).select('*').eq('client_id', clientId);
        if (period) retryQ = retryQ.eq('period', period);
        const { data: d2, error: e2 } = await retryQ.order('account_number', { ascending: true });
        if (e2) {
          console.warn('Erreur lors du fallback get:', e2);
          return undefined;
        }
        if (!d2 || d2.length === 0) {
          console.log('Aucune donnée trouvée dans le cache (fallback) pour la période demandée. Tentative sans filtre de période...');
          const retryAll = await supabase
            .from(table)
            .select('*')
            .eq('client_id', clientId)
            .order('account_number', { ascending: true });
          if (retryAll.error) {
            console.warn('Erreur lors du retry sans période (fallback):', retryAll.error);
            return undefined;
          }
          if (!retryAll.data || retryAll.data.length === 0) {
            console.log('Aucune donnée trouvée pour ce client (toutes périodes) après fallback.');
            return undefined;
          }
          const itemsAll = (retryAll.data as any[]).map(reviveItem);
          const periods = Array.from(new Set(itemsAll.map(i => i.period))).filter(Boolean);
          console.info(`[balance] Périodes disponibles pour ce client: ${periods.join(', ')}`);
          return itemsAll;
        }
        const itemsFb = d2.map(reviveItem);
        console.log(`✅ ${itemsFb.length} éléments chargés depuis Supabase (fallback)`);
        return itemsFb;
      }
      console.warn('Erreur lors de la récupération du cache balance Supabase:', error);
      return undefined;
    }

    if (!data || data.length === 0) {
      console.log('Aucune donnée trouvée dans le cache pour la période demandée. Tentative sans filtre de période...');
      // Retente sans filtre de période pour aider le diagnostic (ex: période différente en base)
      const retry = await supabase
        .from(table)
        .select('*')
        .eq('client_id', clientId)
        .order('account_number', { ascending: true });
      if (retry.error) {
        console.warn('Erreur lors du retry sans période:', retry.error);
        return undefined;
      }
      if (!retry.data || retry.data.length === 0) {
        console.log('Aucune donnée trouvée pour ce client (toutes périodes).');
        return undefined;
      }
      const itemsAll = (retry.data as any[]).map(reviveItem);
      const periods = Array.from(new Set(itemsAll.map(i => i.period))).filter(Boolean);
      console.info(`[balance] Périodes disponibles pour ce client: ${periods.join(', ')}`);
      return itemsAll;
    }

    const items = data.map(reviveItem);
    console.log(`✅ ${items.length} éléments chargés depuis Supabase`);
    return items;
  } catch (error) {
    console.warn('Erreur lors de la récupération du cache balance Supabase:', error);
    return undefined;
  }
}

export async function setBalanceLocalCache(clientId: string, period: string | undefined, items: BalanceItem[]): Promise<void> {
  try {
    console.log(`💾 Sauvegarde cache balance pour client ${clientId}, période ${period}, ${items.length} éléments`);
    
    const supabase = supabaseBrowser;
    let table = await resolveBalanceTable();
    
    // Supprimer les données existantes pour ce client et cette période
    let deleteQuery = supabase.from(table).delete().eq('client_id', clientId);
    if (period) {
      deleteQuery = deleteQuery.eq('period', period);
    }
    
    let { error: deleteError } = await deleteQuery;
    if (deleteError) {
      if (isTableMissingError(deleteError)) {
        console.info(`[balance] Table ${table} introuvable (delete), tentative fallback...`);
        RESOLVED_TABLE = null;
        table = await resolveBalanceTable();
        deleteQuery = supabase.from(table).delete().eq('client_id', clientId);
        if (period) deleteQuery = deleteQuery.eq('period', period);
        const retryDel = await deleteQuery;
        deleteError = retryDel.error as any;
        if (deleteError) {
          console.warn('Erreur delete après fallback:', deleteError);
        }
      } else {
        console.warn('Erreur lors de la suppression des données existantes:', deleteError);
      }
    }

    // Insérer les nouvelles données
    if (items.length > 0) {
      const insertData = items.map(item => ({
        account_number: item.accountNumber,
        account_name: item.accountName,
        debit: item.debit,
        credit: item.credit,
        balance: item.balance,
        client_id: item.clientId,
        period: item.period || null,
        import_index: item.importIndex ?? null,
        created_at: item.createdAt ? item.createdAt.toISOString() : new Date().toISOString()
      }));

      let { error: insertError } = await supabase
        .from(table)
        .insert(insertData);

      if (insertError) {
        if (isTableMissingError(insertError)) {
          console.info(`[balance] Table ${table} introuvable (insert), tentative fallback...`);
          RESOLVED_TABLE = null;
          table = await resolveBalanceTable();
          const retryIns = await supabase.from(table).insert(insertData);
          insertError = retryIns.error as any;
          if (insertError) {
            console.warn('Erreur insert après fallback:', insertError);
          } else {
            console.log(`✅ ${items.length} éléments sauvegardés dans Supabase (fallback)`);
          }
        } else {
          console.warn('Erreur lors de la sauvegarde du cache balance Supabase:', insertError);
        }
      } else {
        console.log(`✅ ${items.length} éléments sauvegardés dans Supabase`);
      }
    }
  } catch (error) {
    console.warn('Erreur lors de la sauvegarde du cache balance Supabase:', error);
  }
}

export async function clearBalanceLocalCache(clientId: string, period?: string): Promise<void> {
  try {
    console.log(`🗑️ Suppression cache balance pour client ${clientId}, période ${period}`);
    
    const supabase = supabaseBrowser;
    let table = await resolveBalanceTable();
    let query = supabase.from(table).delete().eq('client_id', clientId);
    
    if (period) {
      query = query.eq('period', period);
    }
    
    let { error } = await query;

    if (error) {
      if (isTableMissingError(error)) {
        console.info(`[balance] Table ${table} introuvable (clear), tentative fallback...`);
        RESOLVED_TABLE = null;
        table = await resolveBalanceTable();
        let retry = supabase.from(table).delete().eq('client_id', clientId);
        if (period) retry = retry.eq('period', period);
        const retryRes = await retry;
        error = retryRes.error as any;
        if (error) {
          console.warn('Erreur clear après fallback:', error);
        } else {
          console.log('✅ Cache balance supprimé de Supabase (fallback)');
        }
      } else {
        console.warn('Erreur lors de la suppression du cache balance Supabase:', error);
      }
    } else {
      console.log('✅ Cache balance supprimé de Supabase');
    }
  } catch (error) {
    console.warn('Erreur lors de la suppression du cache balance Supabase:', error);
  }
}

// Pour la période, utilisons une approche simple avec localStorage en fallback
export async function getLastUsedPeriod(clientId: string): Promise<string | undefined> {
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`last_period_${clientId}`) || undefined;
    }
    return undefined;
  } catch (error) {
    console.warn('Erreur lors de la récupération de la dernière période:', error);
    return undefined;
  }
}

export async function setLastUsedPeriod(clientId: string, period: string): Promise<void> {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`last_period_${clientId}`, period);
    }
  } catch (error) {
    console.warn('Erreur lors de la sauvegarde de la dernière période:', error);
  }
}
