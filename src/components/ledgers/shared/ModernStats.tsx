'use client';

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign,
  Calendar,
  BarChart3,
  Activity,
  Zap
} from 'lucide-react';

interface ModernStatsProps {
  entries: any[];
  type: 'clients' | 'suppliers' | 'miscellaneous';
  formatCurrency: (amount: number) => string;
}

const ModernStats: React.FC<ModernStatsProps> = ({ entries, type, formatCurrency }) => {
  const stats = React.useMemo(() => {
    const totalEntries = entries.length;
    const totalDebit = entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
    const totalCredit = entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);
    const totalBalance = totalDebit - totalCredit;
    
    const alertsCount = entries.filter(entry => 
      entry.aiMeta?.suspiciousLevel === 'high' || 
      entry.aiMeta?.suspiciousLevel === 'medium'
    ).length;
    
    const recentEntries = entries.filter(entry => {
      if (!entry.date) return false;
      const entryDate = new Date(entry.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    }).length;
    
    const avgAmount = totalEntries > 0 ? (totalDebit + totalCredit) / totalEntries : 0;
    
    const monthlyTrend = entries.reduce((acc, entry) => {
      if (!entry.date) return acc;
      const month = new Date(entry.date).getMonth();
      const amount = entry.debit || entry.credit || 0;
      acc[month] = (acc[month] || 0) + amount;
      return acc;
    }, {} as Record<number, number>);
    
    const currentMonth = new Date().getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const monthlyGrowth = monthlyTrend[currentMonth] && monthlyTrend[lastMonth] 
      ? ((monthlyTrend[currentMonth] - monthlyTrend[lastMonth]) / monthlyTrend[lastMonth]) * 100
      : 0;
    
    return {
      totalEntries,
      totalDebit,
      totalCredit,
      totalBalance,
      alertsCount,
      recentEntries,
      avgAmount,
      monthlyGrowth
    };
  }, [entries]);

  const getTypeLabel = () => {
    switch (type) {
      case 'clients': return 'Clients';
      case 'suppliers': return 'Fournisseurs';
      case 'miscellaneous': return 'Comptes divers';
      default: return 'Entrées';
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'clients': return 'blue';
      case 'suppliers': return 'orange';
      case 'miscellaneous': return 'purple';
      default: return 'gray';
    }
  };

  const color = getTypeColor();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total entries */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total {getTypeLabel()}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalEntries}</p>
            <div className="flex items-center mt-2">
              <Calendar className="w-4 h-4 text-gray-400 mr-1" />
              <span className="text-sm text-gray-500">{stats.recentEntries} cette semaine</span>
            </div>
          </div>
          <div className={`p-3 rounded-full bg-${color}-100`}>
            <BarChart3 className={`w-6 h-6 text-${color}-600`} />
          </div>
        </div>
      </div>

      {/* Total balance */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Solde Total</p>
            <p className={`text-3xl font-bold mt-2 ${
              stats.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(Math.abs(stats.totalBalance))}
            </p>
            <div className="flex items-center mt-2">
              {stats.totalBalance >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${stats.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.totalBalance >= 0 ? 'Créditeur' : 'Débiteur'}
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-full ${
            stats.totalBalance >= 0 ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <DollarSign className={`w-6 h-6 ${
              stats.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'
            }`} />
          </div>
        </div>
      </div>

      {/* Monthly growth */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Évolution Mensuelle</p>
            <p className={`text-3xl font-bold mt-2 ${
              stats.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth.toFixed(1)}%
            </p>
            <div className="flex items-center mt-2">
              <Activity className="w-4 h-4 text-gray-400 mr-1" />
              <span className="text-sm text-gray-500">vs mois dernier</span>
            </div>
          </div>
          <div className={`p-3 rounded-full ${
            stats.monthlyGrowth >= 0 ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {stats.monthlyGrowth >= 0 ? (
              <TrendingUp className="w-6 h-6 text-green-600" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-600" />
            )}
          </div>
        </div>
      </div>

      {/* Alerts & AI */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Alertes IA</p>
            <p className={`text-3xl font-bold mt-2 ${
              stats.alertsCount > 0 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {stats.alertsCount}
            </p>
            <div className="flex items-center mt-2">
              {stats.alertsCount > 0 ? (
                <AlertTriangle className="w-4 h-4 text-yellow-500 mr-1" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-green-500 mr-1" />
              )}
              <span className={`text-sm ${
                stats.alertsCount > 0 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {stats.alertsCount > 0 ? 'Attention requise' : 'Tout va bien'}
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-full ${
            stats.alertsCount > 0 ? 'bg-yellow-100' : 'bg-green-100'
          }`}>
            <Zap className={`w-6 h-6 ${
              stats.alertsCount > 0 ? 'text-yellow-600' : 'text-green-600'
            }`} />
          </div>
        </div>
      </div>


    </div>
  );
};

export default ModernStats;
