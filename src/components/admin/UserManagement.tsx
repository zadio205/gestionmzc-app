/**
 * Composant de gestion des utilisateurs
 * Permet de créer, modifier et supprimer des utilisateurs selon les permissions
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import UnauthorizedRedirect from '@/components/auth/UnauthorizedRedirect';
import type { AdminUsersResponse, CreateUserInput, UserRole } from '@/types/auth';
import { CreateUserModal } from './CreateUserModal';
import { logger } from '@/utils/logger';

interface UserManagementProps {
  /** Scope of data to fetch (managed users vs platform admins) */
  dataScope?: 'managed-users' | 'platform-admins';
  /** Restrict visible/managed roles */
  managedRoles?: UserRole[];
  /** Initial filter role */
  defaultFilterRole?: UserRole | 'all';
  /** Restrict roles that can be created through the modal */
  restrictCreationTo?: UserRole[];
  /** Custom title */
  title?: string;
  /** Custom subtitle/description */
  description?: string;
}

// Composant UserCard pour afficher un utilisateur
interface UserCardProps {
  user: AdminUsersResponse;
  onDelete: () => void;
}

function UserCard({ user, onDelete }: UserCardProps) {
  const getRoleBadge = (role: string) => {
    const styles = {
      superadmin: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      collaborateur: 'bg-green-100 text-green-800',
      client: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      superadmin: 'Super Admin',
      admin: 'Admin',
      collaborateur: 'Collaborateur',
      client: 'Client',
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          styles[role as keyof typeof styles] || styles.client
        }`}
      >
        {labels[role as keyof typeof labels] || role}
      </span>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
              {user.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{user.full_name}</h3>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm ml-13">
            {getRoleBadge(user.role)}
            <span className="text-gray-500">
              Créé le {formatDate(user.created_at)}
            </span>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}

export function UserManagement({
  dataScope = 'managed-users',
  managedRoles,
  defaultFilterRole = 'all',
  restrictCreationTo,
  title = 'Gestion des utilisateurs',
  description = 'Gérez vos collaborateurs et clients',
}: UserManagementProps) {
  const { user, loading: authLoading } = useAuth();
  const { isSuperAdmin, isAdmin, canCreateUsers, loading: permissionsLoading } = usePermissions();
  
  const [users, setUsers] = useState<AdminUsersResponse[]>([]);
  const [stats, setStats] = useState({ total: 0, collaborateurs: 0, clients: 0, admins: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>(defaultFilterRole);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (dataScope === 'platform-admins') {
      params.set('scope', 'admins');
    }
    return params.toString();
  }, [dataScope]);

  // Charger les utilisateurs
  useEffect(() => {
    if (authLoading || permissionsLoading) {
      return;
    }
    if (user && (isSuperAdmin || isAdmin)) {
      loadUsers();
      loadStats();
    }
  }, [user, isSuperAdmin, isAdmin, queryString, authLoading, permissionsLoading, loadStats, loadUsers]);

  const loadUsers = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const url = queryString ? `/api/admin/users?${queryString}` : '/api/admin/users';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des utilisateurs');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      logger.error('Error loading users', {}, error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;
    
    try {
      const params = new URLSearchParams(queryString);
      params.set('type', 'stats');
      const response = await fetch(`/api/admin/users?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des statistiques');
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      logger.error('Error loading stats', {}, error instanceof Error ? error : new Error(String(error)));
    }
  };

  const handleCreateUser = async (input: CreateUserInput) => {
    if (!user) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Erreur : ${error.error || 'Erreur inconnue'}`);
        return;
      }

      alert('Utilisateur créé avec succès !');
      setIsModalOpen(false);
  loadUsers();
  loadStats();
    } catch (error) {
      logger.error('Error creating user', {}, error instanceof Error ? error : new Error(String(error)));
      alert('Erreur lors de la création de l\'utilisateur');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!user) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Erreur : ${error.error || 'Erreur inconnue'}`);
        return;
      }

      alert('Utilisateur supprimé avec succès !');
      loadUsers();
      loadStats();
    } catch (error) {
      logger.error('Error deleting user', { userId }, error instanceof Error ? error : new Error(String(error)));
      alert('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  // Filtrer les utilisateurs
  const filteredUsers = filterRole === 'all' 
    ? users 
    : users.filter(u => u.role === filterRole);

  const visibleUsers = useMemo(() => {
    if (!managedRoles || managedRoles.length === 0) {
      return filteredUsers;
    }
    return filteredUsers.filter((u) => managedRoles.includes(u.role));
  }, [filteredUsers, managedRoles]);

  const filterOptions = useMemo(() => {
    if (!managedRoles || managedRoles.length === 0) {
      return ['all', 'collaborateur', 'client'] as const;
    }
    return (['all', ...managedRoles] as const).filter(
      (role, index, arr) => arr.indexOf(role) === index
    );
  }, [managedRoles]);

  useEffect(() => {
    if (filterRole === 'all') return;
    if (managedRoles && managedRoles.length > 0 && !managedRoles.includes(filterRole)) {
      setFilterRole(defaultFilterRole);
    }
  }, [defaultFilterRole, filterRole, managedRoles]);

  if (authLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="text-center text-gray-600">Chargement des utilisateurs...</div>
      </div>
    );
  }

  if (!user || (!isSuperAdmin && !isAdmin)) {
    return <UnauthorizedRedirect message="Redirection vers la connexion..." />;
  }

  const creationRoles = restrictCreationTo && restrictCreationTo.length > 0
    ? restrictCreationTo
    : undefined;

  const canShowCreateButton = canCreateUsers && (creationRoles ? creationRoles.length > 0 : true);

  const headerDescription = description;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-1">
            {headerDescription}
          </p>
        </div>
        
        {canShowCreateButton && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Créer un utilisateur
          </button>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        {(!managedRoles || managedRoles.includes('collaborateur')) && (
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Collaborateurs</p>
            <p className="text-3xl font-bold text-blue-600">{stats.collaborateurs}</p>
          </div>
        )}
        {(!managedRoles || managedRoles.includes('client')) && (
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Clients</p>
            <p className="text-3xl font-bold text-green-600">{stats.clients}</p>
          </div>
        )}
        {managedRoles && managedRoles.includes('admin') && (
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Administrateurs</p>
            <p className="text-3xl font-bold text-purple-600">{stats.admins ?? stats.total}</p>
          </div>
        )}
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-4">
          <span className="text-gray-700 font-medium">Filtrer par rôle :</span>
          <div className="flex gap-2 flex-wrap">
            {filterOptions.map((roleOption) => {
              const labelMap: Record<string, string> = {
                all: 'Tous',
                superadmin: 'Super Admins',
                admin: 'Admins',
                collaborateur: 'Collaborateurs',
                client: 'Clients',
              };
              const label = labelMap[roleOption as string] || roleOption;
              return (
                <button
                  key={roleOption}
                  onClick={() => setFilterRole(roleOption as UserRole | 'all')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterRole === roleOption
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">Chargement...</p>
          </div>
        ) : visibleUsers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {visibleUsers.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                onDelete={() => handleDeleteUser(u.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de création */}
      {isModalOpen && (
        <CreateUserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateUser}
          creatorRole={user.role}
          availableRoles={creationRoles}
        />
      )}
    </div>
  );
}
