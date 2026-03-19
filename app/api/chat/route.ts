import { NextRequest, NextResponse } from 'next/server';
import { chat, ChatMessage } from '@/lib/openai';

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messaggi mancanti' }, { status: 400 });
    }

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
