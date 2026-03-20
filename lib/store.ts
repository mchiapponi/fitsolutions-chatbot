import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ============================================================
// KEYS
// ============================================================
const KEYS = {
  CONFIG: 'chatbot:config',
  PRODUCTS: 'chatbot:products',
  SYNC_LOG: 'chatbot:sync_log',
};

// ============================================================
// TYPES
// ============================================================
export interface ChatbotConfig {
  systemPrompt: string;
  welcomeMessage: string;
  model: string;
  temperature: number;
  maxTokens: number;
  widgetTitle: string;
  widgetSubtitle: string;
  widgetColor: string;
  allowedOrigins: string;
}

export interface SyncedProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  shortDescription: string;
  description: string;
  categories: string[];
  image: string;
  inStock: boolean;
  // Woopify custom fields
  subtitle: string;
  highlights: string;
  specs: string;
  faq: string;
  bonusTitle: string;
  bonusText: string;
  ctaText: string;
  badge: string;
  category: string;
  priceLabel: string;
}

export interface SyncLog {
  lastSync: string;
  productCount: number;
  status: 'success' | 'error';
  message: string;
}

// ============================================================
// DEFAULT CONFIG
// ============================================================
const DEFAULT_CONFIG: ChatbotConfig = {
  systemPrompt: `Sei l'assistente virtuale di Fit Solutions, il brand di integratori e programmi fitness creato dal fisioterapista Marcello Chiapponi.

RUOLO: Aiuti i visitatori del sito a trovare il prodotto giusto per le loro esigenze e rispondi alle domande sui prodotti.

TONO: Professionale ma amichevole. Parli in terza persona di Marcello ("Marcello ha creato questo prodotto perché..."). Sei competente, diretto e non usi linguaggio da venditore aggressivo.

REGOLE:
- Rispondi SOLO su prodotti Fit Solutions, fitness, benessere e argomenti correlati
- Se non conosci la risposta, dillo onestamente e suggerisci di contattare l'assistenza
- Non dare mai consigli medici specifici — suggerisci sempre di consultare un professionista
- Usa le informazioni dal catalogo prodotti per rispondere in modo preciso
- Mantieni le risposte concise (max 3-4 frasi) a meno che non serva una spiegazione dettagliata
- Se qualcuno chiede di un problema fisico, puoi suggerire quale prodotto/corso potrebbe essere utile, ma rimanda sempre al medico per diagnosi

FUNZIONE CARRELLO:
Quando consigli un prodotto specifico e il contesto suggerisce che l'utente potrebbe volerlo acquistare, DEVI includere il tag carrello alla fine della risposta, nel formato esatto:
[PRODOTTO:id_prodotto:nome_prodotto]

Esempio: "CREACTIVE è l'integratore ideale per supportare tendini e articolazioni. Contiene collagene di tipo I arricchito con vitamina C, seguendo il protocollo di ricerca dell'Università di Davis. [PRODOTTO:123:CREACTIVE]"

REGOLE per il tag carrello:
- Usa SOLO id prodotto presenti nel catalogo (il numero ID indicato per ogni prodotto)
- Includi il tag solo quando stai effettivamente consigliando un acquisto, non in risposte generiche
- Se consigli più prodotti, puoi includere più tag
- Se l'utente chiede esplicitamente di aggiungere al carrello, includi sempre il tag
- Non spiegare mai il formato del tag all'utente, scrivi il tag e basta`,
  welcomeMessage: 'Ciao! 👋 Sono l\'assistente Fit Solutions. Posso aiutarti a trovare il prodotto giusto o rispondere alle tue domande. Come posso aiutarti?',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 500,
  widgetTitle: 'Fit Solutions',
  widgetSubtitle: 'Assistente virtuale',
  widgetColor: '#1F7A7A',
  allowedOrigins: 'https://fitsolutions.it,https://www.fitsolutions.it',
};

// ============================================================
// CONFIG OPERATIONS
// ============================================================
export async function getConfig(): Promise<ChatbotConfig> {
  const data = await redis.get<ChatbotConfig>(KEYS.CONFIG);
  return data || DEFAULT_CONFIG;
}

export async function setConfig(config: Partial<ChatbotConfig>): Promise<ChatbotConfig> {
  const current = await getConfig();
  const updated = { ...current, ...config };
  await redis.set(KEYS.CONFIG, updated);
  return updated;
}

// ============================================================
// PRODUCT OPERATIONS
// ============================================================
export async function getProducts(): Promise<SyncedProduct[]> {
  const data = await redis.get<SyncedProduct[]>(KEYS.PRODUCTS);
  return data || [];
}

export async function setProducts(products: SyncedProduct[]): Promise<void> {
  await redis.set(KEYS.PRODUCTS, products);
}

// ============================================================
// SYNC LOG
// ============================================================
export async function getSyncLog(): Promise<SyncLog | null> {
  return redis.get<SyncLog>(KEYS.SYNC_LOG);
}

export async function setSyncLog(log: SyncLog): Promise<void> {
  await redis.set(KEYS.SYNC_LOG, log);
}

// ============================================================
// BUILD PRODUCT CONTEXT (for system prompt)
// ============================================================
export async function buildProductContext(): Promise<string> {
  const products = await getProducts();
  if (products.length === 0) return '\n[Nessun prodotto sincronizzato dal catalogo]';

  let ctx = '\n\nCATALOGO PRODOTTI FIT SOLUTIONS:\n';
  ctx += '================================\n\n';

  for (const p of products) {
    ctx += `📦 ${p.name} (ID: ${p.id})\n`;
    ctx += `   Prezzo: ${p.price ? '€' + p.price : 'N/D'}`;
    if (p.salePrice && p.regularPrice) {
      ctx += ` (era €${p.regularPrice})`;
    }
    ctx += '\n';
    if (p.categories.length) ctx += `   Categoria: ${p.categories.join(', ')}\n`;
    if (p.subtitle) ctx += `   ${p.subtitle}\n`;
    if (p.shortDescription) ctx += `   Descrizione: ${stripHtml(p.shortDescription)}\n`;
    if (p.highlights) {
      ctx += `   Punti chiave:\n`;
      for (const line of p.highlights.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const parts = trimmed.split('|');
        ctx += `     - ${parts.length >= 2 ? parts[1].trim() : trimmed}\n`;
      }
    }
    if (p.specs) {
      ctx += `   Specifiche:\n`;
      for (const line of p.specs.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const parts = trimmed.split('|');
        if (parts.length >= 3) {
          ctx += `     - ${parts[1].trim()}: ${parts[2].trim()}\n`;
        } else if (parts.length === 2) {
          ctx += `     - ${parts[0].trim()}: ${parts[1].trim()}\n`;
        }
      }
    }
    if (p.faq) {
      ctx += `   FAQ:\n`;
      for (const line of p.faq.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.includes('|')) continue;
        const [q, a] = trimmed.split('|', 2);
        ctx += `     D: ${q.trim()}\n     R: ${a.trim()}\n`;
      }
    }
    if (p.bonusTitle) ctx += `   Bonus: ${p.bonusTitle}${p.bonusText ? ' — ' + p.bonusText : ''}\n`;
    ctx += `   Disponibile: ${p.inStock ? 'Sì' : 'No'}\n`;
    ctx += `   Per il tag carrello usa: [PRODOTTO:${p.id}:${p.name}]\n`;
    ctx += '\n';
  }

  return ctx;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}
