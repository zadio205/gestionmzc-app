/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeString = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

/**
 * Sanitize numeric input
 */
export const sanitizeNumber = (input: string | number): number => {
  if (typeof input === 'number') return input;
  
  const cleaned = String(input).replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Validate and sanitize reference codes
 */
export const sanitizeReference = (reference: string): string => {
  if (!reference) return '';
  
  // Allow only alphanumeric, hyphens, and underscores
  return reference.replace(/[^a-zA-Z0-9\-_]/g, '').trim();
};