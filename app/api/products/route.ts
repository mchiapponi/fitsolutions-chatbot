import { NextRequest, NextResponse } from 'next/server';
import { getProducts, getSyncLog } from '@/lib/store';
import { isAuthenticated } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  const [products, syncLog] = await Promise.all([getProducts(), getSyncLog()]);
  return NextResponse.json({ products, syncLog });
}
