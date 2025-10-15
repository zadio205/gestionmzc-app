'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

const ClientTasksPage = () => {
  const { user } = useAuth();

  return (
    <ProtectedRoute
      allowedRoles={['client']}
      unauthorizedMessage="Cette section est réservée aux clients."
      redirectTo="/auth/signin"
    >
      <DashboardLayout userRole="client" userId={user?.id}>
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-semibold text-gray-900">Vos tâches</h1>
          <p className="text-gray-600 mt-2">
            Centralisez ici les actions à réaliser avec votre cabinet. Les tâches synchronisées depuis
            votre collaborateur apparaîtront dans cette vue.
          </p>
          <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-700">
            Les tâches client seront intégrées prochainement. En attendant, contactez votre
            collaborateur pour toute action urgente.
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default ClientTasksPage;
