"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBgColor,
  trend,
  description,
}) => {
  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div
              className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}
            >
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {value}
                </div>
                {trend && (
                  <div
                    className={`ml-2 flex items-baseline text-sm font-semibold ${
                      trend.isPositive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    <span>
                      {trend.isPositive ? "+" : ""}
                      {trend.value}%
                    </span>
                  </div>
                )}
              </dd>
              {description && (
                <dd className="text-xs text-gray-400 mt-1">{description}</dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
