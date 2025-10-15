import React, { useState } from 'react';
import { CheckCircle, Loader2, Upload, X } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContextSimple';
import { useAuth } from '@/hooks/useAuth';
import { JustificatifService } from '@/services/justificatifService';

interface UploadJustificatifModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName?: string;
  entryId: string;
  montant?: number; // Pour déterminer la catégorie automatiquement
  reference?: string;
  description?: string;
  dateEcriture?: Date;
  onUploaded: (doc: any) => void;
}

const UploadJustificatifModal: React.FC<UploadJustificatifModalProps> = ({ 
  isOpen, 
  onClose, 
  clientId, 
  clientName,
  entryId, 
  montant = 0,
  reference,
  description,
  dateEcriture,
  onUploaded 
}) => {
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

    // Validation du fichier
    if (!JustificatifService.isValidFileType(file)) {
      showNotification({ 
        type: 'error', 
        title: 'Type de fichier non supporté', 
        message: 'Formats acceptés: PDF, PNG, JPG, JPEG, WEBP, DOC, DOCX' 
      });
      return;
    }

    if (!JustificatifService.isValidFileSize(file)) {
      showNotification({ 
        type: 'error', 
        title: 'Fichier trop volumineux', 
        message: 'La taille maximale est de 10 Mo' 
      });
      return;
    }

    try {
      setLoading(true);
      
      // Utiliser le service de justificatifs pour gérer l'upload et l'enregistrement GED
      const justificatif = await JustificatifService.uploadJustificatif({
        file,
        clientId,
        clientName,
        entryId,
        montant,
        reference,
        description,
        dateEcriture,
        uploadedBy: user.id,
        uploadedByName: user.name,
      });

      // Déterminer la catégorie pour le message
      const category = JustificatifService.determineCategory(montant);
      const categoryLabel = category === 'achats' ? 'Achats' : 'Ventes';

      onUploaded(justificatif);
      
      if (justificatif.url) {
        // Essayer d'ouvrir dans un nouvel onglet
        try { window.open(justificatif.url, '_blank', 'noopener,noreferrer'); } catch {}
        showNotification({ 
          type: 'success', 
          title: 'Justificatif ajouté', 
          message: `${file.name} classé dans ${categoryLabel}. Enregistré dans la GED.` 
        });
      } else {
        showNotification({ 
          type: 'success', 
          title: 'Justificatif ajouté', 
          message: `${file.name} classé dans ${categoryLabel}.` 
        });
      }
      
      onClose();
    } catch (e: any) {
      showNotification({ 
        type: 'error', 
        title: 'Échec de l\'upload', 
        message: e.message || 'Erreur inconnue' 
      });
    } finally {
      setLoading(false);
    }
  };

  const category = JustificatifService.determineCategory(montant);
  const categoryLabel = category === 'achats' ? 'Achats' : 'Ventes';

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

        {/* Info sur le classement automatique */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">📁 Classement automatique:</span> {categoryLabel}
          </p>
          {reference && (
            <p className="text-xs text-blue-700 mt-1">Réf: {reference}</p>
          )}
        </div>

        <div className="space-y-3">
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-900 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          {file && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-600" />
                {file.name} — {JustificatifService.formatFileSize(file.size)}
              </div>
              {!JustificatifService.isValidFileType(file) && (
                <p className="text-xs text-red-600">
                  ⚠️ Type de fichier non supporté
                </p>
              )}
              {!JustificatifService.isValidFileSize(file) && (
                <p className="text-xs text-red-600">
                  ⚠️ Fichier trop volumineux (max 10 Mo)
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button 
            onClick={onClose} 
            className="px-3 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} 
            {loading ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadJustificatifModal;
