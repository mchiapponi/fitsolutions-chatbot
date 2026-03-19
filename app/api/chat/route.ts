import { NextRequest, NextResponse } from 'next/server';
import { chat, ChatMessage } from '@/lib/openai';
import { getConfig } from '@/lib/store';

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    // Origin check
    const config = await getConfig();
    const origin = request.headers.get('origin') || '';
    const allowed = config.allowedOrigins
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    // In dev, allow all origins. In prod, check.
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev && allowed.length > 0 && !allowed.includes(origin)) {
      return NextResponse.json({ error: 'Origin non autorizzato' }, { status: 403 });
    }

    const body = await request.json();
    const { messages } = body as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messaggi mancanti' }, { status: 400 });
    }

    // Limit conversation length to prevent abuse
    const trimmedMessages = messages.slice(-20);

    const reply = await chat(trimmedMessages);

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Errore interno. Riprova tra qualche istante.' },
      { status: 500 }
    );
  }
}
