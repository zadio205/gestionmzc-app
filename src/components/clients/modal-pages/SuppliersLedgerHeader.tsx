import React from 'react';
import { Calendar, AlertTriangle, Download, Mail, Loader } from 'lucide-react';
import FileImporter from '@/components/ui/FileImporter';

interface SuppliersLedgerHeaderProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  showAnalysis: boolean;
  onToggleAnalysis: () => void;
  selectedEntriesCount: number;
  onBulkRequest: () => void;
  isGenerating: boolean;
  onImport: (data: any[]) => void;
  analysisCount: number;
  onReload: () => void;
  onClear: () => void;
}

const SuppliersLedgerHeader: React.FC<SuppliersLedgerHeaderProps> = ({
  selectedPeriod,
  onPeriodChange,
  showAnalysis,
  onToggleAnalysis,
  selectedEntriesCount,
  onBulkRequest,
  isGenerating,
  onImport,
  analysisCount,
  onReload,
  onClear,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Grand livre des fournisseurs</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gérez et analysez les écritures de vos fournisseurs
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleAnalysis}
              className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-md transition-colors ${
                showAnalysis 
                  ? 'bg-orange-600 text-white hover:bg-orange-700' 
                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Analyse IA</span>
              {analysisCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-1">
                  {analysisCount}
                </span>
              )}
            </button>
            
            {selectedEntriesCount > 0 && (
              <button
                onClick={onBulkRequest}
                disabled={isGenerating}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                <span>Demander justificatifs ({selectedEntriesCount})</span>
              </button>
            )}
            
            <FileImporter
              onImport={onImport}
              expectedColumns={['Date', 'Nom Fournisseur', 'N° Compte', 'Libellé', 'Débit', 'Crédit', 'Référence']}
              title="Importer les écritures fournisseurs"
              description="Importez les données du grand livre fournisseurs depuis un fichier Excel ou CSV"
              helpType="suppliers"
            />
            
            <button
              onClick={onReload}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
            >
              <span>Recharger</span>
            </button>
            
            <button
              onClick={onClear}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <span>Vider</span>
            </button>
            
            <button className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <Download className="w-4 h-4" />
              <span>Exporter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuppliersLedgerHeader;
