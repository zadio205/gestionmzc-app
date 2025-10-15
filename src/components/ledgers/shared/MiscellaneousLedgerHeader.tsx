import React from 'react';
import { Calendar, AlertTriangle, Download, Mail, Loader } from 'lucide-react';
import FileImporter from '@/components/ui/FileImporter';

interface MiscellaneousLedgerHeaderProps {
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

const MiscellaneousLedgerHeader: React.FC<MiscellaneousLedgerHeaderProps> = ({
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
            <h2 className="text-xl font-semibold text-gray-900">Grand livre des comptes divers</h2>
                      </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Trier par:</label>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as 'accountNumber' | 'accountName')}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              expectedColumns={['Date', 'Nom compte', 'N° Compte', 'Libellé', 'Débit', 'Crédit']}
              title="Importer les écritures comptes divers"
              description="Importez les données du grand livre comptes divers depuis un fichier Excel ou CSV"
              helpType="miscellaneous"
            />
         

            <button
              onClick={onClear}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <span>Vider</span>
            </button>
            
            <button className="flex items-center space-x-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700">
              <Download className="w-4 h-4" />
              <span>Exporter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiscellaneousLedgerHeader;
