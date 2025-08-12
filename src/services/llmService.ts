/**
 * Service pour l'intégration de LLM open source gratuits
 * Supporte Ollama (local), Hugging Face (gratuit), et OpenAI (payant)
 */

import { LLMProvider, AnalysisContext } from './llm/providers/LLMProvider';
import { ollamaService } from './ollamaService';
import { LLMError } from './llm/LLMError';
import { PromptSanitizer } from '@/utils/promptSanitizer';

interface LLMResponse {
  success: boolean;
  data?: string;
  error?: string;
  provider?: 'ollama' | 'huggingface' | 'openai' | 'fallback';
}

type LLMProviderType = 'ollama' | 'huggingface' | 'openai' | 'auto';

class LLMService {
  private readonly HUGGING_FACE_API = 'https://api-inference.huggingface.co/models';
  // Autoriser un endpoint OpenAI-compatible (ex: gpt-oss) via variable d'environnement
  private readonly OPENAI_API = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
  
  // Modèles par provider
  private readonly MODELS = {
    huggingface: {
      text_generation: 'gpt2',
      question_answering: 'distilbert-base-cased-distilled-squad',
      text_classification: 'cardiffnlp/twitter-roberta-base-sentiment-latest'
    },
    ollama: {
      default: 'llama2',
      alternatives: ['mistral', 'codellama', 'neural-chat']
    },
    openai: {
      default: 'gpt-3.5-turbo',
      premium: 'gpt-4'
    }
  };

  private preferredProvider: LLMProviderType = 'auto';

  /**
   * Détermine le meilleur provider disponible
   */
  private async getBestProvider(): Promise<string> {
    if (this.preferredProvider !== 'auto') {
      return this.preferredProvider;
    }

    // Priorité : Ollama (gratuit, local) > OpenAI (payant) > Hugging Face (gratuit, limité)
    
    // Vérifier Ollama (local)
    try {
      if (await ollamaService.isAvailable()) {
        console.log('🤖 Utilisation d\'Ollama (local)');
        return 'ollama';
      } else {
        console.log('ℹ️ Ollama non disponible - Voir OLLAMA_SETUP.md pour l\'installation');
      }
    } catch (error) {
      console.log('ℹ️ Ollama non accessible:', error instanceof Error ? error.message : 'Erreur inconnue');
    }

    // Vérifier OpenAI
  // Considérer disponible si une clé est fournie OU si un endpoint custom est défini
  if (process.env.OPENAI_API_KEY || process.env.OPENAI_API_BASE) {
      console.log('🤖 Utilisation d\'OpenAI');
      return 'openai';
    }

    // Vérifier Hugging Face
    if (process.env.HUGGING_FACE_TOKEN) {
      console.log('🤖 Utilisation de Hugging Face');
      return 'huggingface';
    }

    console.log('🤖 Aucun LLM configuré, utilisation des templates (mode dégradé)');
    console.log('💡 Pour améliorer la qualité des messages, installez Ollama (voir OLLAMA_SETUP.md)');
    throw new LLMError('Aucun provider LLM disponible', 'none');
  }



  /**
   * Génère un message de demande de justificatif personnalisé
   */
  async generateJustificationMessage(context: AnalysisContext): Promise<string> {
    let sanitizedContext: AnalysisContext;
    
    try {
      // Sanitize input before processing
      sanitizedContext = PromptSanitizer.sanitizeContext(context);
    } catch (sanitizationError) {
      console.error('Erreur lors de la sanitisation:', sanitizationError);
      sanitizedContext = context; // Fallback to original context
    }

    try {
      const provider = await this.getBestProvider();
      
      switch (provider) {
        case 'ollama':
          return await this.generateWithOllama(sanitizedContext);
        
        case 'openai':
          return await this.generateWithOpenAI(sanitizedContext);
        
        case 'huggingface':
          return await this.generateWithHuggingFace(sanitizedContext);
        
        default:
          return this.generateTemplateMessage(sanitizedContext);
      }
      
    } catch (error) {
      console.warn('Erreur LLM, utilisation du template par défaut:', error);
      // Always ensure we return a valid message
      try {
        return this.generateTemplateMessage(sanitizedContext);
      } catch (templateError) {
        console.error('Erreur critique lors de la génération du template:', templateError);
        return this.getEmergencyFallbackMessage(context.type);
      }
    }
  }

  /**
   * Message de secours en cas d'échec complet
   */
  private getEmergencyFallbackMessage(type: 'payment' | 'invoice'): string {
    return type === 'payment' 
      ? 'Bonjour, merci de nous fournir les justificatifs pour cet encaissement. Cordialement.'
      : 'Bonjour, merci de nous indiquer le statut de cette facture. Cordialement.';
  }

