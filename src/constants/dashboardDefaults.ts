/**
 * Données de fallback pour un affichage immédiat du dashboard
 * Ces données permettent un rendu instantané pendant le chargement des vraies données
 */

export const DEFAULT_DASHBOARD_STATS = {
  totalUsers: 0,
  activeClients: 0,
  totalDocuments: 0,
  unreadMessages: 0,
  pendingTasks: 0,
  systemAlerts: 0
};

export const DEFAULT_ACTIVITIES = [
  {
    id: 'loading-1',
    type: 'document' as const,
    title: 'Chargement des activités...',
    description: 'Récupération des dernières activités',
    timestamp: new Date().toISOString(),
  }
];

export const DEFAULT_CLIENTS = [];

export const DEFAULT_TASKS = [];

export const DEFAULT_MESSAGES = [];

export const DEFAULT_NOTIFICATIONS = [
  {
    id: 'loading-1',
    type: 'info' as const,
    title: 'Chargement',
    message: 'Récupération des données du dashboard...',
    timestamp: new Date().toISOString(),
    isRead: false,
  }
];
