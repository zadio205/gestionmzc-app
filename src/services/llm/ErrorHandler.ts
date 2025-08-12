/**
 * Centralized error handling for LLM services
 */

export enum LLMErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  QUOTA_EXCEEDED = 'quota_exceeded',
  TIMEOUT = 'timeout',
  INVALID_RESPONSE = 'invalid_response',
  SERVICE_UNAVAILABLE = 'service_unavailable'
}

export class LLMError extends Error {
  constructor(
    message: string,
    public type: LLMErrorType,
    public provider: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export class LLMErrorHandler {
  static handle(error: unknown, provider: string): LLMError {
    if (error instanceof LLMError) {
      return error;
    }

    if (error instanceof Error) {
      // Network errors
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return new LLMError(
          'Erreur de connexion au service LLM',
          LLMErrorType.NETWORK,
          provider,
          error
        );
      }

      // Timeout errors
      if (error.message.includes('timeout') || error.message.includes('AbortError')) {
        return new LLMError(
          'Délai d\'attente dépassé',
          LLMErrorType.TIMEOUT,
          provider,
          error
        );
      }

      // Authentication errors
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return new LLMError(
          'Erreur d\'authentification',
          LLMErrorType.AUTHENTICATION,
          provider,
          error
        );
      }

      // Quota errors
      if (error.message.includes('429') || error.message.includes('quota')) {
        return new LLMError(
          'Quota dépassé',
          LLMErrorType.QUOTA_EXCEEDED,
          provider,
          error
        );
      }
    }

    return new LLMError(
      'Erreur inconnue du service LLM',
      LLMErrorType.SERVICE_UNAVAILABLE,
      provider,
      error instanceof Error ? error : new Error(String(error))
    );
  }

  static shouldRetry(error: LLMError): boolean {
    return [
      LLMErrorType.NETWORK,
      LLMErrorType.TIMEOUT,
      LLMErrorType.SERVICE_UNAVAILABLE
    ].includes(error.type);
  }

  static getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s
    return Math.min(1000 * Math.pow(2, attempt), 8000);
  }
}