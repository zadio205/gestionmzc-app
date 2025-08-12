'use client';

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb,
  Target,
  ChevronRight,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { aiService, AIInsight } from '@/services/aiService';

interface AIInsightsWidgetProps {
  userRole: 'admin' | 'collaborateur';
  data?: any;
}

const AIInsightsWidget: React.FC<AIInsightsWidgetProps> = ({ userRole, data }) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        setLoading(true);
        const aiInsights = await aiService.generateDashboardInsights(userRole, data);
        setInsights(aiInsights);
      } catch (error) {
        console.error('Erreur chargement insights IA:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, [userRole, data]);

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'recommendation':
        return <Lightbulb className="w-4 h-4" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4" />;
      case 'optimization':
        return <Target className="w-4 h-4" />;
      case 'prediction':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getInsightColor = (type: AIInsight['type'], impact: AIInsight['impact']) => {
    const baseColors = {
      recommendation: 'blue',
      alert: 'red',
      optimization: 'green',
      prediction: 'purple'
    };

    const color = baseColors[type] || 'gray';
    const intensity = impact === 'high' ? '600' : impact === 'medium' ? '500' : '400';
    
    return {
      text: `text-${color}-${intensity}`,
      bg: `bg-${color}-50`,
      border: `border-${color}-200`
    };
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Insights IA</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Insights IA</h3>
          <Sparkles className="w-4 h-4 text-yellow-500" />
        </div>
        <button className="text-sm text-purple-600 hover:text-purple-800">
          Voir tous
        </button>
      </div>

      {insights.length === 0 ? (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun insight disponible</p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => {
            const colors = getInsightColor(insight.type, insight.impact);
            return (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-sm ${colors.bg} ${colors.border}`}
                onClick={() => setSelectedInsight(insight)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`flex-shrink-0 ${colors.text}`}>
                      {getInsightIcon(insight.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {insight.title}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(insight.confidence)}`}>
                          {Math.round(insight.confidence * 100)}%
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {insight.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                            insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            Impact {insight.impact}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">
                            {insight.category}
                          </span>
                        </div>
                        
                        {insight.actionable && (
                          <div className="flex items-center space-x-1 text-xs text-purple-600">
                            <span>Actionnable</span>
                            <ChevronRight className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de détails */}
      {selectedInsight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Détails de l'insight
              </h3>
              <button
                onClick={() => setSelectedInsight(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  {selectedInsight.title}
                </h4>
                <p className="text-sm text-gray-600">
                  {selectedInsight.description}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <span className="text-gray-500">Confiance: </span>
                  <span className="font-medium">
                    {Math.round(selectedInsight.confidence * 100)}%
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Impact: </span>
                  <span className="font-medium capitalize">
                    {selectedInsight.impact}
                  </span>
                </div>
              </div>
              
              {selectedInsight.suggestedActions && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">
                    Actions suggérées:
                  </h5>
                  <ul className="space-y-1">
                    {selectedInsight.suggestedActions.map((action, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="text-purple-600 mr-2">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700">
                  Appliquer
                </button>
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsightsWidget;