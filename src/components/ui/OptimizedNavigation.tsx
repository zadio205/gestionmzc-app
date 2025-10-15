'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface OptimizedNavigationProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetch?: boolean;
  preloadDelay?: number;
}

export const OptimizedNavigation: React.FC<OptimizedNavigationProps> = ({
  href,
  children,
  className = '',
  prefetch = true,
  preloadDelay = 200
}) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  const isActive = pathname === href;
  const [preloadTimer, setPreloadTimer] = useState<NodeJS.Timeout | null>(null);

  // Préchargement au hover avec délai
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (prefetch && !isActive) {
      const timer = setTimeout(() => {
        router.prefetch(href);
      }, preloadDelay);
      setPreloadTimer(timer);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (preloadTimer) {
      clearTimeout(preloadTimer);
      setPreloadTimer(null);
    }
  };

  const handleClick = async (e: React.MouseEvent) => {
    if (href === pathname) {
      e.preventDefault();
      return;
    }

    setIsNavigating(true);
    
    // Délai minimal pour montrer l'état de chargement
    const minDelay = new Promise(resolve => setTimeout(resolve, 150));
    
    try {
      await minDelay;
    } finally {
      // Le chargement sera géré par Next.js et nos pages loading.tsx
      setTimeout(() => setIsNavigating(false), 100);
    }
  };

  // Nettoyage du timer au démontage
  useEffect(() => {
    return () => {
      if (preloadTimer) {
        clearTimeout(preloadTimer);
      }
    };
  }, [preloadTimer]);

  const baseClassName = `
    relative inline-flex items-center justify-center
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    ${isActive ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}
    ${isHovered ? 'transform scale-105' : ''}
    ${isNavigating ? 'opacity-75 cursor-wait' : 'cursor-pointer'}
    ${className}
  `;

  return (
    <Link 
      href={href}
      className={baseClassName.trim()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      prefetch={prefetch}
    >
      {isNavigating && (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      )}
      {children}
      
      {/* Indicateur de lien actif */}
      {isActive && (
        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
      )}
      
      {/* Effet de survol */}
      {isHovered && !isActive && (
        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gray-300 rounded-full opacity-50" />
      )}
    </Link>
  );
};

export default OptimizedNavigation;