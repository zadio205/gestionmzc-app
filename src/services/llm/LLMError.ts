/**
 * Custom error classes for LLM operations
 */

export class LLMError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly code?: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export class LLMTimeoutError extends LLMError {
  constructor(provider: string, timeout: number) {
    super(`Timeout after ${timeout}ms`, provider, 'TIMEOUT', true);
    this.name = 'LLMTimeoutError';
  }
}

export class LLMQuotaError extends LLMError {
  constructor(provider: string) {
    super('API quota exceeded', provider, 'QUOTA_EXCEEDED', false);
    this.name = 'LLMQuotaError';
  }
}

export class LLMAuthError extends LLMError {
  constructor(provider: string) {
    super('Authentication failed', provider, 'AUTH_FAILED', false);
    this.name = 'LLMAuthError';
  }
}