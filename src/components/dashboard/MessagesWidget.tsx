'use client';

import React from 'react';
import { 
  Clock, 
  MessageCircle, 
  MoreHorizontal,
  Reply,
  User
} from 'lucide-react';

interface Message {
  id: string;
  sender: string;
  senderRole: 'admin' | 'collaborateur' | 'client';
  subject: string;
  preview: string;
  timestamp: string;
  isRead: boolean;
  client?: string;
}

interface MessagesWidgetProps {
  messages: Message[];
  maxItems?: number;
}

const MessagesWidget: React.FC<MessagesWidgetProps> = ({ 
  messages, 
  maxItems = 5 
}) => {
  const getRoleColor = (role: Message['senderRole']) => {
    switch (role) {
      case 'admin':
        return 'text-purple-600 bg-purple-50';
      case 'collaborateur':
        return 'text-blue-600 bg-blue-50';
      case 'client':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const displayedMessages = messages.slice(0, maxItems);

  if (displayedMessages.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Messages récents
        </h3>
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun message</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Messages récents
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {messages.filter(m => !m.isRead).length} non lus
          </span>
          <button className="text-sm text-blue-600 hover:text-blue-800">
            Voir tous
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        {displayedMessages.map((message) => (
          <div 
            key={message.id} 
            className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 hover:border-gray-200 hover:shadow-sm ${
              message.isRead ? 'border-gray-100 bg-white' : 'border-blue-100 bg-blue-50/30'
            }`}
          >
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getRoleColor(message.senderRole)}`}>
                <User className="w-4 h-4" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h4 className={`text-sm font-medium truncate ${
                    message.isRead ? 'text-gray-900' : 'text-gray-900 font-semibold'
                  }`}>
                    {message.sender}
                  </h4>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(message.senderRole)}`}>
                    {message.senderRole}
                  </span>
                </div>
                <button className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
              
              <p className={`text-sm mt-1 truncate ${
                message.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'
              }`}>
                {message.subject}
              </p>
              
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {message.preview}
              </p>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-4 text-xs text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{message.timestamp}</span>
                  </div>
                  {message.client && (
                    <span className="text-blue-600">{message.client}</span>
                  )}
                </div>
                
                <button className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800">
                  <Reply className="w-3 h-3" />
                  <span>Répondre</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Accéder à la messagerie
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessagesWidget;