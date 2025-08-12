import { LLMProvider, AnalysisContext, AnalysisResult } from './LLMProvider';

export class OllamaProvider extends LLMProvider {
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly timeout: number;

  constructor() {
    super();
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.defaultModel = 'llama2';
    this.timeout = 30000;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateJustificationMessage(context: AnalysisContext): Promise<string> {
    const prompt = this.buildPrompt(context);
    const response = await this.generate(prompt);
    return this.formatMessage(response);
  }

  async analyzeDescription(description: string, amount: number): Promise<AnalysisResult> {
    const prompt = this.buildAnalysisPrompt(description, amount);
    const response = await this.generate(prompt);
    return this.parseAnalysisResponse(response, description, amount);
  }

  async generateSuggestions(entries: any[]): Promise<string[]> {
    const stats = this.calculateStats(entries);
    const prompt = this.buildSuggestionsPrompt(stats, entries.length);
    const response = await this.generate(prompt);
    return this.parseSuggestions(response);
  }

  private async generate(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.defaultModel,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 500
        }
      }),
      signal: AbortSignal.timeout(this.timeout)
    });

    if (!response.ok) {
      throw new Error(`Ollama API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.response.trim();
  }

  private buildPrompt(context: AnalysisContext): string {
    const { clientName, amount, date, description, reference, type } = context;
    
    return `Tu es un assistant comptable professionnel. Génère un message courtois et professionnel en français pour demander des justificatifs.

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
  }

  private buildAnalysisPrompt(description: string, amount: number): string {
    return `Analyse cette écriture comptable et évalue son niveau de suspicion.

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
  }

  private buildSuggestionsPrompt(stats: any, totalEntries: number): string {
    return `Analyse ces statistiques d'écritures comptables et propose des améliorations.

Statistiques :
- Total écritures : ${totalEntries}
- Références manquantes : ${stats.missingReferences}
- Descriptions courtes : ${stats.shortDescriptions}
- Montants ronds : ${stats.roundAmounts}
- Écritures week-end : ${stats.weekendEntries}

Propose 3-5 suggestions concrètes d'amélioration en français.
Format : liste à puces, une suggestion par ligne.`;
  }

  private parseAnalysisResponse(response: string, description: string, amount: number): AnalysisResult {
    try {
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
    
    return this.localAnalysis(description, amount);
  }

  private parseSuggestions(response: string): string[] {
    const lines = response.split('\n');
    const suggestions: string[] = [];
    
    for (const line of lines) {
      const cleaned = line.replace(/^[-•*]\s*/, '').trim();
      if (cleaned.length > 10 && !cleaned.startsWith('Suggestion')) {
        suggestions.push(cleaned);
      }
    }
    
    return suggestions.slice(0, 5);
  }

  private localAnalysis(description: string, amount: number): AnalysisResult {
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

  private calculateStats(entries: any[]) {
    return {
      missingReferences: entries.filter(e => !e.reference || e.reference.length < 3).length,
      shortDescriptions: entries.filter(e => e.description.length < 15).length,
      roundAmounts: entries.filter(e => (e.debit + e.credit) % 100 === 0).length,
      weekendEntries: entries.filter(e => {
  const day = new Date(e.date).getDay();
        return day === 0 || day === 6;
      }).length
    };
  }
}