'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import UnauthorizedRedirect from '@/components/auth/UnauthorizedRedirect';
import { Search, Plus, Edit, Trash2, Mail, Eye } from 'lucide-react';
import ClientDetailsModal from '@/components/clients/ClientDetailsModal';
import { AuthWrapper } from '@/components/ui/AuthWrapper';
import { Client } from '@/types';

interface ClientWithExtras extends Client {
  contact?: string;
  status?: string;
  lastActivity?: string;
  collaborator?: string;
}

interface RawClientData {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  contact?: string;
  phone?: string;
  address?: string;
  siret?: string;
  industry?: string;
  dossier_number?: string;
  dossierNumber?: string;
  collaborator_id?: string;
  collaboratorId?: string;
  documents?: string[];
  is_active?: boolean;
  isActive?: boolean;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  status?: string;
  last_activity?: string;
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
  const router = useRouter();

  // Hydrate modal state from URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const modal = sp.get('modal');
    const clientId = sp.get('clientId');

    if (modal === 'client-details' && clientId) {
      // Try to preselect client from loaded list when available
      const found = clients.find(c => c._id === clientId) || null;
      if (found) {
        setSelectedClient(found);
        setShowDetailsModal(true);
      } else {
        // Fallback visuel immédiat: restaurer depuis sessionStorage si présent
        try {
          const raw = window.sessionStorage.getItem('client-details-selection');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.client?._id === clientId) {
              setSelectedClient(parsed.client);
              setShowDetailsModal(true);
            }
          }
        } catch {}
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (effet ajouté plus bas, après déclaration de clients)

