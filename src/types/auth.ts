/**
 * Types pour l'authentification et la gestion des rôles utilisateurs
 */

// ==============================================================================
// TYPES DE RÔLES
// ==============================================================================

/**
 * Rôles disponibles dans le système
 * - superadmin: Accès complet à l'application, gère les admins
 * - admin: Gère ses propres collaborateurs et clients
 * - collaborateur: Travaille sur les dossiers clients de son admin
 * - client: Accède uniquement à ses propres données
 */
export type UserRole = 'superadmin' | 'admin' | 'collaborateur' | 'client';

// ==============================================================================
// INTERFACE PROFILE
// ==============================================================================

/**
 * Profil utilisateur étendu (table public.profiles)
 */
export interface Profile {
  /** UUID de l'utilisateur (correspond à auth.users.id) */
  id: string;
  
  /** Rôle de l'utilisateur */
  role: UserRole;
  
  /** UUID de l'admin parent (null pour superadmin et admin) */
  admin_id: string | null;
  
  /** Nom complet de l'utilisateur */
  full_name: string | null;
  
  /** Référence optionnelle vers un client (pour les utilisateurs de type 'client') */
  client_id: string | null;
  
  /** URL de l'avatar/photo de profil */
  avatar_url: string | null;
  
  /** Métadonnées additionnelles */
  metadata: Record<string, any>;
  
  /** Date de création */
  created_at: string;
  
  /** Date de dernière mise à jour */
  updated_at: string;
}

// ==============================================================================
// INTERFACE USER COMPLET
// ==============================================================================

/**
 * Utilisateur complet avec les données auth et profile
 */
export interface AppUser {
  /** UUID de l'utilisateur */
  id: string;
  
  /** Email de l'utilisateur */
  email: string;
  
  /** Nom complet */
  name: string;
  
  /** Rôle */
  role: UserRole;
  
  /** UUID de l'admin parent */
  adminId?: string | null;
  
  /** ID du client associé (pour les utilisateurs de type 'client') */
  clientId?: string | null;
  
  /** URL de l'avatar */
  avatar?: string | null;
  
  /** Métadonnées additionnelles */
  metadata?: Record<string, any>;
}

// ==============================================================================
// TYPES POUR LA CRÉATION D'UTILISATEURS
// ==============================================================================

/**
 * Données pour créer un nouvel utilisateur
 */
export interface CreateUserInput {
  /** Email de l'utilisateur */
  email: string;
  
  /** Mot de passe */
  password: string;
  
  /** Nom complet */
  full_name: string;
  
  /** Rôle */
  role: UserRole;
  
  /** UUID de l'admin parent (obligatoire pour collaborateur et client) */
  admin_id?: string;
  
  /** ID du client associé (pour les utilisateurs de type 'client') */
  client_id?: string;
  
  /** Métadonnées additionnelles */
  metadata?: Record<string, any>;
}

/**
 * Données pour mettre à jour un utilisateur
 */
export interface UpdateUserInput {
  /** Nom complet */
  full_name?: string;
  
  /** URL de l'avatar */
  avatar_url?: string;
  
  /** Métadonnées additionnelles */
  metadata?: Record<string, any>;
}

/**
 * Données pour mettre à jour le rôle d'un utilisateur (réservé aux super admins)
 */
export interface UpdateUserRoleInput {
  /** Nouveau rôle */
  role: UserRole;
  
  /** Nouvel admin parent (si applicable) */
  admin_id?: string | null;
}

// ==============================================================================
// TYPES POUR LES PERMISSIONS
// ==============================================================================

/**
 * Actions possibles dans le système
 */
export type Permission =
  | 'users:create'
  | 'users:read'
  | 'users:update'
  | 'users:delete'
  | 'admins:create'
  | 'admins:read'
  | 'admins:update'
  | 'admins:delete'
  | 'collaborateurs:create'
  | 'collaborateurs:read'
  | 'collaborateurs:update'
  | 'collaborateurs:delete'
  | 'clients:create'
  | 'clients:read'
  | 'clients:update'
  | 'clients:delete'
  | 'justificatifs:create'
  | 'justificatifs:read'
  | 'justificatifs:update'
  | 'justificatifs:delete'
  | 'reports:view'
  | 'reports:export'
  | 'settings:view'
  | 'settings:update';

/**
 * Matrice des permissions par rôle
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  superadmin: [
    // Accès complet à tout
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'admins:create',
    'admins:read',
    'admins:update',
    'admins:delete',
    'collaborateurs:create',
    'collaborateurs:read',
    'collaborateurs:update',
    'collaborateurs:delete',
    'clients:create',
    'clients:read',
    'clients:update',
    'clients:delete',
    'justificatifs:create',
    'justificatifs:read',
    'justificatifs:update',
    'justificatifs:delete',
    'reports:view',
    'reports:export',
    'settings:view',
    'settings:update',
  ],
  admin: [
    // Gestion de ses collaborateurs et clients
    'collaborateurs:create',
    'collaborateurs:read',
    'collaborateurs:update',
    'collaborateurs:delete',
    'clients:create',
    'clients:read',
    'clients:update',
    'clients:delete',
    'justificatifs:create',
    'justificatifs:read',
    'justificatifs:update',
    'justificatifs:delete',
    'reports:view',
    'reports:export',
    'settings:view',
  ],
  collaborateur: [
    // Travail sur les dossiers clients
    'clients:read',
    'justificatifs:create',
    'justificatifs:read',
    'justificatifs:update',
    'reports:view',
  ],
  client: [
    // Accès limité à ses propres données
    'justificatifs:read',
    'justificatifs:create',
  ],
};

// ==============================================================================
// TYPES POUR LES RÉPONSES API
// ==============================================================================

/**
 * Réponse lors de la récupération des utilisateurs d'un admin
 */
export interface AdminUsersResponse {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  created_at: string;
  admin_id?: string | null;
  lastLogin?: string | null;
  prenom?: string;
  telephone?: string | null;
}

/**
 * Statistiques des utilisateurs pour un admin
 */
export interface UserStats {
  total: number;
  collaborateurs: number;
  clients: number;
  admins?: number;
}
