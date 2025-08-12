import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Pages publiques qui ne nécessitent pas d'authentification
  const publicPaths = ['/auth/signin', '/auth/signup', '/'];

  // Si l'utilisateur essaie d'accéder à une page protégée sans token
  if (!publicPaths.includes(pathname) && !token) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // Si l'utilisateur est sur la page racine et a un token, rediriger vers signin pour gérer la redirection
  if (pathname === '/' && token) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};