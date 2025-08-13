'use client';

import { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

interface AppUser {
  _id: string; // on conserve le champ attendu par l'app
  email: string;
  name: string;
  role: 'admin' | 'collaborateur' | 'client';
  clientId?: string;
  avatar?: string;
}

function mapSupabaseUser(u: any): AppUser | null {
  if (!u) return null;
  const meta = u.user_metadata || {};
  // Rôle par défaut depuis les metadata (client par défaut)
  let role: AppUser['role'] = (meta.role as AppUser['role']) || 'admin';

  // Option de surclassement par emails (variables publiques, compilées côté client)
  const email = (u.email || '').toLowerCase();
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  const collabEmails = (process.env.NEXT_PUBLIC_COLLABORATEUR_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  if (email && adminEmails.includes(email)) {
    role = 'admin';
  } else if (email && collabEmails.includes(email)) {
    role = 'collaborateur';
  }
  return {
    _id: u.id,
    email: u.email,
    name: meta.name || u.email?.split('@')[0] || 'Utilisateur',
    role,
    clientId: meta.clientId,
    avatar: meta.avatar,
  };
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
        const { data } = await supabaseBrowser.auth.getUser();
        if (!isMounted) return;
        setUser(mapSupabaseUser(data.user));
      } catch (e) {
        console.error('Auth check failed:', e);
        if (!isMounted) return;
        setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      setUser(mapSupabaseUser(session?.user || null));
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, [isClient]);

  const logout = async () => {
    try {
      await supabaseBrowser.auth.signOut();
      setUser(null);
      // Redirection immédiate vers la page de connexion
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return { user, loading: loading || !isClient, logout };
};