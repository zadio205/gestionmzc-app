/**
 * Sanitizes CSV input data to prevent XSS and other security issues
 */
export class CSVSanitizer {
  /**
   * Sanitizes a string value from CSV input
   */
  static sanitizeString(value: string): string {
    if (!value || typeof value !== 'string') return '';
    
    return value
      .trim()
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove script content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Escape special characters
      .replace(/[<>&"']/g, (match) => {
        const escapeMap: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          '"': '&quot;',
          "'": '&#x27;'
        };
        return escapeMap[match] || match;
      })
      // Limit length to prevent DoS
      .substring(0, 500);
  }

  /**
   * Sanitizes a numeric string value
   */
  static sanitizeNumeric(value: string): number {
    if (!value) return 0;
    
    // Convertir en string et nettoyer
    let cleaned = String(value).trim();
    
    // Gérer les formats français avec virgule comme séparateur décimal
    // et espaces comme séparateurs de milliers
    if (cleaned.includes(',') && !cleaned.includes('.')) {
      // Format français : 1 234,56
      cleaned = cleaned.replace(/\s/g, '').replace(',', '.');
    } else if (cleaned.includes(',') && cleaned.includes('.')) {
      // Déterminer si c'est 1,234.56 (US) ou 1.234,56 (EU)
      const lastComma = cleaned.lastIndexOf(',');
      const lastDot = cleaned.lastIndexOf('.');
      if (lastComma > lastDot) {
        // Format européen : 1.234,56
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else {
        // Format US : 1,234.56
        cleaned = cleaned.replace(/,/g, '');
      }
    }
    
    // Supprimer tous les caractères non numériques sauf le point et le moins
    cleaned = cleaned.replace(/[^\d.-]/g, '');
    
    const parsed = parseFloat(cleaned);
    
    // Validate reasonable range for accounting amounts
    if (isNaN(parsed) || parsed < -999999999 || parsed > 999999999) {
      return 0;
    }
    
    return parsed;
  }

  /**
   * Validates and sanitizes a date string
   */
  static sanitizeDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    const sanitized = this.sanitizeString(dateStr);
    
    // Essayer plusieurs formats de date
  let parsed: Date | null = null;
    
    // Format français DD/MM/YYYY
    if (sanitized.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = sanitized.split('/');
      parsed = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // Format ISO YYYY-MM-DD
    else if (sanitized.match(/^\d{4}-\d{2}-\d{2}$/)) {
  parsed = new Date(sanitized);
    }
    // Autres formats
    else {
      // Extraire seulement la partie date si il y a d'autres données
      const dateMatch = sanitized.match(/(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const dateOnly = dateMatch[1];
        if (dateOnly.includes('/')) {
          const [day, month, year] = dateOnly.split('/');
          parsed = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          parsed = new Date(dateOnly);
        }
      } else {
        // Tentative de parse générique
        const generic = new Date(sanitized);
        parsed = isNaN(generic.getTime()) ? null : generic;
      }
    }
    
    if (!parsed) return null;
    // Validate date is reasonable (between 1900 and 2100)
    const year = parsed.getFullYear();
    if (isNaN(parsed.getTime()) || year < 1900 || year > 2100) {
      return null;
    }
    
    return parsed;
  }
}