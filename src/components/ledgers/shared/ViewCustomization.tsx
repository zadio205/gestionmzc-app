'use client';

import React, { useState } from 'react';
import { 
  LayoutGrid, 
  List, 
  Eye, 
  EyeOff, 
  Settings, 
  Columns, 
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface ViewCustomizationProps {
  columns: string[];
  visibleColumns: string[];
  onToggleColumn: (column: string) => void;
  viewMode: 'compact' | 'detailed';
  onViewModeChange: (mode: 'compact' | 'detailed') => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  density: 'comfortable' | 'compact' | 'spacious';
  onDensityChange: (density: 'comfortable' | 'compact' | 'spacious') => void;
  showAnalysis: boolean;
  onToggleAnalysis: (show: boolean) => void;
}

const ViewCustomization: React.FC<ViewCustomizationProps> = ({
  columns,
  visibleColumns,
  onToggleColumn,
  viewMode,
  onViewModeChange,
  sortField,
  sortDirection,
  onSort,
  density,
  onDensityChange,
  showAnalysis,
  onToggleAnalysis
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'view' | 'columns' | 'sort'>('view');

  const getColumnLabel = (column: string) => {
    const labels: Record<string, string> = {
      'date': 'Date',
      'supplierName': 'Nom fournisseur',
      'accountNumber': 'N° Compte',
      'description': 'Description',
      'debit': 'Débit',
      'credit': 'Crédit',
      'balance': 'Solde',
      'status': 'Statut',
      'actions': 'Actions',
      'reference': 'Référence',
      'aiAnalysis': 'Analyse IA',
      'comments': 'Commentaires',
      'justifications': 'Justificatifs'
    };
    return labels[column] || column;
  };

  const viewModeOptions = [
    { value: 'compact', label: 'Compact', icon: List, description: 'Vue condensée, plus d\'entrées visibles' },
    { value: 'detailed', label: 'Détaillé', icon: LayoutGrid, description: 'Vue complète avec toutes les informations' }
  ];

  const densityOptions = [
    { value: 'compact', label: 'Compact', description: 'Espacement minimal' },
    { value: 'comfortable', label: 'Confortable', description: 'Espacement standard' },
    { value: 'spacious', label: 'Spacieux', description: 'Espacement généreux' }
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        title="Personnaliser l'affichage"
      >
        <Settings className="w-4 h-4" />
        <span>Vue</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Personnaliser l'affichage
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          {/* Onglets */}
          <div className="mt-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'view', label: 'Mode d\'affichage', icon: Eye },
                { id: 'columns', label: 'Colonnes', icon: Columns },
                { id: 'sort', label: 'Tri et filtres', icon: Filter }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          {/* Onglet Mode d'affichage */}
          {activeTab === 'view' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Mode d'affichage</h4>
                <div className="grid grid-cols-2 gap-4">
                  {viewModeOptions.map(({ value, label, icon: Icon, description }) => (
                    <button
                      key={value}
                      onClick={() => onViewModeChange(value as any)}
                      className={`p-4 border rounded-lg text-left ${
                        viewMode === value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{label}</span>
                      </div>
                      <p className="text-xs text-gray-600">{description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Densité</h4>
                <div className="space-y-2">
                  {densityOptions.map(({ value, label, description }) => (
                    <label key={value} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="density"
                        value={value}
                        checked={density === value}
                        onChange={() => onDensityChange(value as any)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">{label}</span>
                        <p className="text-xs text-gray-600">{description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Options d'affichage</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showAnalysis}
                      onChange={(e) => onToggleAnalysis(e.target.checked)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Afficher l'analyse IA</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Onglet Colonnes */}
          {activeTab === 'columns' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">Colonnes visibles</h4>
                <div className="flex space-x-2">
                  <button
                    onClick={() => columns.forEach(col => {
                      if (!visibleColumns.includes(col)) onToggleColumn(col);
                    })}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                  >
                    Tout sélectionner
                  </button>
                  <button
                    onClick={() => visibleColumns.forEach(col => onToggleColumn(col))}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                  >
                    Tout désélectionner
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {columns.map((column) => (
                  <label key={column} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(column)}
                      onChange={() => onToggleColumn(column)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{getColumnLabel(column)}</span>
                  </label>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-700">
                  💡 Conseil: Masquez les colonnes inutiles pour améliorer la lisibilité et les performances.
                </p>
              </div>
            </div>
          )}

          {/* Onglet Tri et filtres */}
          {activeTab === 'sort' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Tri principal</h4>
                <div className="flex space-x-2">
                  <select
                    value={sortField || ''}
                    onChange={(e) => onSort?.(e.target.value, sortDirection || 'asc')}
                    className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Aucun tri</option>
                    {columns.map((column) => (
                      <option key={column} value={column}>
                        {getColumnLabel(column)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => onSort?.(sortField || 'date', sortDirection === 'asc' ? 'desc' : 'asc')}
                    disabled={!sortField}
                    className={`p-2 border rounded-md ${
                      sortField
                        ? 'border-gray-300 hover:border-gray-400'
                        : 'border-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Actions rapides</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => onSort?.('date', 'desc')}
                    className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded"
                  >
                    Trier par date (plus récent en premier)
                  </button>
                  <button
                    onClick={() => onSort?.('balance', 'desc')}
                    className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded"
                  >
                    Trier par solde (plus élevé en premier)
                  </button>
                  <button
                    onClick={() => onSort?.('supplierName', 'asc')}
                    className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded"
                  >
                    Trier par nom fournisseur (A-Z)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-between">
            <button
              onClick={() => {
                // Reset to defaults
                onViewModeChange('detailed');
                onDensityChange('comfortable');
                onToggleAnalysis(true);
                columns.forEach(col => {
                  if (!visibleColumns.includes(col)) onToggleColumn(col);
                });
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Réinitialiser
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Appliquer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewCustomization;
