import OpenAI from 'openai';
import { getConfig, buildProductContext } from './store';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function chat(
  messages: ChatMessage[],
  configOverride?: { model?: string; temperature?: number; maxTokens?: number }
): Promise<string> {
  const config = await getConfig();
  const productContext = await buildProductContext();

  // Build system prompt with product catalog
  const systemPrompt = config.systemPrompt + productContext;

  const allMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  const response = await openai.chat.completions.create({
    model: configOverride?.model || config.model,
    temperature: configOverride?.temperature ?? config.temperature,
    max_tokens: configOverride?.maxTokens || config.maxTokens,
    messages: allMessages,
  });

  return response.choices[0]?.message?.content || 'Mi dispiace, non riesco a rispondere al momento.';
}
