'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import UnauthorizedRedirect from '@/components/auth/UnauthorizedRedirect';

const ClientSimulator = () => {
  const { user, loading } = useAuth();

  if (!user && !loading) {
    return <UnauthorizedRedirect />;
  }

  if (user && user.role !== 'client') {
    return <UnauthorizedRedirect />;
  }

  if (!user) return null;

  return (
    <DashboardLayout userRole="client" userId={user.id} clientId={user.clientId ?? undefined}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Simulateur Social</h1>
          <p className="text-gray-600">Simulez vos charges et cotisations sociales</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Simulation de charges sociales</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salaire brut mensuel (€)
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="3000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option>Salarié</option>
                <option>Cadre</option>
                <option>Dirigeant</option>
              </select>
            </div>
          </div>
          
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg">
            Calculer les charges
          </button>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Résultats de la simulation</h4>
            <p className="text-gray-600">Lancez une simulation pour voir les résultats</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientSimulator;