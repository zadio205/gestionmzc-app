export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'collaborateur' | 'client';
  clientId?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  _id: string;
  name: string;
  email: string;
  contact?: string;
  phone?: string;
  address?: string;
  siret?: string;
  industry?: string;
  dossierNumber?: string;
  collaboratorId: string;
  documents: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  _id: string;
  name: string;
  originalName: string;
  type: string;
  size: number;
  path: string;
  url?: string;
  provider?: 'supabase' | 'local';
  bucket?: string;
  storageKey?: string;
  clientId: string;
  uploadedBy: string;
  mimeType: string;
  tags?: string[];
  category?: 'comptable' | 'juridique' | 'social' | 'autre';
  status: 'pending' | 'approved' | 'rejected' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  _id: string;
  content: string;
  senderId: string;
  receiverId: string;
  type: 'internal' | 'client';
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  assignedTo: string;
  assignedBy: string;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface News {
  _id: string;
  title: string;
  content: string;
  author: string;
  status: 'draft' | 'published';
  targetAudience: 'all' | 'admin' | 'collaborateur' | 'client';
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Simulation {
  _id: string;
  clientId: string;
  type: 'social_charges' | 'cotisations';
  parameters: Record<string, unknown>;
  results: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
}

// Export accounting types
export * from './accounting';

// Export justificatif types
export * from './justificatif';