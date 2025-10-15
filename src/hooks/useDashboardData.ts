'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/utils/logger';
import { dashboardService } from '@/services/dashboardService';
import type {
  Activity,
  ClientOverview,
  DashboardStats,
  Message,
  Notification,
  Task
} from '@/services/dashboardService';
import {
  DEFAULT_ACTIVITIES,
  DEFAULT_CLIENTS,
  DEFAULT_DASHBOARD_STATS,
  DEFAULT_MESSAGES,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_TASKS
} from '@/constants/dashboardDefaults';

// Les types sont maintenant importés depuis dashboardService.ts

export const useDashboardData = (userRole: 'admin' | 'collaborateur', userId?: string) => {
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_DASHBOARD_STATS);
  const [activities, setActivities] = useState<Activity[]>(DEFAULT_ACTIVITIES);
  const [tasks, setTasks] = useState<Task[]>(DEFAULT_TASKS);
  const [clients, setClients] = useState<ClientOverview[]>(DEFAULT_CLIENTS);
  const [messages, setMessages] = useState<Message[]>(DEFAULT_MESSAGES);
  const [notifications, setNotifications] = useState<Notification[]>(DEFAULT_NOTIFICATIONS);
  const [loading, setLoading] = useState(false); // Changé à false pour rendu immédiat
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!userId) {
      setError('ID utilisateur requis');
      setLoading(false);
      return;
    }

    try {
      // Afficher immédiatement les données mockées pour un rendu instantané
      setLoading(false);

      // Appeler les API routes au lieu d'appeler directement le service
      // car les variables d'environnement serveur ne sont pas disponibles côté client
      const baseUrl = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
      
      // Charger les stats en priorité (non-bloquant)
      fetch(`${baseUrl}/api/dashboard/stats?userId=${userId}&userRole=${userRole}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => data && setStats(data))
        .catch(err => logger.error('Error fetching stats', { userId }, err));

      // Charger les activités en arrière-plan
      fetch(`${baseUrl}/api/dashboard/activities?userId=${userId}&userRole=${userRole}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => data && setActivities(data))
        .catch(err => logger.error('Error fetching activities', { userId }, err));

      // Charger les clients seulement pour les admins
      if (userRole === 'admin') {
        fetch(`${baseUrl}/api/dashboard/clients?userId=${userId}&userRole=${userRole}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => data && setClients(data))
          .catch(err => logger.error('Error fetching clients', { userId }, err));
      }

      // Pour les collaborateurs, ajouter les données spécifiques
      if (userRole === 'collaborateur') {
        // TODO: Implémenter la récupération des tâches et messages pour les collaborateurs
        setTasks([
          {
            id: '1',
            title: 'Révision balance comptable',
            description: 'Vérifier les écritures Q4 2024',
            priority: 'high',
            status: 'pending',
            dueDate: '2024-12-15',
            assignedTo: userId,
            client: 'SARL Exemple',
            aiSuggestion: 'IA suggère de prioriser cette tâche - échéance proche'
          }
        ]);
      }

      // Messages et notifications (mockés pour l'instant)
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
      logger.error('Error loading dashboard data', { userId, userRole }, err instanceof Error ? err : new Error(String(err)));
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
      refreshData: async () => {
        if (userId) {
          await dashboardService.invalidateCache(userId, userRole);
          await fetchDashboardData();
        }
      }
    }
  };
};