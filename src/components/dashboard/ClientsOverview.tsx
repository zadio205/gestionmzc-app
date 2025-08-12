'use client';

import React from 'react';
import { 
  Building2, 
  MessageCircle, 
  FileText, 
  AlertCircle,
  TrendingUp,
  MoreHorizontal
} from 'lucide-react';

interface ClientOverview {
  id: string;
  name: string;
  industry?: string;
  documentsCount: number;
  messagesCount: number;
  alertsCount: number;
  lastActivity: string;
  status: 'active' | 'inactive' | 'pending';
}

interface ClientsOverviewProps {
  clients: ClientOverview[];
  maxItems?: number;
  userRole: 'admin' | 'collaborateur';
}

const ClientsOverview: React.FC<ClientsOverviewProps> = ({ 
  clients, 
  maxItems = 5,
  userRole 
}) => {
  const getStatusColor = (status: ClientOverview['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const displayedClients = clients.slice(0, maxItems);

  if (displayedClients.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {userRole === 'admin' ? 'Clients récents' : 'Mes clients'}
        </h3>
        <div className="text-center py-8">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun client trouvé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {userRole === 'admin' ? 'Clients récents' : 'Mes clients'}
        </h3>
        <button className="text-sm text-blue-600 hover:text-blue-800">
          Voir tous
        </button>
      </div>
      
      <div className="space-y-4">
        {displayedClients.map((client) => (
          <div 
            key={client.id} 
            className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-gray-200 hover:shadow-sm transition-all duration-200"
          >
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {client.name}
                  </h4>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                    {client.status}
                  </span>
                </div>
                
                {client.industry && (
                  <p className="text-xs text-gray-500 mt-1">
                    {client.industry}
                  </p>
                )}
                
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <FileText className="w-3 h-3" />
                    <span>{client.documentsCount}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <MessageCircle className="w-3 h-3" />
                    <span>{client.messagesCount}</span>
                  </div>
                  {client.alertsCount > 0 && (
                    <div className="flex items-center space-x-1 text-xs text-orange-600">
                      <AlertCircle className="w-3 h-3" />
                      <span>{client.alertsCount}</span>
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-gray-400 mt-1">
                  Dernière activité: {client.lastActivity}
                </div>
              </div>
            </div>
            
            <button className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Total: {clients.length} client{clients.length > 1 ? 's' : ''}
          </span>
          <div className="flex items-center space-x-1 text-green-600">
            <TrendingUp className="w-4 h-4" />
            <span>+12% ce mois</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientsOverview;