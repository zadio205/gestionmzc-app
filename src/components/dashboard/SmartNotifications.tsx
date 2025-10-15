'use client';

import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  Brain, 
  CheckCircle,
  Clock,
  ExternalLink,
  Sparkles,
  X,
  Zap
} from 'lucide-react';
import { aiService } from '@/services/aiService';

interface SmartNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
  aiGenerated?: boolean;
  aiConfidence?: number;
  priority?: 'low' | 'medium' | 'high';
}

interface SmartNotificationsProps {
  userContext: any;
  onMarkAsRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
  maxItems?: number;
}

const SmartNotifications: React.FC<SmartNotificationsProps> = ({
  userContext,
  onMarkAsRead,
  onDismiss,
  maxItems = 5
}) => {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        
        // Notifications classiques
        const classicNotifications: SmartNotification[] = [
          {
            id: '1',
            type: 'warning',
            title: 'Échéance proche',
            message: 'La déclaration TVA de SARL Exemple est due dans 3 jours',
            timestamp: 'Il y a 1 heure',
            isRead: false,
            actionText: 'Voir la tâche',
            actionUrl: '/tasks/1',
            priority: 'high'
          }
        ];

        let aiNotifications: SmartNotification[] = [];
        
        if (aiEnabled) {
          // Génération de notifications IA
          const aiGenerated = await aiService.generateSmartNotifications(userContext);
          aiNotifications = aiGenerated.map(notif => ({
            ...notif,
            aiGenerated: true,
            aiConfidence: 0.85,
            priority: 'medium'
          }));
        }

        setNotifications([...aiNotifications, ...classicNotifications]);
      } catch (error) {
        console.error('Erreur chargement notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
    
    // Actualisation périodique des notifications IA
    const interval = setInterval(loadNotifications, 30000); // 30 secondes
    
    return () => clearInterval(interval);
  }, [userContext, aiEnabled]);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
    onMarkAsRead?.(id);
  };

  const handleDismiss = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    onDismiss?.(id);
  };

  const getNotificationIcon = (notification: SmartNotification) => {
    if (notification.aiGenerated) {
      return <Brain className="w-4 h-4 text-purple-600" />;
    }
    
    switch (notification.type) {
      case 'info':
        return <Bell className="w-4 h-4 text-blue-600" />;
      case 'warning':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <X className="w-4 h-4 text-red-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getNotificationBgColor = (notification: SmartNotification) => {
    if (notification.isRead) return 'bg-gray-50 border-gray-200';
    
    if (notification.aiGenerated) {
      return 'bg-purple-50 border-purple-200';
    }
    
    switch (notification.type) {
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIndicator = (priority?: string) => {
    switch (priority) {
      case 'high':
        return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
      case 'medium':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
      case 'low':
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      default:
        return null;
    }
  };

  const displayedNotifications = notifications.slice(0, maxItems);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const aiNotificationsCount = notifications.filter(n => n.aiGenerated).length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Bell className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          {aiNotificationsCount > 0 && (
            <div className="flex items-center space-x-1">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-purple-600 font-medium">
                {aiNotificationsCount} IA
              </span>
            </div>
          )}
          {unreadCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAiEnabled(!aiEnabled)}
            className={`p-1 rounded ${aiEnabled ? 'text-purple-600' : 'text-gray-400'}`}
            title={aiEnabled ? 'Désactiver IA' : 'Activer IA'}
          >
            <Brain className="w-4 h-4" />
          </button>
          <button className="text-sm text-blue-600 hover:text-blue-800">
            Tout marquer comme lu
          </button>
        </div>
      </div>
      
      {displayedNotifications.length === 0 ? (
        <div className="text-center py-8">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune notification</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedNotifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`p-4 rounded-lg border transition-all duration-200 ${getNotificationBgColor(notification)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className={`text-sm font-medium ${
                        notification.isRead ? 'text-gray-700' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </h4>
                      {notification.aiGenerated && (
                        <div className="flex items-center space-x-1">
                          <Zap className="w-3 h-3 text-purple-500" />
                          <span className="text-xs text-purple-600 font-medium">IA</span>
                        </div>
                      )}
                      {getPriorityIndicator(notification.priority)}
                    </div>
                    
                    <p className={`text-sm mt-1 ${
                      notification.isRead ? 'text-gray-500' : 'text-gray-700'
                    }`}>
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{notification.timestamp}</span>
                        {notification.aiConfidence && (
                          <>
                            <span className="mx-1">•</span>
                            <span>Confiance: {Math.round(notification.aiConfidence * 100)}%</span>
                          </>
                        )}
                      </div>
                      
                      {notification.actionUrl && notification.actionText && (
                        <button className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800">
                          <span>{notification.actionText}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 ml-2">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Marquer comme lu"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDismiss(notification.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Supprimer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {notifications.length > maxItems && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
            Voir toutes les notifications ({notifications.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default SmartNotifications;