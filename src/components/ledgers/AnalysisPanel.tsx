'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

interface AnalysisData {
  unsolvedInvoices: number;
  paymentsWithoutJustification: number;
  suspiciousEntries: number;
  totalEntries: number;
}

interface AnalysisResult {
  unsolvedInvoices: any[];
  paymentsWithoutJustification: any[];
  suspiciousEntries: any[];
}

interface AnalysisPanelProps {
  data?: AnalysisData;
  analysisResult?: AnalysisResult;
  llmSuggestions?: string[];
  onSelectEntries?: (entries: Set<string>) => void;
  onGenerateSuggestions?: () => void;
  isVisible?: boolean;
  onToggle?: (visible: boolean) => void;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ 
  data,
  analysisResult,
  llmSuggestions = [],
  onSelectEntries,
  onGenerateSuggestions,
  isVisible = true, 
  onToggle 
}) => {
  // Calculer les données depuis analysisResult si fourni
  const analysisData = data || {
    unsolvedInvoices: analysisResult?.unsolvedInvoices?.length || 0,
    paymentsWithoutJustification: analysisResult?.paymentsWithoutJustification?.length || 0,
    suspiciousEntries: analysisResult?.suspiciousEntries?.length || 0,
    totalEntries: (analysisResult?.unsolvedInvoices?.length || 0) + 
                  (analysisResult?.paymentsWithoutJustification?.length || 0) + 
                  (analysisResult?.suspiciousEntries?.length || 0)
  };
  
  if (!isVisible) return null;

  const analysisItems = [
    {
      title: 'Factures non soldées',
      count: analysisData.unsolvedInvoices,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Paiements sans justificatifs',
      count: analysisData.paymentsWithoutJustification,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Écritures suspectes',
      count: analysisData.suspiciousEntries,
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Total écritures',
      count: analysisData.totalEntries,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Analyse des écritures
        </h3>
        <button
          onClick={() => onToggle && onToggle(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {analysisItems.map((item, index) => (
          <div key={index} className="p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{item.title}</p>
                <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
              </div>
              <div className={`p-3 rounded-lg ${item.bgColor}`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {analysisData.totalEntries > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Recommandations</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            {analysisData.unsolvedInvoices > 0 && (
              <li>• Relancer les clients avec des factures impàyées</li>
            )}
            {analysisData.paymentsWithoutJustification > 0 && (
              <li>• Demander les justificatifs manquants</li>
            )}
            {analysisData.suspiciousEntries > 0 && (
              <li>• Vérifier les écritures suspectes identifiées</li>
            )}
            {llmSuggestions.length > 0 && (
              <li>• Suggestions IA: {llmSuggestions.slice(0, 2).join(', ')}</li>
            )}
          </ul>
          {onGenerateSuggestions && (
            <button
              onClick={onGenerateSuggestions}
              className="mt-3 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Générer suggestions IA
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisPanel;