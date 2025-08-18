import type { BalanceItem } from '@/types/accounting';
import { supabaseBrowser } from '@/lib/supabase/client';

// Table pour stocker les caches de balance
const BALANCE_CACHE_TABLE = 'balance_cache';
const LAST_PERIOD_TABLE = 'balance_last_period';

function reviveItem(raw: any): BalanceItem {
  return {
    ...raw,
    createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
  } as BalanceItem;
}

export async function getBalanceSupabaseCache(clientId: string, period?: string): Promise<BalanceItem[] | undefined> {
  try {
    const cacheKey = `${clientId}::${period || ''}`;
    
    const { data, error } = await supabaseBrowser
      .from(BALANCE_CACHE_TABLE)
      .select('data')
      .eq('cache_key', cacheKey)
      .single();

    if (error || !data) {
      return undefined;
    }

    const parsed = data.data as any[];
    return parsed.map(reviveItem);
  } catch (error) {
    console.warn('Erreur lors de la récupération du cache balance Supabase:', error);
    return undefined;
  }
}

export async function setBalanceSupabaseCache(clientId: string, period: string | undefined, items: BalanceItem[]): Promise<void> {
  try {
    const cacheKey = `${clientId}::${period || ''}`;
    
    const { error } = await supabaseBrowser
      .from(BALANCE_CACHE_TABLE)
      .upsert({
        cache_key: cacheKey,
        client_id: clientId,
        period: period || null,
        data: items,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'cache_key'
      });

    if (error) {
      console.warn('Erreur lors de la sauvegarde du cache balance Supabase:', error);
    }
  } catch (error) {
    console.warn('Erreur lors de la sauvegarde du cache balance Supabase:', error);
  }
}

export async function clearBalanceSupabaseCache(clientId: string, period?: string): Promise<void> {
  try {
    const cacheKey = `${clientId}::${period || ''}`;
    
    const { error } = await supabaseBrowser
      .from(BALANCE_CACHE_TABLE)
      .delete()
      .eq('cache_key', cacheKey);

    if (error) {
      console.warn('Erreur lors de la suppression du cache balance Supabase:', error);
    }
  } catch (error) {
    console.warn('Erreur lors de la suppression du cache balance Supabase:', error);
  }
}

export async function getLastUsedPeriodSupabase(clientId: string): Promise<string | undefined> {
  try {
    const { data, error } = await supabaseBrowser
      .from(LAST_PERIOD_TABLE)
      .select('period')
      .eq('client_id', clientId)
      .single();

    if (error || !data) {
      return undefined;
    }

    return data.period;
  } catch (error) {
    console.warn('Erreur lors de la récupération de la dernière période Supabase:', error);
    return undefined;
  }
}

export async function setLastUsedPeriodSupabase(clientId: string, period: string): Promise<void> {
  try {
    const { error } = await supabaseBrowser
      .from(LAST_PERIOD_TABLE)
      .upsert({
        client_id: clientId,
        period: period,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'client_id'
      });

    if (error) {
      console.warn('Erreur lors de la sauvegarde de la dernière période Supabase:', error);
    }
  } catch (error) {
    console.warn('Erreur lors de la sauvegarde de la dernière période Supabase:', error);
  }
}

// Fonctions de migration depuis localStorage vers Supabase (optionnel)
export async function migrateFromLocalStorage(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    // Récupérer toutes les clés localStorage qui correspondent au pattern balance
    const keys = Object.keys(localStorage).filter(key => key.startsWith('balanceCache:'));
    
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      
      try {
        const items = JSON.parse(raw) as any[];
        const balanceItems = items.map(reviveItem);
        
        // Extraire clientId et period de la clé
        const match = key.match(/^balanceCache:([^:]+)::(.*)$/);
        if (match) {
          const [, clientId, period] = match;
          await setBalanceSupabaseCache(clientId, period || undefined, balanceItems);
          console.log(`Migration réussie pour ${key}`);
        }
      } catch (error) {
        console.warn(`Erreur lors de la migration de ${key}:`, error);
      }
    }
    
    // Migrer les dernières périodes utilisées
    const lastPeriodKeys = Object.keys(localStorage).filter(key => key.startsWith('balanceCache:lastPeriod:'));
    for (const key of lastPeriodKeys) {
      const period = localStorage.getItem(key);
      if (!period) continue;
      
      const clientId = key.replace('balanceCache:lastPeriod:', '');
      await setLastUsedPeriodSupabase(clientId, period);
      console.log(`Migration de la dernière période réussie pour ${clientId}`);
    }
  } catch (error) {
    console.warn('Erreur lors de la migration depuis localStorage:', error);
  }
}

// Fonctions de compatibilité avec l'ancienne API (pour faciliter la transition)
export const getBalanceLocalCache = getBalanceSupabaseCache;
export const setBalanceLocalCache = setBalanceSupabaseCache;
export const clearBalanceLocalCache = clearBalanceSupabaseCache;
export const getLastUsedPeriod = getLastUsedPeriodSupabase;
export const setLastUsedPeriod = setLastUsedPeriodSupabase;
