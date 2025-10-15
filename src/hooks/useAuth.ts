'use client';

import { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { AppUser, UserRole } from '@/types/auth';
import { normalizeUserRole } from '@/utils/role';
import { logger } from '@/utils/logger';
import AuthLoadingScreen from '@/components/ui/AuthLoadingScreen';

/**
 * Récupère le profil complet d'un utilisateur depuis la base de données
 */
async function fetchUserProfile(userId: string): Promise<AppUser | null> {
  try {
    const { data: { user } } = await supabaseBrowser.auth.getUser();

    if (!user) {
      return null;
    }

    const mergedMetadata = {
      ...(user.app_metadata || {}),
      ...(user.user_metadata || {}),
    } as Record<string, unknown>;

    const { data: profile } = await supabaseBrowser
      .from('profiles')
      .select('role, full_name, admin_id, client_id, avatar_url, metadata')
      .eq('id', userId)
      .single();

    if (!profile) {
      return {
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
    }

    return {
      id: user.id,
      email: user.email || '',
      name: profile.full_name || user.email?.split('@')[0] || 'Utilisateur',
      role: normalizeUserRole(profile.role),
      adminId: profile.admin_id,
      clientId: profile.client_id,
      avatar: profile.avatar_url,
      metadata: profile.metadata || mergedMetadata,
    };
  } catch (error) {
    logger.error('Error in fetchUserProfile', { userId }, error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}



export const useAuth = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    let isMounted = true;

    const load = async () => {
      try {
        const { data, error } = await supabaseBrowser.auth.getUser();
        if (!isMounted) return;
        
        // Si le token est invalide, nettoyer la session
        if (error) {
          if (error.message.includes('Refresh Token') || error.message.includes('Invalid')) {
            await supabaseBrowser.auth.signOut();
            logger.warn('Invalid token detected, clearing session', { error: error.message });
          } else {
            logger.error('Auth check failed', {}, error);
          }
          setUser(null);
          return;
        }
        
        if (data.user) {
          const profile = await fetchUserProfile(data.user.id);
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (e) {
        logger.error('Auth check failed', {}, e instanceof Error ? e : new Error(String(e)));
        if (!isMounted) return;
        setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    const { data: sub } = supabaseBrowser.auth.onAuthStateChange(async (event, session) => {
      // Gérer les erreurs de token
      if (event === 'TOKEN_REFRESHED' && !session) {
        logger.warn('Token refresh failed, clearing session');
        await supabaseBrowser.auth.signOut();
        setUser(null);
        return;
      }

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, [isClient]);

  const logout = async () => {
    try {
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
      // Laisser le middleware gérer la redirection
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin';
      }
    } catch (error) {
      logger.error('Logout failed', {}, error instanceof Error ? error : new Error(String(error)));
    }
  };

  return { 
    user, 
    loading: loading || !isClient, 
    logout,
    AuthLoadingScreen
  };
};