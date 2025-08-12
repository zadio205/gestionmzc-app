export interface LedgerEntryInput {
  date: Date | null;
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
  createdAt?: Date;
  isImported?: boolean;
  aiMeta?: {
    suspiciousLevel?: 'low' | 'medium' | 'high';
    reasons?: string[];
    suggestions?: string[];
  };
}

export async function listClientLedger(clientId: string) {
  const res = await fetch(`/api/client-ledger?clientId=${encodeURIComponent(clientId)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Erreur chargement ledger: ${res.status}`);
  return res.json() as Promise<{ entries: any[] }>;
}

export async function saveClientLedger(entries: LedgerEntryInput[]) {
  const res = await fetch('/api/client-ledger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ entries }),
  });
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    if (contentType.includes('application/json')) {
      const body = await res.json().catch(() => null);
      const details = body?.details || body?.error || `HTTP ${res.status}`;
      throw new Error(`Erreur sauvegarde ledger: ${details}`);
    }
    const text = await res.text().catch(() => '');
    throw new Error(`Erreur sauvegarde ledger: HTTP ${res.status} ${text}`);
  }
  return res.json() as Promise<{ inserted: number; skipped: number }>;
}

export async function clearClientLedger(clientId: string) {
  const res = await fetch(`/api/client-ledger?clientId=${encodeURIComponent(clientId)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Erreur suppression ledger: ${res.status}`);
  return res.json() as Promise<{ deleted: number }>;
}
