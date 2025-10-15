export const CLIENT_LEDGER_CONSTANTS = {
  // Validation thresholds
  MIN_DESCRIPTION_LENGTH: 5,
  MIN_REFERENCE_LENGTH: 5,
  SUSPICIOUS_AMOUNT_THRESHOLD: 500,
  
  // UI Configuration
  NOTIFICATION_DURATION: 3000,
  SUCCESS_NOTIFICATION_DURATION: 5000,
  
  // Analysis patterns
  REFERENCE_PATTERNS: {
    VALID: /^(FAC|REG|CHQ|VIR)/i,
    INVOICE: /^FAC/i,
    PAYMENT: /^(REG|CHQ|VIR)/i
  },
  
  // Column mappings for import
  COLUMN_MAPPINGS: {
    DATE: ['Date', 'date'],
    CLIENT_NAME: ['Nom Client', 'Client', 'clientName'],
    DESCRIPTION: ['Description', 'Libellé', 'description'],
    REFERENCE: ['Référence', 'Reference', 'Ref', 'reference'],
    DEBIT: ['Débit', 'Debit', 'debit'],
    CREDIT: ['Crédit', 'Credit', 'credit'],
    ACCOUNT_NUMBER: ['N° Compte', 'Compte', 'accountNumber'],
    INVOICE_NUMBER: ['N° Facture', 'Facture', 'invoiceNumber']
  },
  
  // Status types
  ENTRY_STATUS: {
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error'
  } as const,
  
  // Request status
  REQUEST_STATUS: {
    PENDING: 'pending',
    SENT: 'sent',
    RECEIVED: 'received'
  } as const
} as const;