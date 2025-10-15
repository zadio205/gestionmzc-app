'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User, Menu, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeaderProps {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onOpenMobile?: () => void;
  isMobile?: boolean;
}

const Header: React.FC<HeaderProps> = ({ collapsed = false, onToggleCollapsed, onOpenMobile, isMobile = false }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 relative z-30">
      <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          {/* Mobile: bouton menu */}
          {isMobile && (
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors"
              aria-label="Ouvrir le menu"
              onClick={onOpenMobile}
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
          )}

          {/* Desktop: bouton collapse */}
          {!isMobile && (
            <button
              type="button"
              className="inline-flex items-center p-2 rounded-lg hover:bg-gray-100 text-gray-700 focus:ring-2 focus:ring-blue-500 transition-colors"
              aria-label={collapsed ? 'Déployer la barre latérale' : 'Réduire la barre latérale'}
              onClick={onToggleCollapsed}
            >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          )}

          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
              Espace {user.role === 'admin' ? 'Administrateur' : user.role === 'collaborateur' ? 'Collaborateur' : 'Client'}
            </h2>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
            <User className="w-4 h-4" aria-hidden="true" />
            <span className="truncate max-w-32">{user.name}</span>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500"
            aria-label="Déconnexion"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;