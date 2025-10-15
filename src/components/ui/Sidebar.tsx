'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import OptimizedLink from '@/components/ui/OptimizedLink';
import { getPrefetchRoutes, useSmartPrefetch } from '@/hooks/useSmartPrefetch';
import { 
  Calculator, 
  ChevronDown, 
  ChevronRight, 
  ClipboardList, 
  FileText, 
  LayoutDashboard, 
  MessageCircle, 
  MessageSquare, 
  Newspaper, 
  Shield,
  User,
  UserCog,
  Users,
  X
} from 'lucide-react';

interface SidebarProps {
  userRole: 'superadmin' | 'admin' | 'collaborateur' | 'client';
  userId?: string;
  clientId?: string;
  collapsed?: boolean; // mode condensé (desktop)
  mobileOpen?: boolean; // panneau mobile ouvert
  onCloseMobile?: () => void; // fermer panneau mobile
  isMobile?: boolean; // mobile detection
}

interface MenuItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
  children?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ userRole, userId, clientId, collapsed = false, mobileOpen = false, onCloseMobile, isMobile = false }) => {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const baseRoute = userRole === 'superadmin' ? 'superadmin' : userRole;

  // Précharger intelligemment les routes fréquemment utilisées
  useSmartPrefetch({
    routes: getPrefetchRoutes(userRole),
    delayMs: 1500, // Attendre 1.5s après le montage
    enabled: true,
  });

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const menuItems: MenuItem[] = [
    {
      title: 'Tableau de bord',
      href: `/${baseRoute}/dashboard`,
      icon: <LayoutDashboard className="w-4 h-4" />,
      roles: ['superadmin', 'admin', 'collaborateur', 'client'],
    },
    {
      title: 'Gestion des administrateurs',
      href: `/${baseRoute}/admins`,
      icon: <UserCog className="w-4 h-4" />,
      roles: ['superadmin'],
    },
    {
      title: 'Paramètres plateforme',
      href: `/${baseRoute}/settings`,
      icon: <Shield className="w-4 h-4" />,
      roles: ['superadmin'],
    },
    {
      title: 'Gestion des clients',
      href: `/${baseRoute}/clients`,
      icon: <Users className="w-4 h-4" />,
      roles: ['admin', 'collaborateur'],
    },
    {
      title: 'GED',
      href: `/${baseRoute}/documents`,
      icon: <FileText className="w-4 h-4" />,
      roles: ['admin', 'collaborateur', 'client'],
    },
    {
      title: 'Gestion des utilisateurs',
      href: `/${baseRoute}/users`,
      icon: <UserCog className="w-4 h-4" />,
      roles: ['admin'],
    },
    {
      title: 'Simulateur Social',
      href: `/${baseRoute}/simulator`,
      icon: <Calculator className="w-4 h-4" />,
      roles: ['admin', 'collaborateur', 'client'],
    },
    {
      title: 'Tâches administratives',
      href: `/${baseRoute}/tasks`,
      icon: <ClipboardList className="w-4 h-4" />,
      roles: ['admin', 'collaborateur', 'client'],
    },
    {
      title: 'Actualités',
      href: `/${baseRoute}/news`,
      icon: <Newspaper className="w-4 h-4" />,
      roles: ['admin', 'collaborateur', 'client'],
    },
    {
      title: 'Chat interne',
      href: `/${baseRoute}/chat/internal`,
      icon: <MessageSquare className="w-4 h-4" />,
      roles: ['admin', 'collaborateur'],
    },
    {
      title: 'Chat clients',
      href: `/${baseRoute}/chat/clients`,
      icon: <MessageCircle className="w-4 h-4" />,
      roles: ['admin', 'collaborateur', 'client'],
    },
    {
      title: 'Profil',
      href: `/${baseRoute}/profile`,
      icon: <User className="w-4 h-4" />,
      roles: ['superadmin', 'admin', 'collaborateur', 'client'],
    },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  );

  const isActive = (href: string) => {
    const current = pathname ?? '';
    return current === href || current.startsWith(href + '/');
  };

  const renderMenuItem = (item: MenuItem, level = 0, showLabels = true) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const active = isActive(item.href);

    return (
      <div key={item.title} className="mb-1">
        <div className="flex items-center">
          <OptimizedLink
            href={item.href}
            prefetchOnHover={true}
            showProgress={true}
            className={`flex items-center ${showLabels ? 'px-3' : 'px-2 justify-center'} py-3 text-sm font-medium rounded-lg transition-colors duration-200 flex-1 ${
              active
                ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            } ${level > 0 ? 'ml-4' : ''}`}
          >
            <span className={showLabels ? 'mr-2' : ''}>{item.icon}</span>
            {showLabels && <span className="truncate">{item.title}</span>}
          </OptimizedLink>
          {hasChildren && showLabels && (
            <button
              onClick={() => toggleExpanded(item.title)}
              className="p-2 text-gray-600 hover:text-gray-800"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {item.children?.map(child => renderMenuItem(child, level + 1, showLabels))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div 
        className={`hidden md:flex bg-white shadow-lg h-full border-r border-gray-200 flex-col transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-56'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="p-4 border-b border-gray-200">
          {collapsed ? (
            <h1 className="text-xl font-bold text-gray-800 text-center" aria-label="Masyzarac">M</h1>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-800">Masyzarac</h1>
              <p className="text-sm text-gray-600 capitalize">{userRole}</p>
            </>
          )}
        </div>
        <nav className="p-2 space-y-1 overflow-y-auto flex-1">
          {filteredMenuItems.map(item => renderMenuItem(item, 0, !collapsed))}
        </nav>
      </div>

      {/* Mobile sidebar */}
      {isMobile && (
        <div 
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Masyzarac</h1>
              <p className="text-sm text-gray-600 capitalize">{userRole}</p>
            </div>
            <button 
              onClick={onCloseMobile} 
              aria-label="Fermer le menu" 
              className="p-2 rounded-lg hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <nav className="p-3 space-y-1 overflow-y-auto flex-1">
            {filteredMenuItems.map(item => renderMenuItem(item, 0, true))}
          </nav>
        </div>
      )}
    </>
  );
};

export default Sidebar;