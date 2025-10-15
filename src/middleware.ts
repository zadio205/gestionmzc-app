/**
 * Middleware de protection des routes selon les rôles utilisateurs
 * Gère l'authentification et les autorisations basées sur les rôles
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { UserRole } from '@/types/auth';
import { normalizeUserRole } from '@/utils/role';
import { logger } from '@/utils/logger';

const profileCache = new Map<string, { profile: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

// ==============================================================================
// CONFIGURATION DES ROUTES
// ==============================================================================

/**
 * Routes publiques accessibles sans authentification
 */
const PUBLIC_ROUTES = [
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/api/auth',
];

/**
 * Routes protégées par rôle
 * Format: { path: string, roles: UserRole[] }
 */
const PROTECTED_ROUTES: Array<{ path: string; roles: UserRole[] }> = [
  // Espace Superadmin
  { path: '/superadmin', roles: ['superadmin'] },

  // Espace Admin
  { path: '/admin', roles: ['superadmin', 'admin'] },

  // Espace Collaborateur
  { path: '/collaborateur', roles: ['superadmin', 'admin', 'collaborateur'] },

  // Espace Client
  { path: '/client', roles: ['client'] },
];

// ==============================================================================
// FONCTIONS UTILITAIRES
// ==============================================================================

/**
 * Vérifie si une route est publique
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Trouve la configuration de route protégée pour un chemin donné
 */
function findProtectedRoute(pathname: string): { path: string; roles: UserRole[] } | null {
  // Trier par longueur décroissante pour matcher les routes les plus spécifiques en premier
  const sorted = [...PROTECTED_ROUTES].sort((a, b) => b.path.length - a.path.length);
  return sorted.find(route => pathname.startsWith(route.path)) || null;
}

/**
 * Vérifie si un utilisateur a accès à une route
 */
function hasRouteAccess(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Redirige vers la page appropriée selon le rôle
 */
function getDefaultRedirect(role: UserRole): string {
  switch (role) {
    case 'superadmin':
      return '/superadmin/dashboard';
    case 'admin':
      return '/admin/dashboard';
    case 'collaborateur':
      return '/collaborateur/dashboard';
    case 'client':
      return '/client/dashboard';
    default:
      return '/';
  }
}

// ==============================================================================
// MIDDLEWARE PRINCIPAL
// ==============================================================================

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const pathname = req.nextUrl.pathname;
  
  // Ajouter des headers de performance pour toutes les requêtes
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Cache statique pour les assets
  if (pathname.startsWith('/_next/static') || pathname.includes('.')) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  }
  
  // Préchargement des ressources critiques
  if (pathname.startsWith('/admin')) {
    response.headers.set('Link', [
      '</admin/dashboard>; rel=prefetch',
      '</admin/clients>; rel=prefetch',
      '</admin/documents>; rel=prefetch'
    ].join(', '));
  }
  
  if (pathname.startsWith('/client')) {
    response.headers.set('Link', [
      '</client/dashboard>; rel=prefetch',
      '</client/documents>; rel=prefetch'
    ].join(', '));
  }

  // Passer les routes publiques et statiques
  if (
    isPublicRoute(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') // fichiers statiques (images, etc.)
  ) {
    return response;
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
            response = NextResponse.next({ request: req });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // Si erreur de session (token invalide), nettoyer et rediriger
    if (sessionError) {
      logger.warn('Invalid session detected in middleware', { error: sessionError.message });
      const response = NextResponse.redirect(new URL('/auth/signin', req.url));
      // Nettoyer les cookies de session
      response.cookies.delete('sb-access-token');
      response.cookies.delete('sb-refresh-token');
      return response;
    }

    // Si pas de session et route protégée, rediriger vers login
    if (!session && !isPublicRoute(pathname)) {
      const redirectUrl = new URL('/auth/signin', req.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (session?.user) {
      const userId = session.user.id;
      const now = Date.now();
      const cached = profileCache.get(userId);
      
      let userRole: UserRole;
      let adminId: string | null = null;

      if (cached && (now - cached.timestamp) < CACHE_TTL) {
        userRole = cached.profile.role;
        adminId = cached.profile.admin_id;
      } else {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, admin_id')
          .eq('id', userId)
          .single();

        if (profileError || !profile) {
          const errorCode = (profileError as any)?.code;
          const isMissing =
            errorCode === 'PGRST116' ||
            errorCode === 'PGRST117' ||
            profileError?.message?.toLowerCase().includes('no rows');

          if (!isMissing) {
            logger.error('Error fetching profile in middleware', { userId }, profileError);
            return NextResponse.redirect(new URL('/auth/signin', req.url));
          }

          const metadata = {
            ...(session.user.app_metadata || {}),
            ...(session.user.user_metadata || {}),
          } as Record<string, unknown>;
          userRole = normalizeUserRole(metadata.role);
          adminId = (metadata.admin_id as string | undefined) ?? null;
        } else {
          userRole = normalizeUserRole(profile.role);
          adminId = profile.admin_id ?? null;
          
          profileCache.set(userId, {
            profile: { role: userRole, admin_id: adminId },
            timestamp: now
          });
        }
      }

      // Vérifier l'accès aux routes protégées
      const protectedRoute = findProtectedRoute(pathname);
      
      if (protectedRoute) {
        const hasAccess = hasRouteAccess(userRole, protectedRoute.roles);
        
        if (!hasAccess) {
          // Rediriger vers la page par défaut du rôle
          const defaultPath = getDefaultRedirect(userRole);
          return NextResponse.redirect(new URL(defaultPath, req.url));
        }
      }

      // Redirection automatique de la page d'accueil selon le rôle
      if (pathname === '/' || pathname === '') {
        const defaultPath = getDefaultRedirect(userRole);
        return NextResponse.redirect(new URL(defaultPath, req.url));
      }

      // Ajouter des headers personnalisés pour faciliter l'accès au rôle côté client
      response.headers.set('x-user-role', userRole);
      response.headers.set('x-user-id', session.user.id);
      if (adminId) {
        response.headers.set('x-admin-id', adminId);
      }
      
      // Headers de sécurité CSP optimisés
      const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https://bhmodzvtsnijrurvkjtv.supabase.co",
        "connect-src 'self' https://bhmodzvtsnijrurvkjtv.supabase.co wss://bhmodzvtsnijrurvkjtv.supabase.co",
        "font-src 'self' data:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ].join('; ');
      
      response.headers.set('Content-Security-Policy', csp);
      
      return response;
    }

    return response;
  } catch (error) {
    logger.error('Middleware error', { pathname }, error as Error);
    return response;
  }
}

// ==============================================================================
// CONFIGURATION
// ==============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};