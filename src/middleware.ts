import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt } from 'jose';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from Authorization header or cookie
  const authHeader = request.headers.get('authorization');
  const tokenFromHeader = authHeader?.replace('Bearer ', '');
  const tokenFromCookie = request.cookies.get('access_token')?.value;
  const token = tokenFromCookie || tokenFromHeader;

  const isAuthPage = pathname.startsWith('/login');
  const isAdminPage = pathname.startsWith('/admin');
  const isApiRoute = pathname.startsWith('/api');

  // Skip middleware for API routes and static files
  if (isApiRoute) {
    return NextResponse.next();
  }

  // No token — redirect to login
  if (!token && !isAuthPage) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Has token and trying to access login — redirect to leads
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/leads', request.url));
  }

  // Check admin access
  if (token && isAdminPage) {
    try {
      // Decode JWT payload only for edge-side route gating; server still verifies signature.
      const payload = decodeJwt(token) as { role?: string };
      if (!['admin', 'superadmin'].includes(payload.role || '')) {
        return NextResponse.redirect(new URL('/leads', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
