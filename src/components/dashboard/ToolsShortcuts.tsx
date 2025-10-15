'use client';

import React from 'react';
import { 
  Calculator, 
  FileSpreadsheet, 
  PieChart, 
  TrendingUp,
  FileText,
  Database,
  BarChart3,
  Settings
} from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  href: string;
  isNew?: boolean;
  usage?: number; // Nombre d'utilisations récentes
}

interface ToolsShortcutsProps {
  userRole: 'admin' | 'collaborateur' | 'client';
}

const ToolsShortcuts: React.FC<ToolsShortcutsProps> = ({ userRole }) => {
  const getToolsForRole = () => {
    const commonTools: Tool[] = [
      {
        id: 'simulator',
        name: 'Simulateur social',
        description: 'Calculer les charges sociales',
        icon: Calculator,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        href: `/${userRole}/simulator`,
        usage: 15
      },
      {
        id: 'balance',
        name: 'Balance comptable',
        description: 'Consulter les balances',
        icon: FileSpreadsheet,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        href: `/${userRole}/balance`,
        usage: 8
      },
      {
        id: 'reports',
        name: 'Rapports',
        description: 'Générer des rapports',
        icon: BarChart3,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        href: `/${userRole}/reports`,
        usage: 12
      }
    ];

    if (userRole === 'admin') {
      return [
        ...commonTools,
        {
          id: 'analytics',
          name: 'Analytics',
          description: 'Statistiques globales',
          icon: PieChart,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          href: '/admin/analytics',
          isNew: true,
          usage: 5
        },
        {
          id: 'system',
          name: 'Système',
          description: 'Configuration système',
          icon: Settings,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          href: '/admin/system',
          usage: 3
        },
        {
          id: 'database',
          name: 'Base de données',
          description: 'Gestion des données',
          icon: Database,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-100',
          href: '/admin/database',
          usage: 2
        }
      ];
    }

    if (userRole === 'collaborateur') {
      return [
        ...commonTools,
        {
          id: 'declarations',
          name: 'Déclarations',
          description: 'TVA, IS, liasses fiscales',
          icon: FileText,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          href: '/collaborateur/declarations',
          usage: 6
        },
        {
          id: 'performance',
          name: 'Performance',
          description: 'Suivi de performance',
          icon: TrendingUp,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-100',
          href: '/collaborateur/performance',
          isNew: true,
          usage: 4
        }
      ];
    }

    return commonTools;
  };

  const tools = getToolsForRole();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Outils comptables
        </h3>
        <button className="text-sm text-blue-600 hover:text-blue-800">
          Voir tous
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <a
              key={tool.id}
              href={tool.href}
              className="group relative flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200"
            >
              {tool.isNew && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  Nouveau
                </div>
              )}
              
              <div className={`w-12 h-12 ${tool.bgColor} rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-200`}>
                <Icon className={`w-6 h-6 ${tool.color}`} />
              </div>
              
              <h4 className="text-sm font-medium text-gray-900 text-center mb-1">
                {tool.name}
              </h4>
              
              <p className="text-xs text-gray-500 text-center mb-2">
                {tool.description}
              </p>
              
              {tool.usage && (
                <div className="text-xs text-gray-400">
                  {tool.usage} utilisations
                </div>
              )}
            </a>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {tools.reduce((sum, tool) => sum + (tool.usage || 0), 0)} utilisations ce mois
          </span>
          <button className="text-blue-600 hover:text-blue-800">
            Personnaliser
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolsShortcuts;