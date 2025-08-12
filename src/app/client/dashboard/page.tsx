'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';

const ClientDashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  if (!user || user.role !== 'client') {
    return <div className="flex items-center justify-center h-screen">Accès non autorisé</div>;
  }

  return (
    <DashboardLayout userRole="client" userId={user._id} clientId={user.clientId}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Mon Tableau de bord
          </h1>
          <p className="text-gray-600">Bienvenue, {user.name}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Mes Documents</h3>
            <p className="text-gray-600 mb-4">Documents disponibles</p>
            <div className="text-2xl font-bold text-blue-600">0</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Messages</h3>
            <p className="text-gray-600 mb-4">Messages non lus</p>
            <div className="text-2xl font-bold text-green-600">0</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tâches</h3>
            <p className="text-gray-600 mb-4">Actions requises</p>
            <div className="text-2xl font-bold text-orange-600">0</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dernières actualités</h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">Aucune actualité récente</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Accès rapide</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-gray-50 rounded hover:bg-gray-100">
                Télécharger mes documents
              </button>
              <button className="w-full text-left p-3 bg-gray-50 rounded hover:bg-gray-100">
                Contacter mon collaborateur
              </button>
              <button className="w-full text-left p-3 bg-gray-50 rounded hover:bg-gray-100">
                Simulateur social
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard;