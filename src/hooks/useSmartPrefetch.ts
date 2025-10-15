'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

interface PrefetchConfig {
  routes: string[];
  delayMs?: number;
  enabled?: boolean;
}

/**
 * Hook pour précharger intelligemment les routes fréquemment visitées
 * Réduit la latence perçue en préchargeant en arrière-plan
 */
export function useSmartPrefetch(config: PrefetchConfig) {
  const router = useRouter();
  const prefetchedRef = useRef(new Set<string>());
  const { routes, delayMs = 2000, enabled = true } = config;

  useEffect(() => {
    if (!enabled) return;

    const timer = setTimeout(() => {
      routes.forEach((route) => {
        if (!prefetchedRef.current.has(route)) {
          try {
            router.prefetch(route);
            prefetchedRef.current.add(route);
          } catch (error) {
            console.warn(`Failed to prefetch route: ${route}`, error);
          }
        }
      });
    }, delayMs);

    return () => clearTimeout(timer);
  }, [routes, delayMs, enabled, router]);
}

/**
 * Routes communes à précharger selon le rôle
 */
export const getPrefetchRoutes = (userRole: string): string[] => {
  const baseRoute = userRole === 'superadmin' ? 'superadmin' : userRole;

  const commonRoutes = [
    `/${baseRoute}/dashboard`,
    `/${baseRoute}/profile`,
  ];

  const roleRoutes: Record<string, string[]> = {
    admin: [
      `/${baseRoute}/clients`,
      `/${baseRoute}/users`,
      `/${baseRoute}/documents`,
      `/${baseRoute}/tasks`,
    ],
    collaborateur: [
      `/${baseRoute}/clients`,
      `/${baseRoute}/documents`,
      `/${baseRoute}/chat/internal`,
      `/${baseRoute}/tasks`,
    ],
    client: [
      `/${baseRoute}/documents`,
      `/${baseRoute}/chat/clients`,
      `/${baseRoute}/simulator`,
    ],
    superadmin: [
      `/${baseRoute}/admins`,
      `/${baseRoute}/settings`,
    ],
  };

  return [...commonRoutes, ...(roleRoutes[userRole] || [])];
};
