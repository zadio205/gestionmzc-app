/**
 * Composant carte utilisateur
 * Affiche les informations d'un utilisateur avec actions
 */

'use client';

import type { AdminUsersResponse } from '@/types/auth';
import { usePermissions } from '@/hooks/usePermissions';

interface UserCardProps {
  user: AdminUsersResponse;
  onDelete: () => void;
}

export function UserCard({ user, onDelete }: UserCardProps) {
  const { isSuperAdmin, isAdmin } = usePermissions();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'collaborateur':
        return 'bg-blue-100 text-blue-800';
      case 'client':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'collaborateur':
        return 'Collaborateur';
      case 'client':
        return 'Client';
      default:
        return role;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
            {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
          </div>

          {/* Informations */}
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-900">
                {user.full_name || 'Sans nom'}
              </h3>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(
                  user.role
                )}`}
              >
                {getRoleLabel(user.role)}
              </span>
            </div>
            <p className="text-sm text-gray-600">{user.email}</p>
            <p className="text-xs text-gray-400 mt-1">
              Créé le {formatDate(user.created_at)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {(isSuperAdmin || isAdmin) && (
            <>
              <button
                onClick={onDelete}
                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Supprimer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
