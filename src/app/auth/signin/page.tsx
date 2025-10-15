'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { supabaseBrowser } from '@/lib/supabase/client';
import { logger } from '@/utils/logger';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Pas de vérification d'auth ici pour éviter les boucles
  // Le middleware gère les redirections

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabaseBrowser.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError('Erreur de connexion');
        setLoading(false);
        return;
      }

      // Synchroniser la session pour le middleware (cookies sb-*)
      if (data.session?.access_token && data.session.refresh_token) {
        try {
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            }),
          });
        } catch (sessionError) {
          logger.error('Impossible de synchroniser la session', {}, sessionError instanceof Error ? sessionError : new Error(String(sessionError)));
        }
      }

      // Récupérer le profil via l'API interne (évitant les policies récursives)
      let role = data.user.user_metadata?.role;
      try {
        const accessToken = data.session?.access_token;
        const response = await fetch(`/api/profiles/${data.user.id}`, {
          cache: 'no-store',
          credentials: 'include',
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined,
        });
        if (response.ok) {
          const profile = await response.json();
          role = profile.role;
        }
      } catch (profileError) {
        logger.error('Erreur profil via API', {}, profileError instanceof Error ? profileError : new Error(String(profileError)));
      }

      // Fallback si rôle toujours inconnu
      const resolvedRole = (role as 'superadmin' | 'admin' | 'collaborateur' | 'client') || 'client';

      // Redirection selon le rôle
      if (resolvedRole === 'superadmin' || resolvedRole === 'admin') {
        router.push('/admin/dashboard');
      } else if (resolvedRole === 'collaborateur') {
        router.push('/collaborateur/dashboard');
      } else {
        router.push('/client/dashboard');
      }
    } catch (error) {
      logger.error('Erreur connexion', { email }, error instanceof Error ? error : new Error(String(error)));
      setError('Une erreur est survenue');
      setLoading(false);
    }
  };

  const forceConfirmDev = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/auth/dev-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j?.error || 'Echec de confirmation');
        setLoading(false);
        return;
      }
      // Réessayer la connexion
      await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    } catch (e: any) {
      setError('Impossible de forcer la confirmation');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connexion à Masyzarac
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          {error && process.env.NODE_ENV !== 'production' && (
            <div className="text-center">
              <button type="button" onClick={forceConfirmDev} className="mt-2 text-xs text-blue-600 hover:text-blue-500">
                Forcer la confirmation (dev)
              </button>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            loading={loading}
          >
            Se connecter
          </Button>

          <div className="text-center">
            <Link href="/auth/signup" className="text-blue-600 hover:text-blue-500">
              Pas encore de compte ? S'inscrire
            </Link>
          </div>

          
        </form>
      </div>
    </div>
  );
}