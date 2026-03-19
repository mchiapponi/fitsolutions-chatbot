'use client';

import { useState, useEffect, useRef } from 'react';

// Types
interface Config {
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

interface Product {
  id: number;
  name: string;
  price: string;
  categories: string[];
  inStock: boolean;
  highlights: string;
  specs: string;
  faq: string;
  image: string;
}

interface SyncLog {
  lastSync: string;
  productCount: number;
  status: 'success' | 'error';
  message: string;
}

// ============================================================
// DASHBOARD
// ============================================================
export default function Dashboard() {
  const [tab, setTab] = useState<'istruzioni' | 'prodotti' | 'widget' | 'test'>('istruzioni');

  const tabs = [
    { id: 'istruzioni' as const, label: '📝 Istruzioni', desc: 'Prompt & comportamento' },
    { id: 'prodotti' as const, label: '📦 Prodotti', desc: 'Catalogo sincronizzato' },
    { id: 'widget' as const, label: '🎨 Widget', desc: 'Aspetto & installazione' },
    { id: 'test' as const, label: '💬 Test', desc: 'Prova il chatbot' },
  ];

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    window.location.href = '/login';
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <span className="font-display font-bold text-gray-900">Fit Solutions</span>
              <span className="text-gray-400 ml-1 text-sm">Chatbot</span>
            </div>
          </div>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 transition">
            Esci ↗
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-4 text-sm font-semibold border-b-2 transition ${
                  tab === t.id
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {tab === 'istruzioni' && <TabIstruzioni />}
        {tab === 'prodotti' && <TabProdotti />}
        {tab === 'widget' && <TabWidget />}
        {tab === 'test' && <TabTest />}
      </main>
    </div>
  );
}

// ============================================================
// TAB: ISTRUZIONI
// ============================================================
function TabIstruzioni() {
  const [config, setConfig] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/config').then((r) => r.json()).then(setConfig);
  }, []);

  async function save() {
    if (!config) return;
    setSaving(true);
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!config) return <LoadingState />;

  return (
    <div className="space-y-8">
      <SectionCard
        title="System Prompt"
        description="Le istruzioni principali del chatbot. Definisci chi è, come si comporta, cosa può e non può fare."
      >
        <textarea
          value={config.systemPrompt}
          onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
          rows={16}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y"
        />
        <p className="text-xs text-gray-400 mt-2">
          Il catalogo prodotti viene aggiunto automaticamente in coda al prompt. Non serve includerlo qui.
        </p>
      </SectionCard>

      <SectionCard title="Messaggio di benvenuto" description="Il primo messaggio che l'utente vede quando apre la chat.">
        <input
          type="text"
          value={config.welcomeMessage}
          onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </SectionCard>

      <SectionCard title="Modello & Parametri" description="Impostazioni del modello OpenAI.">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Modello</label>
            <select
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="gpt-4o-mini">GPT-4o Mini (economico)</option>
              <option value="gpt-4o">GPT-4o (potente)</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (base)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Temperatura: {config.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.temperature}
              onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
              className="w-full mt-2 accent-teal-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Preciso</span>
              <span>Creativo</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Max Token</label>
            <input
              type="number"
              value={config.maxTokens}
              onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) || 500 })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </SectionCard>

      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="px-8 py-3 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-bold rounded-xl transition"
        >
          {saving ? 'Salvataggio...' : 'Salva modifiche'}
        </button>
        {saved && <span className="text-green-600 font-semibold text-sm">✓ Salvato!</span>}
      </div>
    </div>
  );
}

