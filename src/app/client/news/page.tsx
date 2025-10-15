'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import UnauthorizedRedirect from '@/components/auth/UnauthorizedRedirect';

const ClientNews = () => {
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

export default ClientNews;