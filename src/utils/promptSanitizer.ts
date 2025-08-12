import { AnalysisContext } from '@/services/llm/providers/LLMProvider';

/**
 * Sanitizes prompts and context data before sending to LLM providers
 */
export class PromptSanitizer {
  private static readonly MAX_FIELD_LENGTH = 500;
  private static readonly DANGEROUS_PATTERNS = [
    /javascript:/gi,
    /<script/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /function\s*\(/gi,
  ];

  /**
   * Sanitize analysis context for LLM processing
   */
  static sanitizeContext(context: AnalysisContext): AnalysisContext {
    return {
      clientName: this.sanitizeString(context.clientName),
      amount: this.sanitizeAmount(context.amount),
      date: this.sanitizeString(context.date),
      description: this.sanitizeString(context.description),
      reference: context.reference ? this.sanitizeString(context.reference) : undefined,
      type: context.type, // Enum, no sanitization needed
    };
  }

  /**
   * Sanitize string input
   */
  private static sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input
      .trim()
      .substring(0, this.MAX_FIELD_LENGTH)
      .replace(/[<>]/g, '') // Remove HTML brackets
      .replace(/["']/g, '') // Remove quotes
      .replace(/\\/g, ''); // Remove backslashes

    // Check for dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(sanitized)) {
        console.warn('Dangerous pattern detected in input, sanitizing');
        sanitized = sanitized.replace(pattern, '[FILTERED]');
      }
    }

    return sanitized;
  }

  /**
   * Sanitize numeric amount
   */
  private static sanitizeAmount(amount: number): number {
    if (typeof amount !== 'number' || !isFinite(amount) || isNaN(amount)) {
      return 0;
    }
    
    // Ensure reasonable bounds
    return Math.max(0, Math.min(amount, 999999999));
  }

  /**
   * Validate prompt before sending to LLM
   */
  static validatePrompt(prompt: string): boolean {
    if (!prompt || typeof prompt !== 'string') {
      return false;
    }

    if (prompt.length > 2000) {
      console.warn('Prompt too long, may be truncated by LLM');
    }

    // Check for injection attempts
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(prompt)) {
        console.error('Dangerous pattern detected in prompt');
        return false;
      }
    }

    return true;
  }
}