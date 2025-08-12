'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ReportGenerator from '@/components/reports/ReportGenerator';
import ReportHistory from '@/components/reports/ReportHistory';
import { useAuth } from '@/hooks/useAuth';
import { 
  FileText, 
  Plus, 
  BarChart3,
  TrendingUp,
  Users,
  Brain
} from 'lucide-react';

const AdminReportsPage = () => {
  const { user, loading } = useAuth();
  const [showGenerator, setShowGenerator] = useState(false);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <div className="flex items-center justify-center h-screen">Accès non autorisé</div>;
  }

  const reportStats = [
    {
      title: 'Rapports générés',
      value: '24',
      change: '+12%',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Avec IA',
      value: '18',
      change: '+25%',
      icon: Brain,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Téléchargements',
      value: '156',
      change: '+8%',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Utilisateurs actifs',
      value: '12',
      change: '+3%',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <DashboardLayout userRole="admin" userId={user._id}>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestion des Rapports
            </h1>
            <p className="text-gray-600 mt-1">
              Générez et gérez vos rapports avec intelligence artificielle
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowGenerator(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau rapport</span>
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reportStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {stat.title}
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stat.value}
                          </div>
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <span>{stat.change}</span>
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Types de rapports disponibles */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Types de Rapports Disponibles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors duration-200">
              <div className="flex items-center space-x-3 mb-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <h3 className="font-medium text-gray-900">Performance Globale</h3>
              </div>
              <p className="text-sm text-gray-600">
                Vue d'ensemble des performances système avec analyses IA
              </p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors duration-200">
              <div className="flex items-center space-x-3 mb-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <h3 className="font-medium text-gray-900">Résumé Financier</h3>
              </div>
              <p className="text-sm text-gray-600">
                Analyse financière détaillée avec prédictions
              </p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors duration-200">
              <div className="flex items-center space-x-3 mb-2">
                <Brain className="w-6 h-6 text-purple-600" />
                <h3 className="font-medium text-gray-900">Insights IA Avancés</h3>
              </div>
              <p className="text-sm text-gray-600">
                Recommandations et analyses générées par IA
              </p>
            </div>
          </div>
        </div>

        {/* Historique des rapports */}
        <ReportHistory userRole="admin" userId={user._id} />

        {/* Modal de génération */}
        <ReportGenerator
          isOpen={showGenerator}
          onClose={() => setShowGenerator(false)}
          userRole="admin"
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminReportsPage;