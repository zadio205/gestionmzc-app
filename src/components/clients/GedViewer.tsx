'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Archive,
  FolderOpen,
  Search,
  Filter
} from 'lucide-react';
import { JustificatifService } from '@/services/justificatifService';
import { Justificatif } from '@/types/justificatif';
import { useNotification } from '@/contexts/NotificationContextSimple';

interface GedViewerProps {
  clientId: string;
  clientName?: string;
  onRefresh?: () => void;
}

const GedViewer: React.FC<GedViewerProps> = ({ clientId, clientName, onRefresh }) => {
  const [achats, setAchats] = useState<Justificatif[]>([]);
  const [ventes, setVentes] = useState<Justificatif[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'achats' | 'ventes'>('achats');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'archived'>('all');
  const { showNotification } = useNotification();

  const loadJustificatifs = async () => {
    setLoading(true);
    try {
      const data = await JustificatifService.getJustificatifsByClient(clientId);
      setAchats(data.achats);
      setVentes(data.ventes);
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger les justificatifs'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJustificatifs();
  }, [clientId]);

  const handleDelete = async (justificatifId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce justificatif ?')) {
      return;
    }

    try {
      await JustificatifService.deleteJustificatif(justificatifId);
      showNotification({
        type: 'success',
        title: 'Supprimé',
        message: 'Le justificatif a été supprimé'
      });
      loadJustificatifs();
      onRefresh?.();
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de supprimer le justificatif'
      });
    }
  };

  const handleUpdateStatus = async (justificatifId: string, status: Justificatif['status']) => {
    try {
      await JustificatifService.updateStatus(justificatifId, status);
      showNotification({
        type: 'success',
        title: 'Mis à jour',
        message: 'Le statut a été mis à jour'
      });
      loadJustificatifs();
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de mettre à jour le statut'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: <FileText className="w-3 h-3" /> },
      approved: { label: 'Approuvé', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
      rejected: { label: 'Rejeté', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" /> },
      archived: { label: 'Archivé', color: 'bg-gray-100 text-gray-800', icon: <Archive className="w-3 h-3" /> },
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const filterJustificatifs = (justificatifs: Justificatif[]) => {
    return justificatifs.filter(j => {
      const matchesSearch = searchTerm === '' || 
        j.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.reference?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

  const renderJustificatifsList = (justificatifs: Justificatif[], category: string) => {
    const filtered = filterJustificatifs(justificatifs);

    if (filtered.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Aucun justificatif</p>
          <p className="text-sm">
            {searchTerm || statusFilter !== 'all' 
              ? 'Aucun résultat ne correspond à vos filtres'
              : `Aucun justificatif dans la catégorie ${category}`
            }
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filtered.map((justificatif) => (
          <div
            key={justificatif._id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">{justificatif.name}</h4>
                    <p className="text-xs text-gray-500">
                      {JustificatifService.formatFileSize(justificatif.size)} • 
                      {new Date(justificatif.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                {justificatif.description && (
                  <p className="text-sm text-gray-600 mb-2">{justificatif.description}</p>
                )}

                {justificatif.reference && (
                  <p className="text-xs text-gray-500">Réf: {justificatif.reference}</p>
                )}

                {justificatif.montant && (
                  <p className="text-sm font-medium text-gray-700 mt-1">
                    Montant: {new Intl.NumberFormat('fr-FR', { 
                      style: 'currency', 
                      currency: 'EUR' 
                    }).format(Math.abs(justificatif.montant))}
                  </p>
                )}

                <div className="mt-2">
                  {getStatusBadge(justificatif.status)}
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                {justificatif.url && (
                  <>
                    <button
                      onClick={() => window.open(justificatif.url, '_blank')}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="Voir"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <a
                      href={justificatif.url}
                      download={justificatif.name}
                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                      title="Télécharger"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </>
                )}

                {justificatif.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(justificatif._id, 'approved')}
                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                      title="Approuver"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(justificatif._id, 'rejected')}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Rejeter"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleDelete(justificatif._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              GED - Justificatifs {clientName && `de ${clientName}`}
            </h2>
            <p className="text-sm text-gray-600">
              {achats.length} document(s) en achats • {ventes.length} document(s) en ventes
            </p>
          </div>
          <button
            onClick={loadJustificatifs}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Actualiser
          </button>
        </div>

        {/* Filtres */}
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvé</option>
              <option value="rejected">Rejeté</option>
              <option value="archived">Archivé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('achats')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'achats'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Achats ({filterJustificatifs(achats).length})
            </button>
            <button
              onClick={() => setActiveTab('ventes')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'ventes'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Ventes ({filterJustificatifs(ventes).length})
            </button>
          </nav>
        </div>

        <div className="p-4">
          {activeTab === 'achats' && renderJustificatifsList(achats, 'achats')}
          {activeTab === 'ventes' && renderJustificatifsList(ventes, 'ventes')}
        </div>
      </div>
    </div>
  );
};

export default GedViewer;
