'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Eye,
  Filter,
  MoreVertical,
  FileText,
  Tag,
  User,
  MapPin,
  MessageCircle,
  Download,
  Edit3,
  Trash2,
  Send,
  Upload,
  Receipt
} from 'lucide-react';
import InlineComment from './InlineComment';

interface ModernLedgerDisplayProps {
  entries: any[];
  type: 'clients' | 'suppliers' | 'miscellaneous';
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | null) => string;
  onEntryClick?: (entry: any) => void;
  getEntryStatus?: (entry: any) => any;
  onCommentAdd?: (entryId: string, comment: any) => void;
  onEdit?: (entry: any) => void;
  onDelete?: (entry: any) => void;
  onExport?: (entry: any) => void;
  onAddDocument?: (entry: any) => void;
  onSendRequest?: (entry: any) => void;
}

const ModernLedgerDisplay: React.FC<ModernLedgerDisplayProps> = ({
  entries,
  type,
  formatCurrency,
  formatDate,
  onEntryClick,
  getEntryStatus,
  onCommentAdd,
  onEdit,
  onDelete,
  onExport,
  onAddDocument,
  onSendRequest
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'alerts' | 'complete'>('all');
  const [showActionsFor, setShowActionsFor] = useState<string | null>(null);

  // États pour l'édition inline des descriptions
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState<string>('');

  // Fermer le menu d'actions quand on clique ailleurs
  React.useEffect(() => {
    const handleClickOutside = () => setShowActionsFor(null);
    if (showActionsFor) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showActionsFor]);

  const getStatusIcon = (entry: any) => {
    const status = getEntryStatus?.(entry);
    const label = status?.label || 'Facture non réglée';

    // Affichage demandé: "Facture non réglée" = vert
    if (label === 'Facture non réglée') {
      return (
        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
          {label}
        </span>
      );
    }

    if (!status) {
      return (
        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
          {label}
        </span>
      );
    }

    switch (status.type) {
      case 'error':
        return (
          <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
            {label}
          </span>
        );
      case 'warning':
        return (
          <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
            {label}
          </span>
        );
      case 'success':
        return (
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            {label}
          </span>
        );
      default:
        return (
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            {label}
          </span>
        );
    }
  };

  const getAmountTrend = (entry: any) => {
    const amount = entry.debit || entry.credit || 0;
    return amount > 0 ? entry.debit > 0 ? 'debit' : 'credit' : 'neutral';
  };

  const getTypeColor = (entryType: string) => {
    switch (entryType) {
      case 'clients': return 'bg-blue-500';
      case 'suppliers': return 'bg-green-500';
      case 'miscellaneous': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // Gestion de l'édition inline des descriptions
  const handleStartEdit = (entry: any) => {
    setEditingEntryId(entry._id);
    setEditingDescription(entry.description || entry.libelle || '');
    setShowActionsFor(null);
  };

  const handleSaveEdit = (entry: any) => {
    if (onEdit && editingDescription.trim() !== (entry.description || entry.libelle || '')) {
      // Créer un objet entry modifié avec la nouvelle description
      const updatedEntry = {
        ...entry,
        description: editingDescription.trim(),
        libelle: editingDescription.trim() // Pour compatibilité
      };
      onEdit(updatedEntry);
    }
    setEditingEntryId(null);
    setEditingDescription('');
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
    setEditingDescription('');
  };

  // Filtrage des entrées (la sélection 0/0 est gérée en amont par visibleEntries)
  // Le tri est géré par les hooks (useClientLedgerState, useSupplierLedgerState, useMiscLedgerState)
  const filteredEntries = entries.filter(entry => {
    if (filterStatus === 'all') return true;
    const status = getEntryStatus?.(entry);
    if (filterStatus === 'alerts') return status?.type === 'error' || status?.type === 'warning';
    if (filterStatus === 'complete') return status?.type === 'success';
    return true;
  });

  return (
    <div className="space-y-6">
        {/* Controls */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Toutes les entrées</option>
                <option value="alerts">Alertes uniquement</option>
                <option value="complete">Complètes uniquement</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{filteredEntries.length} entrée(s)</span>
          </div>
        </div>

        {/* Liste compacte */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredEntries.map((entry) => {
              const status = getEntryStatus?.(entry);
              const debitAmount = entry.debit || 0;
              const creditAmount = entry.credit || 0;
              
              return (
                <div
                  key={entry._id}
                  className="relative flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`w-3 h-3 rounded-full ${getTypeColor(type)}`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {entry.supplierName || entry.clientName || entry.accountName || 'Description'}
                        </h4>
                      </div>
                      
                      {/* Description editable inline pour mode compact */}
                      {editingEntryId === entry._id ? (
                        <div className="flex items-center space-x-2 mt-1">
                          <input
                            type="text"
                            value={editingDescription}
                            onChange={(e) => setEditingDescription(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveEdit(entry);
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            className="flex-1 px-2 py-1 text-xs border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Description..."
                            autoFocus
                            onBlur={() => handleSaveEdit(entry)}
                          />
                        </div>
                      ) : (
                        <p 
                          className="text-sm text-gray-500 truncate cursor-text hover:bg-gray-50 rounded px-1 py-0.5 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onEdit) handleStartEdit(entry);
                          }}
                          title="Cliquez pour modifier la description"
                        >
                          {entry.description || entry.libelle || 'Pas de description'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Colonne Montants (alignée à droite, largeur fixe) */}
                    <div className="text-right min-w-[140px]">
                      {/* Affichage séparé débit et crédit */}
                      <div className="space-y-0.5">
                        {debitAmount > 0 && (
                          <div className="font-semibold text-red-600 text-sm">
                            D: {formatCurrency(debitAmount)}
                          </div>
                        )}
                        {creditAmount > 0 && (
                          <div className="font-semibold text-green-600 text-sm">
                            C: {formatCurrency(creditAmount)}
                          </div>
                        )}
                        {debitAmount === 0 && creditAmount === 0 && (
                          <div className="font-semibold text-gray-400 text-sm">
                            Aucun montant
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {entry.date ? formatDate(entry.date) : 'Pas de date'}
                      </div>
                    </div>
                    
                    {/* Colonne Statut (alignée à droite, largeur fixe) */}
                    <div className="min-w-[180px] flex justify-end">
                      {getStatusIcon(entry)}
                    </div>

                    {/* Colonne Actions (alignée à droite, largeur fixe) */}
                    <div className="flex items-center space-x-1 min-w-[160px] justify-end">
                        {/* Commentaire intégré avec InlineComment */}
                        <div className="relative">
                          <InlineComment 
                            entryId={entry._id} 
                            clientId={entry.clientId || 'default'} 
                            showInTable={true}
                          />
                        </div>
                        
                        {onEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(entry);
                            }}
                            className="p-1.5 rounded-md hover:bg-green-50 hover:text-green-600 text-gray-400 transition-colors"
                            title="Modifier description"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        
                        {onAddDocument && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddDocument(entry);
                            }}
                            className="p-1.5 rounded-md hover:bg-blue-50 hover:text-blue-600 text-gray-400 transition-colors"
                            title="Ajouter des justificatifs"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Bouton de demande retiré */}
                        
                        {onDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(entry);
                            }}
                            className="p-1.5 rounded-md hover:bg-red-50 hover:text-red-600 text-gray-400 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
              );
            })}
          </div>
        </div>
    </div>
  );
};

export default ModernLedgerDisplay;
