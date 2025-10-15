'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { AppUser, UserRole } from '@/types/auth';
import { normalizeUserRole } from '@/utils/role';
import { logger } from '@/utils/logger';

// Cache des profils utilisateur pour éviter les requêtes répétées
const profileCache = new Map<string, { profile: AppUser; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Récupère le profil utilisateur avec mise en cache optimisée
 */
async function fetchUserProfileOptimized(userId: string): Promise<AppUser | null> {
  try {
    // Vérifier le cache d'abord
    const cached = profileCache.get(userId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.profile;
    }

    const { data: { user } } = await supabaseBrowser.auth.getUser();
    if (!user) return null;

    // Requête optimisée avec les données essentielles seulement
    const { data: profile } = await supabaseBrowser
      .from('profiles')
      .select('role, full_name, admin_id, client_id, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    const mergedMetadata = {
      ...(user.app_metadata || {}),
      ...(user.user_metadata || {}),
    } as Record<string, unknown>;

    const userProfile: AppUser = profile ? {
      id: user.id,
      email: user.email || '',
      name: profile.full_name || user.email?.split('@')[0] || 'Utilisateur',
      role: normalizeUserRole(profile.role),
      adminId: profile.admin_id,
      clientId: profile.client_id,
      avatar: profile.avatar_url,
      metadata: mergedMetadata,
    } : {
      id: user.id,
      email: user.email || '',
      name: (mergedMetadata.full_name as string | undefined)
        || (mergedMetadata.name as string | undefined)
        || user.email?.split('@')[0]
        || 'Utilisateur',
      role: normalizeUserRole(mergedMetadata.role),
      adminId: mergedMetadata.admin_id as string | undefined,
      clientId: mergedMetadata.client_id as string | undefined,
      avatar: (mergedMetadata.avatar_url as string | undefined)
        || (mergedMetadata.avatar as string | undefined),
      metadata: mergedMetadata,
    };

    // Mettre en cache le résultat
    profileCache.set(userId, {
      profile: userProfile,
      timestamp: Date.now()
    });

    return userProfile;
  } catch (error) {
    logger.error('Error in fetchUserProfileOptimized', { userId }, error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

export const useOptimizedAuth = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Mémoriser les callbacks pour éviter les re-renders inutiles
  const updateUser = useCallback(async (userId: string | null) => {
    if (!userId) {
      setUser(null);
      return;
    }
    
    const profile = await fetchUserProfileOptimized(userId);
    setUser(profile);
  }, []);

  const clearCache = useCallback((userId?: string) => {
    if (userId) {
      profileCache.delete(userId);
    } else {
      profileCache.clear();
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const load = async () => {
      try {
        // Timeout pour éviter les chargements trop longs
        const authPromise = supabaseBrowser.auth.getUser();
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Auth timeout')), 5000);
        });

        const { data, error } = await Promise.race([
          authPromise,
          timeoutPromise
        ]) as any;

        if (timeoutId) clearTimeout(timeoutId);
        if (!isMounted) return;
        
        if (error) {
          if (error.message.includes('Refresh Token') || error.message.includes('Invalid')) {
            await supabaseBrowser.auth.signOut();
            clearCache();
            logger.warn('Invalid token detected, clearing session', { error: error.message });
          }
          setUser(null);
        } else if (data.user) {
          await updateUser(data.user.id);
        } else {
          setUser(null);
        }
      } catch (e) {
        if (isMounted) {
          logger.error('Auth check failed', {}, e instanceof Error ? e : new Error(String(e)));
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setAuthChecked(true);
        }
      }
    };

    load();

    // Écouter les changements d'authentification avec debounce
    let debounceTimeout: NodeJS.Timeout;
    const { data: subscription } = supabaseBrowser.auth.onAuthStateChange(async (event, session) => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
      
      debounceTimeout = setTimeout(async () => {
        if (event === 'TOKEN_REFRESHED' && !session) {
          logger.warn('Token refresh failed, clearing session');
          await supabaseBrowser.auth.signOut();
          clearCache();
          setUser(null);
          return;
        }

        if (session?.user) {
          await updateUser(session.user.id);
        } else {
          setUser(null);
          clearCache();
        }
      }, 100); // Debounce de 100ms
    });

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (debounceTimeout) clearTimeout(debounceTimeout);
      subscription.subscription.unsubscribe();
    };
  }, [isClient, updateUser, clearCache]);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      clearCache(user?.id);
      await supabaseBrowser.auth.signOut();
      
      try {
        await fetch('/api/auth/session', {
          method: 'DELETE',
          credentials: 'include',
        });
      } catch (sessionError) {
        logger.error('Erreur lors de la suppression de la session serveur', {}, sessionError instanceof Error ? sessionError : new Error(String(sessionError)));
      }
      
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin';
      }
    } catch (error) {
      logger.error('Logout failed', {}, error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  }, [user?.id, clearCache]);

  const refreshUser = useCallback(async () => {
    if (user?.id) {
      clearCache(user.id);
      await updateUser(user.id);
    }
  }, [user?.id, clearCache, updateUser]);

  // Mémoriser les valeurs de retour pour éviter les re-renders
  const returnValue = useMemo(() => ({
    user,
    loading: loading || !isClient,
    authChecked,
    logout,
    refreshUser,
    clearCache
  }), [user, loading, isClient, authChecked, logout, refreshUser, clearCache]);

  return returnValue;
};