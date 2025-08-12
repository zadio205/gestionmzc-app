'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';

const CollaborateurDocuments = () => {
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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">GED - Mes documents clients</h1>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            Télécharger un document
          </button>
        </div>
        
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              Aucun document client trouvé.
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CollaborateurDocuments;