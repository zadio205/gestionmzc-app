'use client';

import React from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  FileText,
  MessageCircle,
  Upload,
  UserPlus
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'document' | 'message' | 'user' | 'task' | 'alert';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  client?: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  maxItems?: number;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  activities, 
  maxItems = 5 
}) => {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'document':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'message':
        return <MessageCircle className="w-4 h-4 text-green-600" />;
      case 'user':
        return <UserPlus className="w-4 h-4 text-purple-600" />;
      case 'task':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'alert':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityBgColor = (type: Activity['type']) => {
    switch (type) {
      case 'document':
        return 'bg-blue-50';
      case 'message':
        return 'bg-green-50';
      case 'user':
        return 'bg-purple-50';
      case 'task':
        return 'bg-emerald-50';
      case 'alert':
        return 'bg-orange-50';
      default:
        return 'bg-gray-50';
    }
  };

  const displayedActivities = activities.slice(0, maxItems);

  if (displayedActivities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Activité récente
        </h3>
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune activité récente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Activité récente
        </h3>
        <button className="text-sm text-blue-600 hover:text-blue-800">
          Voir tout
        </button>
      </div>
      
      <div className="space-y-4">
        {displayedActivities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className={`flex-shrink-0 w-8 h-8 ${getActivityBgColor(activity.type)} rounded-full flex items-center justify-center`}>
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900">
                {activity.title}
              </div>
              <div className="text-sm text-gray-500">
                {activity.description}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-400">
                  {activity.timestamp}
                </span>
                {activity.user && (
                  <>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-500">
                      {activity.user}
                    </span>
                  </>
                )}
                {activity.client && (
                  <>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-500">
                      {activity.client}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;