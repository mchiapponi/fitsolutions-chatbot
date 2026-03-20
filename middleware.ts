import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public routes — no auth needed
  if (
    path.startsWith('/api/chat') ||
    path.startsWith('/api/auth') ||
    path === '/login' ||
    path === '/widget.js' ||
    path.startsWith('/_next') ||
    path.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Cron route — uses its own auth (Bearer token)
  if (path === '/api/sync' && request.method === 'GET') {
    return NextResponse.next();
  }

  // Everything else requires admin auth
  if (!isAuthenticated(request)) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
