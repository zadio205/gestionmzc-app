'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { Search, Eye, Mail, Phone, MessageCircle, FileText, Calendar } from 'lucide-react';
import ClientDetailsModal from '@/components/clients/ClientDetailsModal';
import { Client } from '@/types';

interface ClientWithExtras extends Client {
  contact?: string;
  status?: string;
  lastActivity?: string;
  nextDeadline?: string;
  pendingTasks?: number;
  unreadMessages?: number;
}

const CollaborateurClients = () => {
  const { user, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithExtras | null>(null);
  const router = useRouter();

  // Plus de données d'exemple
  const clients: ClientWithExtras[] = [];

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  if (!user || user.role !== 'collaborateur') {
    return <div className="flex items-center justify-center h-screen">Accès non autorisé</div>;
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.contact || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPendingTasks = 0;
  const totalUnreadMessages = 0;

  const handleViewClient = (client: ClientWithExtras) => {
    setSelectedClient(client);
    setShowDetailsModal(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('modal', 'client-details');
      params.set('clientId', client._id);
      router.replace(`${window.location.pathname}?${params.toString()}`);
    }
  };

  // Hydrate depuis l'URL au montage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const modal = sp.get('modal');
    const clientId = sp.get('clientId');
    if (modal === 'client-details' && clientId) {
      const found = clients.find(c => c._id === clientId) || null;
      setSelectedClient(found);
      setShowDetailsModal(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si les clients sont chargés plus tard, retenter depuis l'URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (selectedClient) return;
    const sp = new URLSearchParams(window.location.search);
    const modal = sp.get('modal');
    const clientId = sp.get('clientId');
    if (modal === 'client-details' && clientId) {
      const found = clients.find(c => c._id === clientId) || null;
      if (found) {
        setSelectedClient(found);
        setShowDetailsModal(true);
      }
    }
  }, [clients, selectedClient]);

  const initialTabFromUrl = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get('tab');
    if (t === 'balance' || t === 'clients' || t === 'suppliers' || t === 'miscellaneous') return t;
    return undefined;
  }, []);

  return (
    <DashboardLayout userRole="collaborateur" userId={user._id}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes clients</h1>
          <p className="text-gray-600">Gérez vos clients assignés</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900">Mes clients</h3>
            <p className="text-2xl font-bold text-blue-600">{clients.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900">Tâches en attente</h3>
            <p className="text-2xl font-bold text-orange-600">{totalPendingTasks}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900">Messages non lus</h3>
            <p className="text-2xl font-bold text-red-600">{totalUnreadMessages}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900">Échéances cette semaine</h3>
            <p className="text-2xl font-bold text-purple-600">2</p>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Cartes des clients */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div key={client._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                    <p className="text-sm text-gray-600">{client.contact}</p>
                    <p className="text-sm text-gray-500">{client.email}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    client.status === 'Actif' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {client.status}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tâches en attente:</span>
                    <span className={`font-medium ${(client.pendingTasks ?? 0) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {client.pendingTasks ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Messages non lus:</span>
                    <span className={`font-medium ${(client.unreadMessages ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {client.unreadMessages ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Prochaine échéance:</span>
                    <span className="font-medium text-purple-600">
                      {client.nextDeadline ? new Date(client.nextDeadline).toLocaleDateString('fr-FR') : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Dernière activité:</span>
                    <span className="text-gray-500">
                      {client.lastActivity ? new Date(client.lastActivity).toLocaleDateString('fr-FR') : ''}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleViewClient(client)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-lg flex items-center justify-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Voir</span>
                  </button>
                  <button className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg">
                    <Mail className="w-4 h-4" />
                  </button>
                  <button className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-lg">
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="text-center text-gray-500 py-8">
                {searchTerm ? 'Aucun client trouvé pour cette recherche.' : 'Aucun client assigné pour le moment.'}
              </div>
            </div>
          </div>
        )}

        {/* Actions rapides */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <FileText className="w-6 h-6 text-blue-600" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Créer un rapport</div>
                <div className="text-sm text-gray-600">Générer un rapport client</div>
              </div>
            </button>
            <button className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <Calendar className="w-6 h-6 text-green-600" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Planifier RDV</div>
                <div className="text-sm text-gray-600">Programmer un rendez-vous</div>
              </div>
            </button>
            <button className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <MessageCircle className="w-6 h-6 text-purple-600" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Message groupé</div>
                <div className="text-sm text-gray-600">Envoyer à plusieurs clients</div>
              </div>
            </button>
          </div>
        </div>

        {/* Modal des détails comptables */}
        {showDetailsModal && selectedClient && (
          <ClientDetailsModal
            client={selectedClient}
            isOpen={showDetailsModal}
            initialTab={initialTabFromUrl}
            onTabChange={(tab) => {
              if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                params.set('tab', tab);
                params.set('modal', 'client-details');
                params.set('clientId', selectedClient._id);
                router.replace(`${window.location.pathname}?${params.toString()}`);
              }
            }}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedClient(null);
              if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                params.delete('modal');
                params.delete('clientId');
                params.delete('tab');
                const q = params.toString();
                const newUrl = q ? `${window.location.pathname}?${q}` : window.location.pathname;
                try {
                  window.history.replaceState(null, '', newUrl);
                } catch {
                  // ignore
                }
              }
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default CollaborateurClients;