'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';

const CollaborateurTasks = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  if (!user || user.role !== 'collaborateur') {
    return <div className="flex items-center justify-center h-screen">Accès non autorisé</div>;
  }

  return (
    <DashboardLayout userRole="collaborateur" userId={user._id}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes tâches administratives</h1>
          <p className="text-gray-600">Gérez vos tâches assignées</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900">À faire</h3>
            <p className="text-2xl font-bold text-orange-600">0</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900">En cours</h3>
            <p className="text-2xl font-bold text-blue-600">0</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900">Terminées</h3>
            <p className="text-2xl font-bold text-green-600">0</p>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              Aucune tâche assignée pour le moment.
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CollaborateurTasks;