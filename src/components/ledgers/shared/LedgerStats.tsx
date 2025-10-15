import React from 'react';
import {
  ChartBarIcon,
  CheckCircleIcon,
  CurrencyEuroIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency } from '@/services/clientLedgerService';

interface StatCard {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  description?: string;
}

interface LedgerStatsProps {
  type: 'client' | 'supplier' | 'miscellaneous' | 'balance';
  stats: {
    totalEntries?: number;
    totalDebit?: number;
    totalCredit?: number;
    balance?: number;
    pendingItems?: number;
    overdueItems?: number;
    paidItems?: number;
    uniqueClients?: number;
    uniqueSuppliers?: number;
    averageAmount?: number;
    period?: string;
  };
  loading?: boolean;
  error?: string;
}

const LedgerStats: React.FC<LedgerStatsProps> = ({
  type,
  stats,
  loading = false,
  error,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
          <div className="text-sm text-red-700">Erreur de chargement: {error}</div>
        </div>
      </div>
    );
  }

  const getStatCards = (): StatCard[] => {
    const baseCards: StatCard[] = [];

    switch (type) {
      case 'client':
        baseCards.push(
          {
            title: 'Total Clients',
            value: stats.uniqueClients || 0,
            icon: <UserGroupIcon className="h-6 w-6" />,
            color: 'blue',
            description: 'Clients uniques',
          },
          {
            title: 'Total Débit',
            value: formatCurrency(stats.totalDebit || 0),
            icon: <CurrencyEuroIcon className="h-6 w-6" />,
            color: 'red',
            description: 'Montant total dû',
          },
          {
            title: 'Total Crédit',
            value: formatCurrency(stats.totalCredit || 0),
            icon: <CurrencyEuroIcon className="h-6 w-6" />,
            color: 'green',
            description: 'Montant total payé',
          },
          {
            title: 'Solde',
            value: formatCurrency(stats.balance || 0),
            icon: <ChartBarIcon className="h-6 w-6" />,
            color: stats.balance && stats.balance > 0 ? 'red' : 'green',
            description: stats.balance && stats.balance > 0
              ? 'Montant à recevoir'
              : 'Solde positif',
          }
        );

        if (stats.pendingItems !== undefined || stats.overdueItems !== undefined || stats.paidItems !== undefined) {
          baseCards.push(
            {
              title: 'Factures en attente',
              value: stats.pendingItems || 0,
              icon: <ExclamationTriangleIcon className="h-6 w-6" />,
              color: 'yellow',
              description: 'En attente de paiement',
            },
            {
              title: 'Factures en retard',
              value: stats.overdueItems || 0,
              icon: <ExclamationTriangleIcon className="h-6 w-6" />,
              color: 'red',
              description: 'Retard de paiement',
            },
            {
              title: 'Factures payées',
              value: stats.paidItems || 0,
              icon: <CheckCircleIcon className="h-6 w-6" />,
              color: 'green',
              description: 'Montant réglé',
            }
          );
        }
        break;

      case 'supplier':
        baseCards.push(
          {
            title: 'Total Fournisseurs',
            value: stats.uniqueSuppliers || 0,
            icon: <UserGroupIcon className="h-6 w-6" />,
            color: 'blue',
            description: 'Fournisseurs uniques',
          },
          {
            title: 'Total Débit',
            value: formatCurrency(stats.totalDebit || 0),
            icon: <CurrencyEuroIcon className="h-6 w-6" />,
            color: 'green',
            description: 'Montant total payé',
          },
          {
            title: 'Total Crédit',
            value: formatCurrency(stats.totalCredit || 0),
            icon: <CurrencyEuroIcon className="h-6 w-6" />,
            color: 'red',
            description: 'Montant dû',
          },
          {
            title: 'Solde',
            value: formatCurrency(stats.balance || 0),
            icon: <ChartBarIcon className="h-6 w-6" />,
            color: stats.balance && stats.balance > 0 ? 'green' : 'red',
            description: stats.balance && stats.balance > 0
              ? 'Solde positif'
              : 'Montant à payer',
          }
        );
        break;

      case 'miscellaneous':
        baseCards.push(
          {
            title: 'Total Écritures',
            value: stats.totalEntries || 0,
            icon: <DocumentTextIcon className="h-6 w-6" />,
            color: 'gray',
            description: 'Nombre total',
          },
          {
            title: 'Total Débit',
            value: formatCurrency(stats.totalDebit || 0),
            icon: <CurrencyEuroIcon className="h-6 w-6" />,
            color: 'red',
            description: 'Total débit',
          },
          {
            title: 'Total Crédit',
            value: formatCurrency(stats.totalCredit || 0),
            icon: <CurrencyEuroIcon className="h-6 w-6" />,
            color: 'green',
            description: 'Total crédit',
          },
          {
            title: 'Moyenne',
            value: formatCurrency(stats.averageAmount || 0),
            icon: <ChartBarIcon className="h-6 w-6" />,
            color: 'purple',
            description: 'Montant moyen',
          }
        );
        break;

      case 'balance':
        baseCards.push(
          {
            title: 'Total Actif',
            value: formatCurrency(stats.totalDebit || 0),
            icon: <ChartBarIcon className="h-6 w-6" />,
            color: 'blue',
            description: 'Actifs totaux',
          },
          {
            title: 'Total Passif',
            value: formatCurrency(stats.totalCredit || 0),
            icon: <ChartBarIcon className="h-6 w-6" />,
            color: 'yellow',
            description: 'Passifs totaux',
          },
          {
            title: 'Capitaux Propres',
            value: formatCurrency(stats.balance || 0),
            icon: <CurrencyEuroIcon className="h-6 w-6" />,
            color: 'green',
            description: 'Valeur nette',
          },
          {
            title: 'Période',
            value: stats.period || 'N/A',
            icon: <DocumentTextIcon className="h-6 w-6" />,
            color: 'gray',
            description: 'Période analysée',
          }
        );
        break;
    }

    return baseCards;
  };

  const getColorClasses = (color: StatCard['color']) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        icon: 'text-blue-600',
        text: 'text-blue-600',
      },
      green: {
        bg: 'bg-green-50',
        icon: 'text-green-600',
        text: 'text-green-600',
      },
      yellow: {
        bg: 'bg-yellow-50',
        icon: 'text-yellow-600',
        text: 'text-yellow-600',
      },
      red: {
        bg: 'bg-red-50',
        icon: 'text-red-600',
        text: 'text-red-600',
      },
      purple: {
        bg: 'bg-purple-50',
        icon: 'text-purple-600',
        text: 'text-purple-600',
      },
      gray: {
        bg: 'bg-gray-50',
        icon: 'text-gray-600',
        text: 'text-gray-600',
      },
    };

    return colorMap[color];
  };

  const statCards = getStatCards();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const colorClasses = getColorClasses(stat.color);

        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg ${colorClasses.bg}`}>
                <div className={colorClasses.icon}>{stat.icon}</div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className={`text-2xl font-bold ${colorClasses.text}`}>
                  {stat.value}
                </p>
                {stat.description && (
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                )}
              </div>
            </div>

            {stat.change && (
              <div className="mt-4">
                <div className="flex items-center">
                  <span
                    className={`text-sm font-medium ${
                      stat.change.type === 'increase'
                        ? 'text-green-600'
                        : stat.change.type === 'decrease'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {stat.change.type === 'increase' ? '↑' :
                     stat.change.type === 'decrease' ? '↓' : '→'}
                    {' '}
                    {Math.abs(stat.change.value)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    vs période précédente
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LedgerStats;