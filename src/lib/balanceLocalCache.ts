import type { BalanceItem } from '@/types/accounting';

const LS_KEY = (clientId: string, period?: string) => `balanceCache:${clientId}::${period || ''}`;
const LAST_PERIOD_KEY = (clientId: string) => `balanceCache:lastPeriod:${clientId}`;

function reviveItem(raw: any): BalanceItem {
  return {
    ...raw,
    createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
  } as BalanceItem;
}

export function getBalanceLocalCache(clientId: string, period?: string): BalanceItem[] | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem(LS_KEY(clientId, period));
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as any[];
    return parsed.map(reviveItem);
  } catch {
    return undefined;
  }
}

export function setBalanceLocalCache(clientId: string, period: string | undefined, items: BalanceItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_KEY(clientId, period), JSON.stringify(items));
  } catch {
    // ignore quota/security errors
  }
}

export function clearBalanceLocalCache(clientId: string, period?: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(LS_KEY(clientId, period));
  } catch {
    // ignore
  }
}

export function getLastUsedPeriod(clientId: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage.getItem(LAST_PERIOD_KEY(clientId)) || undefined;
  } catch {
    return undefined;
  }
}

export function setLastUsedPeriod(clientId: string, period: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LAST_PERIOD_KEY(clientId), period);
  } catch {
    // ignore
  }
}
