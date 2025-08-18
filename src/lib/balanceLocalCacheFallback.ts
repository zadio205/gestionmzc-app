import type { BalanceItem } from '@/types/accounting';

// Fallback vers localStorage en cas d'échec Supabase
const LOCAL_STORAGE_KEY_PREFIX = 'balance_cache_';
const LAST_PERIOD_KEY_PREFIX = 'balance_last_period_';

// Fonctions de fallback localStorage
function getLocalStorageCache(clientId: string, period?: string): BalanceItem[] | undefined {
  try {
    const key = `${LOCAL_STORAGE_KEY_PREFIX}${clientId}_${period || ''}`;
    const data = localStorage.getItem(key);
    if (!data) return undefined;
    
    const parsed = JSON.parse(data);
    return parsed.map((item: any) => ({
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    }));
  } catch (error) {
    console.warn('Erreur localStorage get:', error);
    return undefined;
  }
}

function setLocalStorageCache(clientId: string, period: string | undefined, items: BalanceItem[]): void {
  try {
    const key = `${LOCAL_STORAGE_KEY_PREFIX}${clientId}_${period || ''}`;
    localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.warn('Erreur localStorage set:', error);
  }
}

function clearLocalStorageCache(clientId: string, period?: string): void {
  try {
    const key = `${LOCAL_STORAGE_KEY_PREFIX}${clientId}_${period || ''}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Erreur localStorage clear:', error);
  }
}

function getLocalStorageLastPeriod(clientId: string): string | undefined {
  try {
    const key = `${LAST_PERIOD_KEY_PREFIX}${clientId}`;
    return localStorage.getItem(key) || undefined;
  } catch (error) {
    console.warn('Erreur localStorage get period:', error);
    return undefined;
  }
}

function setLocalStorageLastPeriod(clientId: string, period: string): void {
  try {
    const key = `${LAST_PERIOD_KEY_PREFIX}${clientId}`;
    localStorage.setItem(key, period);
  } catch (error) {
    console.warn('Erreur localStorage set period:', error);
  }
}

// Fonctions principales avec fallback automatique
export async function getBalanceLocalCache(clientId: string, period?: string): Promise<BalanceItem[] | undefined> {
  // En cas d'échec (tables manquantes), utiliser localStorage
  if (typeof window !== 'undefined') {
    return getLocalStorageCache(clientId, period);
  }
  return undefined;
}

export async function setBalanceLocalCache(clientId: string, period: string | undefined, items: BalanceItem[]): Promise<void> {
  // En cas d'échec (tables manquantes), utiliser localStorage
  if (typeof window !== 'undefined') {
    setLocalStorageCache(clientId, period, items);
  }
}

export async function clearBalanceLocalCache(clientId: string, period?: string): Promise<void> {
  // En cas d'échec (tables manquantes), utiliser localStorage
  if (typeof window !== 'undefined') {
    clearLocalStorageCache(clientId, period);
  }
}

export async function getLastUsedPeriod(clientId: string): Promise<string | undefined> {
  // En cas d'échec (tables manquantes), utiliser localStorage
  if (typeof window !== 'undefined') {
    return getLocalStorageLastPeriod(clientId);
  }
  return undefined;
}

export async function setLastUsedPeriod(clientId: string, period: string): Promise<void> {
  // En cas d'échec (tables manquantes), utiliser localStorage
  if (typeof window !== 'undefined') {
    setLocalStorageLastPeriod(clientId, period);
  }
}
