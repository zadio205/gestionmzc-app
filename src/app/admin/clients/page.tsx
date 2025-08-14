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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const res = await fetch('/api/clients', { signal: controller.signal });
  clearTimeout(timeout);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Erreur chargement clients: ${res.status} ${text}`);
        }
        const body = await res.json();
        const rows = (body?.clients || []) as any[];

        const mapped: ClientWithExtras[] = rows.map((row: any) => ({
          _id: row._id || row.id,
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
  const subject = encodeURIComponent('Contact depuis Masyzarac');
  const body = encodeURIComponent(`Bonjour ${client.contact || 'Client'},\n\n`);
  window.location.href = `mailto:${encodeURIComponent(client.email)}?subject=${subject}&body=${body}`;
  };

  const handleDeleteClient = (client: ClientWithExtras) => {
    setSelectedClient(client);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedClient) return;
    try {
      setError(null);
      const res = await fetch(`/api/clients?id=${encodeURIComponent(selectedClient._id)}`, { method: 'DELETE' });
      const text = await res.text();
      if (!res.ok) {
        let msg = text; try { const j = JSON.parse(text); msg = j?.error || msg; } catch {}
        throw new Error(msg);
      }
      setClients(prev => prev.filter(c => c._id !== selectedClient._id));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Suppression impossible';
      setError(msg);
    } finally {
      setShowDeleteModal(false);
      setSelectedClient(null);
    }
  };

  const handleAddSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setError(null);
      const payload = {
        name: form.name,
        email: form.email,
        contact: form.contact || null,
        phone: form.phone || null,
        dossierNumber: form.dossierNumber || null,
        collaboratorId: user?._id || null,
      } as const;

      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) {
        let msg = text;
        try { const j = JSON.parse(text); msg = j?.error || msg; } catch {}
        throw new Error(msg || `HTTP ${res.status}`);
      }
      const body = JSON.parse(text);
      const data = body?.client || body;

      const newClient: ClientWithExtras = {
        _id: (data as any)._id || (data as any).id,
        name: (data as any).name || '',
        email: (data as any).email || '',
        contact: (data as any).contact || '',
        phone: (data as any).phone || '',
        dossierNumber: (data as any).dossier_number || (data as any).dossierNumber || '',
        collaboratorId: (data as any).collaborator_id || (data as any).collaboratorId || '',
        documents: (data as any).documents || [],
        isActive: ((data as any).is_active ?? (data as any).isActive) ?? true,
        createdAt: (data as any).created_at ? new Date((data as any).created_at) : ((data as any).createdAt ? new Date((data as any).createdAt) : new Date()),
        updatedAt: (data as any).updated_at ? new Date((data as any).updated_at) : ((data as any).updatedAt ? new Date((data as any).updatedAt) : new Date()),
      };

      setClients(prev => [newClient, ...prev]);
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
                <form
                  className="space-y-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget as HTMLFormElement);
                    const payload: any = { id: selectedClient._id };
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