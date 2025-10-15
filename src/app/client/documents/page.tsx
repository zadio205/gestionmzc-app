'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import UnauthorizedRedirect from '@/components/auth/UnauthorizedRedirect';
import UploadJustificatifModal from '@/components/ledgers/shared/UploadJustificatifModal';
import { Upload, Download, RefreshCw } from 'lucide-react';

const ClientDocuments = () => {
  const { user, loading } = useAuth();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [files, setFiles] = useState<Array<{ name: string; url?: string; path: string; size: number | null; createdAt: string | null }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const entryId = 'general'; // Espace générique pour pièces jointes libres

  const refresh = async () => {
    if (!user?.clientId) return;
    try {
      setIsLoading(true);
      const res = await fetch('/api/documents/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: user.clientId, entryId })
      });
      if (!res.ok) throw new Error('Erreur de chargement');
      const data = await res.json();
      setFiles(data.files || []);
    } catch (e) {
      // noop
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [user?.clientId]);

  if (!user && !loading) {
    return <UnauthorizedRedirect />;
  }

  if (user && user.role !== 'client') {
    return <UnauthorizedRedirect />;
  }

  if (!user) return null;

  return (
    <DashboardLayout userRole="client" userId={user.id} clientId={user.clientId ?? undefined}>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mes documents</h1>
              <p className="text-gray-600">Ajoutez des pièces jointes et téléchargez vos documents</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setUploadOpen(true)} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                <Upload className="w-4 h-4" /> Ajouter une pièce jointe
              </button>
              <button onClick={refresh} className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg">
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            {files.length === 0 ? (
              <div className="text-center text-gray-500 py-8">Aucun document disponible pour le moment.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {files.map((f) => (
                  <li key={f.path} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{f.name}</div>
                      <div className="text-xs text-gray-500">{f.size ? `${(f.size/1024).toFixed(1)} Ko` : ''} {f.createdAt ? `• ${new Date(f.createdAt).toLocaleString('fr-FR')}` : ''}</div>
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

      {uploadOpen && user.clientId && (
        <UploadJustificatifModal
          isOpen={uploadOpen}
          onClose={() => setUploadOpen(false)}
          clientId={user.clientId}
          entryId={entryId}
          onUploaded={() => refresh()}
        />
      )}
    </DashboardLayout>
  );
};

export default ClientDocuments;