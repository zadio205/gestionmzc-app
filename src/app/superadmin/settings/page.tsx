'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

const SuperadminSettingsPage = () => {
  const { user } = useAuth();

  return (
    <ProtectedRoute
      allowedRoles={['superadmin']}
      unauthorizedMessage="Seul un super administrateur peut accéder aux paramètres globaux."
      redirectTo="/auth/signin"
    >
      <DashboardLayout userRole="superadmin" userId={user?.id}>
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-semibold text-gray-900">Paramètres de la plateforme</h1>
          <p className="text-gray-600 mt-2 max-w-2xl">
            Centralisez ici les réglages globaux de Masyzarac : politiques de sécurité, intégrations
            externes et configuration des rôles. Cette section sert de point d&apos;ancrage pour les
            futures fonctionnalités de gouvernance.
          </p>
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
            Les paramètres détaillés seront ajoutés dans une itération suivante. Vous pouvez définir
            vos besoins dans la documentation OpenSpec pour prioriser les développements.
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default SuperadminSettingsPage;
