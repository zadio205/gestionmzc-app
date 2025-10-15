type ClientRow = {
  id: string;
  name: string;
  email: string;
  contact?: string | null;
  phone?: string | null;
  address?: string | null;
  siret?: string | null;
  industry?: string | null;
  dossier_number?: string | null;
  collaborator_id?: string | null;
  documents?: string[];
  is_active?: boolean;
  status?: string | null;
  last_activity?: string | null;
  collaborator?: string | null;
  created_at?: string;
  updated_at?: string;
};

const clients = new Map<string, ClientRow>();

export function listClientsCache(): ClientRow[] {
  return Array.from(clients.values());
}

export function addClientCache(row: ClientRow): ClientRow {
  clients.set(row.id, row);
  return row;
}

export function updateClientCache(id: string, patch: Partial<ClientRow>): ClientRow | null {
  const current = clients.get(id);
  if (!current) return null;
  const next = { ...current, ...patch, updated_at: new Date().toISOString() };
  clients.set(id, next);
  return next;
}

export function deleteClientCache(id: string): boolean {
  return clients.delete(id);
}

export type { ClientRow };

export function seedClientsCache(rows: ClientRow[]) {
  clients.clear();
  for (const row of rows) {
    if (row && row.id) clients.set(row.id, row);
  }
}
