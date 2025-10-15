"use client";

import React from "react";
import { TrendingUp, TrendingDown, BarChart3, PieChart, DollarSign, Target, Activity, Shield } from "lucide-react";
import { BalanceIndicator } from "@/types/accounting";

interface BalanceIndicatorsProps {
  indicators: BalanceIndicator;
  loading?: boolean;
}

interface IndicatorCard {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  format?: 'currency' | 'percentage' | 'number';
  description?: string;
}

const BalanceIndicators: React.FC<BalanceIndicatorsProps> = ({ 
  indicators, 
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const formatValue = (value: number, format: 'currency' | 'percentage' | 'number' = 'currency') => {
    switch (format) {
      case 'currency':
        return value.toLocaleString('fr-FR', {
          style: 'currency',
          currency: 'EUR'
        });
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'number':
        return value.toLocaleString('fr-FR');
      default:
        return value.toString();
    }
  };

  const getIndicatorColor = (value: number, isPositiveGood: boolean = true) => {
    if (value === 0) return 'text-gray-600';
    if (isPositiveGood ? value > 0 : value < 0) return 'text-green-600';
    return 'text-red-600';
  };

  const cards: IndicatorCard[] = [
    {
      label: "Actif Total",
      value: indicators.totalAssets,
      icon: <DollarSign className="w-5 h-5" />,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      format: "currency",
      description: "Total des actifs de l'entreprise"
    },
    {
      label: "Passif Total",
      value: indicators.totalLiabilities,
      icon: <Target className="w-5 h-5" />,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      format: "currency",
      description: "Total des dettes et obligations"
    },
    {
      label: "Capitaux Propres",
      value: indicators.totalEquity,
      icon: <Shield className="w-5 h-5" />,
      color: "text-green-600",
      bgColor: "bg-green-100",
      format: "currency",
      description: "Valeur nette de l'entreprise"
    },
    {
      label: "Résultat Net",
      value: indicators.netResult,
      icon: <TrendingUp className="w-5 h-5" />,
      color: getIndicatorColor(indicators.netResult),
      bgColor: indicators.netResult >= 0 ? "bg-green-100" : "bg-red-100",
      format: "currency",
      description: "Profit ou perte de la période"
    },
    {
      label: "Fonds de Roulement",
      value: indicators.workingCapital,
      icon: <Activity className="w-5 h-5" />,
      color: getIndicatorColor(indicators.workingCapital),
      bgColor: "bg-purple-100",
      format: "currency",
      description: "Liquidités à court terme"
    },
    {
      label: "Ratio de Liquidité",
      value: indicators.currentRatio,
      icon: <BarChart3 className="w-5 h-5" />,
      color: indicators.currentRatio >= 1 ? "text-green-600" : "text-red-600",
      bgColor: "bg-indigo-100",
      format: "number",
      description: "Capacité à payer les dettes à court terme"
    },
    {
      label: "Ratio d'Endettement",
      value: indicators.debtRatio,
      icon: <TrendingDown className="w-5 h-5" />,
      color: getIndicatorColor(indicators.debtRatio, false),
      bgColor: "bg-red-100",
      format: "percentage",
      description: "Proportion de dettes par rapport aux actifs"
    },
    {
      label: "Marge Bénéficiaire",
      value: indicators.profitMargin,
      icon: <PieChart className="w-5 h-5" />,
      color: getIndicatorColor(indicators.profitMargin),
      bgColor: "bg-emerald-100",
      format: "percentage",
      description: "Rentabilité de l'entreprise"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <div className={card.color}>
                {card.icon}
              </div>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {card.label}
          </h3>
          
          <p className={`text-2xl font-bold mb-2 ${card.color}`}>
            {formatValue(card.value, card.format)}
          </p>
          
          {card.description && (
            <p className="text-sm text-gray-600">
              {card.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default BalanceIndicators;