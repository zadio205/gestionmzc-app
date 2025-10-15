'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import UnauthorizedRedirect from '@/components/auth/UnauthorizedRedirect';
import { Download, RefreshCw } from 'lucide-react';

const CollaborateurDocuments = () => {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Array<{ clientId: string; entryId: string; name: string; url?: string; path: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Simplification: charger seulement l'espace "general" du client courant si présent
  const load = async () => {
    if (!user?.clientId) return; // si le collab n'a pas de client courant, on garde vide
    try {
      setIsLoading(true);
      const res = await fetch('/api/documents/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: user.clientId, entryId: 'general' })
      });
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      const files = (data.files || []).map((f: any) => ({ clientId: user.clientId!, entryId: 'general', ...f }));
      setItems(files);
    } catch (e) {
      // noop
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.clientId]);

  if (!user && !loading) {
    return <UnauthorizedRedirect />;
  }

  if (user && user.role !== 'collaborateur') {
    return <UnauthorizedRedirect />;
  }

  if (!user) return null;

  return (
    <DashboardLayout userRole="collaborateur" userId={user.id}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">GED - Documents clients</h1>
          <button onClick={load} className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Rafraîchir
          </button>
        </div>
        
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            {items.length === 0 ? (
              <div className="text-center text-gray-500 py-8">Aucun document trouvé.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((it) => (
                  <li key={it.path} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{it.name}</div>
                      <div className="text-xs text-gray-500">Client: {it.clientId} • Espace: {it.entryId}</div>
                    </div>
                    {it.url && (
                      <a href={it.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800">
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
    </DashboardLayout>
  );
};

export default CollaborateurDocuments;