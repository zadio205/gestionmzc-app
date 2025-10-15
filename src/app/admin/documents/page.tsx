'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import UnauthorizedRedirect from '@/components/auth/UnauthorizedRedirect';
import UploadJustificatifModal from '@/components/ledgers/shared/UploadJustificatifModal';
import GedViewer from '@/components/clients/GedViewer';
import { AuthWrapper } from '@/components/ui/AuthWrapper';
import { Download, RefreshCw, Upload } from 'lucide-react';

type ClientItem = { id: string; name: string };

const DocumentsManagement = () => {
  const { user, loading } = useAuth();
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [entryId, setEntryId] = useState<string>('general');
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<Array<{ name: string; url?: string; path: string; size: number | null; createdAt: string | null }>>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [includeGeneral, setIncludeGeneral] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/clients');
        if (!res.ok) throw new Error('Échec chargement clients');
        const data = await res.json();
        const list = (data.clients || []).map((c: any) => ({ id: c.id || c._id, name: c.name || c.email || 'Client' })).filter((c: any) => !!c.id);
        if (!cancelled) {
          setClients(list);
          // Sélectionner le premier par défaut
          if (list.length > 0) setSelectedClientId(list[0].id);
        }
      } catch (e) {
        // noop
      }
    })();
    return () => { cancelled = true; };
  }, [user?.role]);

  const selectedClientName = useMemo(() => clients.find(c => c.id === selectedClientId)?.name || '', [clients, selectedClientId]);

  const refresh = async () => {
    if (!selectedClientId || !entryId) return;
    try {
      setIsLoading(true);
      const fetchOne = async (eid: string) => {
        const res = await fetch('/api/documents/list', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: selectedClientId, entryId: eid })
        });
        if (!res.ok) return [] as any[];
        const data = await res.json();
        return data.files || [];
      };
      const lists = await Promise.all([
        fetchOne(entryId),
        includeGeneral && entryId !== 'general' ? fetchOne('general') : Promise.resolve([])
      ]);
      const merged = [...lists[0], ...lists[1]];
      setItems(merged);
    } catch (e) {
      // noop
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (selectedClientId) refresh(); }, [selectedClientId, entryId]);

return (
    <AuthWrapper 
      loadingMessage="Chargement de la GED..."
      allowedRoles={['admin']}
      unauthorizedMessage="Vous devez être administrateur pour accéder à la GED."
    >
      <DashboardLayout userRole="admin" userId={user?.id || ''}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">GED - Documents clients</h1>
            <p className="text-gray-600">Parcourez et téléchargez les pièces jointes envoyées par les clients</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setUploadOpen(true)} disabled={!selectedClientId}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg">
              <Upload className="w-4 h-4" /> Ajouter une pièce jointe
            </button>
            <button onClick={refresh} className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Rafraîchir
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm text-gray-600">Client</label>
              <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                {clients.length === 0 && <option>Aucun client</option>}
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-64 flex flex-col gap-2">
              <label className="text-sm text-gray-600">Espace (entryId)</label>
              <input value={entryId} onChange={(e) => setEntryId(e.target.value)}
                placeholder="general" className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <p className="text-xs text-gray-500">Astuce: utilisez "general" pour les documents génériques. Pour une écriture spécifique, indiquez son identifiant.</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
              <input type="checkbox" checked={includeGeneral} onChange={(e) => setIncludeGeneral(e.target.checked)} />
              Inclure aussi l'espace "general"
            </label>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            {items.length === 0 ? (
              <div className="text-center text-gray-500 py-8">Aucun document trouvé pour ce client{entryId ? ` (${entryId})` : ''}.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((f) => (
                  <li key={f.path} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{f.name}</div>
                      <div className="text-xs text-gray-500">
                        Client: {selectedClientName || selectedClientId} • {f.path?.includes('/general/') ? 'Espace: general' : `Espace: ${entryId}`}
                        {f.size ? ` • ${(f.size/1024).toFixed(1)} Ko` : ''}
                        {f.createdAt ? ` • ${new Date(f.createdAt).toLocaleString('fr-FR')}` : ''}
                      </div>
                    </div>
                    {f.url && (
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800">
                        <Download className="w-4 h-4" /> Télécharger
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {uploadOpen && selectedClientId && (
        <UploadJustificatifModal
          isOpen={uploadOpen}
          onClose={() => setUploadOpen(false)}
          clientId={selectedClientId}
          entryId={entryId || 'general'}
          onUploaded={() => refresh()}
        />
)}
      </DashboardLayout>
    </AuthWrapper>
  );
};

export default DocumentsManagement;