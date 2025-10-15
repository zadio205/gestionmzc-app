import React, { useMemo, useState } from 'react';
// import { FixedSizeList as List } from 'react-window'; // Disabled for now
import {
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentIcon,
  EyeIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency } from '@/services/clientLedgerService';
import type { LedgerEntry } from '@/types/ledger';

interface LedgerTableProps {
  entries: LedgerEntry[];
  type: 'client' | 'supplier' | 'miscellaneous';
  loading?: boolean;
  onView?: (entry: LedgerEntry) => void;
  onEdit?: (entry: LedgerEntry) => void;
  onComment?: (entry: LedgerEntry) => void;
  onJustify?: (entry: LedgerEntry) => void;
  selectedEntries?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
}

interface RowData {
  index: number;
  style: React.CSSProperties;
  data: {
    entries: LedgerEntry[];
    columns: Column[];
    selectedEntries: Set<string>;
    onSelectionChange: (ids: Set<string>) => void;
    onView: (entry: LedgerEntry) => void;
    onEdit: (entry: LedgerEntry) => void;
    onComment: (entry: LedgerEntry) => void;
    onJustify: (entry: LedgerEntry) => void;
  };
}

interface Column {
  key: string;
  label: string;
  width: number;
  sortable?: boolean;
  format?: (value: any) => string;
}

