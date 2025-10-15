'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import UnauthorizedRedirect from '@/components/auth/UnauthorizedRedirect';
import { Send, Users, Search } from 'lucide-react';

const InternalChat = () => {
  const { user, loading } = useAuth();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - à remplacer par de vraies données
  const colleagues = [
    { id: '1', name: 'Admin Principal', role: 'Admin', online: true, lastMessage: 'Réunion équipe demain', time: '15:30' },
    { id: '2', name: 'Marie Dupont', role: 'Collaborateur', online: false, lastMessage: 'Merci pour l\'aide', time: 'Hier' },
    { id: '3', name: 'Jean Martin', role: 'Collaborateur', online: true, lastMessage: 'Dossier client terminé', time: '12:15' },
  ];

  const messages = [
    { id: '1', senderId: '1', senderName: 'Admin Principal', content: 'Bonjour ! N\'oubliez pas la réunion équipe demain à 10h.', timestamp: '15:30', isOwn: false },
    { id: '2', senderId: user?.id, senderName: user?.name, content: 'Merci pour le rappel ! J\'ai noté.', timestamp: '15:32', isOwn: true },
    { id: '3', senderId: '1', senderName: 'Admin Principal', content: 'Parfait. Bonne fin de journée !', timestamp: '15:35', isOwn: false },
  ];

  if (!user && !loading) {
    return <UnauthorizedRedirect />;
  }

  if (user && user.role !== 'collaborateur') {
    return <UnauthorizedRedirect />;
  }

  if (!user) return null;

  const handleSendMessage = () => {
    if (message.trim() && selectedUser) {
      console.log('Envoi message:', message, 'à:', selectedUser);
      setMessage('');
    }
  };

  const filteredColleagues = colleagues.filter(colleague =>
    colleague.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout userRole="collaborateur" userId={user.id}>
      <div className="h-full flex bg-white rounded-lg shadow">
        {/* Liste des utilisateurs */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Chat Interne</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un collègue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filteredColleagues.map((colleague) => (
              <div
                key={colleague.id}
                onClick={() => setSelectedUser(colleague.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedUser === colleague.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {colleague.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    {colleague.online && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-900 truncate">{colleague.name}</p>
                      <p className="text-xs text-gray-500">{colleague.time}</p>
                    </div>
                    <p className="text-xs text-gray-500">{colleague.role}</p>
                    <p className="text-sm text-gray-600 truncate">{colleague.lastMessage}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone de chat */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* En-tête du chat */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {colleagues.find(c => c.id === selectedUser)?.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {colleagues.find(c => c.id === selectedUser)?.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {colleagues.find(c => c.id === selectedUser)?.online ? 'En ligne' : 'Hors ligne'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.isOwn 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-900'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Zone de saisie */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Tapez votre message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez une conversation</h3>
                <p className="text-gray-500">Choisissez un collègue pour commencer à discuter</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InternalChat;