/**
 * Sanitizes CSV input data to prevent XSS and other security issues
 */
export class CSVSanitizer {
  /**
   * Sanitizes a string value from CSV input
   */
  static sanitizeString(value: string): string {
    if (!value || typeof value !== 'string') return '';
    // 1) Decode common HTML entities (to éviter COMPTE D&#x27;ATTENTE)
    const decodeHtmlEntities = (str: string) =>
      str.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_, ent: string) => {
        const named: Record<string, string> = {
          amp: '&', lt: '<', gt: '>', quot: '"', apos: "'"
        };
        if (/^#x/i.test(ent)) {
          const code = parseInt(ent.slice(2), 16);
          return Number.isNaN(code) ? `&${ent};` : String.fromCharCode(code);
        }
        if (/^#\d+$/i.test(ent)) {
          const code = parseInt(ent.slice(1), 10);
          return Number.isNaN(code) ? `&${ent};` : String.fromCharCode(code);
        }
        return named[ent] ?? `&${ent};`;
      });

    let out = String(value);
    out = decodeHtmlEntities(out);
    // 2) Remove script blocks entirely
    out = out.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    // 3) Strip remaining HTML tags
    out = out.replace(/<[^>]*>/g, '');
    // 4) Normalize spaces incl. non-breaking
    out = out.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
    // 5) Limit length to prevent DoS
    return out.substring(0, 500);
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