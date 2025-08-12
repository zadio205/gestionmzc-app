import { LLMProvider, AnalysisContext } from './providers/LLMProvider';
import { OllamaProvider } from './providers/OllamaProvider';
import { LLMError } from './LLMError';

export type LLMProviderType = 'ollama' | 'openai' | 'huggingface' | 'auto';

/**
 * Manager for LLM providers using Strategy pattern
 */
export class LLMProviderManager {
  private providers: Map<string, LLMProvider> = new Map();
  private preferredProvider: LLMProviderType = 'auto';

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    this.providers.set('ollama', new OllamaProvider());
    // Add other providers as needed
  }

  async getBestAvailableProvider(): Promise<LLMProvider> {
    if (this.preferredProvider !== 'auto') {
      const provider = this.providers.get(this.preferredProvider);
      if (provider && await provider.isAvailable()) {
        return provider;
      }
    }

    // Try providers in order of preference
    const providerOrder = ['ollama', 'openai', 'huggingface'];
    
    for (const providerName of providerOrder) {
      const provider = this.providers.get(providerName);
      if (provider && await this.checkProviderAvailability(providerName, provider)) {
        console.log(`🤖 Utilisation de ${providerName}`);
        return provider;
      }
    }

    console.log('🤖 Aucun LLM configuré, utilisation des templates (mode dégradé)');
    console.log('💡 Pour améliorer la qualité des messages, installez Ollama (voir OLLAMA_SETUP.md)');
    throw new LLMError('Aucun provider LLM disponible', 'none');
  }

  private async checkProviderAvailability(name: string, provider: LLMProvider): Promise<boolean> {
    try {
      const isAvailable = await provider.isAvailable();
      if (!isAvailable && name === 'ollama') {
        console.log('ℹ️ Ollama non disponible - Voir OLLAMA_SETUP.md pour l\'installation');
      }
      return isAvailable;
    } catch (error) {
      if (name === 'ollama') {
        console.log('ℹ️ Ollama non accessible:', error instanceof Error ? error.message : 'Erreur inconnue');
      }
      return false;
    }
  }

  setPreferredProvider(provider: LLMProviderType): void {
    this.preferredProvider = provider;
  }

  async getProvidersStatus(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {};
    
    for (const [name, provider] of this.providers) {
      try {
        status[name] = await provider.isAvailable();
      } catch {
        status[name] = false;
      }
    }
    
    return status;
  }
}