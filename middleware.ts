import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public routes — no auth needed
  if (
    path.startsWith('/api/chat') ||      // Widget chat endpoint
    path.startsWith('/api/auth') ||       // Login endpoint
    path === '/login' ||                  // Login page
    path.startsWith('/_next') ||          // Next.js internals
    path.startsWith('/favicon')           // Favicon
  ) {
    return NextResponse.next();
  }

  // Cron route — uses its own auth (Bearer token)
  if (path === '/api/sync' && request.method === 'GET') {
    return NextResponse.next(); // Auth checked inside the route handler
  }

  // Everything else requires admin auth
  if (!isAuthenticated(request)) {
    // API routes get 401
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }
    // Pages get redirected to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
