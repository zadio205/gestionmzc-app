'use client';

import React, { useState } from 'react';
import { CommentModal } from '../CommentModal';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Eye,
  Filter,
  SortAsc,
  SortDesc,
  MoreVertical,
  Calendar,
  DollarSign,
  FileText,
  Tag,
  User,
  MapPin,
  Zap,
  MessageCircle,
  Download,
  Edit3,
  Trash2,
  Send,
  Upload
} from 'lucide-react';

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
  onSendRequest
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'balance'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'alerts' | 'complete'>('all');
  const [showActionsFor, setShowActionsFor] = useState<string | null>(null);
  
  // États pour le modal de commentaire
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedEntryForComment, setSelectedEntryForComment] = useState<any>(null);

  // Fermer le menu d'actions quand on clique ailleurs
  React.useEffect(() => {
    const handleClickOutside = () => setShowActionsFor(null);
    if (showActionsFor) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showActionsFor]);

  // Gestion du modal de commentaire
  const handleOpenCommentModal = (entry: any) => {
    setSelectedEntryForComment(entry);
    setCommentModalOpen(true);
    setShowActionsFor(null);
  };

  const handleCloseCommentModal = () => {
    setCommentModalOpen(false);
    setSelectedEntryForComment(null);
  };

  const handleSubmitComment = (comment: { content: string; priority: 'normal' | 'urgent' }) => {
    if (selectedEntryForComment && onCommentAdd) {
      onCommentAdd(selectedEntryForComment._id, {
        ...comment,
        author: 'Utilisateur'
      });
    }
  };

  const getStatusIcon = (entry: any) => {
    const status = getEntryStatus?.(entry);
    if (!status) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    
    switch (status.type) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
  };

  const getAmountTrend = (entry: any) => {
    const amount = entry.debit || entry.credit || 0;
    return amount > 0 ? (
      entry.debit > 0 ? 
        <TrendingDown className="w-4 h-4 text-red-500" /> : 
        <TrendingUp className="w-4 h-4 text-green-500" />
    ) : null;
  };

  const getTypeColor = (entryType: string) => {
    switch (entryType) {
      case 'clients': return 'bg-blue-500';
      case 'suppliers': return 'bg-orange-500';
      case 'miscellaneous': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const sortedEntries = [...entries].sort((a, b) => {
    let aVal, bVal;
    
    switch (sortBy) {
      case 'date':
        aVal = new Date(a.date || 0).getTime();
        bVal = new Date(b.date || 0).getTime();
        break;
      case 'amount':
        aVal = Math.abs(a.debit || a.credit || 0);
        bVal = Math.abs(b.debit || b.credit || 0);
        break;
      case 'balance':
        aVal = Math.abs(a.balance || 0);
        bVal = Math.abs(b.balance || 0);
        break;
      default:
        return 0;
    }
    
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const filteredEntries = sortedEntries.filter(entry => {
    // Filtrer les entrées avec montants nuls
    const hasAmount = (entry.debit || 0) > 0 || (entry.credit || 0) > 0;
    if (!hasAmount) return false;
    
    if (filterStatus === 'all') return true;
    const status = getEntryStatus?.(entry);
    if (filterStatus === 'alerts') return status?.type === 'error' || status?.type === 'warning';
    if (filterStatus === 'complete') return status?.type === 'success';
    return true;
  });

  // Vue en cartes modernes
  if (viewMode === 'cards') {
    return (
      <>
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
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Trier par:</span>
              <button
                onClick={() => {
                  if (sortBy === 'date') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('date');
                    setSortOrder('desc');
                  }
                }}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm ${
                  sortBy === 'date' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                } hover:bg-blue-200`}
              >
                <Calendar className="w-4 h-4" />
                <span>Date</span>
                {sortBy === 'date' && (sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />)}
              </button>
              
              <button
                onClick={() => {
                  if (sortBy === 'amount') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('amount');
                    setSortOrder('desc');
                  }
                }}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm ${
                  sortBy === 'amount' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                } hover:bg-blue-200`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Montant</span>
                {sortBy === 'amount' && (sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />)}
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{filteredEntries.length} entrée(s)</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 rounded-md text-sm transition-all ${
                  viewMode === 'cards' 
                    ? 'bg-white shadow-sm text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Cartes
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`px-3 py-1 rounded-md text-sm transition-all ${
                  viewMode === 'compact' 
                    ? 'bg-white shadow-sm text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Compact
              </button>
            </div>
          </div>
        </div>

        {/* Grid de cartes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEntries.map((entry) => {
            const status = getEntryStatus?.(entry);
            const amount = entry.debit || entry.credit || 0;
            const isDebit = entry.debit > 0;
            
            return (
              <div
                key={entry._id}
                onClick={() => onEntryClick?.(entry)}
                className="group relative bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-200 cursor-pointer overflow-hidden"
              >
                {/* Type indicator */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${getTypeColor(type)}`} />
                
                {/* Status indicator */}
                <div className="absolute top-3 right-3">
                  {getStatusIcon(entry)}
                </div>
                
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {getAmountTrend(entry)}
                        <h3 className="font-semibold text-gray-900 truncate">
                          {entry.supplierName || entry.clientName || entry.accountName || 'Compte'}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {entry.description || 'Pas de description'}
                      </p>
                    </div>
                  </div>

                  {/* Amount display */}
                  <div className="mb-4">
                    <div className={`text-2xl font-bold ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(amount)}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{isDebit ? 'Débit' : 'Crédit'}</span>
                      {entry.balance !== undefined && (
                        <>
                          <span>•</span>
                          <span className={entry.balance < 0 ? 'text-red-600' : 'text-green-600'}>
                            Solde: {formatCurrency(Math.abs(entry.balance))}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-2">
                    {entry.date && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(entry.date)}</span>
                      </div>
                    )}
                    
                    {entry.accountNumber && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Tag className="w-4 h-4" />
                        <span>{entry.accountNumber}</span>
                      </div>
                    )}
                    
                    {entry.reference && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <FileText className="w-4 h-4" />
                        <span>{entry.reference}</span>
                      </div>
                    )}
                  </div>

                  {/* AI Analysis */}
                  {entry.aiMeta && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-purple-500" />
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          entry.aiMeta.suspiciousLevel === 'high'
                            ? 'bg-red-100 text-red-700'
                            : entry.aiMeta.suspiciousLevel === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          IA: {entry.aiMeta.suspiciousLevel}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  {status && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <span className={`inline-flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${
                        status.type === 'success' ? 'bg-green-100 text-green-700' :
                        status.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {getStatusIcon(entry)}
                        <span>{status.label}</span>
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Actions rapides</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Toggle actions menu for:', entry._id);
                          const newValue = showActionsFor === entry._id ? null : entry._id;
                          setShowActionsFor(newValue);
                        }}
                        className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                        title="Actions rapides"
                      >
                        <MoreVertical className={`w-4 h-4 ${showActionsFor === entry._id ? 'text-blue-600' : 'text-gray-400'}`} />
                      </button>
                    </div>
                    
                    {showActionsFor === entry._id && (
                      <div className="mt-2 space-y-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                        {onCommentAdd && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCommentModal(entry);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Ajouter commentaire</span>
                          </button>
                        )}
                        
                        {onEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Edit button clicked (cards):', entry._id);
                              onEdit(entry);
                              setShowActionsFor(null);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-md transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span>Modifier</span>
                          </button>
                        )}
                        
                        {onExport && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Export button clicked (cards):', entry._id);
                              onExport(entry);
                              setShowActionsFor(null);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-md transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            <span>Exporter</span>
                          </button>
                        )}
                        
                        {onSendRequest && status?.type === 'error' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSendRequest(entry);
                              setShowActionsFor(null);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
                          >
                            <Send className="w-4 h-4" />
                            <span>Demander justificatif</span>
                          </button>
                        )}
                        
                        {onDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) {
                                onDelete(entry);
                              }
                              setShowActionsFor(null);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Supprimer</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            );
          })}
        </div>
      </div>
        
        {/* Modal de commentaire */}
        <CommentModal
          isOpen={commentModalOpen}
          onClose={handleCloseCommentModal}
          onSubmit={handleSubmitComment}
          entryId={selectedEntryForComment?._id || ''}
          entryDescription={selectedEntryForComment?.description || selectedEntryForComment?.libelle || ''}
        />
      </>
    );
  // Vue compacte
  } else if (viewMode === 'compact') {
    return (
      <>
        <div className="space-y-4">
        {/* Controls pour vue compacte */}
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
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 rounded-md text-sm transition-all ${
                  viewMode === 'cards' 
                    ? 'bg-white shadow-sm text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Cartes
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`px-3 py-1 rounded-md text-sm transition-all ${
                  viewMode === 'compact' 
                    ? 'bg-white shadow-sm text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Compact
              </button>
            </div>
          </div>
        </div>

        {/* Liste compacte */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredEntries.map((entry) => {
              const status = getEntryStatus?.(entry);
              const amount = entry.debit || entry.credit || 0;
              const isDebit = entry.debit > 0;
              
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
                          {entry.supplierName || entry.clientName || entry.accountName || 'Compte'}
                        </h4>
                        {entry.aiMeta && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            entry.aiMeta.suspiciousLevel === 'high' ? 'bg-red-100 text-red-700' :
                            entry.aiMeta.suspiciousLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            IA
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {entry.description || 'Pas de description'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className={`font-semibold ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {entry.date ? formatDate(entry.date) : 'Pas de date'}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(entry)}
                      
                      {/* Actions directes à côté des montants */}
                      <div className="flex items-center space-x-1">
                        {onCommentAdd && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCommentModal(entry);
                            }}
                            className="p-1.5 rounded-md hover:bg-blue-50 hover:text-blue-600 text-gray-400 transition-colors"
                            title="Ajouter commentaire"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {onEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(entry);
                            }}
                            className="p-1.5 rounded-md hover:bg-green-50 hover:text-green-600 text-gray-400 transition-colors"
                            title="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        
                        {onExport && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onExport(entry);
                            }}
                            className="p-1.5 rounded-md hover:bg-purple-50 hover:text-purple-600 text-gray-400 transition-colors"
                            title="Exporter"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        
                        {onSendRequest && status?.type === 'error' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSendRequest(entry);
                            }}
                            className="p-1.5 rounded-md hover:bg-orange-50 hover:text-orange-600 text-gray-400 transition-colors"
                            title="Demander justificatif"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        
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
                </div>
              );
            })}
          </div>
        </div>
      </div>
        
        {/* Modal de commentaire */}
        <CommentModal
          isOpen={commentModalOpen}
          onClose={handleCloseCommentModal}
          onSubmit={handleSubmitComment}
          entryId={selectedEntryForComment?._id || ''}
          entryDescription={selectedEntryForComment?.description || selectedEntryForComment?.libelle || ''}
        />
      </>
    );
  }

  return null;
};

export default ModernLedgerDisplay;
