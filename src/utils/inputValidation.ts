/**
 * Input validation utilities for client ledger data
 */

export class InputValidator {
  /**
   * Validate client ID format
   */
  static validateClientId(clientId: string): boolean {
    if (!clientId || typeof clientId !== 'string') {
      return false;
    }
    
    // Basic format validation - adjust based on your ID format
    return /^[a-zA-Z0-9-_]{1,50}$/.test(clientId);
  }

  /**
   * Validate search term to prevent injection
   */
  static validateSearchTerm(searchTerm: string): string {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return '';
    }
    
    // Remove potentially dangerous characters
    return searchTerm
      .replace(/[<>\"']/g, '') // Remove HTML/script injection chars
      .replace(/[{}]/g, '') // Remove object notation
      .trim()
      .substring(0, 100); // Limit length
  }

  /**
   * Validate monetary amount
   */
  static validateAmount(amount: unknown): number {
    if (typeof amount === 'number' && !isNaN(amount) && isFinite(amount)) {
      return Math.max(0, Math.round(amount * 100) / 100); // Round to 2 decimals, ensure positive
    }
    
    if (typeof amount === 'string') {
      const parsed = parseFloat(amount.replace(/[^\d.-]/g, ''));
      if (!isNaN(parsed) && isFinite(parsed)) {
        return Math.max(0, Math.round(parsed * 100) / 100);
      }
    }
    
    return 0;
  }

  /**
   * Validate date input
   */
  static validateDate(dateInput: unknown): Date {
    if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
      return dateInput;
    }
    
    if (typeof dateInput === 'string') {
      const parsed = new Date(dateInput);
      if (!isNaN(parsed.getTime())) {
        // Ensure date is within reasonable range (last 10 years to next 2 years)
        const now = new Date();
        const minDate = new Date(now.getFullYear() - 10, 0, 1);
        const maxDate = new Date(now.getFullYear() + 2, 11, 31);
        
        if (parsed >= minDate && parsed <= maxDate) {
          return parsed;
        }
      }
    }
    
    return new Date(); // Default to current date
  }

  /**
   * Validate and sanitize text input
   */
  static validateText(text: unknown, maxLength: number = 255): string {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    return text
      .replace(/[<>\"']/g, '') // Remove HTML/script injection chars
      .trim()
      .substring(0, maxLength);
  }

  /**
   * Validate account number format
   */
  static validateAccountNumber(accountNumber: unknown): string {
    if (!accountNumber || typeof accountNumber !== 'string') {
      return '411000'; // Default client account
    }
    
    // French accounting plan format validation
    const cleaned = accountNumber.replace(/[^\d]/g, '');
    if (cleaned.length >= 3 && cleaned.length <= 8) {
      return cleaned;
    }
    
    return '411000'; // Default client account
  }

  /**
   * Validate reference format
   */
  static validateReference(reference: unknown): string {
    if (!reference || typeof reference !== 'string') {
      return '';
    }
    
    return reference
      .replace(/[<>\"']/g, '')
      .trim()
      .substring(0, 50);
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Sanitize HTML to prevent XSS
   */
  static sanitizeHtml(html: string): string {
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validate client ID with enhanced checks
   */
  static validateClientIdStrict(clientId: unknown): string {
    if (!clientId || typeof clientId !== 'string') {
      throw new Error('Client ID must be a non-empty string');
    }
    
    const trimmed = clientId.trim();
    if (trimmed.length === 0) {
      throw new Error('Client ID cannot be empty');
    }
    
    if (trimmed.length > 50) {
      throw new Error('Client ID too long (max 50 characters)');
    }
    
    // Basic format validation (alphanumeric + hyphens/underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      throw new Error('Client ID contains invalid characters');
    }
    
    return trimmed;
  }
}