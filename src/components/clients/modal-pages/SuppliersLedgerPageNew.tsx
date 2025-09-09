'use client';

import React, { useState, useMemo } from 'react';
import { Search, Download } from 'lucide-react';

interface SuppliersLedgerPageProps {
  clientId: string;
  clientName: string;
}

const SuppliersLedgerPage: React.FC<SuppliersLedgerPageProps> = ({
  clientId,
  clientName
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [entries] = useState<any[]>([]);

  // Filtrage des entrées par terme de recherche
  const filteredEntries = useMemo(() => {
    if (!searchTerm.trim()) return entries;
    
    const term = searchTerm.toLowerCase();
    return entries.filter(entry =>
      entry.supplier?.toLowerCase().includes(term) ||
      entry.description?.toLowerCase().includes(term) ||
      entry.reference?.toLowerCase().includes(term)
    );
  }, [entries, searchTerm]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Grand livre fournisseurs</h2>
            <p className="text-sm text-gray-600 mt-1">
              {clientName} - Mode compact uniquement
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <Download className="w-4 h-4" />
              <span>Exporter</span>
            </button>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher par fournisseur, description ou référence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Contenu principal - Mode compact uniquement */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-lg font-medium mb-2">Mode compact activé</h3>
              <p className="text-sm">
                Le mode cartes a été supprimé définitivement. 
                Seul l'affichage compact est disponible.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuppliersLedgerPage;
