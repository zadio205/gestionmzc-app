'use client';

import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { AlertTriangle, Home } from 'lucide-react';
import { logger } from '@/utils/logger';

interface DashboardErrorBoundaryProps {
  children: React.ReactNode;
  fallbackType?: 'full' | 'widget' | 'inline';
}

const DashboardErrorFallback: React.FC<{ type: 'full' | 'widget' | 'inline' }> = ({ type }) => {
  const handleGoHome = () => {
    window.location.href = '/admin/dashboard';
  };

  if (type === 'widget') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">Erreur de chargement</span>
        </div>
        <p className="text-xs text-red-500 mt-1">
          Ce composant n'a pas pu être chargé
        </p>
      </div>
    );
  }

  if (type === 'inline') {
    return (
      <div className="flex items-center space-x-2 text-red-600 py-2">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm">Une erreur est survenue</span>
      </div>
    );
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md p-6">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-red-100 rounded-full">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Erreur dans le tableau de bord
        </h2>
        
        <p className="text-gray-600 mb-6">
          Le tableau de bord a rencontré une erreur et n'a pas pu être chargé correctement.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Actualiser la page
          </button>
          
          <button
            onClick={handleGoHome}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <Home className="w-4 h-4 inline mr-2" />
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export const DashboardErrorBoundary: React.FC<DashboardErrorBoundaryProps> = ({ 
  children, 
  fallbackType = 'full' 
}) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log dashboard-specific errors
    logger.error('Dashboard Error', {
      errorMessage: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    }, error);

    // Here you could send to error reporting service
    // Example: trackDashboardError(error, errorInfo);
  };

  return (
    <ErrorBoundary 
      fallback={<DashboardErrorFallback type={fallbackType} />}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
};