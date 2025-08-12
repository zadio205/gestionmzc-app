/**
 * Service pour l'intégration avec Ollama (LLM local gratuit)
 * Alternative locale aux APIs externes
 */

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

interface OllamaRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  };
}

class OllamaService {
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly timeout: number;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.defaultModel = 'llama2'; // Modèle par défaut
    this.timeout = 30000; // 30 secondes
  }

  /**
   * Vérifie si Ollama est disponible
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Ne pas appeler Ollama depuis le navigateur
      if (typeof window !== 'undefined') {
        return false;
      }
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      console.warn('Ollama non disponible:', error);
      return false;
    }
  }

  /**
   * Liste les modèles disponibles
   */
  async listModels(): Promise<string[]> {
    try {
      if (typeof window !== 'undefined') {
        return [];
      }
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) throw new Error('Erreur API Ollama');
      
      const data = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      console.error('Erreur listage modèles Ollama:', error);
      return [];
    }
  }

  /**
   * Génère une réponse avec Ollama
   */
  async generate(prompt: string, model?: string): Promise<string> {
    const selectedModel = model || this.defaultModel;
    
    try {
      if (typeof window !== 'undefined') {
        throw new Error('Ollama indisponible côté client');
      }
      const request: OllamaRequest = {
        model: selectedModel,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 500
        }
      };

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`Erreur Ollama: ${response.status} ${response.statusText}`);
      }

      const data: OllamaResponse = await response.json();
      return data.response.trim();

    } catch (error) {
      console.error('Erreur génération Ollama:', error);
      throw error;
    }
  }

  /**
   * Génère un message de demande de justificatif
   */
  async generateJustificationMessage(context: {
    clientName: string;
    amount: number;
    date: string;
    description: string;
    reference?: string;
    type: 'payment' | 'invoice';
  }): Promise<string> {
    const { clientName, amount, date, description, reference, type } = context;
    
    const prompt = `Tu es un assistant comptable professionnel. Génère un message courtois et professionnel en français pour demander des justificatifs.

Contexte :
- Client : ${clientName}
- Type : ${type === 'payment' ? 'Encaissement' : 'Facture'}
- Montant : ${amount}€
- Date : ${date}
- Description : ${description}
- Référence : ${reference || 'non spécifiée'}

Instructions :
- Sois professionnel et courtois
- Explique clairement ce qui est demandé
- Mentionne les justificatifs nécessaires
- Termine par une formule de politesse
- Maximum 200 mots
- En français uniquement

Message :`;

    try {
      const response = await this.generate(prompt);
      return this.formatMessage(response);
    } catch (error) {
      console.error('Erreur génération message Ollama:', error);
      throw error;
    }
  }

  /**
   * Analyse une description d'écriture
   */
  async analyzeDescription(description: string, amount: number): Promise<{
    suspiciousLevel: 'low' | 'medium' | 'high';
    reasons: string[];
    suggestions: string[];
  }> {
    const prompt = `Analyse cette écriture comptable et évalue son niveau de suspicion.

Description : "${description}"
Montant : ${amount}€

Évalue selon ces critères :
- Clarté de la description
- Précision des informations
- Cohérence du montant
- Risques potentiels

Réponds au format JSON :
{
  "suspiciousLevel": "low|medium|high",
  "reasons": ["raison1", "raison2"],
  "suggestions": ["suggestion1", "suggestion2"]
}`;

    try {
      const response = await this.generate(prompt);
      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error('Erreur analyse Ollama:', error);
      // Fallback vers analyse locale
      return this.localAnalysis(description, amount);
    }
  }

  /**
   * Génère des suggestions d'amélioration
   */
  async generateSuggestions(entries: any[]): Promise<string[]> {
    const stats = this.calculateStats(entries);
    
    const prompt = `Analyse ces statistiques d'écritures comptables et propose des améliorations.

Statistiques :
- Total écritures : ${entries.length}
- Références manquantes : ${stats.missingReferences}
- Descriptions courtes : ${stats.shortDescriptions}
- Montants ronds : ${stats.roundAmounts}
- Écritures week-end : ${stats.weekendEntries}

Propose 3-5 suggestions concrètes d'amélioration en français.
Format : liste à puces, une suggestion par ligne.`;

    try {
      const response = await this.generate(prompt);
      return this.parseSuggestions(response);
    } catch (error) {
      console.error('Erreur suggestions Ollama:', error);
      return this.getDefaultSuggestions(stats);
    }
  }

  /**
   * Formate le message généré
   */
  private formatMessage(response: string): string {
    let message = response.replace(/^Message\s*:\s*/i, '').trim();
    
    // Nettoyer les artefacts courants
    message = message.replace(/```/g, '');
    message = message.replace(/^\s*-\s*/gm, '');
    
    // Ajouter signature si manquante
    if (!message.includes('Cordialement') && !message.includes('Salutations')) {
      message += '\n\nCordialement,\nL\'équipe comptable';
    }
    
    return message;
  }

  /**
   * Parse la réponse d'analyse JSON
   */
  private parseAnalysisResponse(response: string): {
    suspiciousLevel: 'low' | 'medium' | 'high';
    reasons: string[];
    suggestions: string[];
  } {
    try {
      // Extraire le JSON de la réponse
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          suspiciousLevel: parsed.suspiciousLevel || 'low',
          reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
          suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : []
        };
      }
    } catch (error) {
      console.warn('Erreur parsing JSON Ollama:', error);
    }
    
    // Fallback
    return this.localAnalysis(response, 0);
  }

  /**
   * Parse les suggestions de la réponse
   */
  private parseSuggestions(response: string): string[] {
    const lines = response.split('\n');
    const suggestions: string[] = [];
    
    for (const line of lines) {
      const cleaned = line.replace(/^[-•*]\s*/, '').trim();
      if (cleaned.length > 10 && !cleaned.startsWith('Suggestion')) {
        suggestions.push(cleaned);
      }
    }
    
    return suggestions.slice(0, 5); // Maximum 5 suggestions
  }

  /**
   * Analyse locale de fallback
   */
  private localAnalysis(description: string, amount: number) {
    const reasons: string[] = [];
    let suspiciousLevel: 'low' | 'medium' | 'high' = 'low';

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
      reasons.push('Description vague');
      suspiciousLevel = 'high';
    }

    return {
      suspiciousLevel,
      reasons,
      suggestions: ['Demander des justificatifs', 'Vérifier la cohérence']
    };
  }

  /**
   * Calcule les statistiques des écritures
   */
  private calculateStats(entries: any[]) {
    return {
      missingReferences: entries.filter(e => !e.reference || e.reference.length < 3).length,
      shortDescriptions: entries.filter(e => e.description.length < 15).length,
      roundAmounts: entries.filter(e => (e.debit + e.credit) % 100 === 0).length,
      weekendEntries: entries.filter(e => {
        if (!e.date) return false;
        const day = new Date(e.date).getDay();
        return day === 0 || day === 6;
      }).length
    };
  }

  /**
   * Suggestions par défaut
   */
  private getDefaultSuggestions(stats: any): string[] {
    const suggestions: string[] = [];
    
    if (stats.missingReferences > 0) {
      suggestions.push('Améliorer la traçabilité en ajoutant des références systématiques');
    }
    
    if (stats.shortDescriptions > 0) {
      suggestions.push('Enrichir les descriptions pour faciliter le suivi');
    }
    
    if (stats.roundAmounts > 0) {
      suggestions.push('Vérifier les montants ronds qui peuvent indiquer des estimations');
    }
    
    if (stats.weekendEntries > 0) {
      suggestions.push('Contrôler les écritures saisies en week-end');
    }
    
    return suggestions;
  }
}

// Instance singleton
export const ollamaService = new OllamaService();

// Export des types
export type { OllamaResponse, OllamaRequest };