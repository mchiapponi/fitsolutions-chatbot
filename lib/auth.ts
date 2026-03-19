import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const COOKIE_NAME = 'fsc_auth';

function getAuthToken(): string {
  // Simple hash of password + secret as token
  const secret = process.env.AUTH_SECRET || 'default-secret';
  const password = process.env.ADMIN_PASSWORD || 'admin';
  // Simple token: base64 of secret+password
  return Buffer.from(`${secret}:${password}`).toString('base64');
}

export function verifyPassword(password: string): boolean {
  return password === (process.env.ADMIN_PASSWORD || 'admin');
}

export function createAuthCookie(): string {
  return getAuthToken();
}

export function isAuthenticated(request: NextRequest): boolean {
  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie) return false;
  return cookie.value === getAuthToken();
}

export async function isAuthenticatedServer(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie) return false;
  return cookie.value === getAuthToken();
}

export { COOKIE_NAME };
