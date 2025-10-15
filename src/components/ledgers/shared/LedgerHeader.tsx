import React, { useState } from 'react';
import {
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  EyeSlashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface LedgerHeaderProps {
  title: string;
  subtitle?: string;
  type: 'client' | 'supplier' | 'miscellaneous' | 'balance';
  onSearch?: (query: string) => void;
  onFilter?: (filters: Record<string, any>) => void;
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void;
  onRefresh?: () => void;
  loading?: boolean;
  totalCount?: number;
  filteredCount?: number;
  showFilters?: boolean;
  onToggleFilters?: () => void;
  viewOptions?: {
    showCompact?: boolean;
    onToggleCompact?: () => void;
  };
  children?: React.ReactNode;
}

interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

const LedgerHeader: React.FC<LedgerHeaderProps> = ({
  title,
  subtitle,
  type,
  onSearch,
  onFilter,
  onExport,
  onRefresh,
  loading = false,
  totalCount,
  filteredCount,
  showFilters = false,
  onToggleFilters,
  viewOptions,
  children,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    onExport?.(format);
    setExportMenuOpen(false);
  };

  const getTypeSpecificFilters = (): FilterOption[] => {
    switch (type) {
      case 'client':
        return [
          {
            key: 'clientName',
            label: 'Client',
            type: 'text',
            placeholder: 'Nom du client',
          },
          {
            key: 'status',
            label: 'Statut',
            type: 'select',
            options: [
              { value: 'all', label: 'Tous' },
              { value: 'paid', label: 'Payé' },
              { value: 'pending', label: 'En attente' },
              { value: 'overdue', label: 'En retard' },
            ],
          },
          {
            key: 'dateRange',
            label: 'Période',
            type: 'date',
            placeholder: 'Date de début',
          },
          {
            key: 'amountMin',
            label: 'Montant min',
            type: 'number',
            placeholder: '0',
          },
        ];

      case 'supplier':
        return [
          {
            key: 'supplierName',
            label: 'Fournisseur',
            type: 'text',
            placeholder: 'Nom du fournisseur',
          },
          {
            key: 'category',
            label: 'Catégorie',
            type: 'select',
            options: [
              { value: 'all', label: 'Toutes' },
              { value: 'services', label: 'Services' },
              { value: 'materials', label: 'Matériaux' },
              { value: 'equipment', label: 'Équipement' },
            ],
          },
          {
            key: 'dateRange',
            label: 'Période',
            type: 'date',
            placeholder: 'Date de début',
          },
        ];

      case 'miscellaneous':
        return [
          {
            key: 'account',
            label: 'Compte',
            type: 'text',
            placeholder: 'Numéro de compte',
          },
          {
            key: 'category',
            label: 'Catégorie',
            type: 'select',
            options: [
              { value: 'all', label: 'Toutes' },
              { value: 'expenses', label: 'Dépenses' },
              { value: 'income', label: 'Revenus' },
              { value: 'transfers', label: 'Transferts' },
            ],
          },
        ];

      case 'balance':
        return [
          {
            key: 'period',
            label: 'Période',
            type: 'select',
            options: [
              { value: 'current', label: 'Période en cours' },
              { value: 'previous', label: 'Période précédente' },
              { value: 'ytd', label: 'Année en cours' },
              { value: 'custom', label: 'Personnalisé' },
            ],
          },
          {
            key: 'accountType',
            label: 'Type de compte',
            type: 'select',
            options: [
              { value: 'all', label: 'Tous' },
              { value: 'assets', label: 'Actifs' },
              { value: 'liabilities', label: 'Passifs' },
              { value: 'equity', label: 'Capitaux propres' },
            ],
          },
        ];

      default:
        return [];
    }
  };

  return (
    <div className="bg-white shadow rounded-lg mb-6">
      {/* Main Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
            {totalCount !== undefined && (
              <div className="mt-2 text-sm text-gray-600">
                {filteredCount !== undefined && filteredCount !== totalCount
                  ? `${filteredCount} sur ${totalCount} résultats`
                  : `${totalCount} résultat${totalCount > 1 ? 's' : ''}`}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* View Options */}
            {viewOptions?.onToggleCompact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={viewOptions.onToggleCompact}
                title={viewOptions.showCompact ? 'Vue étendue' : 'Vue compacte'}
              >
                {viewOptions.showCompact ? (
                  <EyeIcon className="h-5 w-5" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5" />
                )}
              </Button>
            )}

            {/* Refresh */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              title="Actualiser"
            >
              <svg
                className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </Button>

            {/* Export Menu */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Exporter
              </Button>

              {exportMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handleExport('csv')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                      Exporter en CSV
                    </button>
                    <button
                      onClick={() => handleExport('excel')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                      Exporter en Excel
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                      Exporter en PDF
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Filters Toggle */}
            <Button
              variant={showFilters ? 'primary' : 'outline'}
              size="sm"
              onClick={onToggleFilters}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {getTypeSpecificFilters().map((filter) => (
                <div key={filter.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {filter.label}
                  </label>
                  {filter.type === 'text' && (
                    <Input
                      type="text"
                      placeholder={filter.placeholder}
                      onChange={(e) =>
                        onFilter?.({ [filter.key]: e.target.value })
                      }
                    />
                  )}
                  {filter.type === 'select' && (
                    <select
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      onChange={(e) =>
                        onFilter?.({ [filter.key]: e.target.value })
                      }
                    >
                      {filter.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {filter.type === 'date' && (
                    <Input
                      type="date"
                      onChange={(e) =>
                        onFilter?.({ [filter.key]: e.target.value })
                      }
                    />
                  )}
                  {filter.type === 'number' && (
                    <Input
                      type="number"
                      placeholder={filter.placeholder}
                      onChange={(e) =>
                        onFilter?.({ [filter.key]: e.target.value })
                      }
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFilter?.({})}
              >
                Réinitialiser
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setExportMenuOpen(false)}
              >
                Appliquer les filtres
              </Button>
            </div>
          </div>
        )}

        {/* Additional Content */}
        {children}
      </div>
    </div>
  );
};

export default LedgerHeader;