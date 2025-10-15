'use client';

import React, { useState } from 'react';
import { 
  BarChart3, 
  Brain, 
  Calendar, 
  CheckCircle, 
  Clock,
  Download,
  FileText,
  PieChart,
  Sparkles,
  TrendingUp,
  Users,
  X
} from 'lucide-react';

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'financial' | 'operational' | 'client' | 'ai';
  estimatedTime: string;
  aiEnhanced?: boolean;
}

interface ReportGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'admin' | 'collaborateur';
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ isOpen, onClose, userRole }) => {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [includeAI, setIncludeAI] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const reportTypes: ReportType[] = userRole === 'admin' ? [
    {
      id: 'global-performance',
      name: 'Performance Globale',
      description: 'Vue d\'ensemble des performances système et utilisateurs',
      icon: TrendingUp,
      category: 'operational',
      estimatedTime: '2-3 min',
      aiEnhanced: true
    },
    {
      id: 'financial-summary',
      name: 'Résumé Financier',
      description: 'Analyse financière complète avec prédictions IA',
      icon: BarChart3,
      category: 'financial',
      estimatedTime: '3-4 min',
      aiEnhanced: true
    },
    {
      id: 'user-activity',
      name: 'Activité Utilisateurs',
      description: 'Statistiques d\'utilisation et engagement',
      icon: Users,
      category: 'operational',
      estimatedTime: '1-2 min'
    },
    {
      id: 'ai-insights',
      name: 'Rapport IA Avancé',
      description: 'Insights et recommandations générés par IA',
      icon: Brain,
      category: 'ai',
      estimatedTime: '4-5 min',
      aiEnhanced: true
    }
  ] : [
    {
      id: 'client-portfolio',
      name: 'Portfolio Clients',
      description: 'Analyse détaillée de vos clients avec scores de risque IA',
      icon: Users,
      category: 'client',
      estimatedTime: '2-3 min',
      aiEnhanced: true
    },
    {
      id: 'productivity',
      name: 'Productivité Personnelle',
      description: 'Analyse de votre performance avec suggestions IA',
      icon: TrendingUp,
      category: 'operational',
      estimatedTime: '1-2 min',
      aiEnhanced: true
    },
    {
      id: 'financial-analysis',
      name: 'Analyse Financière Clients',
      description: 'Rapport financier détaillé avec optimisations suggérées',
      icon: PieChart,
      category: 'financial',
      estimatedTime: '3-4 min',
      aiEnhanced: true
    }
  ];

  const getCategoryColor = (category: ReportType['category']) => {
    switch (category) {
      case 'financial':
        return 'bg-green-100 text-green-800';
      case 'operational':
        return 'bg-blue-100 text-blue-800';
      case 'client':
        return 'bg-purple-100 text-purple-800';
      case 'ai':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleGenerate = async () => {
    if (!selectedReport || !dateRange.start || !dateRange.end) return;

    setGenerating(true);
    
    try {
      // Import dynamique du service
      const { reportService } = await import('@/services/reportService');
      
      // Génération du rapport avec le service
      const report = await reportService.generateReport({
        type: selectedReport,
        dateRange,
        includeAI,
        userRole
      });
      
      console.log('Rapport généré:', report);
      setGenerated(true);
      
      // Auto-fermeture après succès
      setTimeout(() => {
        setGenerated(false);
        setGenerating(false);
        onClose();
        // Reset form
        setSelectedReport('');
        setDateRange({ start: '', end: '' });
      }, 2000);
      
    } catch (error) {
      console.error('Erreur génération rapport:', error);
      setGenerating(false);
      // Ici vous pourriez afficher une notification d'erreur
    }
  };

  const selectedReportData = reportTypes.find(r => r.id === selectedReport);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Générateur de Rapports
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {generating ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Génération en cours...
            </h3>
            <p className="text-gray-600">
              {selectedReportData?.name} • Temps estimé: {selectedReportData?.estimatedTime}
            </p>
            {includeAI && (
              <div className="flex items-center justify-center space-x-1 mt-2 text-purple-600">
                <Brain className="w-4 h-4" />
                <span className="text-sm">Analyse IA en cours</span>
              </div>
            )}
          </div>
        ) : generated ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Rapport généré avec succès !
            </h3>
            <p className="text-gray-600 mb-4">
              Le rapport sera téléchargé automatiquement
            </p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200">
              <Download className="w-4 h-4 inline mr-2" />
              Télécharger maintenant
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sélection du type de rapport */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Type de rapport
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reportTypes.map((report) => {
                  const Icon = report.icon;
                  return (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report.id)}
                      className={`p-4 border rounded-lg text-left transition-all duration-200 ${
                        selectedReport === report.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          selectedReport === report.id ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            selectedReport === report.id ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-gray-900">
                              {report.name}
                            </h3>
                            {report.aiEnhanced && (
                              <Sparkles className="w-4 h-4 text-purple-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {report.description}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(report.category)}`}>
                              {report.category}
                            </span>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>{report.estimatedTime}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Période */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Période d'analyse
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date de début</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date de fin</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Options IA */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Options avancées
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={includeAI}
                    onChange={(e) => setIncludeAI(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-gray-700">
                      Inclure les analyses et recommandations IA
                    </span>
                  </div>
                </label>
                <p className="text-xs text-gray-500 ml-7">
                  Ajoute des insights intelligents, prédictions et recommandations personnalisées
                </p>
              </div>
            </div>

            {/* Aperçu du rapport sélectionné */}
            {selectedReportData && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Aperçu du rapport</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Type:</strong> {selectedReportData.name}</p>
                  <p><strong>Catégorie:</strong> {selectedReportData.category}</p>
                  <p><strong>Temps estimé:</strong> {selectedReportData.estimatedTime}</p>
                  {selectedReportData.aiEnhanced && (
                    <p className="flex items-center space-x-1 text-purple-600">
                      <Sparkles className="w-3 h-3" />
                      <span><strong>IA:</strong> Rapport enrichi par intelligence artificielle</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleGenerate}
                disabled={!selectedReport || !dateRange.start || !dateRange.end}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Générer le rapport
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportGenerator;