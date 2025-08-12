'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';

const CollaborateurNews = () => {
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
          <h1 className="text-3xl font-bold text-gray-900">Actualités</h1>
          <p className="text-gray-600">Restez informé des dernières nouvelles</p>
        </div>
        
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              Aucune actualité disponible pour le moment.
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CollaborateurNews;