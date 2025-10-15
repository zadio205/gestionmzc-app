'use client';

import React from 'react';
import Spinner from './Spinner';

interface AuthLoadingScreenProps {
  message?: string;
}

const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({ 
  message = "Chargement en cours..." 
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-6 p-8">
        {/* Logo */}
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl font-bold">M</span>
          </div>
          <span className="ml-3 text-2xl font-bold text-gray-900">asyzarac</span>
        </div>
        
        {/* Loading Spinner */}
        <div className="flex flex-col items-center space-y-4">
          <Spinner size="lg" color="primary" />
          <p className="text-gray-600 text-sm font-medium animate-pulse">
            {message}
          </p>
        </div>
        
        {/* Loading dots animation */}
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
      
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 pointer-events-none" />
    </div>
  );
};

export default AuthLoadingScreen;