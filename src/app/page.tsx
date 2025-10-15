'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AuthWrapper } from '@/components/ui/AuthWrapper';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const navigatedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading || navigatedRef.current) return;
    const target = user ? `/${user.role}/dashboard` : '/auth/signin';
    navigatedRef.current = true;
    // Navigation préférée
    router.replace(target);
    // Repli dur si la navigation n’a pas lieu (rare, mais évite l’écran bloqué)
    const t = setTimeout(() => {
      if (typeof window !== 'undefined' && window.location.pathname === '/') {
        window.location.href = target;
      }
    }, 800);
    return () => clearTimeout(t);
  }, [user, loading, router, mounted]);

return (
    <AuthWrapper loadingMessage="Préparation de votre espace...">
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 animate-fade-in">Masyzarac</h1>
          <p className="text-gray-600 mb-8 text-lg">Application de gestion comptable et documentaire</p>
          {!mounted && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          )}
          {/* Lien de secours si la redirection ne part pas */}
          <div className="mt-6">
            <a href="/auth/signin" className="text-blue-600 hover:text-blue-500 text-sm underline">Aller à la page de connexion</a>
          </div>
        </div>
      </div>
    </AuthWrapper>
  );
}