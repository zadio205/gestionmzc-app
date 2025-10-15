'use client';

import React, { useState, lazy, Suspense, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import StatsCard from '@/components/dashboard/StatsCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import { DashboardErrorBoundary } from '@/components/ui/DashboardErrorBoundary';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useDashboardData } from '@/hooks/useDashboardData';
import UnauthorizedRedirect from '@/components/auth/UnauthorizedRedirect';

// Lazy load des composants non-critiques avec preload
const ToolsShortcuts = lazy(() => {
  const promise = import('@/components/dashboard/ToolsShortcuts');
  // Preload après 1 seconde
  setTimeout(() => promise, 1000);
  return promise;
});

const SmartNotifications = lazy(() => {
  const promise = import('@/components/dashboard/SmartNotifications');
  setTimeout(() => promise, 1500);
  return promise;
});

const PredictiveAnalytics = lazy(() => {
  const promise = import('@/components/dashboard/PredictiveAnalytics');
  setTimeout(() => promise, 2000);
  return promise;
});

const SmartQuickActions = lazy(() => {
  const promise = import('@/components/dashboard/SmartQuickActions');
  setTimeout(() => promise, 500);
  return promise;
});

const ReportGenerator = lazy(() => {
  const promise = import('@/components/reports/ReportGenerator');
  return promise;
});
import { 
  Users, 
  Building2, 
  FileText, 
  MessageCircle,
  TrendingUp,
  AlertTriangle,
  Shield,
  Database
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, loading: authLoading, authChecked } = useOptimizedAuth();
  const { 
    stats, 
    activities, 
    tasks, 
    clients, 
    loading: dataLoading,
    actions 
  } = useDashboardData('admin', user?.id);
  
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [visibleSections, setVisibleSections] = useState({
    quickActions: false,
    tools: false,
    notifications: false,
    analytics: false
  });

  // Révéler progressivement les sections pour améliorer les performances
  React.useEffect(() => {
    if (authChecked && user) {
      const timer1 = setTimeout(() => setVisibleSections(prev => ({ ...prev, quickActions: true })), 300);
      const timer2 = setTimeout(() => setVisibleSections(prev => ({ ...prev, tools: true })), 800);
      const timer3 = setTimeout(() => setVisibleSections(prev => ({ ...prev, notifications: true })), 1200);
      const timer4 = setTimeout(() => setVisibleSections(prev => ({ ...prev, analytics: true })), 1600);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    }
  }, [authChecked, user]);

  // Mémoriser les composants de statistiques
  const statsCards = useMemo(() => {
    if (!stats) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatsCard
          title="Utilisateurs totaux"
          value={stats.totalUsers}
          icon={Users}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          trend={{ value: 8, isPositive: true }}
          description="Ce mois"
        />
        <StatsCard
          title="Clients actifs"
          value={stats.activeClients}
          icon={Building2}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          trend={{ value: 12, isPositive: true }}
          description="En activité"
        />
        <StatsCard
          title="Documents"
          value={stats.totalDocuments}
          icon={FileText}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
          trend={{ value: 5, isPositive: true }}
          description="Cette semaine"
        />
        <StatsCard
          title="Messages non lus"
          value={stats.unreadMessages}
          icon={MessageCircle}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
          description="À traiter"
        />
        <StatsCard
          title="Tâches en attente"
          value={stats.pendingTasks}
          icon={TrendingUp}
          iconColor="text-indigo-600"
          iconBgColor="bg-indigo-100"
          description="Prioritaires"
        />
        <StatsCard
          title="Alertes système"
          value={stats.systemAlerts}
          icon={AlertTriangle}
          iconColor="text-red-600"
          iconBgColor="bg-red-100"
          description="À vérifier"
        />
      </div>
    );
  }, [stats]);



  // Afficher seulement un loader pour l'authentification, pas pour les données
  if (authLoading) {
    return (
      <DashboardLayout userRole="admin" userId={user?.id}>
        <PageLayout
          title="Tableau de bord Administrateur"
          subtitle="Chargement..."
          breadcrumbs={[
            { label: 'Accueil', href: '/admin' },
            { label: 'Tableau de bord' },
          ]}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PageLayout>
      </DashboardLayout>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return <UnauthorizedRedirect />;
  }

  return (
    <DashboardLayout userRole={user.role} userId={user.id}>
      <DashboardErrorBoundary>
      <PageLayout
        title="Tableau de bord Administrateur"
        subtitle={`Bienvenue, ${user.name} • Vue d'ensemble du système`}
        breadcrumbs={[
          { label: 'Accueil', href: '/admin' },
          { label: 'Tableau de bord' },
        ]}
        actions={
          <button 
            onClick={() => setShowReportGenerator(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau rapport</span>
          </button>
        }
      >
        
        {/* Statistiques principales */}
        {statsCards}

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche */}
          <div className="lg:col-span-2 space-y-6">
            {visibleSections.quickActions && (
              <Suspense fallback={<div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse h-48" />}>
                <SmartQuickActions 
                  userRole="admin" 
                  userData={{ stats, clients, tasks }}
                  onActionClick={(actionId) => console.log('Action clicked:', actionId)}
                />
              </Suspense>
            )}
            
            {visibleSections.tools && (
              <Suspense fallback={<div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse h-64" />}>
                <ToolsShortcuts userRole="admin" />
              </Suspense>
            )}
            {/* <ClientsOverview clients={clients} userRole="admin" /> */}
            {/* <TasksList 
              tasks={tasks} 
              onUpdateStatus={actions.updateTaskStatus}
            /> */}
          </div>
          
          {/* Colonne droite */}
          <div className="space-y-6">
            {visibleSections.notifications && (
              <Suspense fallback={<div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse h-48" />}>
                <SmartNotifications 
                  userContext={{ role: 'admin', userId: user?.id }}
                  onMarkAsRead={actions.markNotificationAsRead}
                  onDismiss={actions.dismissNotification}
                />
              </Suspense>
            )}
            
            <ActivityFeed activities={activities} />
            
            {/* Widget système */}
            <Card>
              <CardHeader title="État du système" />
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Database className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">Base de données</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Opérationnelle</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">Sécurité</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Sécurisé</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm font-medium text-gray-900">Stockage</span>
                    </div>
                    <span className="text-sm text-yellow-600 font-medium">85% utilisé</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section métriques avancées */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* <MetricsChart
            title="Activité mensuelle"
            data={mockMetricsData}
            type="bar"
            period="Décembre 2024"
          /> */}
          {/* <MetricsChart
            title="Performance globale"
            data={[
              { label: 'Satisfaction client', value: 92, change: 5 },
              { label: 'Temps de réponse', value: 87, change: -2 },
              { label: 'Disponibilité système', value: 99, change: 1 },
              { label: 'Efficacité équipe', value: 85, change: 8 }
            ]}
            type="progress"
            period="Moyennes mensuelles"
          /> */}
          <Suspense fallback={<div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse h-64" />}>
            <PredictiveAnalytics userRole="admin" data={{ stats, clients, tasks }} />
          </Suspense>
        </div>
      </PageLayout>
      
      {/* Modal de génération de rapport */}
      {showReportGenerator && (
        <Suspense fallback={null}>
          <ReportGenerator
            isOpen={showReportGenerator}
            onClose={() => setShowReportGenerator(false)}
            userRole="admin"
          />
        </Suspense>
      )}
      </DashboardErrorBoundary>
    </DashboardLayout>
  );
};

export default AdminDashboard;