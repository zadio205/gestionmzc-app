'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';

const ClientProfile = () => {
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
          <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
          <p className="text-gray-600">Gérez vos informations personnelles</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet
              </label>
              <input
                type="text"
                defaultValue={user.name}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                defaultValue={user.email}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rôle
              </label>
              <input
                type="text"
                value="Client"
                disabled
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                placeholder="Laisser vide pour ne pas changer"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg">
              Sauvegarder les modifications
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientProfile;