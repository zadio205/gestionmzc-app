/**
 * Composant de protection des routes côté client
 * Vérifie les permissions et affiche le contenu ou redirige
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import type { UserRole, Permission } from '@/types/auth';
import AuthLoadingScreen from '@/components/ui/AuthLoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  
  /** Rôles autorisés à accéder à cette route */
  allowedRoles?: UserRole[];
  
  /** Permissions requises pour accéder à cette route */
  requiredPermissions?: Permission[];
  
  /** Exiger toutes les permissions (AND) ou au moins une (OR) */
  requireAll?: boolean;
  
  /** Message à afficher si accès refusé */
  unauthorizedMessage?: string;
  
  /** Page de redirection si accès refusé */
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requiredPermissions,
  requireAll = true,
  unauthorizedMessage = 'Vous n\'avez pas accès à cette page.',
  redirectTo,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading, hasAnyRole, hasAllPermissions, hasAnyPermission } = usePermissions();

  useEffect(() => {
    if (loading) return;

    // Pas connecté
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    // Vérifier les rôles
    if (allowedRoles && allowedRoles.length > 0) {
      const hasRole = hasAnyRole(allowedRoles);
      if (!hasRole) {
        if (redirectTo) {
          router.push(redirectTo);
        }
        return;
      }
    }

    // Vérifier les permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = requireAll
        ? hasAllPermissions(requiredPermissions)
        : hasAnyPermission(requiredPermissions);
      
      if (!hasPermission) {
        if (redirectTo) {
          router.push(redirectTo);
        }
        return;
      }
    }
  }, [user, loading, allowedRoles, requiredPermissions, requireAll, redirectTo, router]);

  // Loading state
  if (loading) {
    return <AuthLoadingScreen message="Vérification des autorisations..." />;
  }

  // Non authentifié
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Redirection vers la connexion...</p>
        </div>
      </div>
    );
  }

  // Vérifier les rôles
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = hasAnyRole(allowedRoles);
    if (!hasRole) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Accès refusé
            </h1>
            <p className="text-gray-600">{unauthorizedMessage}</p>
            <button
              onClick={() => router.back()}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      );
    }
  }

  // Vérifier les permissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPermission = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);
    
    if (!hasPermission) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Permissions insuffisantes
            </h1>
            <p className="text-gray-600">{unauthorizedMessage}</p>
            <button
              onClick={() => router.back()}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      );
    }
  }

  // Autorisé
  return <>{children}</>;
}
