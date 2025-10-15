/**
 * Hook pour gérer les permissions et restrictions d'accès
 * Basé sur le système de rôles utilisateurs
 */

'use client';

import { useAuth } from './useAuth';
import { useMemo } from 'react';
import type { Permission, UserRole } from '@/types/auth';
import { ROLE_PERMISSIONS } from '@/types/auth';

// ==============================================================================
// HOOK PRINCIPAL - usePermissions
// ==============================================================================

/**
 * Hook pour vérifier les permissions de l'utilisateur connecté
 * @returns Fonctions et état des permissions
 */
export function usePermissions() {
  const { user, loading } = useAuth();

  // Calculer les permissions de l'utilisateur
  const permissions = useMemo<Permission[]>(() => {
    if (!user) return [];
    return ROLE_PERMISSIONS[user.role] || [];
  }, [user]);

  /**
   * Vérifie si l'utilisateur a une permission spécifique
   * @param permission - La permission à vérifier
   * @returns true si l'utilisateur a la permission
   */
  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  /**
   * Vérifie si l'utilisateur a toutes les permissions spécifiées
   * @param requiredPermissions - Liste des permissions requises
   * @returns true si l'utilisateur a toutes les permissions
   */
  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.every(perm => permissions.includes(perm));
  };

  /**
   * Vérifie si l'utilisateur a au moins une des permissions spécifiées
   * @param requiredPermissions - Liste des permissions requises
   * @returns true si l'utilisateur a au moins une permission
   */
  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.some(perm => permissions.includes(perm));
  };

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   * @param role - Le rôle à vérifier
   * @returns true si l'utilisateur a le rôle
   */
  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  /**
   * Vérifie si l'utilisateur a l'un des rôles spécifiés
   * @param roles - Liste des rôles à vérifier
   * @returns true si l'utilisateur a l'un des rôles
   */
  const hasAnyRole = (roles: UserRole[]): boolean => {
    return !!user && roles.includes(user.role);
  };

  /**
   * Vérifie si l'utilisateur est un super admin
   */
  const isSuperAdmin = useMemo(() => user?.role === 'superadmin', [user]);

  /**
   * Vérifie si l'utilisateur est un admin (ou super admin)
   */
  const isAdmin = useMemo(
    () => user?.role === 'admin' || user?.role === 'superadmin',
    [user]
  );

  /**
   * Vérifie si l'utilisateur est un collaborateur
   */
  const isCollaborateur = useMemo(() => user?.role === 'collaborateur', [user]);

  /**
   * Vérifie si l'utilisateur est un client
   */
  const isClient = useMemo(() => user?.role === 'client', [user]);

  /**
   * Vérifie si l'utilisateur peut créer des utilisateurs
   */
  const canCreateUsers = useMemo(
    () => hasPermission('users:create') || hasPermission('collaborateurs:create') || hasPermission('clients:create'),
    [permissions]
  );

  /**
   * Vérifie si l'utilisateur peut voir les rapports
   */
  const canViewReports = useMemo(
    () => hasPermission('reports:view'),
    [permissions]
  );

  /**
   * Vérifie si l'utilisateur peut exporter des rapports
   */
  const canExportReports = useMemo(
    () => hasPermission('reports:export'),
    [permissions]
  );

  /**
   * Vérifie si l'utilisateur peut gérer les paramètres
   */
  const canManageSettings = useMemo(
    () => hasPermission('settings:update'),
    [permissions]
  );

  return {
    // État
    user,
    loading,
    permissions,
    
    // Fonctions de vérification de permissions
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    
    // Fonctions de vérification de rôles
    hasRole,
    hasAnyRole,
    
    // Flags de rôles
    isSuperAdmin,
    isAdmin,
    isCollaborateur,
    isClient,
    
    // Flags de permissions courantes
    canCreateUsers,
    canViewReports,
    canExportReports,
    canManageSettings,
  };
}

// ==============================================================================
// HOOK - useCanManageUser
// ==============================================================================

