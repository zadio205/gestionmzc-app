import { supabaseServer } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import { createCacheFromPreset } from '@/lib/cache';

// Cache pour les données du dashboard (15 minutes TTL)
// Utiliser 'session' (memory cache) au lieu de 'user' (localStorage) 
// car ce service s'exécute côté serveur où localStorage n'existe pas
const dashboardCache = createCacheFromPreset('dashboard', 'session');

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

export interface Activity {
  id: string;
  type: 'document' | 'message' | 'user' | 'task' | 'alert';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  client?: string;
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
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  aiGenerated?: boolean;
  actionText?: string;
  actionUrl?: string;
}

/**
 * Service optimisé pour récupérer les données du dashboard
 * Utilise des requêtes SQL jointes pour éviter les N+1 queries
 */
export class DashboardService {
  /**
   * Récupère toutes les statistiques du dashboard en une seule requête
   */
  async getDashboardStats(userId: string, userRole: 'admin' | 'collaborateur'): Promise<DashboardStats> {
    const cacheKey = `stats:${userId}:${userRole}`;

    // Vérifier le cache d'abord
    const cached = await dashboardCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const query = supabaseServer()
        .from('dashboard_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('user_role', userRole)
        .single();

      const { data, error } = await query;

      if (error || !data) {
        // Fallback vers le calcul manuel si la vue n'existe pas
        return this.calculateDashboardStats(userId, userRole);
      }

      const stats: DashboardStats = {
        totalUsers: data.total_users || 0,
        activeClients: data.active_clients || 0,
        totalDocuments: data.total_documents || 0,
        unreadMessages: data.unread_messages || 0,
        pendingTasks: data.pending_tasks || 0,
        systemAlerts: data.system_alerts || 0,
        myClients: data.my_clients,
        pendingDocuments: data.pending_documents,
        completedTasks: data.completed_tasks,
        thisWeekTasks: data.this_week_tasks,
      };

      // Mettre en cache pendant 15 minutes
      await dashboardCache.set(cacheKey, stats);
      return stats;

    } catch (error) {
      logger.error('Error fetching dashboard stats:', { userId, userRole }, error as Error);
      return this.getDefaultStats(userRole);
    }
  }

  /**
   * Calcul manuel des statistiques (fallback)
   */
  private async calculateDashboardStats(userId: string, userRole: 'admin' | 'collaborateur'): Promise<DashboardStats> {
    try {
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));

