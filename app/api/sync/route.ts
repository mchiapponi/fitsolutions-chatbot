import { NextRequest, NextResponse } from 'next/server';
import { syncProducts } from '@/lib/woocommerce';
import { isAuthenticated } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // Vercel Cron calls GET with Authorization header
  const authHeader = request.headers.get('authorization');
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const isAdmin = isAuthenticated(request);

  if (!isCron && !isAdmin) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const result = await syncProducts();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Also allow POST for manual trigger from admin
export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const result = await syncProducts();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
