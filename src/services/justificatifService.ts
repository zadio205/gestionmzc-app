import { Justificatif, JustificatifUploadParams, JustificatifFilters } from '@/types/justificatif';
import { logger } from '@/utils/logger';

/**
 * Service de gestion des justificatifs
 * Gère l'upload dans Supabase Storage et les métadonnées dans la GED
 */
export class JustificatifService {
  /**
   * Détermine automatiquement la catégorie selon le montant
   * @param montant - Montant de l'écriture (positif = crédit, négatif = débit)
   * @returns 'achats' si débit, 'ventes' si crédit
   */
  static determineCategory(montant: number): 'achats' | 'ventes' {
    // Si montant au débit (négatif) → achats
    // Si montant au crédit (positif) → ventes
    return montant < 0 ? 'achats' : 'ventes';
  }

  /**
   * Génère le chemin de stockage dans Supabase
   * @param clientId - ID du client
   * @param category - Catégorie (achats/ventes)
   * @param fileName - Nom du fichier
   * @returns Chemin complet dans le bucket
   */
  static getStoragePath(clientId: string, category: 'achats' | 'ventes', fileName: string): string {
    return `justificatifs/clients/${clientId}/${category}/${fileName}`;
  }

  /**
   * Upload un justificatif avec classement automatique
   * @param params - Paramètres d'upload
   * @returns Métadonnées du justificatif créé
   */
  static async uploadJustificatif(params: JustificatifUploadParams): Promise<Justificatif> {
    const {
      file,
      clientId,
      clientName,
      entryId,
      montant,
      reference,
      description,
      dateEcriture,
      uploadedBy,
      uploadedByName,
    } = params;

    // 1. Déterminer la catégorie automatiquement
    const category = this.determineCategory(montant);

    // 2. Générer le nom de fichier unique
    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    
    // 3. Créer le chemin de stockage
    const folder = `justificatifs/clients/${clientId}/${category}`;
    
    // 4. Upload vers Supabase Storage
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clientId', clientId);
    formData.append('entryId', entryId);
    formData.append('folder', folder);
    formData.append('category', category);
    formData.append('montant', montant.toString());

    const uploadResponse = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'x-user-id': uploadedBy,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new Error(error.error || 'Erreur lors de l\'upload du fichier');
    }

    const uploadData = await uploadResponse.json();

    // 5. Créer les métadonnées du justificatif pour la GED
    const justificatif: Omit<Justificatif, '_id'> = {
      name: file.name,
      originalName: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      path: uploadData.path,
      url: uploadData.url,
      clientId,
      clientName,
      entryId,
      category,
      montant,
      reference,
      description,
      dateEcriture,
      provider: 'supabase',
      bucket: process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'uploads',
      storageKey: uploadData.path,
      uploadedBy,
      uploadedByName,
      status: 'pending',
      mimeType: file.type || 'application/octet-stream',
      tags: [category, clientId],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 6. Enregistrer les métadonnées dans la GED
    const gedResponse = await fetch('/api/justificatifs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': uploadedBy,
      },
      body: JSON.stringify(justificatif),
    });

    if (!gedResponse.ok) {
      let gedErrorDetail: string | undefined;
      try {
        gedErrorDetail = await gedResponse.text();
      } catch {}
      logger.error("Erreur lors de l'enregistrement dans la GED", {
        status: gedResponse.status,
        statusText: gedResponse.statusText,
        clientId,
        entryId,
        category,
        montant,
        reference,
        uploadedBy,
        detail: gedErrorDetail,
      });
      throw new Error("Erreur lors de l'enregistrement dans la GED");
    }

    const savedJustificatif = await gedResponse.json();
    return savedJustificatif;
  }

  /**
   * Récupère les justificatifs selon des filtres
   * @param filters - Filtres de recherche
   * @returns Liste des justificatifs
   */
  static async getJustificatifs(filters: JustificatifFilters): Promise<Justificatif[]> {
    const queryParams = new URLSearchParams();
    
    if (filters.clientId) queryParams.append('clientId', filters.clientId);
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom.toISOString());
    if (filters.dateTo) queryParams.append('dateTo', filters.dateTo.toISOString());

    const response = await fetch(`/api/justificatifs?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des justificatifs');
    }

    return response.json();
  }

  /**
   * Récupère les justificatifs d'un client classés par catégorie
   * @param clientId - ID du client
   * @returns Justificatifs groupés par catégorie
   */
  static async getJustificatifsByClient(clientId: string): Promise<{
    achats: Justificatif[];
    ventes: Justificatif[];
  }> {
    const justificatifs = await this.getJustificatifs({ clientId });
    
    return {
      achats: justificatifs.filter(j => j.category === 'achats'),
      ventes: justificatifs.filter(j => j.category === 'ventes'),
    };
  }

  /**
   * Supprime un justificatif (fichier + métadonnées)
   * @param justificatifId - ID du justificatif
   * @returns true si succès
   */
  static async deleteJustificatif(justificatifId: string): Promise<boolean> {
    const response = await fetch(`/api/justificatifs/${justificatifId}`, {
      method: 'DELETE',
    });

    return response.ok;
  }

  /**
   * Met à jour le statut d'un justificatif
   * @param justificatifId - ID du justificatif
   * @param status - Nouveau statut
   * @returns Justificatif mis à jour
   */
  static async updateStatus(
    justificatifId: string,
    status: 'pending' | 'approved' | 'rejected' | 'archived'
  ): Promise<Justificatif> {
    const response = await fetch(`/api/justificatifs/${justificatifId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la mise à jour du statut');
    }

    return response.json();
  }

  /**
   * Formate la taille du fichier
   * @param bytes - Taille en octets
   * @returns Taille formatée
   */
  static formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  /**
   * Vérifie si le type de fichier est accepté
   * @param file - Fichier à vérifier
   * @returns true si accepté
   */
  static isValidFileType(file: File): boolean {
    const acceptedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    return acceptedTypes.includes(file.type);
  }

  /**
   * Vérifie si la taille du fichier est acceptable (max 10 Mo)
   * @param file - Fichier à vérifier
   * @returns true si acceptable
   */
  static isValidFileSize(file: File): boolean {
    const maxSize = 10 * 1024 * 1024; // 10 Mo
    return file.size <= maxSize;
  }
}