  // Keep URL in sync when opening/closing the details modal
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (showDetailsModal && selectedClient) {
      params.set('modal', 'client-details');
      params.set('clientId', selectedClient._id);
      router.replace(`${window.location.pathname}?${params.toString()}`);
    } else {
      params.delete('modal');
      params.delete('clientId');
      params.delete('tab');
      const q = params.toString();
      router.replace(q ? `${window.location.pathname}?${q}` : `${window.location.pathname}`);
    }
  }, [showDetailsModal, selectedClient, router]);

  const initialTabFromUrl = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    try {
      const raw = window.sessionStorage.getItem('client-details-selection');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.tab && ['balance','clients','suppliers','miscellaneous'].includes(parsed.tab)) {
          return parsed.tab as 'balance' | 'clients' | 'suppliers' | 'miscellaneous';
        }
      }
    } catch {}
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get('tab');
    if (t === 'balance' || t === 'clients' || t === 'suppliers' || t === 'miscellaneous') return t;
    return undefined;
  }, []);
  const [clients, setClients] = useState<ClientWithExtras[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoadingClients(true);
        setError(null);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const res = await fetch('/api/clients', { signal: controller.signal });
  clearTimeout(timeout);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Erreur chargement clients: ${res.status} ${text}`);
        }
        const body = await res.json();
        const rows = (body?.clients || []) as RawClientData[];

        const mapped: ClientWithExtras[] = rows.map((row: RawClientData) => ({
          _id: row._id || row.id || '',
          name: row.name || '',
          email: row.email || '',
          contact: row.contact || '',
          phone: row.phone || '',
          address: row.address || '',
          siret: row.siret || '',
          industry: row.industry || '',
          dossierNumber: row.dossier_number || row.dossierNumber || '',
          collaboratorId: row.collaborator_id || row.collaboratorId || '',
          documents: row.documents || [],
          isActive: (row.is_active ?? row.isActive) ?? true,
          createdAt: row.created_at ? new Date(row.created_at) : (row.createdAt ? new Date(row.createdAt) : new Date()),
          updatedAt: row.updated_at ? new Date(row.updated_at) : (row.updatedAt ? new Date(row.updatedAt) : new Date()),
          status: row.status,
          lastActivity: row.last_activity || row.updated_at || row.created_at || row.lastActivity || row.updatedAt || row.createdAt || undefined,
          collaborator: row.collaborator,
        }));
        setClients(mapped);
  } catch {
        setError('Impossible de charger les clients');
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
  }, []);

  // Si les clients arrivent après, retenter l'ouverture du modal depuis l'URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const modal = sp.get('modal');
    const clientId = sp.get('clientId');
    if (modal === 'client-details' && clientId && !selectedClient) {
      const found = clients.find(c => c._id === clientId) || null;
      if (found) {
        setSelectedClient(found);
        setShowDetailsModal(true);
      }
    }
  }, [clients, selectedClient]);

const filteredClients = clients.filter(client =>
    (client.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.contact || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewClient = (client: ClientWithExtras) => {
    setSelectedClient(client);
    setShowDetailsModal(true);
    if (typeof window !== 'undefined') {
      try { window.sessionStorage.setItem('client-details-selection', JSON.stringify({ client, tab: 'balance' })); } catch {}
      const params = new URLSearchParams(window.location.search);
      params.set('modal', 'client-details');
      params.set('clientId', client._id);
      router.replace(`${window.location.pathname}?${params.toString()}`);
    }
  };

  const handleEditClient = (client: ClientWithExtras) => {
    setSelectedClient(client);
    setShowEditModal(true);
  };

  const handleSendEmail = (client: ClientWithExtras) => {
    // Ouvrir le client email par défaut avec l'adresse du client
    const subject = encodeURIComponent('Contact depuis Masyzarac');
    const body = encodeURIComponent(`Bonjour ${client.contact || 'Client'},\n\n`);
    window.open(`mailto:${client.email}?subject=${subject}&body=${body}`);
  };

  const handleDeleteClient = (client: ClientWithExtras) => {
    setSelectedClient(client);
    setShowDeleteModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const clientData = {
      name: formData.get('name') as string,
      contact: formData.get('contact') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      dossierNumber: formData.get('dossierNumber') as string,
    };
    // Implémentation de l'ajout
    console.log('Ajout client:', clientData);
    setShowAddModal(false);
  };

  const confirmDelete = async () => {
    if (!selectedClient) return;
    // Implémentation de la suppression
    console.log('Suppression client:', selectedClient);
    setShowDeleteModal(false);
    setSelectedClient(null);
  };

  return (
    <AuthWrapper 
      loadingMessage="Chargement de la gestion des clients..."
      allowedRoles={['admin']}
      unauthorizedMessage="Vous devez être administrateur pour accéder à la gestion des clients."
    >
      <DashboardLayout userRole="admin" userId={user?.id || ''}>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    N°Dossier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Collaborateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Dernière activité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
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
                        <div className="text-sm text-gray-600">{client.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{client.dossierNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{client.contact}</div>
                        <div className="text-sm text-gray-600">{client.phone}</div>
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
                      name="name"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nom de l&apos;entreprise"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact principal</label>
                    <input
                      type="text"
                      name="contact"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nom du contact"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="email@exemple.fr"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                    <input
                      type="tel"
                      name="phone"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="01 23 45 67 89"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">N°Dossier</label>
                    <input
                      type="text"
                      name="dossierNumber"
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
                <form
                  className="space-y-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget as HTMLFormElement);
                    const payload: { id: string; name?: string; contact?: string; email?: string; phone?: string; dossierNumber?: string; collaboratorId?: string; status?: string } = { id: selectedClient._id };
                    const name = (formData.get('name') as string) || '';
                    const contact = (formData.get('contact') as string) || '';
                    const email = (formData.get('email') as string) || '';
                    const phone = (formData.get('phone') as string) || '';
                    const dossierNumber = (formData.get('dossierNumber') as string) || '';
                    const status = (formData.get('status') as string) || '';
                    if (name && name !== selectedClient.name) payload.name = name;
                    if (contact && contact !== selectedClient.contact) payload.contact = contact;
                    if (email && email !== selectedClient.email) payload.email = email;
                    if (phone && phone !== selectedClient.phone) payload.phone = phone;
                    if (dossierNumber && dossierNumber !== selectedClient.dossierNumber) payload.dossierNumber = dossierNumber;
                    if (status && status !== (selectedClient.status || (selectedClient.isActive ? 'Actif' : 'Inactif'))) payload.status = status;
                    try {
                      setError(null);
                      const res = await fetch('/api/clients', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                      });
                      const text = await res.text();
                      if (!res.ok) {
                        let msg = text; try { const j = JSON.parse(text); msg = j?.error || msg; } catch {}
                        throw new Error(msg);
                      }
                      const body = JSON.parse(text);
            const updated = body?.client;
                      if (updated) {
                        setClients(prev => prev.map(c => c._id === selectedClient._id ? {
                          ...c,
                          name: updated.name || c.name,
                          email: updated.email || c.email,
                          contact: updated.contact || c.contact,
                          phone: updated.phone || c.phone,
              dossierNumber: updated.dossierNumber ?? updated.dossier_number ?? c.dossierNumber,
              collaboratorId: updated.collaboratorId ?? updated.collaborator_id ?? c.collaboratorId,
              isActive: (updated.isActive ?? updated.is_active) ?? c.isActive,
              updatedAt: updated.updatedAt ? new Date(updated.updatedAt) : (updated.updated_at ? new Date(updated.updated_at) : c.updatedAt),
                          status: updated.status ?? c.status,
                        } : c));
                        setShowEditModal(false);
                        setSelectedClient(null);
                      }
                    } catch (err) {
                      const msg = err instanceof Error ? err.message : 'Mise à jour impossible';
                      setError(msg);
                    }
                  }}
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nom de l&apos;entreprise</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={selectedClient.name}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nom de l&apos;entreprise"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact principal</label>
                    <input
                      type="text"
                      name="contact"
                      defaultValue={selectedClient.contact}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nom du contact"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={selectedClient.email}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="email@exemple.fr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                    <input
                      type="tel"
                      name="phone"
                      defaultValue={selectedClient.phone}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="01 23 45 67 89"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">N°Dossier</label>
                    <input
                      type="text"
                      name="dossierNumber"
                      defaultValue={selectedClient.dossierNumber}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="DOS-2024-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Statut</label>
                    <select
                      name="status"
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
            initialTab={initialTabFromUrl}
            onTabChange={(tab) => {
              if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                params.set('tab', tab);
                params.set('modal', 'client-details');
                params.set('clientId', selectedClient._id);
                router.replace(`${window.location.pathname}?${params.toString()}`);
                try {
                  const raw = window.sessionStorage.getItem('client-details-selection');
                  const parsed = raw ? JSON.parse(raw) : { client: selectedClient };
                  window.sessionStorage.setItem('client-details-selection', JSON.stringify({ ...parsed, tab }));
                } catch {}
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
                  // fallback no-op
                }
              }
            }}
          />
        )}
      </DashboardLayout>
    </AuthWrapper>
  );
};

export default ClientsManagement;