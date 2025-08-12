/**
 * Input validation and sanitization for LLM operations
 */

import { AnalysisContext } from './providers/LLMProvider';

export class InputValidator {
  private static readonly MAX_DESCRIPTION_LENGTH = 500;
  private static readonly MAX_CLIENT_NAME_LENGTH = 100;
  private static readonly MAX_AMOUNT = 1000000; // 1M euros
  private static readonly MIN_AMOUNT = 0;

  /**
   * Validates and sanitizes analysis context
   */
  static validateAnalysisContext(context: AnalysisContext): AnalysisContext {
    const sanitized = { ...context };

    // Sanitize client name
    sanitized.clientName = this.sanitizeString(context.clientName, this.MAX_CLIENT_NAME_LENGTH);
    if (!sanitized.clientName) {
      throw new Error('Client name is required');
    }

    // Validate amount
    if (typeof context.amount !== 'number' || 
        context.amount < this.MIN_AMOUNT || 
        context.amount > this.MAX_AMOUNT) {
      throw new Error(`Amount must be between ${this.MIN_AMOUNT} and ${this.MAX_AMOUNT}`);
    }

    // Sanitize description
    sanitized.description = this.sanitizeString(context.description, this.MAX_DESCRIPTION_LENGTH);
    if (!sanitized.description) {
      throw new Error('Description is required');
    }

    // Sanitize reference (optional)
    if (context.reference) {
      sanitized.reference = this.sanitizeString(context.reference, 50);
    }

    // Validate type
    if (!['payment', 'invoice'].includes(context.type)) {
      throw new Error('Type must be either "payment" or "invoice"');
    }

    // Validate date format
    if (!this.isValidDate(context.date)) {
      throw new Error('Invalid date format');
    }

    return sanitized;
  }

  /**
   * Sanitizes string input by removing potentially harmful content
   */
  private static sanitizeString(input: string, maxLength: number): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .trim()
      .slice(0, maxLength)
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/[\r\n\t]/g, ' ') // Replace line breaks with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Validates date string format
   */
  private static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Validates entries array for analysis
   */
  static validateEntries(entries: any[]): boolean {
    if (!Array.isArray(entries)) {
      return false;
    }

    if (entries.length === 0 || entries.length > 10000) {
      return false; // Prevent processing too many entries
    }

    return entries.every(entry => 
      entry && 
      typeof entry === 'object' &&
      typeof entry.description === 'string' &&
      typeof entry.debit === 'number' &&
      typeof entry.credit === 'number'
    );
  }
}