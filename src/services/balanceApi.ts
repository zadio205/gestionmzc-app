import type { BalanceItem } from '@/types/accounting';

export type BalanceInput = Omit<BalanceItem, '_id' | 'createdAt'> & {
  createdAt?: Date;
};

export async function listBalance(clientId: string, period?: string) {
  const qs = new URLSearchParams({ clientId });
  if (period) qs.set('period', period);
  const res = await fetch(`/api/balance?${qs.toString()}`);
  if (!res.ok) throw new Error(`Erreur chargement balance: ${res.status}`);
  return res.json() as Promise<{ items: BalanceItem[] }>;
}

export async function saveBalance(items: BalanceInput[]) {
  const res = await fetch('/api/balance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    if (contentType.includes('application/json')) {
      const body = await res.json().catch(() => null);
      const details = body?.details || body?.error || `HTTP ${res.status}`;
      throw new Error(`Erreur sauvegarde balance: ${details}`);
    }
    const text = await res.text().catch(() => '');
    throw new Error(`Erreur sauvegarde balance: HTTP ${res.status} ${text}`);
  }
  return res.json() as Promise<{ inserted: number }>;
}

export async function clearBalance(clientId: string, period?: string) {
  const qs = new URLSearchParams({ clientId });
  if (period) qs.set('period', period);
  const res = await fetch(`/api/balance?${qs.toString()}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Erreur suppression balance: ${res.status}`);
  return res.json() as Promise<{ deleted: number }>;
}
