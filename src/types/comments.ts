// Types de commentaires liés aux écritures des grands livres

export type LedgerType = 'client' | 'supplier' | 'misc';

export interface LedgerComment {
  id: string;
  entryId: string; // _id de l'écriture
  clientId: string;
  ledgerType: LedgerType;
  author: string;
  authorType?: 'client' | 'collaborateur' | 'admin';
  content: string;
  priority?: 'low' | 'medium' | 'high';
  isInternal?: boolean;
  createdAt: Date;
}