// ============================================================
// TAB: PRODOTTI
// ============================================================
function TabProdotti() {
  const [products, setProducts] = useState<Product[]>([]);
  const [syncLog, setSyncLog] = useState<SyncLog | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadProducts() {
    setLoading(true);
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data.products || []);
    setSyncLog(data.syncLog || null);
    setLoading(false);
  }

  useEffect(() => { loadProducts(); }, []);

  async function triggerSync() {
    setSyncing(true);
    try {
      await fetch('/api/sync', { method: 'POST' });
      await loadProducts();
    } catch (e) {
      console.error('Sync failed', e);
    }
    setSyncing(false);
  }

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      {/* Sync status bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-lg text-gray-900">Sincronizzazione WooCommerce</h3>
          {syncLog ? (
            <p className="text-sm text-gray-500 mt-1">
              Ultima sync: {new Date(syncLog.lastSync).toLocaleString('it-IT')} ·{' '}
              <span className={syncLog.status === 'success' ? 'text-green-600' : 'text-red-500'}>
                {syncLog.message}
              </span>
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">Nessuna sincronizzazione effettuata</p>
          )}
          <p className="text-xs text-gray-400 mt-1">La sync automatica avviene ogni 6 ore</p>
        </div>
        <button
          onClick={triggerSync}
          disabled={syncing}
          className="px-6 py-3 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center gap-2"
        >
          {syncing ? (
            <>
              <Spinner /> Sync in corso...
            </>
          ) : (
            '🔄 Sincronizza ora'
          )}
        </button>
      </div>

      {/* Products grid */}
      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Nessun prodotto sincronizzato</p>
          <p className="text-sm mt-1">Clicca "Sincronizza ora" per importare il catalogo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {p.image && (
                <div className="h-40 bg-gray-100">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-display font-bold text-gray-900">{p.name}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    p.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {p.inStock ? 'Disponibile' : 'Esaurito'}
                  </span>
                </div>
                {p.price && (
                  <p className="font-display font-bold text-teal-600 text-lg mt-1">€{p.price}</p>
                )}
                {p.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.categories.map((c) => (
                      <span key={c} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">{c}</span>
                    ))}
                  </div>
                )}
                {/* Data badges */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {p.highlights && <DataBadge label="Highlights" />}
                  {p.specs && <DataBadge label="Specs" />}
                  {p.faq && <DataBadge label="FAQ" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// TAB: WIDGET
// ============================================================
function TabWidget() {
  const [config, setConfig] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/config').then((r) => r.json()).then(setConfig);
  }, []);

  async function save() {
    if (!config) return;
    setSaving(true);
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!config) return <LoadingState />;

  // Build the snippet
  const backendUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tuo-progetto.vercel.app';
  const snippet = `<!-- Fit Solutions Chatbot Widget -->
<script>
(function(){
  var s=document.createElement('script');
  s.src='${backendUrl}/widget.js';
  s.async=true;
  s.dataset.endpoint='${backendUrl}/api/chat';
  s.dataset.title='${config.widgetTitle}';
  s.dataset.subtitle='${config.widgetSubtitle}';
  s.dataset.color='${config.widgetColor}';
  s.dataset.welcome='${config.welcomeMessage.replace(/'/g, "\\'")}';
  document.head.appendChild(s);
})();
</script>`;

  return (
    <div className="space-y-8">
      <SectionCard title="Aspetto del widget" description="Personalizza titolo, colore e sottotitolo della finestra chat.">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Titolo</label>
            <input
              type="text"
              value={config.widgetTitle}
              onChange={(e) => setConfig({ ...config, widgetTitle: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Sottotitolo</label>
            <input
              type="text"
              value={config.widgetSubtitle}
              onChange={(e) => setConfig({ ...config, widgetSubtitle: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Colore principale</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={config.widgetColor}
              onChange={(e) => setConfig({ ...config, widgetColor: e.target.value })}
              className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={config.widgetColor}
              onChange={(e) => setConfig({ ...config, widgetColor: e.target.value })}
              className="w-32 px-3 py-2 border border-gray-300 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Origini consentite" description="Domini da cui il widget può comunicare con il backend. Separa con virgola.">
        <input
          type="text"
          value={config.allowedOrigins}
          onChange={(e) => setConfig({ ...config, allowedOrigins: e.target.value })}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="https://fitsolutions.it,https://www.fitsolutions.it"
        />
      </SectionCard>

      <SectionCard title="Codice di installazione" description="Copia questo snippet e incollalo nel functions.php del tema Woopify, oppure in un widget HTML di Elementor.">
        <div className="relative">
          <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-sm overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {snippet}
          </pre>
          <button
            onClick={() => { navigator.clipboard.writeText(snippet); }}
            className="absolute top-3 right-3 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-semibold transition"
          >
            📋 Copia
          </button>
        </div>
      </SectionCard>

      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="px-8 py-3 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-bold rounded-xl transition"
        >
          {saving ? 'Salvataggio...' : 'Salva modifiche'}
        </button>
        {saved && <span className="text-green-600 font-semibold text-sm">✓ Salvato!</span>}
      </div>
    </div>
  );
}

// ============================================================
// TAB: TEST
// ============================================================
function TabTest() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [welcome, setWelcome] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/config').then((r) => r.json()).then((c) => {
      setWelcome(c.welcomeMessage);
    });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.reply || data.error }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Errore di connessione.' }]);
    }
    setLoading(false);
  }

  function reset() {
    setMessages([]);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
        {/* Chat header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-teal-500">
          <div>
            <h3 className="font-display font-bold text-white">Fit Solutions</h3>
            <p className="text-teal-100 text-xs">Assistente virtuale · Test mode</p>
          </div>
          <button onClick={reset} className="text-teal-200 hover:text-white text-xs font-semibold transition">
            🔄 Reset
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Welcome message */}
          {welcome && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">FS</div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-3 max-w-[80%]">
                <p className="text-sm text-gray-700 leading-relaxed">{welcome}</p>
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">FS</div>
              )}
              <div
                className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                  m.role === 'user'
                    ? 'bg-teal-500 text-white rounded-tr-md'
                    : 'bg-gray-100 text-gray-700 rounded-tl-md'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">FS</div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Scrivi un messaggio..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="px-5 py-3 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-bold rounded-xl transition"
            >
              Invia
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SHARED UI COMPONENTS
// ============================================================
function SectionCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="font-display font-bold text-lg text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      {children}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner />
      <span className="ml-3 text-gray-500">Caricamento...</span>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-teal-500" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function DataBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full text-xs font-semibold">
      ✓ {label}
    </span>
  );
}