  /**
   * Génération avec Ollama (local)
   */
  private async generateWithOllama(context: AnalysisContext): Promise<string> {
    try {
      return await ollamaService.generateJustificationMessage(context);
    } catch (error) {
      console.warn('Erreur Ollama:', error);
      throw error;
    }
  }

  /**
   * Génération avec OpenAI
   */
  private async generateWithOpenAI(context: AnalysisContext): Promise<string> {
    const prompt = this.buildJustificationPrompt(context);
    const model = process.env.OPENAI_MODEL || this.MODELS.openai.default;
    
    try {
      const response = await fetch(`${this.OPENAI_API}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Certaines implémentations OpenAI-compatibles n'exigent pas de clé.
          // On n'ajoute l'entête que si une clé est disponible.
          ...(process.env.OPENAI_API_KEY ? { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` } : {})
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'Tu es un assistant comptable professionnel. Génère des messages courtois et professionnels en français pour demander des justificatifs comptables.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content?.trim() || '';
      
    } catch (error) {
      console.error('Erreur OpenAI:', error);
      throw error;
    }
  }

  /**
   * Génération avec Hugging Face
   */
  private async generateWithHuggingFace(context: AnalysisContext): Promise<string> {
    const prompt = this.buildJustificationPrompt(context);
    
    try {
      const response = await fetch(`${this.HUGGING_FACE_API}/${this.MODELS.huggingface.text_generation}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN}`
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 200,
            temperature: 0.7,
            do_sample: true,
            return_full_text: false
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Hugging Face API Error: ${response.status}`);
      }

      const data = await response.json();
      return data[0]?.generated_text?.trim() || '';
      
    } catch (error) {
      console.error('Erreur Hugging Face:', error);
      throw error;
    }
  }

  /**
   * Analyse la description d'une écriture pour détecter des anomalies
   */
  async analyzeEntryDescription(description: string, amount: number): Promise<{
    suspiciousLevel: 'low' | 'medium' | 'high';
    reasons: string[];
    suggestions: string[];
  }> {
    try {
      const provider = await this.getBestProvider();
      
      if (provider === 'ollama') {
        return await ollamaService.analyzeDescription(description, amount);
      }
      
      // Pour les autres providers, utiliser l'analyse locale pour l'instant
      return this.performLocalAnalysis(description, amount);
      
    } catch (error) {
      console.warn('Erreur analyse LLM:', error);
      return this.performLocalAnalysis(description, amount);
    }
  }

  /**
   * Génère des suggestions d'amélioration pour les écritures comptables
   */
  async generateImprovementSuggestions(entries: any[]): Promise<string[]> {
    try {
      const provider = await this.getBestProvider();
      
      if (provider === 'ollama') {
        return await ollamaService.generateSuggestions(entries);
      }
      
      // Analyse des patterns locale
      const patterns = this.analyzePatterns(entries);
      return this.generateLocalSuggestions(patterns, entries.length);
      
    } catch (error) {
      console.warn('Erreur suggestions LLM:', error);
      const patterns = this.analyzePatterns(entries);
      return this.generateLocalSuggestions(patterns, entries.length);
    }
  }

  /**
   * Configure le provider préféré
   */
  setPreferredProvider(provider: LLMProviderType): void {
    this.preferredProvider = provider;
  }

  /**
   * Obtient le statut des providers
   */
  async getProvidersStatus(): Promise<Record<string, boolean>> {
    const isBrowser = typeof window !== 'undefined';
    return {
      ollama: isBrowser ? false : await ollamaService.isAvailable(),
      openai: !!process.env.OPENAI_API_KEY,
      huggingface: !!process.env.HUGGING_FACE_TOKEN
    };
  }

  private buildJustificationPrompt(context: AnalysisContext): string {
    const typeText = context.type === 'payment' ? 'encaissement' : 'facture';
    
    return `Génère un message professionnel et courtois pour demander des justificatifs concernant ${typeText} suivant:
    
Client: ${context.clientName}
Montant: ${context.amount}€
Date: ${context.date}
Description: ${context.description}
Référence: ${context.reference || 'non spécifiée'}

Le message doit être:
- Professionnel et courtois
- Spécifique aux informations manquantes
- En français
- Concis mais complet
- Inclure une formule de politesse

Message:`;
  }

  private generateTemplateMessage(context: AnalysisContext): string {
    const { amount, date, description, reference, type } = context;
    
    if (type === 'payment') {
      return `Bonjour,

Nous avons identifié un encaissement de ${amount}€ en date du ${date}.

Description: ${description}
Référence: ${reference || 'non spécifiée'}

Afin de compléter notre suivi comptable, pourriez-vous nous fournir les justificatifs suivants :
- Copie du chèque ou relevé bancaire
- Facture correspondante si applicable
- Tout autre document justificatif

Cette demande s'inscrit dans le cadre de nos obligations de contrôle et de traçabilité comptable.

Merci de votre collaboration.

Cordialement,
L'équipe comptable`;
    } else {
      return `Bonjour,

Nous constatons que la facture d'un montant de ${amount}€ émise le ${date} présente un solde non soldé.

Description: ${description}
Référence: ${reference || 'non spécifiée'}

Pourriez-vous nous indiquer :
- Le statut actuel de cette facture
- La date de règlement prévue
- Tout élément explicatif concernant ce dossier

Nous restons à votre disposition pour tout complément d'information.

Cordialement,
L'équipe comptable`;
    }
  }

  private performLocalAnalysis(description: string, amount: number) {
    const reasons: string[] = [];
    let suspiciousLevel: 'low' | 'medium' | 'high' = 'low';

    // Vérifications basiques
    if (description.length < 10) {
      reasons.push('Description trop courte');
      suspiciousLevel = 'medium';
    }

    if (amount % 100 === 0 && amount > 500) {
      reasons.push('Montant rond suspect');
      if (suspiciousLevel === 'low') {
        suspiciousLevel = 'medium';
      }
    }

    const suspiciousWords = ['divers', 'autre', 'inconnu', 'test'];
    if (suspiciousWords.some(word => description.toLowerCase().includes(word))) {
      reasons.push('Description vague ou générique');
      suspiciousLevel = 'high';
    }

    // Vérifications avancées
    if (description.match(/^\d+$/)) {
      reasons.push('Description uniquement numérique');
      suspiciousLevel = 'high';
    }

    if (description.length > 100) {
      reasons.push('Description anormalement longue');
      suspiciousLevel = 'medium';
    }

    const suggestions: string[] = [];
    if (reasons.length > 0) {
      suggestions.push('Demander des justificatifs complémentaires');
      suggestions.push('Vérifier la cohérence avec les pièces comptables');
      
      if (suspiciousLevel === 'high') {
        suggestions.push('Effectuer un contrôle approfondi');
      }
    }

    return {
      suspiciousLevel,
      reasons,
      suggestions
    };
  }

  private analyzePatterns(entries: any[]) {
    return {
      missingReferences: entries.filter(e => !e.reference || e.reference.length < 3).length,
      vagueDescriptions: entries.filter(e => e.description.length < 15).length,
      roundAmounts: entries.filter(e => (e.debit + e.credit) % 100 === 0).length,
      weekendEntries: entries.filter(e => {
        if (!e.date) return false;
        const day = new Date(e.date).getDay();
        return day === 0 || day === 6;
      }).length,
      duplicateDescriptions: this.findDuplicateDescriptions(entries),
      highAmounts: entries.filter(e => (e.debit + e.credit) > 10000).length
    };
  }

  private findDuplicateDescriptions(entries: any[]): number {
    const descriptions = entries.map(e => e.description.toLowerCase());
    const duplicates = descriptions.filter((desc, index) => 
      descriptions.indexOf(desc) !== index
    );
    return duplicates.length;
  }

  private generateLocalSuggestions(patterns: any, totalEntries: number): string[] {
    const suggestions: string[] = [];
    
    if (patterns.missingReferences > totalEntries * 0.3) {
      suggestions.push("Améliorer la traçabilité en ajoutant des références systématiques");
    }
    
    if (patterns.vagueDescriptions > totalEntries * 0.2) {
      suggestions.push("Enrichir les descriptions des écritures pour faciliter le suivi");
    }
    
    if (patterns.roundAmounts > totalEntries * 0.5) {
      suggestions.push("Vérifier les montants ronds qui peuvent indiquer des estimations");
    }

    if (patterns.weekendEntries > 0) {
      suggestions.push("Contrôler les écritures saisies en week-end");
    }

    if (patterns.duplicateDescriptions > totalEntries * 0.1) {
      suggestions.push("Diversifier les descriptions pour éviter les doublons");
    }

    if (patterns.highAmounts > 0) {
      suggestions.push("Renforcer les contrôles sur les montants élevés");
    }

    // Suggestions générales si peu de problèmes détectés
    if (suggestions.length === 0) {
      suggestions.push("Maintenir la qualité actuelle de la saisie");
      suggestions.push("Effectuer des contrôles périodiques de cohérence");
    }
    
    return suggestions;
  }
}

// Instance singleton
export const llmService = new LLMService();

// Types pour l'export
export type { AnalysisContext, LLMResponse, LLMProvider };