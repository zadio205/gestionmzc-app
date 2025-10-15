// Types pour les données comptables

export interface BalanceItem {
  originalDebit: any;
  originalCredit: any;
  _id: string;
  accountNumber: string;
  accountName: string;
  account?: string; // Alias pour accountNumber
  label?: string; // Alias pour accountName
  debit: number;
  credit: number;
  balance: number;
  clientId: string;
  period: string;
  type?: string; // Type de compte
  category?: string; // Catégorie de compte
  createdAt: Date;
  importIndex?: number; // Index du fichier importé
}

export interface BalanceIndicator {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  netResult: number;
  workingCapital: number;
  currentRatio: number;
  debtRatio: number;
  profitMargin: number;
}

export interface ClientLedger {
  _id: string;
  date: Date | null;
  accountNumber: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference: string;
  clientId: string;
  type: 'client';
  clientName: string;
  invoiceNumber?: string;
  createdAt: Date;
  importIndex?: number; // Index du fichier importé
  isImported?: boolean; // Flag pour les données importées
  // Métadonnées d'analyse IA optionnelles (remplies après enrichissement)
  aiMeta?: {
    suspiciousLevel: 'low' | 'medium' | 'high';
    reasons: string[];
    suggestions: string[];
  };
}

export interface SupplierLedger {
  _id: string;
  date: Date | null;
  accountNumber: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference: string;
  clientId: string;
  type: 'supplier';
  supplierName: string;
  billNumber?: string;
  createdAt: Date;
  importIndex?: number; // Index du fichier importé
  aiMeta?: {
    suspiciousLevel: 'low' | 'medium' | 'high';
    reasons: string[];
    suggestions?: string[];
  };
}

export interface MiscellaneousLedger {
  _id: string;
  date: Date | null;
  accountNumber: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference: string;
  clientId: string;
  type: 'miscellaneous';
  category: string;
  createdAt: Date;
  importIndex?: number; // Index du fichier importé
  aiMeta?: {
    suspiciousLevel: 'low' | 'medium' | 'high';
    reasons: string[];
    suggestions?: string[];
  };
}

// Types pour l'importation
export interface ImportedRow {
  index: number;
  data: Record<string, any>;
  isValid: boolean;
  errors?: string[];
}

export interface ImportConfig {
  expectedColumns: string[];
  title: string;
  description: string;
  acceptedFormats?: string[];
}