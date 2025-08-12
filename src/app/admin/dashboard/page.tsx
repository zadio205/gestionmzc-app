'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import QuickActions from '@/components/dashboard/QuickActions';
import TasksList from '@/components/dashboard/TasksList';
import ClientsOverview from '@/components/dashboard/ClientsOverview';
import MessagesWidget from '@/components/dashboard/MessagesWidget';
import MetricsChart from '@/components/dashboard/MetricsChart';
import NotificationsPanel from '@/components/dashboard/NotificationsPanel';
import ToolsShortcuts from '@/components/dashboard/ToolsShortcuts';
import AIInsightsWidget from '@/components/dashboard/AIInsightsWidget';
import SmartNotifications from '@/components/dashboard/SmartNotifications';
import PredictiveAnalytics from '@/components/dashboard/PredictiveAnalytics';
import SmartQuickActions from '@/components/dashboard/SmartQuickActions';
import AIStatusWidget from '@/components/dashboard/AIStatusWidget';
import ReportGenerator from '@/components/reports/ReportGenerator';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardData } from '@/hooks/useDashboardData';
import { 
  Users, 
  Building2, 
  FileText, 
  MessageCircle,
  TrendingUp,
  AlertTriangle,
  UserPlus,
  Plus,
  Settings,
  BarChart3,
  Shield,
  Database
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { 
    stats, 
    activities, 
    tasks, 
    clients, 
    messages, 
    notifications,
    loading: dataLoading,
    error,
    actions 
  } = useDashboardData('admin', user?._id);
  
  const [showReportGenerator, setShowReportGenerator] = useState(false);

  // Données pour les métriques
  const mockMetricsData = [
    { label: 'Nouveaux clients', value: 8, change: 25 },
    { label: 'Documents traités', value: 156, change: 12 },
    { label: 'Tâches terminées', value: 89, change: -5 },
    { label: 'Messages échangés', value: 234, change: 18 }
  ];

  const quickActions = [
    {
      id: '1',
      title: 'Ajouter un utilisateur',
      description: 'Créer un nouveau compte',
      icon: UserPlus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      onClick: () => console.log('Ajouter utilisateur')
    },
    {
      id: '2',
      title: 'Créer un client',
      description: 'Nouveau dossier client',
      icon: Plus,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      onClick: () => console.log('Créer client')
    },
    {
      id: '3',
      title: 'Paramètres système',
      description: 'Configuration globale',
      icon: Settings,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      onClick: () => console.log('Paramètres')
    },
    {
      id: '4',
      title: 'Rapports',
      description: 'Générer des statistiques',
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      onClick: () => console.log('Rapports')
    }
  ];

  if (authLoading || dataLoading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <div className="flex items-center justify-center h-screen">Accès non autorisé</div>;
  }

  return (
    <DashboardLayout userRole="admin" userId={user._id}>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Tableau de bord Administrateur
            </h1>
            <p className="text-gray-600 mt-1">
              Bienvenue, {user.name} • Vue d'ensemble du système
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowReportGenerator(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Nouveau rapport</span>
            </button>
          </div>
        </div>
        
        {/* Statistiques principales */}
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

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche */}
          <div className="lg:col-span-2 space-y-6">
            <SmartQuickActions 
              userRole="admin" 
              userData={{ stats, clients, tasks }}
              onActionClick={(actionId) => console.log('Action clicked:', actionId)}
            />
            <ToolsShortcuts userRole="admin" />
            <ClientsOverview clients={clients} userRole="admin" />
            <TasksList 
              tasks={tasks} 
              onUpdateStatus={actions.updateTaskStatus}
            />
          </div>
          
          {/* Colonne droite */}
          <div className="space-y-6">
            <AIInsightsWidget userRole="admin" data={{ stats, clients, tasks }} />
            <SmartNotifications 
              userContext={{ role: 'admin', userId: user?._id }}
              onMarkAsRead={actions.markNotificationAsRead}
              onDismiss={actions.dismissNotification}
            />
            <AIStatusWidget userRole="admin" />
            <MessagesWidget messages={messages} />
            <ActivityFeed activities={activities} />
            
            {/* Widget système */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                État du système
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Base de données</span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">Opérationnelle</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Sécurité</span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">Sécurisé</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-gray-700">Stockage</span>
                  </div>
                  <span className="text-sm text-yellow-600 font-medium">85% utilisé</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section métriques avancées */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <MetricsChart
            title="Activité mensuelle"
            data={mockMetricsData}
            type="bar"
            period="Décembre 2024"
          />
          <MetricsChart
            title="Performance globale"
            data={[
              { label: 'Satisfaction client', value: 92, change: 5 },
              { label: 'Temps de réponse', value: 87, change: -2 },
              { label: 'Disponibilité système', value: 99, change: 1 },
              { label: 'Efficacité équipe', value: 85, change: 8 }
            ]}
            type="progress"
            period="Moyennes mensuelles"
          />
          <PredictiveAnalytics userRole="admin" data={{ stats, clients, tasks }} />
        </div>
      </div>
      
      {/* Modal de génération de rapport */}
      <ReportGenerator
        isOpen={showReportGenerator}
        onClose={() => setShowReportGenerator(false)}
        userRole="admin"
      />
    </DashboardLayout>
  );
};

export default AdminDashboard;