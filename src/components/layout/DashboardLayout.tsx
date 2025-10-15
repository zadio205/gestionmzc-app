'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import Header from '@/components/ui/Header';
import NavigationProgress from '@/components/ui/NavigationProgress';
import { DashboardErrorBoundary } from '@/components/ui/DashboardErrorBoundary';
import { trackRoute } from '@/lib/routeCache';
import { usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: 'superadmin' | 'admin' | 'collaborateur' | 'client';
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
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true); // Auto-collapse on mobile
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu when route changes or screen becomes desktop
  useEffect(() => {
    if (!isMobile && mobileOpen) {
      setMobileOpen(false);
    }
  }, [isMobile, mobileOpen]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };

    if (mobileOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [mobileOpen]);

  // Tracker les routes visitées pour le cache intelligent
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) {
      trackRoute(pathname);
    }
  }, [pathname]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Barre de progression pour les transitions */}
      <NavigationProgress />
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/20 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <Sidebar 
        userRole={userRole} 
        userId={userId} 
        clientId={clientId}
        collapsed={isMobile ? false : collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        isMobile={isMobile}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header 
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed(c => !c)}
          onOpenMobile={() => setMobileOpen(true)}
          isMobile={isMobile}
        />
        
        <main 
          className="flex-1 overflow-auto"
          id="main-content"
          role="main"
          aria-label="Main content"
        >
          <div className="container-responsive py-4 md:py-6 lg:py-8">
            <DashboardErrorBoundary fallbackType="inline">
              {children}
            </DashboardErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;