'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';

const ClientDocuments = () => {
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
          <h1 className="text-3xl font-bold text-gray-900">Mes documents</h1>
          <p className="text-gray-600">Consultez et téléchargez vos documents</p>
        </div>
        
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              Aucun document disponible pour le moment.
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientDocuments;