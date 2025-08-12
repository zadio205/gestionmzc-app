import React, { useState } from 'react';
import { Upload, X, CheckCircle, Loader2 } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContextSimple';
import { useAuth } from '@/hooks/useAuth';

interface UploadJustificatifModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  entryId: string;
  onUploaded: (doc: any) => void;
}

const UploadJustificatifModal: React.FC<UploadJustificatifModalProps> = ({ isOpen, onClose, clientId, entryId, onUploaded }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!file) {
      showNotification({ type: 'warning', title: 'Aucun fichier', message: 'Sélectionnez un fichier à envoyer.' });
      return;
    }
    if (!user) {
      showNotification({ type: 'error', title: 'Non authentifié', message: 'Veuillez vous reconnecter.' });
      return;
    }

    const form = new FormData();
    form.append('file', file);
    form.append('clientId', clientId);
    form.append('entryId', entryId);

    try {
      setLoading(true);
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'x-user-id': user._id,
        },
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Erreur upload' }));
        throw new Error(data.error || 'Erreur upload');
      }
      const data = await res.json();
      onUploaded(data.document);
      const url: string | undefined = data?.document?.url;
      if (url) {
        // Essayer d'ouvrir dans un nouvel onglet (après action utilisateur)
        try { window.open(url, '_blank', 'noopener,noreferrer'); } catch {}
        // Copier le lien en repli
        try { await navigator.clipboard?.writeText(url); } catch {}
        showNotification({ type: 'success', title: 'Justificatif ajouté', message: `${file.name} envoyé. Lien ouvert/copié.` });
      } else {
        showNotification({ type: 'success', title: 'Justificatif ajouté', message: `${file.name} envoyé.` });
      }
      onClose();
    } catch (e: any) {
      showNotification({ type: 'error', title: 'Échec upload', message: e.message || 'Erreur inconnue' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Upload className="w-5 h-5" /> Ajouter un justificatif
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="space-y-3">
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-900 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          {file && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 text-green-600" />
              {file.name} — {(file.size / 1024).toFixed(1)} Ko
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50">Annuler</button>
          <button
            onClick={handleUpload}
            disabled={loading}
            className="px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Envoyer
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadJustificatifModal;
