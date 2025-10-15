'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import UnauthorizedRedirect from '@/components/auth/UnauthorizedRedirect';

const CollaborateurSimulator = () => {
  const { user, loading } = useAuth();

  if (!user && !loading) {
    return <UnauthorizedRedirect />;
  }

  if (user && user.role !== 'collaborateur') {
    return <UnauthorizedRedirect />;
  }

  if (!user) return null;

  return (
    <DashboardLayout userRole="collaborateur" userId={user.id}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Simulateur Social</h1>
          <p className="text-gray-600">Outils de simulation pour mes clients</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Simulation de charges</h3>
            <p className="text-gray-600 mb-4">Calculez les charges sociales pour vos clients</p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded">
              Lancer la simulation
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Calcul de cotisations</h3>
            <p className="text-gray-600 mb-4">Estimez les cotisations sociales</p>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded">
              Calculer
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CollaborateurSimulator;