import React from 'react';
import { AlertTriangle, Calendar, Download, Loader, Mail } from 'lucide-react';
import FileImporter from '@/components/ui/FileImporter';

interface ClientsLedgerHeaderProps {
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
  sortBy: 'accountNumber' | 'accountName';
  onSortChange: (sortBy: 'accountNumber' | 'accountName') => void;
}

const ClientsLedgerHeader: React.FC<ClientsLedgerHeaderProps> = ({
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
  sortBy,
  onSortChange,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Grand livre des clients</h2>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Trier par:</label>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as 'accountNumber' | 'accountName')}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="accountNumber">N° Compte</option>
              <option value="accountName">Nom de compte</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          
          
          <div className="flex items-center space-x-2">
            
            
            {selectedEntriesCount > 0 && (
              <button
                onClick={onBulkRequest}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <span>Ajouter pièces jointes ({selectedEntriesCount})</span>
              </button>
            )}
            
            <FileImporter
              onImport={onImport}
              expectedColumns={['Date', 'Nom Client', 'N° Compte', 'Libellé', 'Débit', 'Crédit', 'Référence']}
              title="Importer les écritures clients"
              description="Importez les données du grand livre clients depuis un fichier Excel ou CSV"
              helpType="clients"
            />
           
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

export default ClientsLedgerHeader;