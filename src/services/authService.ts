/**
 * Service d'authentification et de gestion des rôles utilisateurs
 * Gère les opérations CRUD sur les utilisateurs et les permissions
 */

import { supabaseServer } from '@/lib/supabase';
import { supabaseBrowser } from '@/lib/supabase/client';
import type {
  Profile,
  AppUser,
  CreateUserInput,
  UpdateUserInput,
  UpdateUserRoleInput,
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
  AdminUsersResponse,
  UserStats,
} from '@/types/auth';
import { normalizeUserRole } from '@/utils/role';
import { logger } from '@/utils/logger';

// ==============================================================================
// RÉCUPÉRATION DE PROFIL
// ==============================================================================

/**
 * Récupère le profil complet d'un utilisateur
 * @param userId - UUID de l'utilisateur
 * @param useServer - Utiliser le client serveur (true) ou navigateur (false)
 * @returns Le profil complet ou null si non trouvé
 */
export async function getUserProfile(
  userId: string,
  useServer = false
): Promise<AppUser | null> {
  try {
    const client = useServer ? supabaseServer() : supabaseBrowser;

    // Récupérer le profil depuis la table profiles
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      logger.error('Error fetching profile', { userId }, profileError ? new Error(profileError.message) : undefined);
      return null;
    }

    // Récupérer l'email depuis auth.users
    let authEmail = '';
  let authMetadata: Record<string, unknown> | undefined;

    if (useServer) {
      const { data, error } = await client.auth.admin.getUserById(userId);
      if (error || !data?.user) {
        logger.error('Error fetching auth user (admin)', { userId }, error ? new Error(error.message) : undefined);
        return null;
      }
      authEmail = data.user.email ?? '';
      authMetadata = {
        ...(data.user.app_metadata || {}),
        ...(data.user.user_metadata || {}),
      } as Record<string, unknown>;
    } else {
      const {
        data: { user },
        error: userError,
      } = await client.auth.getUser();

      if (userError || !user) {
        logger.error('Error fetching auth user', {}, userError ? new Error(userError.message) : undefined);
        return null;
      }
      authEmail = user.email ?? '';
      authMetadata = {
        ...(user.app_metadata || {}),
        ...(user.user_metadata || {}),
      } as Record<string, unknown>;
    }

    return {
      id: profile.id,
      email: authEmail,
      name: profile.full_name || authEmail.split('@')[0] || 'Utilisateur',
      role: normalizeUserRole(profile.role),
      adminId: profile.admin_id,
      clientId: profile.client_id,
      avatar: profile.avatar_url,
      metadata: profile.metadata || authMetadata || {},
    };
  } catch (error) {
    logger.error('Error in getUserProfile', { userId }, error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

/**
 * Récupère le profil de l'utilisateur actuellement connecté (côté client)
 * @returns Le profil complet ou null si non connecté
 */
export async function getCurrentUserProfile(): Promise<AppUser | null> {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user }, error: userError } = await supabaseBrowser.auth.getUser();
    
    if (userError || !user) {
      return null;
    }

    return getUserProfile(user.id, false);
  } catch (error) {
    logger.error('Error in getCurrentUserProfile', {}, error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

// ==============================================================================
// CRÉATION D'UTILISATEURS
// ==============================================================================

/**
 * Crée un nouvel utilisateur avec son profil
 * Réservé aux super admins et admins (selon le rôle créé)
 * @param input - Données de création de l'utilisateur
 * @param creatorId - UUID du créateur (pour vérification des permissions)
 * @returns L'utilisateur créé ou une erreur
 */
export async function createUser(
  input: CreateUserInput,
  creatorId: string
): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  try {
    const client = supabaseServer();

    // Vérifier les permissions du créateur
    const creator = await getUserProfile(creatorId, true);
    if (!creator) {
      return { success: false, error: 'Créateur non trouvé' };
    }

    // Vérifier que le créateur a le droit de créer ce type d'utilisateur
    if (creator.role === 'admin' && input.role === 'admin') {
      return { 
        success: false, 
        error: 'Seul un super admin peut créer un autre admin' 
      };
    }

    if (creator.role === 'admin' && input.role === 'superadmin') {
      return { 
        success: false, 
        error: 'Seul un super admin peut créer un super admin' 
      };
    }

    // Vérifier que admin_id est fourni pour collaborateur et client
    if (['collaborateur', 'client'].includes(input.role) && !input.admin_id) {
      return { 
        success: false, 
        error: 'admin_id est requis pour les collaborateurs et clients' 
      };
    }

    // Si c'est un admin qui crée, forcer admin_id à son propre ID
    let finalAdminId = input.admin_id;
    if (creator.role === 'admin' && ['collaborateur', 'client'].includes(input.role)) {
      finalAdminId = creatorId;
    }

    // Créer l'utilisateur dans auth.users
    const { data: authData, error: authError } = await client.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
  role: normalizeUserRole(input.role),
        full_name: input.full_name,
        admin_id: finalAdminId,
        client_id: input.client_id,
        ...input.metadata,
      },
    });

    if (authError || !authData.user) {
      return { 
        success: false, 
        error: authError?.message || 'Erreur lors de la création de l\'utilisateur' 
      };
    }

    // Le trigger handle_new_user() créera automatiquement le profil
    // Attendre un peu pour que le trigger s'exécute
    await new Promise(resolve => setTimeout(resolve, 100));

    // Récupérer le profil créé
    const newUser = await getUserProfile(authData.user.id, true);
    
    if (!newUser) {
      return { 
        success: false, 
        error: 'Utilisateur créé mais profil non trouvé' 
      };
    }

    return { success: true, user: newUser };
  } catch (error) {
    logger.error('Error in createUser', { creatorId }, error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

// ==============================================================================
// MISE À JOUR D'UTILISATEURS
// ==============================================================================

/**
 * Met à jour le profil d'un utilisateur
 * @param userId - UUID de l'utilisateur à mettre à jour
 * @param input - Données de mise à jour
 * @returns Succès ou erreur
 */
export async function updateUserProfile(
  userId: string,
  input: UpdateUserInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = supabaseBrowser;

    const { error } = await client
      .from('profiles')
      .update({
        full_name: input.full_name,
        avatar_url: input.avatar_url,
        metadata: input.metadata,
      })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    logger.error('Error in updateUserProfile', { userId }, error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Met à jour le rôle d'un utilisateur (réservé aux super admins)
 * @param userId - UUID de l'utilisateur à mettre à jour
 * @param input - Nouveau rôle et admin_id
 * @param updaterId - UUID de l'utilisateur qui effectue la mise à jour
 * @returns Succès ou erreur
 */
export async function updateUserRole(
  userId: string,
  input: UpdateUserRoleInput,
  updaterId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = supabaseServer();

    // Vérifier que l'updater est un super admin
    const updater = await getUserProfile(updaterId, true);
    if (!updater || updater.role !== 'superadmin') {
      return { 
        success: false, 
        error: 'Seul un super admin peut modifier les rôles' 
      };
    }

    const { error } = await client
      .from('profiles')
      .update({
        role: input.role,
        admin_id: input.admin_id,
      })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    logger.error('Error in updateUserRole', { userId, updaterId }, error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

// ==============================================================================
// SUPPRESSION D'UTILISATEURS
// ==============================================================================

/**
 * Supprime un utilisateur et son profil
 * @param userId - UUID de l'utilisateur à supprimer
 * @param deleterId - UUID de l'utilisateur qui effectue la suppression
 * @returns Succès ou erreur
 */
export async function deleteUser(
  userId: string,
  deleterId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = supabaseServer();

    // Vérifier les permissions du deleter
    const deleter = await getUserProfile(deleterId, true);
    if (!deleter) {
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    // Récupérer l'utilisateur à supprimer
    const userToDelete = await getUserProfile(userId, true);
    if (!userToDelete) {
      return { success: false, error: 'Utilisateur à supprimer non trouvé' };
    }

    // Vérifier les permissions
    if (deleter.role === 'admin' && userToDelete.adminId !== deleterId) {
      return { 
        success: false, 
        error: 'Vous ne pouvez supprimer que vos propres utilisateurs' 
      };
    }

    // Supprimer l'utilisateur depuis auth (cascade sur profiles)
    const { error } = await client.auth.admin.deleteUser(userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    logger.error('Error in deleteUser', { userId, deleterId }, error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

// ==============================================================================
// RÉCUPÉRATION DE LISTES D'UTILISATEURS
// ==============================================================================

/**
 * Récupère tous les utilisateurs d'un admin
 * @param adminId - UUID de l'admin
 * @returns Liste des utilisateurs
 */
export async function getAdminUsers(
  adminId: string
): Promise<AdminUsersResponse[]> {
  try {
    const client = supabaseServer();

    const { data, error } = await client
      .rpc('get_admin_users', { admin_user_id: adminId });

    if (error) {
      logger.error('Error fetching admin users', { adminId }, new Error(error.message));
      return [];
    }

    if (!data) {
      return [];
    }

    // Transform the database result to match AdminUsersResponse interface
    return data.map((user: any) => ({
      id: user.id,
      role: user.role as UserRole,
      full_name: user.full_name || '',
      email: user.email || '',
      created_at: user.created_at,
      admin_id: adminId, // The admin_id is the adminId parameter
      lastLogin: null, // Not available from current function
      prenom: '', // Not available from current function
      telephone: null, // Not available from current function
    } as AdminUsersResponse));
  } catch (error) {
    logger.error('Error in getAdminUsers', { adminId }, error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

export async function getPlatformAdmins(): Promise<AdminUsersResponse[]> {
  try {
    const client = supabaseServer();
    const { data, error } = await client
      .from('profiles')
      .select('id, role, full_name, created_at, admin_id')
      .eq('role', 'admin')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching platform admins', {}, new Error(error.message));
      return [];
    }

    if (!data) {
      return [];
    }

    const adminsPromises = data.map(async (row) => {
      const { data: authData, error: authError } = await client.auth.admin.getUserById(row.id);
      if (authError || !authData?.user) {
        logger.error('Error fetching admin auth user', { userId: row.id }, authError ? new Error(authError.message) : undefined);
      return {
        id: row.id,
        role: row.role as UserRole,
        full_name: row.full_name ?? 'Admin',
        email: 'inconnu',
        created_at: row.created_at,
        admin_id: null,
        lastLogin: null,
        prenom: '',
        telephone: null,
      } as AdminUsersResponse;
      }

      return {
        id: row.id,
        role: row.role as UserRole,
        full_name: row.full_name ?? authData.user.email ?? 'Admin',
        email: authData.user.email ?? 'inconnu',
        created_at: row.created_at,
        admin_id: row.admin_id ?? null,
        lastLogin: null,
        prenom: '',
        telephone: null,
      } as AdminUsersResponse;
    });

    const admins = await Promise.all(adminsPromises);
    return admins;
  } catch (error) {
    logger.error('Error in getPlatformAdmins', {}, error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

/**
 * Récupère les statistiques des utilisateurs d'un admin
 * @param adminId - UUID de l'admin
 * @returns Statistiques
 */
export async function getUserStats(adminId: string): Promise<UserStats> {
  try {
    const client = supabaseServer();

    const { data, error } = await client
      .from('profiles')
      .select('role')
      .eq('admin_id', adminId);

    if (error) {
      logger.error('Error fetching user stats', { adminId }, new Error(error.message));
      return { total: 0, collaborateurs: 0, clients: 0, admins: 0 };
    }

    const stats = {
      total: data.length,
      collaborateurs: data.filter(u => u.role === 'collaborateur').length,
      clients: data.filter(u => u.role === 'client').length,
      admins: 0,
    };

    return stats;
  } catch (error) {
    logger.error('Error in getUserStats', { adminId }, error instanceof Error ? error : new Error(String(error)));
    return { total: 0, collaborateurs: 0, clients: 0, admins: 0 };
  }
}

export async function getPlatformAdminStats(): Promise<UserStats> {
  try {
    const client = supabaseServer();
    const { data, error } = await client
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (error) {
      logger.error('Error fetching platform admin stats', {}, new Error(error.message));
      return { total: 0, collaborateurs: 0, clients: 0, admins: 0 };
    }

    const total = data?.length ?? 0;
    return {
      total,
      collaborateurs: 0,
      clients: 0,
      admins: total,
    };
  } catch (error) {
    logger.error('Error in getPlatformAdminStats', {}, error instanceof Error ? error : new Error(String(error)));
    return { total: 0, collaborateurs: 0, clients: 0, admins: 0 };
  }
}

// ==============================================================================
// GESTION DES PERMISSIONS
// ==============================================================================

/**
 * Vérifie si un utilisateur a une permission spécifique
 * @param userId - UUID de l'utilisateur
 * @param permission - Permission à vérifier
 * @returns true si l'utilisateur a la permission
 */
export async function hasPermission(
  userId: string,
  permission: Permission
): Promise<boolean> {
  try {
    const user = await getUserProfile(userId, false);
    if (!user) return false;

    const { ROLE_PERMISSIONS } = await import('@/types/auth');
    const rolePermissions = ROLE_PERMISSIONS[user.role];
    
    return rolePermissions.includes(permission);
  } catch (error) {
    logger.error('Error in hasPermission', { userId }, error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/**
 * Récupère toutes les permissions d'un utilisateur
 * @param userId - UUID de l'utilisateur
 * @returns Liste des permissions
 */
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  try {
    const user = await getUserProfile(userId, false);
    if (!user) return [];

    const { ROLE_PERMISSIONS } = await import('@/types/auth');
    return ROLE_PERMISSIONS[user.role] || [];
  } catch (error) {
    logger.error('Error in getUserPermissions', { userId }, error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

/**
 * Vérifie si un utilisateur peut gérer un autre utilisateur
 * @param managerId - UUID du gestionnaire
 * @param targetId - UUID de l'utilisateur cible
 * @returns true si le gestionnaire peut gérer la cible
 */
export async function canManageUser(
  managerId: string,
  targetId: string
): Promise<boolean> {
  try {
    const manager = await getUserProfile(managerId, false);
    const target = await getUserProfile(targetId, false);

    if (!manager || !target) return false;

    // Super admin peut tout gérer
    if (manager.role === 'superadmin') return true;

    // Admin peut gérer ses propres collaborateurs et clients
    if (manager.role === 'admin' && target.adminId === managerId) return true;

    return false;
  } catch (error) {
    logger.error('Error in canManageUser', { managerId, targetId }, error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}
