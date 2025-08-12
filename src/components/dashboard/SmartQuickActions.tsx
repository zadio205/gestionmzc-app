'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Brain, 
  Sparkles,
  TrendingUp,
  Users,
  FileText,
  MessageCircle,
  Calendar,
  Target,
  AlertTriangle
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface SmartAction {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  priority: 'low' | 'medium' | 'high';
  aiGenerated: boolean;
  confidence?: number;
  estimatedImpact: string;
  onClick: () => void;
}

interface SmartQuickActionsProps {
  userRole: 'admin' | 'collaborateur';
  userData: any;
  onActionClick?: (actionId: string) => void;
}

const SmartQuickActions: React.FC<SmartQuickActionsProps> = ({ 
  userRole, 
  userData,
  onActionClick 
}) => {
  const [actions, setActions] = useState<SmartAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAIOnly, setShowAIOnly] = useState(false);

  useEffect(() => {
    const generateSmartActions = async () => {
      try {
        setLoading(true);
        
        // Simulation de génération d'actions intelligentes
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const baseActions: SmartAction[] = userRole === 'admin' ? [
          {
            id: 'add-user',
            title: 'Ajouter un utilisateur',
            description: 'Créer un nouveau compte',
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
            priority: 'medium',
            aiGenerated: false,
            estimatedImpact: 'Moyen',
            onClick: () => console.log('Add user')
          },
          {
            id: 'system-report',
            title: 'Rapport système',
            description: 'Générer un rapport de performance',
            icon: FileText,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
            priority: 'low',
            aiGenerated: false,
            estimatedImpact: 'Faible',
            onClick: () => console.log('System report')
          }
        ] : [
          {
            id: 'new-client',
            title: 'Nouveau client',
            description: 'Créer un dossier client',
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
            priority: 'medium',
            aiGenerated: false,
            estimatedImpact: 'Élevé',
            onClick: () => console.log('New client')
          },
          {
            id: 'upload-doc',
            title: 'Upload document',
            description: 'Ajouter des documents',
            icon: FileText,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
            priority: 'low',
            aiGenerated: false,
            estimatedImpact: 'Moyen',
            onClick: () => console.log('Upload doc')
          }
        ];

        // Actions générées par IA
        const aiActions: SmartAction[] = userRole === 'admin' ? [
          {
            id: 'ai-optimize-resources',
            title: 'Optimiser les ressources',
            description: 'IA détecte 23% de sous-utilisation',
            icon: Target,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
            priority: 'high',
            aiGenerated: true,
            confidence: 0.87,
            estimatedImpact: 'Très élevé',
            onClick: () => console.log('AI optimize resources')
          },
          {
            id: 'ai-predict-load',
            title: 'Préparer pic d\'activité',
            description: 'Pic prévu dans 2 semaines (+35%)',
            icon: TrendingUp,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
            priority: 'high',
            aiGenerated: true,
            confidence: 0.92,
            estimatedImpact: 'Élevé',
            onClick: () => console.log('AI predict load')
          }
        ] : [
          {
            id: 'ai-contact-client',
            title: 'Contacter SARL Exemple',
            description: 'IA détecte des signaux de risque',
            icon: AlertTriangle,
            color: 'text-red-600',
            bgColor: 'bg-red-100',
            priority: 'high',
            aiGenerated: true,
            confidence: 0.78,
            estimatedImpact: 'Très élevé',
            onClick: () => console.log('AI contact client')
          },
          {
            id: 'ai-schedule-meetings',
            title: 'Planifier 3 audits fiscaux',
            description: 'Opportunités d\'optimisation détectées',
            icon: Calendar,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
            priority: 'medium',
            aiGenerated: true,
            confidence: 0.85,
            estimatedImpact: 'Élevé',
            onClick: () => console.log('AI schedule meetings')
          }
        ];

        setActions([...aiActions, ...baseActions]);
      } catch (error) {
        console.error('Erreur génération actions:', error);
      } finally {
        setLoading(false);
      }
    };

    generateSmartActions();
  }, [userRole, userData]);

  const getPriorityColor = (priority: SmartAction['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const filteredActions = showAIOnly ? actions.filter(a => a.aiGenerated) : actions;
  const aiActionsCount = actions.filter(a => a.aiGenerated).length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Actions Intelligentes</h3>
        </div>
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Actions Intelligentes</h3>
          {aiActionsCount > 0 && (
            <div className="flex items-center space-x-1">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-purple-600 font-medium">
                {aiActionsCount} IA
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAIOnly(!showAIOnly)}
            className={`px-3 py-1 text-xs rounded-full transition-colors duration-200 ${
              showAIOnly 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {showAIOnly ? 'Toutes' : 'IA uniquement'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => {
                action.onClick();
                onActionClick?.(action.id);
              }}
              className={`relative flex items-start p-4 border rounded-lg hover:shadow-sm transition-all duration-200 text-left group ${getPriorityColor(action.priority)}`}
            >
              {action.aiGenerated && (
                <div className="absolute -top-2 -right-2 flex items-center space-x-1 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                  <Brain className="w-3 h-3" />
                  <span>IA</span>
                </div>
              )}
              
              <div className={`flex-shrink-0 w-10 h-10 ${action.bgColor} rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}>
                <Icon className={`w-5 h-5 ${action.color}`} />
              </div>
              
              <div className="ml-4 flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                    {action.title}
                  </h4>
                  <div className={`w-2 h-2 rounded-full ${
                    action.priority === 'high' ? 'bg-red-500' :
                    action.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                </div>
                
                <p className="text-xs text-gray-600 mb-2">
                  {action.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Impact: {action.estimatedImpact}
                  </span>
                  
                  {action.confidence && (
                    <span className="text-xs text-purple-600 font-medium">
                      {Math.round(action.confidence * 100)}% confiance
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {aiActionsCount} actions générées par IA • Mise à jour en temps réel
          </span>
          <button className="text-blue-600 hover:text-blue-800">
            Personnaliser
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartQuickActions;