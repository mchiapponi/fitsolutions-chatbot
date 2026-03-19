import { NextRequest, NextResponse } from 'next/server';
import { getConfig, setConfig } from '@/lib/store';
import { isAuthenticated } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  const config = await getConfig();
  return NextResponse.json(config);
}

export async function PUT(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const updated = await setConfig(body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
