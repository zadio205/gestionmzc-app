/**
 * Page de gestion des utilisateurs (Admin/Super Admin)
 * Route: /admin/users
 * 
 * Utilise le nouveau système de gestion des rôles avec Supabase
 */

'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { UserManagement } from '@/components/admin/UserManagement';
import { useAuth } from '@/hooks/useAuth';
import { AuthWrapper } from '@/components/ui/AuthWrapper';

const UsersManagementPage = () => {
  const { user } = useAuth();

  return (
    <AuthWrapper 
      loadingMessage="Chargement de la gestion des utilisateurs..."
      allowedRoles={['superadmin', 'admin']}
      unauthorizedMessage="Vous devez être administrateur pour accéder à la gestion des utilisateurs."
    >
      <DashboardLayout userRole={user?.role || 'admin'} userId={user?.id || ''}>
        <UserManagement />
      </DashboardLayout>
    </AuthWrapper>
  );
};

export default UsersManagementPage;