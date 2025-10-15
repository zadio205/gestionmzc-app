'use client';

import React from 'react';
import { Bell, Calculator, FileText, MessageCircle } from 'lucide-react';

interface ClientDashboardWidgetProps {
  clientId: string;
  clientName: string;
}

const ClientDashboardWidget: React.FC<ClientDashboardWidgetProps> = ({
  clientId,
  clientName,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{clientName}</h3>
        <span className="text-sm text-gray-500">ID: {clientId}</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">0</div>
          <div className="text-sm text-gray-600">Documents</div>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <MessageCircle className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">0</div>
          <div className="text-sm text-gray-600">Messages</div>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Calculator className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">0</div>
          <div className="text-sm text-gray-600">Simulations</div>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Bell className="w-6 h-6 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">0</div>
          <div className="text-sm text-gray-600">Alertes</div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Dernière activité:</span>
          <span className="text-gray-900">Aucune activité</span>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboardWidget;