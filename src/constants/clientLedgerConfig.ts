export const CLIENT_LEDGER_CONFIG = {
  // Import configuration
  EXPECTED_COLUMNS: [
    'Date',
    'Nom Client', 
    'Description',
    'Référence',
    'Débit',
    'Crédit'
  ],
  
  // Column mapping alternatives
  COLUMN_MAPPINGS: {
    date: ['Date', 'date'],
    clientName: ['Nom Client', 'Client', 'clientName'],
    description: ['Description', 'Libellé', 'description'],
    reference: ['Référence', 'Reference', 'Ref', 'reference'],
    debit: ['Débit', 'Debit', 'debit'],
    credit: ['Crédit', 'Credit', 'credit'],
    accountNumber: ['N° Compte', 'Compte', 'accountNumber'],
    invoiceNumber: ['N° Facture', 'Facture', 'invoiceNumber']
  },
  
  // Default values
  DEFAULTS: {
    ACCOUNT_NUMBER: '411000',
    PERIOD: '2024-01'
  },
  
  // Analysis thresholds
  ANALYSIS: {
    MIN_REFERENCE_LENGTH: 5,
    MIN_DESCRIPTION_LENGTH: 10,
    ROUND_AMOUNT_THRESHOLD: 100,
    SUSPICIOUS_WORDS: ['divers', 'autre', 'inconnu', 'test']
  },
  
  // UI Configuration
  UI: {
    NOTIFICATION_DURATION: 5000,
    SUCCESS_DURATION: 3000,
    MAX_SUGGESTIONS: 5
  },
  
  // Reference patterns for validation
  REFERENCE_PATTERNS: {
    VALID: /^(FAC|REG|CHQ|VIR)/i
  }
} as const;

export type ClientLedgerConfig = typeof CLIENT_LEDGER_CONFIG;