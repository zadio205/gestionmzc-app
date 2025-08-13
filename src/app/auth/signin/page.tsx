'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function SignIn() {
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.push(`/${user.role}/dashboard`);
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      redirectAfterLogin(data.user);
    } catch (error) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Calcule le rôle et redirige
  const redirectAfterLogin = (user: any) => {
    // Déduire le rôle: metadata puis surclassement par listes d'emails (env publiques)
    const metaRole = (user?.user_metadata?.role as 'admin' | 'collaborateur' | 'client') || 'admin';
    const userEmail = (user?.email || '').toLowerCase();
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
    const collabEmails = (process.env.NEXT_PUBLIC_COLLABORATEUR_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
    const role: 'admin' | 'collaborateur' | 'client' = userEmail && adminEmails.includes(userEmail)
      ? 'admin'
      : userEmail && collabEmails.includes(userEmail)
        ? 'collaborateur'
        : metaRole;
    if (role === 'admin') router.push('/admin/dashboard');
    else if (role === 'collaborateur') router.push('/collaborateur/dashboard');
    else router.push('/client/dashboard');
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
        return;
      }
      // Tente une reconnexion directe
      const { data, error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      redirectAfterLogin(data.user);
    } catch (e: any) {
      setError('Impossible de forcer la confirmation');
    } finally {
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