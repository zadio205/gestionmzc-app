import { ClientLedger } from './accounting';

export interface AnalysisResult {
  unsolvedInvoices: ClientLedger[];
  paymentsWithoutJustification: ClientLedger[];
  suspiciousEntries: ClientLedger[];
}

export interface JustificationRequest {
  id: string;
  entryId: string;
  type: 'payment' | 'invoice';
  status: 'pending' | 'sent' | 'received';
  message: string;
  createdAt: Date;
  isLLMGenerated: boolean;
}

export interface ImportedRow {
  index: number;
  data: Record<string, unknown>;
  isValid: boolean;
  errors?: string[];
}

export interface LedgerFilters {
  searchTerm: string;
  selectedPeriod: string;
  showAnalysis: boolean;
}

export interface LedgerSummary {
  totalDebit: number;
  totalCredit: number;
  totalBalance: number;
}

export type EntryStatus = {
  type: 'success' | 'warning' | 'error';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};