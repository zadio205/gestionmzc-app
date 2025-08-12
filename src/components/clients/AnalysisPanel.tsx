import React from 'react';
import { Brain } from 'lucide-react';
import { ClientLedger } from '@/types/accounting';

interface AnalysisResult {
  unsolvedInvoices: ClientLedger[];
  paymentsWithoutJustification: ClientLedger[];
  suspiciousEntries: ClientLedger[];
}

interface AnalysisPanelProps {
  analysisResult: AnalysisResult;
  llmSuggestions: string[];
  onSelectEntries: (entries: Set<string>) => void;
  onGenerateSuggestions?: () => void;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  analysisResult,
  llmSuggestions,
  onSelectEntries,
  onGenerateSuggestions
}) => {
  return (
    <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Brain className="w-5 h-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-orange-800">Analyse intelligente du grand livre</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-red-800">Factures non soldées</h4>
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              {analysisResult.unsolvedInvoices.length}
            </span>
          </div>
          <p className="text-sm text-red-600">
            Factures émises sans règlement complet
          </p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-yellow-800">Justificatifs manquants</h4>
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
              {analysisResult.paymentsWithoutJustification.length}
            </span>
          </div>
          <p className="text-sm text-yellow-600">
            Encaissements sans justificatifs clairs
          </p>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-purple-800">Écritures suspectes</h4>
            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
              {analysisResult.suspiciousEntries.length}
            </span>
          </div>
          <p className="text-sm text-purple-600">
            Écritures nécessitant une vérification
          </p>
        </div>
      </div>

      {/* Suggestions LLM */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-blue-800">Suggestions d'amélioration (IA)</h4>
          {onGenerateSuggestions && (
            <button
              onClick={onGenerateSuggestions}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
            >
              Générer suggestions
            </button>
          )}
        </div>
        {llmSuggestions.length > 0 ? (
          <ul className="text-sm text-blue-700 space-y-1">
            {llmSuggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-blue-500">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-blue-600">Cliquez sur "Générer suggestions" pour obtenir des recommandations IA</p>
        )}
      </div>

      {/* Actions rapides */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            const ids = new Set(analysisResult.unsolvedInvoices.map(e => e._id));
            onSelectEntries(ids);
          }}
          className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-md hover:bg-red-200"
        >
          Sélectionner factures non soldées
        </button>
        <button
          onClick={() => {
            const ids = new Set(analysisResult.paymentsWithoutJustification.map(e => e._id));
            onSelectEntries(ids);
          }}
          className="text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded-md hover:bg-yellow-200"
        >
          Sélectionner paiements sans justif
        </button>
        <button
          onClick={() => {
            const allProblematic = [
              ...analysisResult.unsolvedInvoices,
              ...analysisResult.paymentsWithoutJustification
            ];
            const ids = new Set(allProblematic.map(e => e._id));
            onSelectEntries(ids);
          }}
          className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-md hover:bg-orange-200"
        >
          Sélectionner tout problématique
        </button>
      </div>
    </div>
  );
};

export default AnalysisPanel;