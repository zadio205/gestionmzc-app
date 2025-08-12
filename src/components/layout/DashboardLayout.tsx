 'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import Header from '@/components/ui/Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: 'admin' | 'collaborateur' | 'client';
  userId?: string;
  clientId?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  userRole,
  userId,
  clientId,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        userRole={userRole} 
        userId={userId} 
        clientId={clientId}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed(c => !c)}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;