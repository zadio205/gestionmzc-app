'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ReportGenerator from '@/components/reports/ReportGenerator';
import ReportHistory from '@/components/reports/ReportHistory';
import { useAuth } from '@/hooks/useAuth';
import UnauthorizedRedirect from '@/components/auth/UnauthorizedRedirect';
import { 
  Brain, 
  FileText, 
  PieChart,
  Plus,
  TrendingUp,
  Users
} from 'lucide-react';

const CollaborateurReportsPage = () => {
  const { user, loading } = useAuth();
  const [showGenerator, setShowGenerator] = useState(false);

  if (!user && !loading) {
    return <UnauthorizedRedirect />;
  }

  if (user && user.role !== 'collaborateur') {
    return <UnauthorizedRedirect />;
  }

  if (!user) return null;

  const reportStats = [
    {
      title: 'Mes rapports',
      value: '8',
      change: '+3',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Clients analysés',
      value: '12',
      change: '+2',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Avec IA',
      value: '6',
      change: '+4',
      icon: Brain,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Ce mois',
      value: '3',
      change: '+1',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <DashboardLayout userRole="collaborateur" userId={user.id}>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Mes Rapports
            </h1>
            <p className="text-gray-600 mt-1">
              Générez des rapports personnalisés pour vos clients
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
            Rapports Disponibles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors duration-200">
              <div className="flex items-center space-x-3 mb-2">
                <Users className="w-6 h-6 text-blue-600" />
                <h3 className="font-medium text-gray-900">Portfolio Clients</h3>
              </div>
              <p className="text-sm text-gray-600">
                Analyse détaillée de vos clients avec scores de risque IA
              </p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors duration-200">
              <div className="flex items-center space-x-3 mb-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <h3 className="font-medium text-gray-900">Productivité</h3>
              </div>
              <p className="text-sm text-gray-600">
                Analyse de votre performance avec suggestions IA
              </p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors duration-200">
              <div className="flex items-center space-x-3 mb-2">
                <PieChart className="w-6 h-6 text-purple-600" />
                <h3 className="font-medium text-gray-900">Analyse Financière</h3>
              </div>
              <p className="text-sm text-gray-600">
                Rapport financier détaillé avec optimisations suggérées
              </p>
            </div>
          </div>
        </div>

        {/* Conseils IA */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
          <div className="flex items-center space-x-3 mb-3">
            <Brain className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Conseils IA pour vos Rapports
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white/50 rounded-lg p-3">
              <h4 className="font-medium text-gray-900 mb-1">📊 Fréquence optimale</h4>
              <p className="text-gray-600">Générez un rapport portfolio mensuel pour un suivi optimal</p>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <h4 className="font-medium text-gray-900 mb-1">🎯 Personnalisation</h4>
              <p className="text-gray-600">Activez l&apos;IA pour des recommandations personnalisées</p>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <h4 className="font-medium text-gray-900 mb-1">⏰ Meilleur moment</h4>
              <p className="text-gray-600">Générez vos rapports le matin pour une productivité optimale</p>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <h4 className="font-medium text-gray-900 mb-1">📈 Tendances</h4>
              <p className="text-gray-600">Comparez sur 3 mois minimum pour identifier les tendances</p>
            </div>
          </div>
        </div>

        {/* Historique des rapports */}
        <ReportHistory userRole="collaborateur" userId={user.id} />

        {/* Modal de génération */}
        <ReportGenerator
          isOpen={showGenerator}
          onClose={() => setShowGenerator(false)}
          userRole="collaborateur"
        />
      </div>
    </DashboardLayout>
  );
};

export default CollaborateurReportsPage;