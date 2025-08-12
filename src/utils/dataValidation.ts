import { ClientLedger } from '@/types/accounting';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateClientLedgerEntry = (entry: Partial<ClientLedger>): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields validation
  if (!entry.clientName?.trim()) {
    errors.push('Nom du client requis');
  }

  if (!entry.description?.trim()) {
    errors.push('Description requise');
  }

  if (entry.debit === undefined && entry.credit === undefined) {
    errors.push('Montant débit ou crédit requis');
  }

  if ((entry.debit || 0) < 0 || (entry.credit || 0) < 0) {
    errors.push('Les montants ne peuvent pas être négatifs');
  }

  if ((entry.debit || 0) > 0 && (entry.credit || 0) > 0) {
    warnings.push('Écriture avec débit et crédit simultanés');
  }

  // Business logic validation
  if (!entry.reference?.trim()) {
    warnings.push('Référence manquante');
  }

  if (entry.description && entry.description.length < 5) {
    warnings.push('Description très courte');
  }

  // Date validation
  if (entry.date && entry.date > new Date()) {
    warnings.push('Date future détectée');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const sanitizeImportData = (rawData: any[]): { valid: ClientLedger[]; invalid: any[] } => {
  const valid: ClientLedger[] = [];
  const invalid: any[] = [];

  rawData.forEach((row, index) => {
    try {
      const validation = validateClientLedgerEntry(row);
      if (validation.isValid) {
        valid.push(row as ClientLedger);
      } else {
        invalid.push({ ...row, index, errors: validation.errors });
      }
    } catch (error) {
      invalid.push({ ...row, index, errors: ['Erreur de traitement des données'] });
    }
  });

  return { valid, invalid };
};