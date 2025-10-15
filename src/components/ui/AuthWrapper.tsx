'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthLoadingScreen from './AuthLoadingScreen';

interface AuthWrapperProps {
  children: React.ReactNode;
  loadingMessage?: string;
  fallback?: React.ReactNode;
  allowedRoles?: string[];
  unauthorizedMessage?: string;
}

/**
 * Composant wrapper qui gère automatiquement l'état de chargement de l'authentification
 * et affiche l'AuthLoadingScreen pendant le chargement.
 */
export const AuthWrapper: React.FC<AuthWrapperProps> = ({ 
  children, 
  loadingMessage = "Chargement en cours...",
  fallback,
  allowedRoles,
  unauthorizedMessage = "Vous n'avez pas accès à cette page."
}) => {
  const { loading, user } = useAuth();

  // Si un fallback personnalisé est fourni et l'utilisateur n'est pas connecté
  if (fallback && !loading && !user) {
    return <>{fallback}</>;
  }

  // Afficher l'écran de chargement pendant l'authentification
  if (loading) {
    return <AuthLoadingScreen message={loadingMessage} />;
  }

  // Vérifier les rôles si spécifiés
  if (allowedRoles && allowedRoles.length > 0 && user) {
    if (!allowedRoles.includes(user.role)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Accès refusé
            </h1>
            <p className="text-gray-600">{unauthorizedMessage}</p>
            <button
              onClick={() => window.history.back()}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      );
    }
  }

  // Afficher les enfants une fois l'authentification terminée
  return <>{children}</>;
};

export default AuthWrapper;