'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageLayout from '@/components/layout/PageLayout';
import OptimizedLink from '@/components/ui/OptimizedLink';
import { useAuth } from '@/hooks/useAuth';
import UnauthorizedRedirect from '@/components/auth/UnauthorizedRedirect';
import { FileText, MessageCircle, ClipboardList, Download, Phone, Calculator } from 'lucide-react';

const ClientDashboard = () => {
  const { user, loading } = useAuth();

  if (!user && !loading) {
    return <UnauthorizedRedirect />;
  }

  if (user && user.role !== 'client') {
    return <UnauthorizedRedirect />;
  }

  const statsCards = [
    {
      title: 'Mes Documents',
      subtitle: 'Documents disponibles',
      value: '0',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Messages',
      subtitle: 'Messages non lus',
      value: '0',
      icon: MessageCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Tâches',
      subtitle: 'Actions requises',
      value: '0',
      icon: ClipboardList,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const quickActions = [
    {
      title: 'Télécharger mes documents',
      description: 'Accéder à tous vos documents',
      icon: Download,
      href: '/client/documents',
    },
    {
      title: 'Contacter mon collaborateur',
      description: 'Envoyer un message',
      icon: Phone,
      href: '/client/chat/clients',
    },
    {
      title: 'Simulateur social',
      description: 'Calculer vos cotisations',
      icon: Calculator,
      href: '/client/simulator',
    },
  ];

  return (
    <DashboardLayout userRole="client" userId={user?.id || ''} clientId={user?.clientId ?? undefined}>
      <PageLayout
        title="Mon Tableau de bord"
        subtitle={`Bienvenue, ${user?.name || 'Client'}`}
        breadcrumbs={[
          { label: 'Accueil', href: '/client' },
          { label: 'Tableau de bord' },
        ]}
      >
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {statsCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">{stat.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{stat.subtitle}</p>
                  <div className={`text-2xl sm:text-3xl font-bold ${stat.color} mt-2`}>
                    {stat.value}
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* News Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dernières actualités</h3>
            <div className="space-y-3">
              <div className="text-center py-8">
                <div className="text-gray-500 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">Aucune actualité récente</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Accès rapide</h3>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <OptimizedLink
                  key={index}
                  href={action.href}
                  prefetchOnHover={true}
                  showProgress={true}
                  className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                    <action.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{action.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </OptimizedLink>
              ))}
            </div>
          </div>
        </div>
      </PageLayout>
    </DashboardLayout>
  );
};

export default ClientDashboard;