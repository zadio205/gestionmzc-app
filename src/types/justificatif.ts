/**
 * Types pour la gestion des justificatifs
 */

export interface Justificatif {
  _id: string;
  name: string;
  originalName: string;
  type: string;
  size: number;
  path: string;
  url?: string;
  
  // Informations de classement
  clientId: string;
  clientName?: string;
  entryId: string; // ID de l'écriture comptable associée
  category: 'achats' | 'ventes'; // Classement automatique selon le montant
  
  // Métadonnées comptables
  montant?: number;
  reference?: string;
  description?: string;
  dateEcriture?: Date;
  
  // Informations de stockage
  provider: 'supabase';
  bucket: string;
  storageKey: string;
  
  // Gestion
  uploadedBy: string;
  uploadedByName?: string;
  status: 'pending' | 'approved' | 'rejected' | 'archived';
  mimeType: string;
  tags?: string[];
  
  // Dates
  createdAt: Date;
  updatedAt: Date;
}

export interface JustificatifUploadParams {
  file: File;
  clientId: string;
  clientName?: string;
  entryId: string;
  montant: number; // Utilisé pour déterminer la catégorie
  reference?: string;
  description?: string;
  dateEcriture?: Date;
  uploadedBy: string;
  uploadedByName?: string;
}

export interface JustificatifFilters {
  clientId?: string;
  category?: 'achats' | 'ventes';
  status?: 'pending' | 'approved' | 'rejected' | 'archived';
  dateFrom?: Date;
  dateTo?: Date;
}
