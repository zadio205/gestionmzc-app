'use client';

import React from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  X,
  Clock,
  ExternalLink
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
}

interface NotificationsPanelProps {
  notifications: Notification[];
  maxItems?: number;
  onMarkAsRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications,
  maxItems = 5,
  onMarkAsRead,
  onDismiss
}) => {
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getNotificationBgColor = (type: Notification['type'], isRead: boolean) => {
    if (isRead) return 'bg-gray-50 border-gray-200';
    
    switch (type) {
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

  const displayedNotifications = notifications.slice(0, maxItems);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (displayedNotifications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Notifications
        </h3>
        <div className="text-center py-8">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune notification</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
            </span>
          )}
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-800">
          Tout marquer comme lu
        </button>
      </div>
      
      <div className="space-y-3">
        {displayedNotifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`p-4 rounded-lg border transition-all duration-200 ${getNotificationBgColor(notification.type, notification.isRead)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-medium ${
                    notification.isRead ? 'text-gray-700' : 'text-gray-900'
                  }`}>
                    {notification.title}
                  </h4>
                  
                  <p className={`text-sm mt-1 ${
                    notification.isRead ? 'text-gray-500' : 'text-gray-700'
                  }`}>
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{notification.timestamp}</span>
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
                {!notification.isRead && onMarkAsRead && (
                  <button
                    onClick={() => onMarkAsRead(notification.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Marquer comme lu"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
                {onDismiss && (
                  <button
                    onClick={() => onDismiss(notification.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Supprimer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
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

export default NotificationsPanel;