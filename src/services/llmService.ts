/**
 * Service de messagerie simplifié - remplace les services LLM supprimés
 * Utilise uniquement des templates prédéfinis
 */

export interface AnalysisContext {
  clientName: string;
  amount: number;
  date: string;
  description: string;
  reference?: string;
  type: 'payment' | 'invoice';
}

class LLMService {
  /**
   * Génère un message de demande de justificatif à partir de templates
   */
  async generateJustificationMessage(context: AnalysisContext): Promise<string> {
    const { clientName, amount, date, description, reference, type } = context;
    
    if (type === 'payment') {
      return `Bonjour,

Nous avons identifié un encaissement de ${amount}€ en date du ${date} pour ${clientName}.

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

Nous constatons que la facture de ${clientName} d'un montant de ${amount}€ émise le ${date} présente un solde non soldé.

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

  /**
   * Analyse simple d'une description d'écriture
   */
  async analyzeEntryDescription(description: string, amount: number): Promise<{
    suspiciousLevel: 'low' | 'medium' | 'high';
    reasons: string[];
    suggestions: string[];
  }> {
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

    if (description.match(/^\d+$/)) {
      reasons.push('Description uniquement numérique');
      suspiciousLevel = 'high';
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

  /**
   * Génère des suggestions d'amélioration basiques
   */
  async generateImprovementSuggestions(entries: any[]): Promise<string[]> {
    const suggestions: string[] = [];
    
    const missingReferences = entries.filter(e => !e.reference || e.reference.length < 3).length;
    const shortDescriptions = entries.filter(e => e.description.length < 15).length;
    const roundAmounts = entries.filter(e => (e.debit + e.credit) % 100 === 0).length;
    
    if (missingReferences > entries.length * 0.3) {
      suggestions.push("Améliorer la traçabilité en ajoutant des références systématiques");
    }
    
    if (shortDescriptions > entries.length * 0.2) {
      suggestions.push("Enrichir les descriptions des écritures pour faciliter le suivi");
    }
    
    if (roundAmounts > entries.length * 0.5) {
      suggestions.push("Vérifier les montants ronds qui peuvent indiquer des estimations");
    }

    if (suggestions.length === 0) {
      suggestions.push("Maintenir la qualité actuelle de la saisie");
      suggestions.push("Effectuer des contrôles périodiques de cohérence");
    }
    
    return suggestions;
  }

  /**
   * Retourne un statut vide pour maintenir la compatibilité
   */
  async getProvidersStatus(): Promise<Record<string, boolean>> {
    return {
      ollama: false,
      openai: false,
      huggingface: false
    };
  }
}

// Instance singleton
export const llmService = new LLMService();