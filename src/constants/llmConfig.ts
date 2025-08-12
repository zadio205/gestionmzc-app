/**
 * Configuration constants for LLM services
 */

export const LLM_CONFIG = {
  // Timeouts
  DEFAULT_TIMEOUT: 30000,
  AVAILABILITY_CHECK_TIMEOUT: 5000,
  
  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY_BASE: 1000,
  MAX_RETRY_DELAY: 8000,
  
  // Input limits
  MAX_PROMPT_LENGTH: 2000,
  MAX_RESPONSE_LENGTH: 1000,
  
  // Analysis thresholds
  SUSPICIOUS_AMOUNT_THRESHOLD: 500,
  MIN_DESCRIPTION_LENGTH: 10,
  MIN_REFERENCE_LENGTH: 3,
  
  // Provider priorities
  PROVIDER_PRIORITIES: {
    ollama: 1,
    openai: 2,
    huggingface: 3
  },
  
  // Model configurations
  MODELS: {
    ollama: {
      default: 'llama2',
      alternatives: ['mistral', 'codellama', 'neural-chat']
    },
    openai: {
      default: 'gpt-3.5-turbo',
      premium: 'gpt-4'
    },
    huggingface: {
      text_generation: 'gpt2',
      question_answering: 'distilbert-base-cased-distilled-squad'
    }
  },
  
  // Generation parameters
  GENERATION_PARAMS: {
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 500
  }
} as const;

export const ANALYSIS_PATTERNS = {
  SUSPICIOUS_WORDS: ['divers', 'autre', 'inconnu', 'test', 'temp'],
  REFERENCE_PATTERNS: {
    INVOICE: /^(FAC|FACT|INV)/i,
    PAYMENT: /^(REG|PAY|CHQ|VIR)/i,
    CHECK: /^CHQ/i,
    TRANSFER: /^VIR/i
  }
} as const;

export const MESSAGE_TEMPLATES = {
  PAYMENT_REQUEST: {
    subject: 'Demande de justificatifs - Encaissement',
    greeting: 'Bonjour,',
    closing: 'Cordialement,\nL\'équipe comptable'
  },
  INVOICE_REQUEST: {
    subject: 'Demande de justificatifs - Facture',
    greeting: 'Bonjour,',
    closing: 'Cordialement,\nL\'équipe comptable'
  }
} as const;