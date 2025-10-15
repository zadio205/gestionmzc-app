'use client';

import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  Bell, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Eye, 
  Filter,
  MessageCircle,
  Search,
  User
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'comment' | 'justification' | 'approval' | 'alert' | 'reminder';
  title: string;
  message: string;
  clientId: string;
  clientName: string;
  entryId?: string;
  ledgerType: 'clients' | 'suppliers' | 'miscellaneous';
  priority: 'low' | 'medium' | 'high';
  status: 'unread' | 'read' | 'archived';
  author: string;
  authorType: 'client' | 'collaborator' | 'system';
  createdAt: Date;
  actionRequired?: boolean;
  dueDate?: Date;
}

interface CollaborationDashboardProps {
  clientId?: string; // Si spécifié, filtre pour ce client seulement
  isClientView?: boolean; // Mode client (notifications limitées)
}

const CollaborationDashboard: React.FC<CollaborationDashboardProps> = ({
  clientId,
  isClientView = false
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'action-required' | 'alerts'>('unread');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Simulation de données - à remplacer par appels API
  useEffect(() => {
    const loadNotifications = async () => {
      // TODO: Appel API réel
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'comment',
          title: 'Nouveau commentaire',
          message: 'Un commentaire a été ajouté sur une écriture fournisseur.',
          clientId: 'client-1',
          clientName: 'Entreprise ABC',
          entryId: 'entry-123',
          ledgerType: 'suppliers',
          priority: 'medium',
          status: 'unread',
          author: 'Jean Dupont',
          authorType: 'client',
          createdAt: new Date('2024-01-15T10:30:00'),
          actionRequired: true
        },
        {
          id: '2',
          type: 'justification',
          title: 'Justificatif demandé',
          message: 'Un justificatif est requis pour une écriture client.',
          clientId: 'client-2',
          clientName: 'Société XYZ',
          entryId: 'entry-456',
          ledgerType: 'clients',
          priority: 'high',
          status: 'unread',
          author: 'Marie Martin',
          authorType: 'collaborator',
          createdAt: new Date('2024-01-14T14:20:00'),
          actionRequired: true,
          dueDate: new Date('2024-01-20T00:00:00')
        },
        {
          id: '3',
          type: 'alert',
          title: 'Anomalie détectée',
          message: 'L\'IA a détecté une anomalie sur plusieurs écritures.',
          clientId: 'client-1',
          clientName: 'Entreprise ABC',
          ledgerType: 'miscellaneous',
          priority: 'high',
          status: 'unread',
          author: 'Système IA',
          authorType: 'system',
          createdAt: new Date('2024-01-13T09:15:00'),
          actionRequired: true
        }
      ];

      // Filtrer par client si spécifié
      const filtered = clientId 
        ? mockNotifications.filter(n => n.clientId === clientId)
        : mockNotifications;

      // Filtrer pour la vue client (masquer notifications internes)
      const finalFiltered = isClientView
        ? filtered.filter(n => n.authorType !== 'system' || n.type === 'reminder')
        : filtered;

      setNotifications(finalFiltered);
    };

    loadNotifications();
  }, [clientId, isClientView]);

  const filteredNotifications = notifications.filter(notification => {
    // Filtre principal
    if (filter === 'unread' && notification.status !== 'unread') return false;
    if (filter === 'action-required' && !notification.actionRequired) return false;
    if (filter === 'alerts' && notification.type !== 'alert') return false;

    // Filtre par type
    if (selectedType !== 'all' && notification.type !== selectedType) return false;

    // Recherche
    if (searchTerm && !notification.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !notification.message.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !notification.clientName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'comment': return MessageCircle;
      case 'justification': return AlertTriangle;
      case 'approval': return CheckCircle;
      case 'alert': return AlertTriangle;
      case 'reminder': return Clock;
      default: return Bell;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'comment': return 'Commentaire';
      case 'justification': return 'Justificatif';
      case 'approval': return 'Approbation';
      case 'alert': return 'Alerte';
      case 'reminder': return 'Rappel';
      default: return 'Notification';
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId 
          ? { ...n, status: 'read' as const }
          : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, status: 'read' as const }))
    );
  };

  const archiveNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId 
          ? { ...n, status: 'archived' as const }
          : n
      )
    );
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired && n.status !== 'archived').length;

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-gray-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Centre de collaboration
              </h2>
              <p className="text-sm text-gray-600">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''} • {actionRequiredCount} action{actionRequiredCount > 1 ? 's' : ''} requise{actionRequiredCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={markAllAsRead}
              className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            >
              Tout marquer lu
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="mt-4 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              {[
                { value: 'all', label: 'Toutes' },
                { value: 'unread', label: 'Non lues' },
                { value: 'action-required', label: 'Action requise' },
                { value: 'alerts', label: 'Alertes' }
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFilter(value as any)}
                  className={`px-3 py-1 text-sm rounded-full border ${
                    filter === value
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {label}
                  {value === 'unread' && unreadCount > 0 && (
                    <span className="ml-1 bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1"
            >
              <option value="all">Tous types</option>
              <option value="comment">Commentaires</option>
              <option value="justification">Justificatifs</option>
              <option value="alert">Alertes</option>
              <option value="reminder">Rappels</option>
            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher dans les notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Liste des notifications */}
      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium">Aucune notification</p>
            <p className="text-sm">
              {filter === 'unread' 
                ? 'Toutes les notifications ont été lues'
                : 'Aucune notification ne correspond aux filtres sélectionnés'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => {
              const TypeIcon = getTypeIcon(notification.type);
              const isOverdue = notification.dueDate && new Date() > notification.dueDate;
              
              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    notification.status === 'unread' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    setSelectedNotification(notification);
                    markAsRead(notification.id);
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${getPriorityColor(notification.priority)}`}>
                      <TypeIcon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <div className="flex items-center space-x-2">
                          {notification.actionRequired && (
                            <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                              Action requise
                            </span>
                          )}
                          {isOverdue && (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                              En retard
                            </span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{notification.author}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Intl.DateTimeFormat('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            }).format(notification.createdAt)}</span>
                          </span>
                          <span>
                            {notification.clientName} • {getTypeLabel(notification.type)}
                          </span>
                        </div>
                        
                        {notification.dueDate && (
                          <span className={`text-xs ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                            Échéance: {new Intl.DateTimeFormat('fr-FR').format(notification.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal détails notification */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Détails de la notification
                </h3>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Type</p>
                  <p className="text-sm text-gray-900">{getTypeLabel(selectedNotification.type)}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Message</p>
                  <p className="text-sm text-gray-900">{selectedNotification.message}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Client</p>
                    <p className="text-sm text-gray-900">{selectedNotification.clientName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Priorité</p>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(selectedNotification.priority)}`}>
                      {selectedNotification.priority}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <button
                    onClick={() => {
                      markAsRead(selectedNotification.id);
                      setSelectedNotification(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Marquer comme lu
                  </button>
                  <button
                    onClick={() => {
                      archiveNotification(selectedNotification.id);
                      setSelectedNotification(null);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Archiver
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborationDashboard;
