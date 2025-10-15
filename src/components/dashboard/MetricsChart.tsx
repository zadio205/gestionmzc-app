'use client';

import React from 'react';
import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react';

interface ChartData {
  label: string;
  value: number;
  change?: number;
}

interface MetricsChartProps {
  title: string;
  data: ChartData[];
  type?: 'bar' | 'line' | 'progress';
  period?: string;
}

const MetricsChart: React.FC<MetricsChartProps> = ({ 
  title, 
  data, 
  type = 'bar',
  period = 'Ce mois' 
}) => {
  const maxValue = Math.max(...data.map(d => d.value));

  const renderBarChart = () => (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                {item.change !== undefined && (
                  <div className={`flex items-center space-x-1 text-xs ${
                    item.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.change >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>{Math.abs(item.change)}%</span>
                  </div>
                )}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderProgressChart = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {data.map((item, index) => (
        <div key={index} className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-2">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-200"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-blue-600"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${item.value}, 100`}
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-700">{item.label}</div>
          {item.change !== undefined && (
            <div className={`text-xs mt-1 ${
              item.change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {item.change >= 0 ? '+' : ''}{item.change}% vs mois dernier
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{period}</p>
        </div>
        <BarChart3 className="w-5 h-5 text-gray-400" />
      </div>
      
      {type === 'progress' ? renderProgressChart() : renderBarChart()}
    </div>
  );
};

export default MetricsChart;