/**
 * Constants for client ledger functionality
 */

// CSV Import Configuration
export const CSV_EXPECTED_COLUMNS = [
  'Date',
  'Nom Client', 
  'N° Compte',
  'Libellé',
  'Débit',
  'Crédit',
  'Référence'
] as const;

export const CSV_COLUMN_MAPPINGS = {
  date: ['Date', 'date'],
  clientName: ['Nom Client', 'Client', 'clientName'],
  accountNumber: ['N° Compte', 'Compte', 'accountNumber'],
  description: ['Libellé', 'Description', 'description'],
  debit: ['Débit', 'Debit', 'debit'],
  credit: ['Crédit', 'Credit', 'credit'],
  reference: ['Référence', 'Reference', 'Ref', 'reference'],
  invoiceNumber: ['N° Facture', 'Facture', 'invoiceNumber']
} as const;

// Analysis Configuration
export const ANALYSIS_THRESHOLDS = {
  MIN_REFERENCE_LENGTH: 5,
  MIN_DESCRIPTION_LENGTH: 10,
  ROUND_AMOUNT_THRESHOLD: 100,
  HIGH_AMOUNT_THRESHOLD: 10000
} as const;

export const REFERENCE_PATTERNS = {
  VALID_PREFIXES: /^(FAC|REG|CHQ|VIR)/i,
  SUSPICIOUS_WORDS: ['divers', 'autre', 'inconnu', 'test']
} as const;

// UI Configuration
export const NOTIFICATION_DURATIONS = {
  SUCCESS: 3000,
  ERROR: 5000,
  WARNING: 4000,
  INFO: 3000
} as const;

export const PERIOD_OPTIONS = [
  { value: '2024-01', label: 'Janvier 2024' },
  { value: '2023-12', label: 'Décembre 2023' },
  { value: '2023-11', label: 'Novembre 2023' }
] as const;

// Entry Status Types
export const ENTRY_STATUS_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning', 
  ERROR: 'error'
} as const;

export const ENTRY_STATUS_LABELS = {
  UNSOLVED_INVOICE: 'Facture non soldée',
  MISSING_JUSTIFICATION: 'Justificatif manquant',
  SUSPICIOUS_ENTRY: 'Écriture suspecte',
  COMPLIANT: 'Conforme'
} as const;