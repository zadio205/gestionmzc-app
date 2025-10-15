'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import TasksList from '@/components/dashboard/TasksList';
import ClientsOverview from '@/components/dashboard/ClientsOverview';
import MessagesWidget from '@/components/dashboard/MessagesWidget';
import MetricsChart from '@/components/dashboard/MetricsChart';
import CalendarWidget from '@/components/dashboard/CalendarWidget';
import ToolsShortcuts from '@/components/dashboard/ToolsShortcuts';
import SmartNotifications from '@/components/dashboard/SmartNotifications';
import PredictiveAnalytics from '@/components/dashboard/PredictiveAnalytics';
import SmartQuickActions from '@/components/dashboard/SmartQuickActions';
import ReportGenerator from '@/components/reports/ReportGenerator';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardData } from '@/hooks/useDashboardData';
import UnauthorizedRedirect from '@/components/auth/UnauthorizedRedirect';
import { 
  Building2, 
  Calculator, 
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  MessageCircle,
  Plus,
  TrendingUp,
  Upload
} from 'lucide-react';

const CollaborateurDashboard = () => {
  const { user, loading  const { 
    stats, 
    activities, 
    tasks,
    clients,
    messages,
    actions 
  } = useDashboardData('collaborateur', user?.id);oardData('c  const [showReportGenerator, setShowReportGenerator] = useState(false);

  // Données de démonstration - à remplacer par de vraies données API
  const _mockActivities = [ API
  const mockActivities = [
    {
      id: '1',
      type: 'document' as const,
      title: 'Document validé',
      description: 'Balance comptable approuvée pour SARL Exemple',
      timestamp: 'Il y a 1 heure',
      client: 'SARL Exemple'
    },
    {
      id: '2',
      type: 'message' as const,
      title: 'Nouveau message',
      description: 'Question de Marie Dubois sur les charges sociales',
      timestamp: 'Il y a 2 heures',
      client: 'SAS Innovation'
    },
    {
      id: '3',
      type: 'task' as const,
      title: 'Tâche terminée',
      description: 'Révision des comptes Q3 2024',
      timestamp: 'Il y a 4 heures',
      client: 'SARL Exemple'
    },
    {
      id: '4',
      type: 'document' as const,
      title: 'Document uploadé',
      description: 'Factures fournisseurs novembre',
      timestamp: 'Hier',
      client: 'EURL Commerce'
    }
  ];

  const _mockTasks = [
    {
      id: '1',
      title: 'Révision balance comptable',
      description: 'Vérifier les écritures Q4 2024',
      priority: 'high' as const,
      status: 'pending' as const,
      dueDate: '2024-12-15',
      assignedTo: user?.name || 'Collaborateur',
      client: 'SARL Exemple'
    },
    {
      id: '2',
      title: 'Préparation déclaration TVA',
      description: 'Déclaration mensuelle novembre',
      priority: 'medium' as const,
      status: 'in_progress' as const,
      dueDate: '2024-12-20',
      assignedTo: user?.name || 'Collaborateur',
      client: 'SAS Innovation'
    },
    {
      id: '3',
      title: 'Analyse charges sociales',
      description: 'Optimisation des cotisations',
      priority: 'low' as const,
      status: 'pending' as const,
      dueDate: '2024-12-25',
      assignedTo: user?.name || 'Collaborateur',
      client: 'EURL Commerce'
    }
  ];

  const _mockClients = [
    {
      id: '1',
      name: 'SARL Exemple',
      industry: 'Commerce de détail',
      documentsCount: 15,
      messagesCount: 3,
      alertsCount: 1,
      lastActivity: 'Il y a 1 heure',
      status: 'active' as const
    },
    {
      id: '2',
      name: 'SAS Innovation',
      industry: 'Services numériques',
      documentsCount: 8,
      messagesCount: 1,
      alertsCount: 0,
      lastActivity: 'Il y a 2 heures',
      status: 'active' as const
    },
    {
      id: '3',
      name: 'EURL Commerce',
      industry: 'E-commerce',
      documentsCount: 12,
      messagesCount: 0,
      alertsCount: 2,
      lastActivity: 'Il y a 1 jour',
      status: 'active' as const
    }
  ];

  const _mockMessages = [
    {
      id: '1',
      sender: 'Marie Dubois',
      senderRole: 'client' as const,
      subject: 'Question sur les charges sociales',
      preview: 'Bonjour, j\'aimerais comprendre le calcul des charges...',
      timestamp: 'Il y a 2 heures',
      isRead: false,
      client: 'SAS Innovation'
    },
    {
      id: '2',
      sender: 'Jean Martin',
      senderRole: 'client' as const,
      subject: 'Documents manquants',
      preview: 'Il me manque les justificatifs pour la déclaration...',
      timestamp: 'Il y a 5 heures',
      isRead: false,
      client: 'SARL Exemple'
    },
    {
      id: '3',
      sender: 'Admin Système',
      senderRole: 'admin' as const,
      subject: 'Nouvelle procédure',
      preview: 'Mise à jour des procédures de validation...',
      timestamp: 'Hier',
      isRead: true
    }
  ];

  const _mockNotifications = [
    {
      id: '1',
      type: 'warning' as const,
      title: 'Échéance proche',
      message: 'La déclaration TVA de SARL Exemple est due dans 3 jours',
      timestamp: 'Il y a 1 heure',
      isRead: false,
      actionText: 'Voir la tâche',
      actionUrl: '/collaborateur/tasks/1'
    },
    {
      id: '2',
      type: 'info' as const,
      title: 'Nouveau document',
      message: 'SAS Innovation a uploadé des factures',
      timestamp: 'Il y a 3 heures',
      isRead: false,
      actionText: 'Consulter',
      actionUrl: '/collaborateur/documents'
    },
    {
      id: '3',
      type: 'success' as const,
      title: 'Validation terminée',
      message: 'Balance comptable Q4 approuvée pour EURL Commerce',
      timestamp: 'Il y a 6 heures',
      isRead: true
    }
  ];

  const mockMetricsData = [
    { label: 'Dossiers traités', value: 23, change: 15 },
    { label: 'Documents validés', value: 89, change: 8 },
    { label: 'Réunions client', value: 12, change: -10 },
    { label: 'Déclarations', value: 7, change: 22 }
  ];

  const mockCalendarEvents = [
    {
      id: '1',
      title: 'RDV Marie Dubois',
      date: '2024-12-10',
      time: '14:00',
      type: 'meeting' as const,
      client: 'SAS Innovation',
      location: 'Bureau'
    },
    {
      id: '2',
      title: 'Échéance TVA',
      date: '2024-12-15',
      time: '23:59',
      type: 'deadline' as const,
      client: 'SARL Exemple'
    },
    {
      id: '3',
      title: 'Révision balance',
      date: '2024-12-12',
      time: '10:00',
      type: 'reminder' as const,
      client: 'EURL Commerce'
    }
  ];

  const _quickActions = [
    {
      id: '1',
      title: 'Nouveau client',
      description: 'Créer un dossier client',
      icon: Plus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      onClick: () => {}
    },
    {
      id: '2',
      title: 'Upload document',
      description: 'Ajouter des documents',
      icon: Upload,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      onClick: () => {}
    },
    {
      id: '3',
      title: 'Simulateur social',
      description: 'Calculer les charges',
      icon: Calculator,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      onClick: () => {}
    },
    {
      id: '4',
      title: 'Planifier RDV',
      description: 'Organiser un rendez-vous',
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      onClick: () => {}
    }
  ];

  if (!user && !authLoading) {
    return <UnauthorizedRedirect />;
  }

  if (user && user.role !== 'collaborateur') {
    return <UnauthorizedRedirect />;
  }

  if (!user) return null;

  return (
    <DashboardLayout userRole="collaborateur" userId={user.id}>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Tableau de bord Collaborateur
            </h1>
            <p className="text-gray-600 mt-1">
              Bienvenue, {user.name} • Gérez vos clients et tâches
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowReportGenerator(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Nouveau rapport</span>
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
              Nouveau dossier
            </button>
          </div>
        </div>
        
        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <StatsCard
            title="Mes clients"
            value={stats.myClients ?? 0}
            icon={Building2}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
            trend={{ value: 15, isPositive: true }}
            description="Clients actifs"
          />
          <StatsCard
            title="Documents en attente"
            value={stats.pendingDocuments ?? 0}
            icon={FileText}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
            description="À traiter"
          />
          <StatsCard
            title="Messages non lus"
            value={stats.unreadMessages}
            icon={MessageCircle}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
            description="Nouveaux"
          />
          <StatsCard
            title="Tâches terminées"
            value={stats.completedTasks ?? 0}
            icon={CheckCircle}
            iconColor="text-emerald-600"
            iconBgColor="bg-emerald-100"
            trend={{ value: 8, isPositive: true }}
            description="Ce mois"
          />
          <StatsCard
            title="Tâches en cours"
            value={stats.pendingTasks}
            icon={Clock}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
            description="À finaliser"
          />
          <StatsCard
            title="Cette semaine"
            value={stats.thisWeekTasks ?? 0}
            icon={TrendingUp}
            iconColor="text-indigo-600"
            iconBgColor="bg-indigo-100"
            description="Nouvelles tâches"
          />
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche */}
          <div className="lg:col-span-2 space-y-6">
            <SmartQuickActions 
              userRole="collaborateur" 
              userData={{ stats, clients, tasks }}
              onActionClick={() => {}}
            />
            <ToolsShortcuts userRole="collaborateur" />
            <ClientsOverview clients={clients} userRole="collaborateur" />
            <TasksList 
              tasks={tasks} 
              showActions={true}
              onUpdateStatus={actions.updateTaskStatus}
            />
          </div>
          
          {/* Colonne droite */}
          <div className="space-y-6">
            <CalendarWidget events={mockCalendarEvents} />
            <SmartNotifications 
              userContext={{ role: 'collaborateur', userId: user?.id }}
              onMarkAsRead={actions.markNotificationAsRead}
              onDismiss={actions.dismissNotification}
            />
            <MessagesWidget messages={messages} />
            <ActivityFeed activities={activities} />
            
            {/* Widget performance */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Performance ce mois
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tâches terminées</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">85%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Satisfaction client</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">92%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Délais respectés</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">78%</span>
                  </div>
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
            title="Objectifs personnels"
            data={[
              { label: 'Tâches terminées', value: 85, change: 5 },
              { label: 'Satisfaction client', value: 92, change: 3 },
              { label: 'Délais respectés', value: 78, change: -2 },
              { label: 'Productivité', value: 88, change: 12 }
            ]}
            type="progress"
            period="Performance mensuelle"
          />
          <PredictiveAnalytics userRole="collaborateur" data={{ stats, clients, tasks }} />
        </div>
      </div>
      
      {/* Modal de génération de rapport */}
      <ReportGenerator
        isOpen={showReportGenerator}
        onClose={() => setShowReportGenerator(false)}
        userRole="collaborateur"
      />
    </DashboardLayout>
  );
};

export default CollaborateurDashboard;