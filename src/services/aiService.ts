'use client';

import { logger } from '@/utils/logger';

export interface AIInsight {
  id: string;
  type: 'recommendation' | 'alert' | 'optimization' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  category: 'financial' | 'operational' | 'compliance' | 'client';
  actionable: boolean;
  suggestedActions?: string[];
}

export interface AIAnalysis {
  clientRiskScore: number;
  sentimentAnalysis: 'positive' | 'neutral' | 'negative';
  priorityScore: number;
  recommendations: string[];
  predictedIssues: string[];
}

class AIService {
  private baseUrl = '/api/ai';

  // Analyse des messages avec IA
  async analyzeMessage(content: string, sender: string): Promise<AIAnalysis> {
    try {
      // Simulation d'analyse IA
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const sentiment = this.analyzeSentiment(content);
      const priority = this.calculatePriority(content);
      
      return {
        clientRiskScore: Math.random() * 0.3, // Score de risque faible simulé
        sentimentAnalysis: sentiment,
        priorityScore: priority,
        recommendations: this.generateRecommendations(content, sentiment),
        predictedIssues: this.predictIssues(content)
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Erreur analyse IA', { error: err, sender });
      throw err;
    }

  }

  // Génération d'insights IA pour le tableau de bord
  async generateDashboardInsights(userRole: 'admin' | 'collaborateur', data: any): Promise<AIInsight[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const insights: AIInsight[] = [];

      if (userRole === 'admin') {
        insights.push(
          {
            id: '1',
            type: 'optimization',
            title: 'Optimisation des ressources',
            description: 'L\'IA détecte une sous-utilisation de 23% des ressources système aux heures creuses',
            confidence: 0.87,
            impact: 'medium',
            category: 'operational',
            actionable: true,
            suggestedActions: [
              'Programmer les tâches lourdes aux heures creuses',
              'Ajuster l\'allocation des ressources'
            ]
          },
          {
            id: '2',
            type: 'prediction',
            title: 'Prédiction de charge',
            description: 'Pic d\'activité prévu la semaine prochaine (+35% de documents)',
            confidence: 0.92,
            impact: 'high',
            category: 'operational',
            actionable: true,
            suggestedActions: [
              'Préparer des ressources supplémentaires',
              'Informer l\'équipe de la charge prévue'
            ]
          }
        );
      } else {
        insights.push(
          {
            id: '3',
            type: 'recommendation',
            title: 'Client à risque identifié',
            description: 'SARL Exemple présente des signaux de difficultés financières',
            confidence: 0.78,
            impact: 'high',
            category: 'client',
            actionable: true,
            suggestedActions: [
              'Programmer un entretien avec le client',
              'Réviser les conditions de paiement'
            ]
          },
          {
            id: '4',
            type: 'optimization',
            title: 'Optimisation fiscale',
            description: '3 clients pourraient bénéficier d\'optimisations fiscales',
            confidence: 0.85,
            impact: 'medium',
            category: 'financial',
            actionable: true,
            suggestedActions: [
              'Proposer un audit fiscal',
              'Planifier des rendez-vous de conseil'
            ]
          }
        );
      }

      return insights;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Erreur génération insights', { error: err, userRole });
      return [];
    }

  }

  // Analyse prédictive des tâches
  async predictTaskCompletion(tasks: any[]): Promise<{ taskId: string; predictedDelay: number; riskLevel: 'low' | 'medium' | 'high' }[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return tasks.map(task => ({
        taskId: task.id,
        predictedDelay: Math.random() * 5, // Délai prédit en jours
        riskLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Erreur prédiction tâches', { error: err });
      return [];
    }

  }

  // Génération automatique de notifications intelligentes
  async generateSmartNotifications(userContext: any): Promise<any[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const notifications = [];

      // Notification basée sur l'analyse des patterns
      if (userContext.role === 'collaborateur') {
        notifications.push({
          id: `ai-${Date.now()}`,
          type: 'info',
          title: 'IA: Suggestion de productivité',
          message: 'Votre productivité est 15% plus élevée le matin. Planifiez les tâches complexes avant 11h.',
          timestamp: 'À l\'instant',
          isRead: false,
          aiGenerated: true,
          actionText: 'Optimiser planning',
          actionUrl: '/planning-optimization'
        });
      }

      return notifications;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Erreur génération notifications', { error: err, role: userContext?.role });
      return [];
    }

  }

  // Analyse de sentiment simplifiée
  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['merci', 'excellent', 'parfait', 'satisfait', 'content'];
    const negativeWords = ['problème', 'erreur', 'difficile', 'urgent', 'inquiet'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Calcul de priorité basé sur le contenu
  private calculatePriority(text: string): number {
    const urgentWords = ['urgent', 'immédiat', 'rapidement', 'asap'];
    const lowerText = text.toLowerCase();
    const urgentCount = urgentWords.filter(word => lowerText.includes(word)).length;
    
    return Math.min(urgentCount * 0.3 + Math.random() * 0.4, 1);
  }

  // Génération de recommandations
  private generateRecommendations(content: string, sentiment: string): string[] {
    const recommendations = [];
    
    if (sentiment === 'negative') {
      recommendations.push('Répondre rapidement pour résoudre les préoccupations');
      recommendations.push('Programmer un appel de suivi');
    } else if (sentiment === 'positive') {
      recommendations.push('Capitaliser sur cette satisfaction');
      recommendations.push('Proposer des services additionnels');
    } else {
      recommendations.push('Maintenir un suivi régulier');
    }
    
    return recommendations;
  }

  // Prédiction d'issues potentielles
  private predictIssues(content: string): string[] {
    const issues = [];
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('retard') || lowerContent.includes('délai')) {
      issues.push('Risque de retard dans les livrables');
    }
    
    if (lowerContent.includes('budget') || lowerContent.includes('coût')) {
      issues.push('Préoccupations budgétaires possibles');
    }
    
    return issues;
  }
}

export const aiService = new AIService();