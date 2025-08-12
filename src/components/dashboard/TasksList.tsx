'use client';

import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  User,
  Calendar,
  MoreHorizontal
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
  assignedTo?: string;
  client?: string;
}

interface TasksListProps {
  tasks: Task[];
  maxItems?: number;
  showActions?: boolean;
  onUpdateStatus?: (id: string, status: Task['status']) => void;
}

const TasksList: React.FC<TasksListProps> = ({ 
  tasks, 
  maxItems = 5,
  showActions = true,
  onUpdateStatus
}) => {
  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'pending':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const displayedTasks = tasks.slice(0, maxItems);

  if (displayedTasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Tâches à traiter
        </h3>
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune tâche en cours</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Tâches à traiter
        </h3>
        <button className="text-sm text-blue-600 hover:text-blue-800">
          Voir toutes
        </button>
      </div>
      
      <div className="space-y-3">
        {displayedTasks.map((task) => (
          <div 
            key={task.id} 
            className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors duration-200"
          >
            <div className="flex items-center space-x-3 flex-1">
              <div className="flex-shrink-0">
                {getStatusIcon(task.status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {task.title}
                  </h4>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                
                {task.description && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {task.description}
                  </p>
                )}
                
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                  {task.dueDate && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{task.dueDate}</span>
                    </div>
                  )}
                  {task.assignedTo && (
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{task.assignedTo}</span>
                    </div>
                  )}
                  {task.client && (
                    <span className="text-blue-600">{task.client}</span>
                  )}
                </div>
              </div>
            </div>
            
            {showActions && onUpdateStatus && (
              <div className="flex-shrink-0 flex items-center space-x-1">
                {task.status !== 'completed' && (
                  <button 
                    onClick={() => onUpdateStatus(task.id, 'completed')}
                    className="p-1 text-green-600 hover:text-green-800"
                    title="Marquer comme terminé"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TasksList;