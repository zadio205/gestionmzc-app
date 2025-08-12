import { LLMProvider } from './providers/LLMProvider';
import { OllamaProvider } from './providers/OllamaProvider';
import { LLMError } from './LLMError';

export type LLMProviderType = 'ollama' | 'huggingface' | 'openai';

export class LLMProviderFactory {
  private static providers: Map<LLMProviderType, LLMProvider> = new Map();

  static async createProvider(type: LLMProviderType): Promise<LLMProvider> {
    if (!this.providers.has(type)) {
      const provider = await this.instantiateProvider(type);
      this.providers.set(type, provider);
    }
    return this.providers.get(type)!;
  }

  private static async instantiateProvider(type: LLMProviderType): Promise<LLMProvider> {
    switch (type) {
      case 'ollama':
        const ollamaProvider = new OllamaProvider();
        if (!(await ollamaProvider.isAvailable())) {
          throw new LLMError('Ollama provider not available', type);
        }
        return ollamaProvider;
      
      // TODO: Add other providers
      case 'huggingface':
        throw new LLMError('Hugging Face provider not implemented yet', type);
      
      case 'openai':
        throw new LLMError('OpenAI provider not implemented yet', type);
      
      default:
        throw new LLMError(`Unsupported provider type: ${type}`, type);
    }
  }

  static clearCache(): void {
    this.providers.clear();
  }
}