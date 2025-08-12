'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { Send, MessageCircle, Phone, Video, Paperclip } from 'lucide-react';

const ClientChat = () => {
  const { user, loading } = useAuth();
  const [message, setMessage] = useState('');

  // Mock data - à remplacer par de vraies données
  const collaborators = [
    { 
      id: '1', 
      name: 'Marie Dupont', 
      role: 'Collaborateur comptable', 
      online: true,
      avatar: 'MD'
    },
    { 
      id: '2', 
      name: 'Jean Martin', 
      role: 'Expert-comptable', 
      online: false,
      avatar: 'JM'
    },
  ];

  const messages = [
    { 
      id: '1', 
      senderId: '1', 
      senderName: 'Marie Dupont', 
      content: 'Bonjour ! J\'ai bien reçu vos documents. Je vais les traiter dans la journée.', 
      timestamp: '09:30', 
      isOwn: false 
    },
    { 
      id: '2', 
      senderId: user?._id, 
      senderName: user?.name, 
      content: 'Parfait, merci beaucoup ! Y a-t-il des documents supplémentaires à fournir ?', 
      timestamp: '09:35', 
      isOwn: true 
    },
    { 
      id: '3', 
      senderId: '1', 
      senderName: 'Marie Dupont', 
      content: 'Non, tout est complet. Je vous tiendrai informé de l\'avancement.', 
      timestamp: '09:40', 
      isOwn: false 
    },
    { 
      id: '4', 
      senderId: user?._id, 
      senderName: user?.name, 
      content: 'Excellent ! Merci pour votre réactivité.', 
      timestamp: '09:42', 
      isOwn: true 
    },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  if (!user || user.role !== 'client') {
    return <div className="flex items-center justify-center h-screen">Accès non autorisé</div>;
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log('Envoi message:', message);
      setMessage('');
    }
  };

  return (
    <DashboardLayout userRole="client" userId={user._id} clientId={user.clientId}>
      <div className="h-full flex bg-white rounded-lg shadow">
        {/* Sidebar avec les collaborateurs */}
        <div className="w-1/4 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Mes Collaborateurs</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {collaborators.map((collaborator) => (
              <div
                key={collaborator.id}
                className="p-4 border-b border-gray-100 hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {collaborator.avatar}
                      </span>
                    </div>
                    {collaborator.online && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{collaborator.name}</p>
                    <p className="text-xs text-gray-500">{collaborator.role}</p>
                    <p className="text-xs text-gray-400">
                      {collaborator.online ? 'En ligne' : 'Hors ligne'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone de chat principale */}
        <div className="flex-1 flex flex-col">
          {/* En-tête du chat */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">MD</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Marie Dupont</h3>
                  <p className="text-sm text-gray-500">Collaborateur comptable • En ligne</p>
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
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                <Paperclip className="w-5 h-5" />
              </button>
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
        </div>

        {/* Panneau d'informations */}
        <div className="w-1/4 border-l border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Actions rapides</h4>
              <div className="space-y-2">
                <button className="w-full text-left p-2 text-sm bg-white rounded hover:bg-gray-100">
                  📄 Mes documents
                </button>
                <button className="w-full text-left p-2 text-sm bg-white rounded hover:bg-gray-100">
                  📊 Simulateur social
                </button>
                <button className="w-full text-left p-2 text-sm bg-white rounded hover:bg-gray-100">
                  📅 Prendre RDV
                </button>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Statut du dossier</h4>
              <p className="text-sm text-blue-700">✅ Documents reçus</p>
              <p className="text-sm text-blue-700">⏳ En cours de traitement</p>
            </div>

            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Prochaine échéance</h4>
              <p className="text-sm text-green-700">Déclaration TVA</p>
              <p className="text-xs text-green-600">Dans 15 jours</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientChat;