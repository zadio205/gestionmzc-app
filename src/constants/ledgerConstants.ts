/**
 * Constants for ledger analysis and validation
 */
export const LEDGER_CONSTANTS = {
  // Validation thresholds
  MIN_REFERENCE_LENGTH: 5,
  MIN_DESCRIPTION_LENGTH: 10,
  ROUND_AMOUNT_THRESHOLD: 100,
  
  // Import limits
  MAX_IMPORT_ENTRIES: 10000,
  MAX_STRING_LENGTH: 500,
  
  // Date validation
  MIN_YEAR: 1900,
  MAX_YEAR: 2100,
  
  // Amount validation
  MIN_AMOUNT: -999999999,
  MAX_AMOUNT: 999999999,
  
  // Reference patterns
  VALID_REFERENCE_PATTERNS: /^(FAC|REG|CHQ|VIR)/i,
  
  // Suspicious keywords
  SUSPICIOUS_KEYWORDS: ['divers', 'autre', 'inconnu', 'test'],
  
  // Notification durations
  SUCCESS_DURATION: 3000,
  ERROR_DURATION: 5000,
} as const;

export type LedgerConstants = typeof LEDGER_CONSTANTS;