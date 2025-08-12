'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  UserCog, 
  Calculator, 
  ClipboardList, 
  Newspaper, 
  MessageSquare, 
  MessageCircle, 
  User,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';

interface SidebarProps {
  userRole: 'admin' | 'collaborateur' | 'client';
  userId?: string;
  clientId?: string;
  collapsed?: boolean; // mode condensé (desktop)
  mobileOpen?: boolean; // panneau mobile ouvert
  onCloseMobile?: () => void; // fermer panneau mobile
}

interface MenuItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
  children?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ userRole, userId, clientId, collapsed = false, mobileOpen = false, onCloseMobile }) => {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

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
      href: `/${userRole}/dashboard`,
  icon: <LayoutDashboard className="w-4 h-4" />,
      roles: ['admin', 'collaborateur', 'client'],
    },
    {
      title: 'Gestion des clients',
      href: `/${userRole}/clients`,
  icon: <Users className="w-4 h-4" />,
      roles: ['admin', 'collaborateur'],
    },
    {
      title: 'GED',
      href: `/${userRole}/documents`,
  icon: <FileText className="w-4 h-4" />,
      roles: ['admin', 'collaborateur', 'client'],
    },
    {
      title: 'Gestion des utilisateurs',
      href: `/${userRole}/users`,
  icon: <UserCog className="w-4 h-4" />,
      roles: ['admin'],
    },
    {
      title: 'Simulateur Social',
      href: `/${userRole}/simulator`,
  icon: <Calculator className="w-4 h-4" />,
      roles: ['admin', 'collaborateur', 'client'],
    },
    {
      title: 'Tâches administratives',
      href: `/${userRole}/tasks`,
  icon: <ClipboardList className="w-4 h-4" />,
      roles: ['admin', 'collaborateur'],
    },
    {
      title: 'Actualités',
      href: `/${userRole}/news`,
  icon: <Newspaper className="w-4 h-4" />,
      roles: ['admin', 'collaborateur', 'client'],
    },
    {
      title: 'Chat interne',
      href: `/${userRole}/chat/internal`,
  icon: <MessageSquare className="w-4 h-4" />,
      roles: ['admin', 'collaborateur'],
    },
    {
      title: 'Chat clients',
      href: `/${userRole}/chat/clients`,
  icon: <MessageCircle className="w-4 h-4" />,
      roles: ['admin', 'collaborateur', 'client'],
    },
    {
      title: 'Profil',
      href: `/${userRole}/profile`,
  icon: <User className="w-4 h-4" />,
      roles: ['admin', 'collaborateur', 'client'],
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
          <Link
            href={item.href}
            className={`flex items-center ${showLabels ? 'px-3' : 'px-2 justify-center'} py-3 text-sm font-medium rounded-lg transition-colors duration-200 flex-1 ${
              active
                ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            } ${level > 0 ? 'ml-4' : ''}`}
          >
            <span className={showLabels ? 'mr-2' : ''}>{item.icon}</span>
            {showLabels && <span className="truncate">{item.title}</span>}
          </Link>
          {hasChildren && showLabels && (
            <button
              onClick={() => toggleExpanded(item.title)}
              className="p-2 text-gray-500 hover:text-gray-700"
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
      <div className={`hidden md:flex bg-white shadow-lg h-full border-r border-gray-200 flex-col ${collapsed ? 'w-20' : 'w-56'}`}>
        <div className="p-4 border-b border-gray-200">
          {collapsed ? (
            <h1 className="text-xl font-bold text-gray-800 text-center">M</h1>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-800">Masyzarac</h1>
              <p className="text-sm text-gray-600 capitalize">{userRole}</p>
            </>
          )}
        </div>
        <nav className="p-2 space-y-1">
          {filteredMenuItems.map(item => renderMenuItem(item, 0, !collapsed))}
        </nav>
      </div>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={onCloseMobile} />
          <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-800">Masyzarac</h1>
                <p className="text-sm text-gray-600 capitalize">{userRole}</p>
              </div>
              <button onClick={onCloseMobile} aria-label="Fermer le menu" className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <nav className="p-3 space-y-1 overflow-auto">
              {filteredMenuItems.map(item => renderMenuItem(item, 0, true))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;