const LedgerTable: React.FC<LedgerTableProps> = ({
  entries,
  type,
  loading = false,
  onView,
  onEdit,
  onComment,
  onJustify,
  selectedEntries = new Set(),
  onSelectionChange,
}) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'date', direction: 'desc' });

  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Define columns based on ledger type
  const columns = useMemo(() => {
    const baseColumns: Column[] = [
      { key: 'date', label: 'Date', width: 120, sortable: true },
      { key: 'reference', label: 'Référence', width: 140, sortable: true },
    ];

    if (type === 'client') {
      baseColumns.push(
        { key: 'clientName', label: 'Client', width: 200, sortable: true },
        { key: 'debit', label: 'Débit', width: 120, sortable: true, format: formatCurrency },
        { key: 'credit', label: 'Crédit', width: 120, sortable: true, format: formatCurrency }
      );
    } else if (type === 'supplier') {
      baseColumns.push(
        { key: 'supplierName', label: 'Fournisseur', width: 200, sortable: true },
        { key: 'debit', label: 'Débit', width: 120, sortable: true, format: formatCurrency },
        { key: 'credit', label: 'Crédit', width: 120, sortable: true, format: formatCurrency }
      );
    } else {
      baseColumns.push(
        { key: 'account', label: 'Compte', width: 150, sortable: true },
        { key: 'debit', label: 'Débit', width: 120, sortable: true, format: formatCurrency },
        { key: 'credit', label: 'Crédit', width: 120, sortable: true, format: formatCurrency }
      );
    }

    baseColumns.push(
      { key: 'description', label: 'Description', width: 300 },
      { key: 'actions', label: 'Actions', width: 150 }
    );

    return baseColumns;
  }, [type]);

  // Sort entries
  const sortedEntries = useMemo(() => {
    const sortable = [...entries];
    sortable.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof LedgerEntry];
      const bValue = b[sortConfig.key as keyof LedgerEntry];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sortable;
  }, [entries, sortConfig]);

  const handleSort = (column: Column) => {
    if (!column.sortable) return;

    setSortConfig(prev => ({
      key: column.key,
      direction:
        prev.key === column.key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const toggleRowExpansion = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const toggleSelection = (entryId: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    onSelectionChange?.(newSelected);
  };

  const Row: React.FC<RowData> = ({ index, style, data }) => {
    const entry = data.entries[index];
    const isExpanded = expandedRows.has(index);
    const isSelected = data.selectedEntries.has(entry._id);

    const getEntryValue = (key: string): React.ReactNode => {
      const value = entry[key as keyof LedgerEntry];
      const column = data.columns.find(col => col.key === key);
      
      if (column?.format && value) {
        return column.format(value);
      }
      
      // Handle Date objects
      if (value instanceof Date) {
        return value.toLocaleDateString('fr-FR');
      }
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        return '-';
      }
      
      return String(value);
    };

    return (
      <div style={style}>
        <div className={`border-b border-gray-200 hover:bg-gray-50 ${
          isSelected ? 'bg-blue-50' : ''
        }`}>
          <div className="flex items-center px-4 py-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelection(entry._id)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />

            {data.columns.map((column) => (
              <div
                key={column.key}
                style={{ width: column.width }}
                className="px-2 text-sm"
              >
                {column.key === 'actions' ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => data.onView(entry)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Voir les détails"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => data.onEdit(entry)}
                      className="text-green-600 hover:text-green-800"
                      title="Modifier"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => data.onComment(entry)}
                      className="text-purple-600 hover:text-purple-800"
                      title="Ajouter un commentaire"
                    >
                      <DocumentIcon className="h-4 w-4" />
                    </button>
                    {type === 'client' && (
                      <button
                        onClick={() => data.onJustify(entry)}
                        className="text-orange-600 hover:text-orange-800"
                        title="Demander une justification"
                      >
                        <DocumentIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="truncate">
                    {getEntryValue(column.key)}
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={() => toggleRowExpansion(index)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </button>
          </div>

          {isExpanded && (
            <div className="px-12 py-3 bg-gray-50 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Description complète:</span>
                  <p className="mt-1 text-gray-600">{entry.description}</p>
                </div>
                {entry.invoiceNumber && (
                  <div>
                    <span className="font-medium">Numéro de facture:</span>
                    <p className="mt-1 text-gray-600">{entry.invoiceNumber}</p>
                  </div>
                )}
                {entry.balance && (
                  <div>
                    <span className="font-medium">Solde:</span>
                    <p className="mt-1">{formatCurrency(entry.balance)}</p>
                  </div>
                )}
                {entry.status && (
                  <div>
                    <span className="font-medium">Statut:</span>
                    <p className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        entry.status === 'validated'
                          ? 'bg-green-100 text-green-800'
                          : entry.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {entry.status === 'validated' ? 'Validé' : 
                         entry.status === 'pending' ? 'En attente' : 'Rejeté'}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (sortedEntries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Aucune entrée trouvée</div>
      </div>
    );
  }

  const rowHeight = expandedRows.size > 0 ? 120 : 60;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="flex items-center px-4 py-3">
          <div className="mr-3">
            <input
              type="checkbox"
              checked={selectedEntries.size === sortedEntries.length}
              onChange={(e) => {
                if (e.target.checked) {
                  const allIds = new Set(sortedEntries.map(entry => entry._id));
                  onSelectionChange?.(allIds);
                } else {
                  onSelectionChange?.(new Set());
                }
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          {columns.map((column) => (
            <div
              key={column.key}
              style={{ width: column.width }}
              className={`px-2 text-xs font-medium text-gray-700 uppercase tracking-wider ${
                column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
              }`}
              onClick={() => handleSort(column)}
            >
              <div className="flex items-center">
                {column.label}
                {column.sortable && sortConfig.key === column.key && (
                  <span className="ml-1">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="max-h-96 overflow-y-auto">
        {sortedEntries.map((entry, index) => (
          <Row
            key={entry._id}
            index={index}
            style={{ height: rowHeight }}
            data={{
              entries: sortedEntries,
              columns,
              selectedEntries,
              onSelectionChange: onSelectionChange || (() => {}),
              onView: onView || (() => {}),
              onEdit: onEdit || (() => {}),
              onComment: onComment || (() => {}),
              onJustify: onJustify || (() => {}),
            }}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-700">
          <div>
            {selectedEntries.size > 0 && (
              <span>{selectedEntries.size} élément(s) sélectionné(s)</span>
            )}
          </div>
          <div>
            {sortedEntries.length} entrée(s) au total
          </div>
        </div>
      </div>
    </div>
  );
};

export default LedgerTable;