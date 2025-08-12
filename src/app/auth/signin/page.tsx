'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Rediriger selon le rôle
        if (data.user.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (data.user.role === 'collaborateur') {
          router.push('/collaborateur/dashboard');
        } else {
          router.push('/client/dashboard');
        }
      } else {
        setError(data.error || 'Erreur de connexion');
      }
    } catch (error) {
      setError('Une erreur est survenue');
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

          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Comptes de test :</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <div><strong>Admin:</strong> admin@masyzarac.com / admin123</div>
              <div><strong>Collaborateur:</strong> collaborateur@masyzarac.com / collab123</div>
              <div><strong>Client:</strong> client@masyzarac.com / client123</div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}