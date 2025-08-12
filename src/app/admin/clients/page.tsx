'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { Search, Plus, Edit, Trash2, Mail, Eye } from 'lucide-react';
import ClientDetailsModal from '@/components/clients/ClientDetailsModal';
import { Client } from '@/types';

interface ClientWithExtras extends Client {
  contact?: string;
  status?: string;
  lastActivity?: string;
  collaborator?: string;
}

const ClientsManagement = () => {
  const { user, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithExtras | null>(null);
  const [clients, setClients] = useState<ClientWithExtras[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    dossierNumber: '',
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoadingClients(true);
        setError(null);
        const res = await fetch('/api/clients', { cache: 'no-store' });
        if (!res.ok) throw new Error('Erreur de chargement');
        const data = await res.json();
        setClients(data.clients || []);
  } catch {
        setError('Impossible de charger les clients');
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <div className="flex items-center justify-center h-screen">Accès non autorisé</div>;
  }

  const filteredClients = clients.filter(client =>
    (client.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.contact || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fonctions pour gérer les actions
  const handleViewClient = (client: ClientWithExtras) => {
    setSelectedClient(client);
    setShowDetailsModal(true);
  };

  const handleEditClient = (client: ClientWithExtras) => {
    setSelectedClient(client);
    setShowEditModal(true);
  };

  const handleSendEmail = (client: ClientWithExtras) => {
    // Ouvrir le client email par défaut avec l'adresse du client
    window.location.href = `mailto:${client.email}?subject=Contact depuis Masyzarac&body=Bonjour ${client.contact || 'Client'},`;
  };

  const handleDeleteClient = (client: ClientWithExtras) => {
    setSelectedClient(client);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    // Ici vous ajouteriez la logique pour supprimer le client de la base de données
    console.log('Suppression du client:', selectedClient);
    setShowDeleteModal(false);
    setSelectedClient(null);
    // Actualiser la liste des clients après suppression
  };

  const handleAddSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setError(null);
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          contact: form.contact || undefined,
          phone: form.phone || undefined,
          dossierNumber: form.dossierNumber || undefined,
          // address intentionally omitted in add modal for now
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur lors de l\'ajout');
      }
      const { client } = await res.json();
      setClients(prev => [client, ...prev]);
      setShowAddModal(false);
      setForm({ name: '', contact: '', email: '', phone: '', dossierNumber: '' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(msg);
    }
  };

  return (
    <DashboardLayout userRole="admin" userId={user._id}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des clients</h1>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un client</span>
          </button>
        </div>

        {/* Statistiques */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900">Total clients</h3>
      <p className="text-2xl font-bold text-blue-600">{clients.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900">Clients actifs</h3>
      <p className="text-2xl font-bold text-green-600">0</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900">Clients inactifs</h3>
      <p className="text-2xl font-bold text-red-600">0</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900">Nouveaux ce mois</h3>
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
        
        {/* Tableau des clients */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            {error && (
              <div className="p-4 text-red-600 text-sm">{error}</div>
            )}
            {loadingClients && (
              <div className="p-4 text-gray-600 text-sm">Chargement des clients...</div>
            )}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N°Dossier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Collaborateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière activité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">{client.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{client.dossierNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{client.contact}</div>
                        <div className="text-sm text-gray-500">{client.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.collaborator}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const statusLabel = client.status ?? (client.isActive ? 'Actif' : 'Inactif');
                        const badgeClass = statusLabel === 'Actif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
                        return (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass}`}>
                            {statusLabel}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.lastActivity ? new Date(client.lastActivity).toLocaleDateString('fr-FR') : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewClient(client)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Voir les détails comptables"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditClient(client)}
                          className="text-green-600 hover:text-green-900"
                          title="Modifier le client"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleSendEmail(client)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Envoyer un email"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClient(client)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer le client"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal d'ajout de client */}
  {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ajouter un nouveau client</h3>
    <form className="space-y-4" onSubmit={handleAddSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nom de l&apos;entreprise</label>
                    <input
                      type="text"
          value={form.name}
          onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nom de l&apos;entreprise"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact principal</label>
                    <input
                      type="text"
          value={form.contact}
          onChange={(e) => setForm(f => ({ ...f, contact: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nom du contact"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
          value={form.email}
          onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="email@exemple.fr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                    <input
                      type="tel"
          value={form.phone}
          onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="01 23 45 67 89"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">N°Dossier</label>
                    <input
                      type="text"
          value={form.dossierNumber}
          onChange={(e) => setForm(f => ({ ...f, dossierNumber: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="DOS-2024-001"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Ajouter
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal d'édition de client */}
        {showEditModal && selectedClient && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Modifier le client</h3>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nom de l&apos;entreprise</label>
                    <input
                      type="text"
                      defaultValue={selectedClient.name}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nom de l&apos;entreprise"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact principal</label>
                    <input
                      type="text"
                      defaultValue={selectedClient.contact}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nom du contact"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      defaultValue={selectedClient.email}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="email@exemple.fr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                    <input
                      type="tel"
                      defaultValue={selectedClient.phone}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="01 23 45 67 89"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">N°Dossier</label>
                    <input
                      type="text"
                      defaultValue={selectedClient.dossierNumber}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="DOS-2024-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Statut</label>
                    <select
                      defaultValue={selectedClient.status}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Actif">Actif</option>
                      <option value="Inactif">Inactif</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedClient(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                    >
                      Modifier
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmation de suppression */}
        {showDeleteModal && selectedClient && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmer la suppression</h3>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Êtes-vous sûr de vouloir supprimer le client <strong>{selectedClient.name}</strong> ?
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    Cette action est irréversible.
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedClient(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal des détails comptables */}
        {showDetailsModal && selectedClient && (
          <ClientDetailsModal
            client={selectedClient}
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedClient(null);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientsManagement;