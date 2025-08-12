'use client';

import React, { useState } from 'react';
import { X, BarChart3, Users, Truck, FileText } from 'lucide-react';
import { Client } from '@/types';
import BalancePage from './modal-pages/BalancePage';
import ClientsLedgerPage from './modal-pages/ClientsLedgerPage';
import SuppliersLedgerPage from './modal-pages/SuppliersLedgerPage';
import MiscellaneousLedgerPage from './modal-pages/MiscellaneousLedgerPage';

interface ClientDetailsModalProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'balance' | 'clients' | 'suppliers' | 'miscellaneous';

const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({
  client,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('balance');

  if (!isOpen) return null;

  const tabs = [
    {
      id: 'balance' as TabType,
      name: 'Balance',
      icon: BarChart3,
      color: 'blue',
    },
    {
      id: 'clients' as TabType,
      name: 'Clients',
      icon: Users,
      color: 'green',
    },
    {
      id: 'suppliers' as TabType,
      name: 'Fournisseurs',
      icon: Truck,
      color: 'orange',
    },
    {
      id: 'miscellaneous' as TabType,
      name: 'Comptes divers',
      icon: FileText,
      color: 'purple',
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'balance':
        return <BalancePage clientId={client._id} />;
      case 'clients':
        return <ClientsLedgerPage clientId={client._id} />;
      case 'suppliers':
        return <SuppliersLedgerPage clientId={client._id} />;
      case 'miscellaneous':
        return <MiscellaneousLedgerPage clientId={client._id} />;
      default:
        return <BalancePage clientId={client._id} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full h-full bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-sm text-gray-600">
              {client.email} • Dossier: {client.dossierNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm transition-colors relative ${
                  isActive
                    ? `text-${tab.color}-600 bg-white border-b-2 border-${tab.color}-600`
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ClientDetailsModal;