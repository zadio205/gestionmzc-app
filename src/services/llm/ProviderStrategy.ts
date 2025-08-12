/**
 * Strategy pattern for LLM provider selection and management
 */

import { LLMProvider, AnalysisContext } from './providers/LLMProvider';
import { OllamaProvider } from './providers/OllamaProvider';
import { LLMError, LLMErrorHandler } from './ErrorHandler';

export interface ProviderConfig {
  priority: number;
  enabled: boolean;
  maxRetries: number;
  timeout: number;
}

export class ProviderStrategy {
  private providers: Map<string, LLMProvider> = new Map();
  private configs: Map<string, ProviderConfig> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Register providers with their configurations
    this.registerProvider('ollama', new OllamaProvider(), {
      priority: 1,
      enabled: true,
      maxRetries: 2,
      timeout: 30000
    });

    // TODO: Add other providers
    // this.registerProvider('openai', new OpenAIProvider(), { ... });
    // this.registerProvider('huggingface', new HuggingFaceProvider(), { ... });
  }

  private registerProvider(name: string, provider: LLMProvider, config: ProviderConfig): void {
    this.providers.set(name, provider);
    this.configs.set(name, config);
  }

  async selectBestProvider(): Promise<{ name: string; provider: LLMProvider } | null> {
    const availableProviders = Array.from(this.providers.entries())
      .filter(([name]) => this.configs.get(name)?.enabled)
      .sort(([nameA], [nameB]) => {
        const priorityA = this.configs.get(nameA)?.priority || 999;
        const priorityB = this.configs.get(nameB)?.priority || 999;
        return priorityA - priorityB;
      });

    for (const [name, provider] of availableProviders) {
      try {
        if (await provider.isAvailable()) {
          return { name, provider };
        }
      } catch (error) {
        console.warn(`Provider ${name} unavailable:`, error);
      }
    }

    return null;
  }

  async executeWithFallback<T>(
    operation: (provider: LLMProvider) => Promise<T>,
    fallback: () => T
  ): Promise<T> {
    const selected = await this.selectBestProvider();
    
    if (!selected) {
      console.log('🤖 No LLM provider available, using fallback');
      return fallback();
    }

    const config = this.configs.get(selected.name)!;
    let lastError: LLMError | null = null;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation(selected.provider);
      } catch (error) {
        lastError = LLMErrorHandler.handle(error, selected.name);
        
        if (!LLMErrorHandler.shouldRetry(lastError) || attempt === config.maxRetries) {
          break;
        }

        const delay = LLMErrorHandler.getRetryDelay(attempt);
        console.log(`🤖 Retrying ${selected.name} in ${delay}ms (attempt ${attempt + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.warn(`🤖 Provider ${selected.name} failed, using fallback:`, lastError);
    return fallback();
  }

  getProviderStatus(): Record<string, { enabled: boolean; priority: number }> {
    const status: Record<string, { enabled: boolean; priority: number }> = {};
    
    for (const [name, config] of this.configs.entries()) {
      status[name] = {
        enabled: config.enabled,
        priority: config.priority
      };
    }

    return status;
  }

  updateProviderConfig(name: string, updates: Partial<ProviderConfig>): void {
    const current = this.configs.get(name);
    if (current) {
      this.configs.set(name, { ...current, ...updates });
    }
  }
}