'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserManagement } from '@/components/admin/UserManagement';
import { useAuth } from '@/hooks/useAuth';

const SuperadminAdminsPage = () => {
  const { user } = useAuth();

  return (
    <ProtectedRoute
      allowedRoles={['superadmin']}
      unauthorizedMessage="Seul un super administrateur peut gérer les comptes administrateurs."
      redirectTo="/auth/signin"
    >
      <DashboardLayout userRole="superadmin" userId={user?.id}>
        <UserManagement
          dataScope="platform-admins"
          managedRoles={['admin']}
          defaultFilterRole="admin"
          restrictCreationTo={['admin']}
          title="Gestion des administrateurs"
          description="Créez, auditez et désactivez les administrateurs de la plateforme."
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default SuperadminAdminsPage;
