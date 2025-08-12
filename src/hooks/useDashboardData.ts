'use client';

import { useState, useEffect } from 'react';

export interface DashboardStats {
  totalUsers: number;
  activeClients: number;
  totalDocuments: number;
  unreadMessages: number;
  pendingTasks: number;
  systemAlerts: number;
  myClients?: number;
  pendingDocuments?: number;
  completedTasks?: number;
  thisWeekTasks?: number;
}

export interface Activity {
  id: string;
  type: 'document' | 'message' | 'user' | 'task' | 'alert';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  client?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
  assignedTo?: string;
  client?: string;
  aiSuggestion?: string;
}

export interface ClientOverview {
  id: string;
  name: string;
  industry?: string;
  documentsCount: number;
  messagesCount: number;
  alertsCount: number;
  lastActivity: string;
  status: 'active' | 'inactive' | 'pending';
  aiRiskScore?: number;
  aiRecommendations?: string[];
}

export interface Message {
  id: string;
  sender: string;
  senderRole: 'admin' | 'collaborateur' | 'client';
  subject: string;
  preview: string;
  timestamp: string;
  isRead: boolean;
  client?: string;
  aiSentiment?: 'positive' | 'neutral' | 'negative';
  aiPriority?: 'low' | 'medium' | 'high';
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
  aiGenerated?: boolean;
}

export const useDashboardData = (userRole: 'admin' | 'collaborateur', userId?: string) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeClients: 0,
    totalDocuments: 0,
    unreadMessages: 0,
    pendingTasks: 0,
    systemAlerts: 0
  });

  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<ClientOverview[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Simuler des appels API avec données enrichies par IA
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (userRole === 'admin') {
        setStats({
          totalUsers: 24,
          activeClients: 18,
          totalDocuments: 156,
          unreadMessages: 7,
          pendingTasks: 5,
          systemAlerts: 2
        });

        setActivities([
          {
            id: '1',
            type: 'user',
            title: 'Nouvel utilisateur inscrit',
            description: 'Marie Dubois a créé un compte collaborateur',
            timestamp: 'Il y a 2 heures',
            user: 'Marie Dubois'
          },
          {
            id: '2',
            type: 'alert',
            title: 'IA: Anomalie détectée',
            description: 'Pic inhabituel d\'activité sur le serveur',
            timestamp: 'Il y a 1 heure'
          }
        ]);

        setClients([
          {
            id: '1',
            name: 'SARL Exemple',
            industry: 'Commerce',
            documentsCount: 15,
            messagesCount: 3,
            alertsCount: 1,
            lastActivity: 'Il y a 2 heures',
            status: 'active',
            aiRiskScore: 0.2,
            aiRecommendations: ['Révision comptable recommandée', 'Optimisation fiscale possible']
          }
        ]);

      } else {
        setStats({
          totalUsers: 0,
          activeClients: 0,
          totalDocuments: 0,
          unreadMessages: 5,
          pendingTasks: 7,
          systemAlerts: 0,
          myClients: 12,
          pendingDocuments: 8,
          completedTasks: 23,
          thisWeekTasks: 4
        });

        setTasks([
          {
            id: '1',
            title: 'Révision balance comptable',
            description: 'Vérifier les écritures Q4 2024',
            priority: 'high',
            status: 'pending',
            dueDate: '2024-12-15',
            assignedTo: 'Collaborateur',
            client: 'SARL Exemple',
            aiSuggestion: 'IA suggère de prioriser cette tâche - échéance proche'
          }
        ]);
      }

      setMessages([
        {
          id: '1',
          sender: 'Marie Dubois',
          senderRole: 'client',
          subject: 'Question sur les charges sociales',
          preview: 'Bonjour, j\'aimerais comprendre le calcul des charges...',
          timestamp: 'Il y a 2 heures',
          isRead: false,
          client: 'SAS Innovation',
          aiSentiment: 'neutral',
          aiPriority: 'medium'
        }
      ]);

      setNotifications([
        {
          id: '1',
          type: 'info',
          title: 'IA: Recommandation',
          message: 'Optimisation possible pour 3 clients basée sur l\'analyse des données',
          timestamp: 'Il y a 30 minutes',
          isRead: false,
          aiGenerated: true,
          actionText: 'Voir les détails',
          actionUrl: '/ai-recommendations'
        }
      ]);

    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const dismissNotification = async (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const markMessageAsRead = async (id: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === id ? { ...msg, isRead: true } : msg
      )
    );
  };

  const updateTaskStatus = async (id: string, status: Task['status']) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === id ? { ...task, status } : task
      )
    );
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userRole, userId]);

  return {
    stats,
    activities,
    tasks,
    clients,
    messages,
    notifications,
    loading,
    error,
    actions: {
      markNotificationAsRead,
      dismissNotification,
      markMessageAsRead,
      updateTaskStatus,
      refreshData: fetchDashboardData
    }
  };
};