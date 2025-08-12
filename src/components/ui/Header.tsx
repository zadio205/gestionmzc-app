'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User, Menu, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeaderProps {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onOpenMobile?: () => void;
}

const Header: React.FC<HeaderProps> = ({ collapsed = false, onToggleCollapsed, onOpenMobile }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center space-x-3">
          {/* Mobile: bouton menu */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            aria-label="Ouvrir le menu"
            onClick={onOpenMobile}
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>

          {/* Desktop: bouton collapse */}
          <button
            type="button"
            className="hidden md:inline-flex items-center p-2 rounded-lg hover:bg-gray-100 text-gray-700"
            aria-label={collapsed ? 'Déployer la barre latérale' : 'Réduire la barre latérale'}
            onClick={onToggleCollapsed}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>

          <h2 className="text-lg font-semibold text-gray-800">
            Espace {user.role === 'admin' ? 'Administrateur' : user.role === 'collaborateur' ? 'Collaborateur' : 'Client'}
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>{user.name}</span>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;