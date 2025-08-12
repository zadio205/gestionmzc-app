/**
 * Retry manager for LLM operations
 */

import { LLMError } from './LLMError';

interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export class RetryManager {
  private static readonly DEFAULT_OPTIONS: RetryOptions = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  };

  static async withRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };
    let lastError: Error;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry non-retryable errors
        if (error instanceof LLMError && !error.retryable) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === config.maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
          config.maxDelay
        );

        console.warn(`LLM operation failed (attempt ${attempt}/${config.maxAttempts}), retrying in ${delay}ms:`, error);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}