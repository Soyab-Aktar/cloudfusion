
import { NextResponse, type NextRequest } from 'next/server';

const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/verify-email'];
const PROTECTED_ROUTES = ['/dashboard', '/files', '/accounts', '/starred', '/trash'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasSession =
    request.cookies.has('accessToken') ||
    request.cookies.has('refreshToken') ||
    request.cookies.has('refresh-token') ||
    request.cookies.has('better-auth.session_token');

  const matchesRoute = (route: string) =>
    pathname === route || pathname.startsWith(`${route}/`);

  const isProtectedRoute = PROTECTED_ROUTES.some(matchesRoute);
  const isAuthRoute = AUTH_ROUTES.some(matchesRoute);

  if (!hasSession && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && (isAuthRoute || pathname === '/')) {
    const authRedirect = new URL('/dashboard', request.url);
    return NextResponse.redirect(authRedirect);
  }

  return NextResponse.next();
}

export const config = {
  // Run on these paths (skip static files, api routes, _next)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