      // Requête optimisée pour les comptes utilisateurs
      const { count: totalUsers } = await supabaseServer()
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Requête optimisée pour les clients actifs
      const { count: activeClients } = await supabaseServer()
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'client')
        .gte('last_activity', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Requête optimisée pour les documents
      let documentsQuery = supabaseServer()
        .from('justificatifs')
        .select('*', { count: 'exact', head: true });

      if (userRole === 'collaborateur') {
        documentsQuery = documentsQuery.eq('assigned_to', userId);
      }

      const { count: totalDocuments } = await documentsQuery;

      // Requête optimisée pour les messages non lus
      let messagesQuery = supabaseServer()
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      if (userRole === 'collaborateur') {
        messagesQuery = messagesQuery.or(`sender_role.eq.client,assigned_to.eq.${userId}`);
      }

      const { count: unreadMessages } = await messagesQuery;

      // Requête optimisée pour les tâches en attente
      let tasksQuery = supabaseServer()
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (userRole === 'collaborateur') {
        tasksQuery = tasksQuery.eq('assigned_to', userId);
      }

      const { count: pendingTasks } = await tasksQuery;

      // Requête optimisée pour les alertes système
      const { count: systemAlerts } = await supabaseServer()
        .from('system_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('resolved', false);

      const stats: DashboardStats = {
        totalUsers: totalUsers || 0,
        activeClients: activeClients || 0,
        totalDocuments: totalDocuments || 0,
        unreadMessages: unreadMessages || 0,
        pendingTasks: pendingTasks || 0,
        systemAlerts: systemAlerts || 0,
      };

      // Ajouter les statistiques spécifiques aux collaborateurs
      if (userRole === 'collaborateur') {
        // Nombre de clients assignés
        const { count: myClients } = await supabaseServer()
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'client')
          .eq('assigned_to', userId);

        // Documents en attente de validation
        const { count: pendingDocuments } = await supabaseServer()
          .from('justificatifs')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', userId)
          .eq('status', 'pending');

        // Tâches complétées cette semaine
        const { count: completedTasks } = await supabaseServer()
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', userId)
          .eq('status', 'completed')
          .gte('completed_at', weekStart.toISOString());

        // Tâches cette semaine
        const { count: thisWeekTasks } = await supabaseServer()
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', userId)
          .gte('due_date', weekStart.toISOString());

        stats.myClients = myClients || 0;
        stats.pendingDocuments = pendingDocuments || 0;
        stats.completedTasks = completedTasks || 0;
        stats.thisWeekTasks = thisWeekTasks || 0;
      }

      return stats;

    } catch (error) {
      logger.error('Error calculating dashboard stats:', { userId, userRole }, error as Error);
      return this.getDefaultStats(userRole);
    }
  }

  /**
   * Récupère les activités récentes avec jointures optimisées
   */
  async getRecentActivities(userId: string, userRole: 'admin' | 'collaborateur', limit: number = 10): Promise<Activity[]> {
    const cacheKey = `activities:${userId}:${userRole}:${limit}`;

    const cached = await dashboardCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Requête SQL optimisée avec CTEs pour éviter les N+1
      const { data, error } = await supabaseServer()
        .rpc('get_recent_activities', {
          p_user_id: userId,
          p_user_role: userRole,
          p_limit: limit
        });

      if (error) {
        // Fallback vers une requête simple si la fonction n'existe pas
        return this.getFallbackActivities(userId, userRole, limit);
      }

      const activities: Activity[] = data?.map((activity: any) => ({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        timestamp: activity.timestamp,
        user: activity.user_name,
        client: activity.client_name,
      })) || [];

      await dashboardCache.set(cacheKey, activities);
      return activities;

    } catch (error) {
      logger.error('Error fetching recent activities:', { userId, userRole }, error as Error);
      return [];
    }
  }

  /**
   * Fallback pour les activités récentes
   */
  private async getFallbackActivities(userId: string, userRole: 'admin' | 'collaborateur', limit: number): Promise<Activity[]> {
    // Implémentation simple qui évite les N+1 queries
    const activities: Activity[] = [];

    try {
      // Activités des utilisateurs
      if (userRole === 'admin') {
        const { data: userActivities } = await supabaseServer()
          .from('profiles')
          .select('id, full_name, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        if (userActivities) {
          userActivities.forEach(user => {
            activities.push({
              id: `user_${user.id}`,
              type: 'user',
              title: 'Nouvel utilisateur inscrit',
              description: `${user.full_name} a rejoint la plateforme`,
              timestamp: user.created_at,
              user: user.full_name,
            });
          });
        }
      }

      // Activités des documents
      let documentsQuery = supabaseServer()
        .from('justificatifs')
        .select('id, filename, uploaded_at, uploaded_by, profiles!inner(full_name)')
        .order('uploaded_at', { ascending: false })
        .limit(5);

      if (userRole === 'collaborateur') {
        documentsQuery = documentsQuery.eq('assigned_to', userId);
      }

      const { data: documentActivities } = await documentsQuery;

      if (documentActivities) {
        documentActivities.forEach(doc => {
          activities.push({
            id: `doc_${doc.id}`,
            type: 'document',
            title: 'Nouveau document téléversé',
            description: `${doc.filename} par ${(doc.profiles as any)?.full_name || 'Utilisateur inconnu'}`,
            timestamp: doc.uploaded_at,
            user: (doc.profiles as any)?.full_name || 'Utilisateur inconnu',
          });
        });
      }

      return activities.slice(0, limit);

    } catch (error) {
      logger.error('Error in fallback activities:', { userId, userRole, error: (error as Error).message });
      return [];
    }
  }

  /**
   * Récupère les clients avec toutes leurs statistiques en une seule requête
   */
  async getClientOverviews(userId: string, userRole: 'admin' | 'collaborateur'): Promise<ClientOverview[]> {
    const cacheKey = `clients:${userId}:${userRole}`;

    const cached = await dashboardCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Requête SQL optimisée avec jointures pour compter les documents, messages, etc.
      const { data, error } = await supabaseServer()
        .from('client_overviews')
        .select('*')
        .order('last_activity', { ascending: false });

      if (error) {
        return this.getFallbackClientOverviews(userId, userRole);
      }

      const clients: ClientOverview[] = data?.map(client => ({
        id: client.id,
        name: client.name,
        industry: client.industry,
        documentsCount: client.documents_count || 0,
        messagesCount: client.messages_count || 0,
        alertsCount: client.alerts_count || 0,
        lastActivity: client.last_activity,
        status: client.status,
        aiRiskScore: client.ai_risk_score,
        aiRecommendations: client.ai_recommendations,
      })) || [];

      await dashboardCache.set(cacheKey, clients);
      return clients;

    } catch (error) {
      logger.error('Error fetching client overviews:', { userId, userRole, error: (error as Error).message });
      return [];
    }
  }

  /**
   * Fallback pour les aperçus clients
   */
  private async getFallbackClientOverviews(userId: string, userRole: 'admin' | 'collaborateur'): Promise<ClientOverview[]> {
    try {
      let clientsQuery = supabaseServer()
        .from('profiles')
        .select('id, full_name, created_at, last_activity')
        .eq('role', 'client');

      if (userRole === 'collaborateur') {
        clientsQuery = clientsQuery.eq('assigned_to', userId);
      }

      const { data: clients } = await clientsQuery;

      if (!clients) return [];

      // Récupérer les statistiques pour tous les clients en une seule requête
      const clientIds = clients.map(c => c.id);

      const { data: docStats } = await supabaseServer()
        .from('justificatifs')
        .select('client_id')
        .in('client_id', clientIds);

      const { data: messageStats } = await supabaseServer()
        .from('messages')
        .select('client_id')
        .in('client_id', clientIds);

      // Calculer les statistiques
      const documentCounts = new Map<string, number>();
      const messageCounts = new Map<string, number>();

      docStats?.forEach(doc => {
        documentCounts.set(doc.client_id, (documentCounts.get(doc.client_id) || 0) + 1);
      });

      messageStats?.forEach(msg => {
        messageCounts.set(msg.client_id, (messageCounts.get(msg.client_id) || 0) + 1);
      });

      return clients.map(client => ({
        id: client.id,
        name: client.full_name || 'Client',
        documentsCount: documentCounts.get(client.id) || 0,
        messagesCount: messageCounts.get(client.id) || 0,
        alertsCount: 0, // TODO: Implémenter les alertes
        lastActivity: client.last_activity || client.created_at,
        status: 'active' as const,
      }));

    } catch (error) {
      logger.error('Error in fallback client overviews:', { error: (error as Error).message });
      return [];
    }
  }

  /**
   * Statistiques par défaut en cas d'erreur
   */
  private getDefaultStats(userRole: 'admin' | 'collaborateur'): DashboardStats {
    const baseStats = {
      totalUsers: 0,
      activeClients: 0,
      totalDocuments: 0,
      unreadMessages: 0,
      pendingTasks: 0,
      systemAlerts: 0,
    };

    if (userRole === 'collaborateur') {
      return {
        ...baseStats,
        myClients: 0,
        pendingDocuments: 0,
        completedTasks: 0,
        thisWeekTasks: 0,
      };
    }

    return baseStats;
  }

  /**
   * Invalider le cache du dashboard pour un utilisateur
   */
  async invalidateCache(userId: string, userRole: 'admin' | 'collaborateur'): Promise<void> {
    const patterns = [
      `stats:${userId}:${userRole}`,
      `activities:${userId}:${userRole}:*`,
      `clients:${userId}:${userRole}`,
    ];

    for (const pattern of patterns) {
      await dashboardCache.clear(pattern);
    }
  }
}

// Export du singleton
export const dashboardService = new DashboardService();