/**
 * Hook pour vérifier si l'utilisateur connecté peut gérer un autre utilisateur
 * @param targetUserId - ID de l'utilisateur cible
 * @param targetAdminId - ID de l'admin de l'utilisateur cible (optionnel)
 * @returns true si l'utilisateur peut gérer la cible
 */
export function useCanManageUser(targetUserId?: string, targetAdminId?: string | null): boolean {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user || !targetUserId) return false;

    // Super admin peut tout gérer
    if (user.role === 'superadmin') return true;

    // On ne peut pas se gérer soi-même (sauf pour le profil)
    if (user.id === targetUserId) return false;

    // Admin peut gérer ses propres utilisateurs
    if (user.role === 'admin' && targetAdminId === user.id) return true;

    return false;
  }, [user, targetUserId, targetAdminId]);
}

// ==============================================================================
// HOOK - useIsOwnResource
// ==============================================================================

/**
 * Hook pour vérifier si une ressource appartient à l'utilisateur connecté
 * @param resourceOwnerId - ID du propriétaire de la ressource
 * @returns true si la ressource appartient à l'utilisateur
 */
export function useIsOwnResource(resourceOwnerId?: string | null): boolean {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user || !resourceOwnerId) return false;
    return user.id === resourceOwnerId;
  }, [user, resourceOwnerId]);
}

// ==============================================================================
// HOOK - useResourceAccess
// ==============================================================================

/**
 * Hook pour vérifier l'accès à une ressource selon le rôle et la propriété
 * @param resourceOwnerId - ID du propriétaire de la ressource
 * @param resourceAdminId - ID de l'admin de la ressource
 * @returns Objet avec les droits d'accès
 */
export function useResourceAccess(
  resourceOwnerId?: string | null,
  resourceAdminId?: string | null
) {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) {
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        isOwner: false,
      };
    }

    const isOwner = resourceOwnerId === user.id;
    const isSuperAdmin = user.role === 'superadmin';
    const isResourceAdmin = user.role === 'admin' && resourceAdminId === user.id;

    return {
      // Peut voir la ressource
      canView: isSuperAdmin || isOwner || isResourceAdmin,
      
      // Peut modifier la ressource
      canEdit: isSuperAdmin || isOwner || isResourceAdmin,
      
      // Peut supprimer la ressource
      canDelete: isSuperAdmin || isResourceAdmin,
      
      // Est le propriétaire
      isOwner,
    };
  }, [user, resourceOwnerId, resourceAdminId]);
}

// ==============================================================================
// HOOK - useClientAccess
// ==============================================================================

/**
 * Hook pour vérifier l'accès aux données d'un client
 * @param clientId - ID du client
 * @param clientAdminId - ID de l'admin du client
 * @returns Objet avec les droits d'accès au client
 */
export function useClientAccess(clientId?: string, clientAdminId?: string | null) {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user || !clientId) {
      return {
        canView: false,
        canEdit: false,
        canViewDocuments: false,
        canUploadDocuments: false,
      };
    }

    const isSuperAdmin = user.role === 'superadmin';
    const isClientAdmin = user.role === 'admin' && user.id === clientAdminId;
    const isClientCollaborateur = 
      user.role === 'collaborateur' && user.adminId === clientAdminId;
    const isClientOwner = user.role === 'client' && user.clientId === clientId;

    return {
      // Peut voir les informations du client
      canView: isSuperAdmin || isClientAdmin || isClientCollaborateur || isClientOwner,
      
      // Peut modifier les informations du client
      canEdit: isSuperAdmin || isClientAdmin,
      
      // Peut voir les documents du client
      canViewDocuments: 
        isSuperAdmin || isClientAdmin || isClientCollaborateur || isClientOwner,
      
      // Peut uploader des documents pour le client
      canUploadDocuments: 
        isSuperAdmin || isClientAdmin || isClientCollaborateur || isClientOwner,
    };
  }, [user, clientId, clientAdminId]);
}
