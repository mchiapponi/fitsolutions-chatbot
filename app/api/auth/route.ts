import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createAuthCookie, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!verifyPassword(password)) {
      return NextResponse.json({ error: 'Password errata' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, createAuthCookie(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 giorni
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: 'Errore login' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
