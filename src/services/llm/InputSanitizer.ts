/**
 * Input sanitization for LLM prompts to prevent injection attacks
 */

export class InputSanitizer {
  private static readonly MAX_INPUT_LENGTH = 2000;
  private static readonly DANGEROUS_PATTERNS = [
    /ignore\s+previous\s+instructions/i,
    /forget\s+everything/i,
    /system\s*:/i,
    /assistant\s*:/i,
    /human\s*:/i,
    /<script/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i
  ];

  static sanitizePromptInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Limit length
    let sanitized = input.slice(0, this.MAX_INPUT_LENGTH);

    // Remove dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[FILTERED]');
    }

    // Remove excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    // Escape special characters that could break prompts
    sanitized = sanitized
      .replace(/[{}]/g, '') // Remove braces that could break JSON
      .replace(/`{3,}/g, '```'); // Normalize code blocks

    return sanitized;
  }

  static validateAnalysisContext(context: any): boolean {
    const required = ['clientName', 'amount', 'date', 'description', 'type'];
    
    for (const field of required) {
      if (!context[field]) {
        return false;
      }
    }

    // Validate amount is a number
    if (typeof context.amount !== 'number' || context.amount < 0) {
      return false;
    }

    // Validate type
    if (!['payment', 'invoice'].includes(context.type)) {
      return false;
    }

    return true;
  }

  static sanitizeAnalysisContext(context: any): any {
    if (!this.validateAnalysisContext(context)) {
      throw new Error('Invalid analysis context');
    }

    return {
      clientName: this.sanitizePromptInput(context.clientName),
      amount: Math.abs(Number(context.amount)),
      date: this.sanitizePromptInput(context.date),
      description: this.sanitizePromptInput(context.description),
      reference: this.sanitizePromptInput(context.reference || ''),
      type: context.type
    };
  }
}