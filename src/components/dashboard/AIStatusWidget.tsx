'use client';

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Activity, 
  CheckCircle, 
  AlertCircle,
  Zap,
  TrendingUp,
  Settings
} from 'lucide-react';

interface AIService {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  lastUpdate: string;
  confidence: number;
  processedToday: number;
}

interface AIStatusWidgetProps {
  userRole: 'admin' | 'collaborateur';
}

const AIStatusWidget: React.FC<AIStatusWidgetProps> = ({ userRole }) => {
  const [services, setServices] = useState<AIService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAIStatus = async () => {
      try {
        setLoading(true);
        
        // Simulation du statut des services IA
        await new Promise(resolve => setTimeout(resolve, 600));
        
        const mockServices: AIService[] = [
          {
            id: 'insights',
            name: 'Génération d\'insights',
            status: 'active',
            lastUpdate: 'Il y a 2 min',
            confidence: 0.89,
            processedToday: 47
          },
          {
            id: 'predictions',
            name: 'Analyses prédictives',
            status: 'active',
            lastUpdate: 'Il y a 5 min',
            confidence: 0.92,
            processedToday: 23
          },
          {
            id: 'notifications',
            name: 'Notifications intelligentes',
            status: 'active',
            lastUpdate: 'Il y a 1 min',
            confidence: 0.85,
            processedToday: 156
          }
        ];
        
        setServices(mockServices);
      } catch (error) {
        console.error('Erreur chargement statut IA:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAIStatus();
    
    // Actualisation périodique
    const interval = setInterval(loadAIStatus, 60000); // 1 minute
    
    return () => clearInterval(interval);
  }, [userRole]);

  const getStatusIcon = (status: AIService['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: AIService['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Statut IA</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const activeServices = services.filter(s => s.status === 'active').length;
  const totalProcessed = services.reduce((sum, s) => sum + s.processedToday, 0);
  const avgConfidence = services.reduce((sum, s) => sum + s.confidence, 0) / services.length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Statut IA</h3>
        </div>
        <button className="p-1 text-gray-400 hover:text-gray-600">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Résumé global */}
      <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-purple-50 rounded-lg">
        <div className="text-center">
          <div className="text-lg font-semibold text-purple-900">{activeServices}/{services.length}</div>
          <div className="text-xs text-purple-600">Services actifs</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-purple-900">{totalProcessed}</div>
          <div className="text-xs text-purple-600">Traitements/jour</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-purple-900">{Math.round(avgConfidence * 100)}%</div>
          <div className="text-xs text-purple-600">Confiance moy.</div>
        </div>
      </div>

      {/* Liste des services */}
      <div className="space-y-3">
        {services.map((service) => (
          <div key={service.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(service.status)}
              <div>
                <h4 className="text-sm font-medium text-gray-900">{service.name}</h4>
                <p className="text-xs text-gray-500">{service.lastUpdate}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{service.processedToday}</div>
                <div className="text-xs text-gray-500">aujourd'hui</div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                {Math.round(service.confidence * 100)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Dernière synchronisation: maintenant</span>
          <div className="flex items-center space-x-1 text-green-600">
            <Zap className="w-3 h-3" />
            <span>Temps réel</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIStatusWidget;