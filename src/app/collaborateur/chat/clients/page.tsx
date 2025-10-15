'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import UnauthorizedRedirect from '@/components/auth/UnauthorizedRedirect';
import { MessageCircle, Phone, Search, Send, Video } from 'lucide-react';

const ClientChat = () => {
  const { user, loading } = useAuth();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - à remplacer par de vraies données
  const clients = [
    { 
      id: '1', 
      name: 'Entreprise ABC', 
      contact: 'Pierre Durand', 
      online: true, 
      lastMessage: 'Merci pour les documents comptables', 
      time: '14:30',
      unread: 2
    },
    { 
      id: '2', 
      name: 'SARL Martin', 
      contact: 'Marie Martin', 
      online: false, 
      lastMessage: 'Quand aura lieu notre prochain rendez-vous ?', 
      time: 'Hier',
      unread: 0
    },
    { 
      id: '3', 
      name: 'SAS Innovation', 
      contact: 'Jean Dupont', 
      online: true, 
      lastMessage: 'Les bilans sont-ils prêts ?', 
      time: '11:45',
      unread: 1
    },
  ];

  const messages = [
    { 
      id: '1', 
      senderId: '1', 
      senderName: 'Pierre Durand', 
      content: 'Bonjour, j\'aimerais avoir des informations sur mes déclarations fiscales.', 
      timestamp: '14:25', 
      isOwn: false 
    },
    { 
      id: '2', 
      senderId: user?.id, 
      senderName: user?.name, 
      content: 'Bonjour Pierre, bien sûr ! Je vais vous préparer un récapitulatif de vos déclarations.', 
      timestamp: '14:27', 
      isOwn: true 
    },
    { 
      id: '3', 
      senderId: '1', 
      senderName: 'Pierre Durand', 
      content: 'Parfait, merci beaucoup !', 
      timestamp: '14:30', 
      isOwn: false 
    },
  ];

  if (!user && !loading) {
    return <UnauthorizedRedirect />;
  }

  if (user && user.role !== 'collaborateur') {
    return <UnauthorizedRedirect />;
  }

  if (!user) return null;

  const handleSendMessage = () => {
    if (message.trim() && selectedClient) {
      // TODO: Implémenter l'envoi de message
      setMessage('');
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout userRole="collaborateur" userId={user.id}>
      <div className="h-full flex bg-white rounded-lg shadow">
        {/* Liste des clients */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Chat Clients</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedClient === client.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {client.name.split(' ')[0][0]}{client.contact.split(' ')[0][0]}
                      </span>
                    </div>
                    {client.online && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                      <div className="flex items-center space-x-1">
                        <p className="text-xs text-gray-500">{client.time}</p>
                        {client.unread > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {client.unread}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">{client.contact}</p>
                    <p className="text-sm text-gray-600 truncate">{client.lastMessage}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone de chat */}
        <div className="flex-1 flex flex-col">
          {selectedClient ? (
            <>
              {/* En-tête du chat */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {clients.find(c => c.id === selectedClient)?.name.split(' ')[0][0]}
                        {clients.find(c => c.id === selectedClient)?.contact.split(' ')[0][0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {clients.find(c => c.id === selectedClient)?.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {clients.find(c => c.id === selectedClient)?.contact} • {' '}
                        {clients.find(c => c.id === selectedClient)?.online ? 'En ligne' : 'Hors ligne'}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                      <Video className="w-5 h-5" />
                    </button>
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
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez un client</h3>
                <p className="text-gray-500">Choisissez un client pour commencer la conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientChat;