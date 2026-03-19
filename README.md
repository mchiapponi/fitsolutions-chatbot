# 🤖 Fit Solutions Chatbot

Backend + widget chatbot AI per fitsolutions.it.  
Stack: **Next.js 14 + Upstash Redis + OpenAI GPT-4o-mini**

---

## Architettura

```
┌──────────────────┐     ┌───────────────────────────┐     ┌──────────┐
│  fitsolutions.it │────▶│  Vercel (Next.js app)     │────▶│  OpenAI  │
│  (widget JS)     │     │  - /api/chat   (widget)   │     │  GPT-4o  │
│                  │     │  - /api/sync   (cron 6h)  │     └──────────┘
└──────────────────┘     │  - /api/config (admin)    │
                         │  - Dashboard React        │     ┌──────────┐
                         │                           │◀───▶│ Upstash  │
┌──────────────────┐     │                           │     │  Redis   │
│  WooCommerce     │◀────│  Sync ogni 6h via REST    │     └──────────┘
│  REST API        │     └───────────────────────────┘
└──────────────────┘
```

---

## Setup (per lo sviluppatore)

### 1. Prerequisiti

- Account Vercel (già presente: Fit Solutions SRL)
- Account Upstash (gratis: https://upstash.com)
- API key OpenAI (https://platform.openai.com)
- WooCommerce REST API keys

### 2. Crea un database Upstash Redis

1. Vai su https://console.upstash.com
2. Crea un nuovo database Redis (regione: EU West)
3. Copia `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`

**Oppure** usa l'integrazione Vercel:
- Vercel Dashboard → Integrations → cerca "Upstash" → installa
- Le variabili vengono auto-popolate

### 3. Crea le chiavi WooCommerce REST API

1. WordPress admin → WooCommerce → Impostazioni → Avanzate → REST API
2. Aggiungi chiave: nome "Chatbot", permessi "Sola lettura"
3. Copia Consumer Key (`ck_...`) e Consumer Secret (`cs_...`)

### 4. Deploy su Vercel

```bash
# Clona o crea il repo
git clone <questo-repo>
cd fitsolutions-chatbot

# Deploy
vercel --prod
```

Oppure collega il repo GitHub da Vercel Dashboard → "Add New Project".

**⚠️ IMPORTANTE: Crea come NUOVO progetto, non toccare fitness-sicuro!**

### 5. Variabili d'ambiente

Nella dashboard Vercel del NUOVO progetto → Settings → Environment Variables:

| Variabile | Valore |
|-----------|--------|
| `OPENAI_API_KEY` | `sk-...` |
| `WC_STORE_URL` | `https://fitsolutions.it` |
| `WC_CONSUMER_KEY` | `ck_...` |
| `WC_CONSUMER_SECRET` | `cs_...` |
| `UPSTASH_REDIS_REST_URL` | `https://...upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | `AX...` |
| `ADMIN_PASSWORD` | (scegli una password per l'admin) |
| `AUTH_SECRET` | (stringa random, almeno 32 char) |
| `CRON_SECRET` | (auto-generata da Vercel per i cron) |

> Per generare AUTH_SECRET: `openssl rand -base64 32`

### 6. Prima sync

1. Vai su `https://tuo-progetto.vercel.app/login`
2. Accedi con la password scelta
3. Tab "Prodotti" → clicca "Sincronizza ora"
4. Verifica che i prodotti appaiano con i campi Woopify

### 7. Installa il widget su WordPress

Aggiungi al `functions.php` del child theme Woopify (in fondo, prima del `?>`):

```php
// ============================================================
// FIT SOLUTIONS CHATBOT WIDGET
// ============================================================
add_action('wp_footer', function() {
    $backend = 'https://TUO-PROGETTO.vercel.app'; // ← URL del deploy
    ?>
    <script>
    (function(){
        var s=document.createElement('script');
        s.src='<?php echo esc_url($backend); ?>/widget.js';
        s.async=true;
        s.dataset.endpoint='<?php echo esc_url($backend); ?>/api/chat';
        s.dataset.title='Fit Solutions';
        s.dataset.subtitle='Assistente virtuale';
        s.dataset.color='#1F7A7A';
        s.dataset.welcome='Ciao! 👋 Sono l\'assistente Fit Solutions. Come posso aiutarti?';
        document.head.appendChild(s);
    })();
    </script>
    <?php
}, 99);
```

### 8. Dominio custom (opzionale)

1. Vercel Dashboard → progetto chatbot → Settings → Domains
2. Aggiungi `chatbot.fitsolutions.it`
3. Configura il DNS: CNAME `chatbot` → `cname.vercel-dns.com`
4. Aggiorna l'URL nel functions.php

---

## Pannello Admin

Accessibile su `https://tuo-progetto.vercel.app` (richiede login).

### Tab disponibili:

- **📝 Istruzioni** — System prompt, messaggio di benvenuto, modello, temperatura
- **📦 Prodotti** — Lista prodotti sincronizzati, bottone sync manuale
- **🎨 Widget** — Colore, titolo, sottotitolo, snippet di installazione
- **💬 Test** — Chat di prova in tempo reale

---

## Cron automatico

Il file `vercel.json` configura un cron job ogni 6 ore:

```json
{
  "crons": [
    {
      "path": "/api/sync",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

Il cron è disponibile su Vercel Pro (già attivo su questo account).

---

## Struttura file

```
fitsolutions-chatbot/
├── app/
│   ├── api/
│   │   ├── auth/route.ts      ← Login/logout
│   │   ├── chat/route.ts      ← Endpoint widget (pubblico)
│   │   ├── config/route.ts    ← CRUD configurazione
│   │   ├── products/route.ts  ← Lista prodotti sync
│   │   └── sync/route.ts      ← Trigger sync WooCommerce
│   ├── components/
│   │   └── Dashboard.tsx       ← Pannello admin completo
│   ├── login/page.tsx          ← Pagina login
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/
│   ├── auth.ts                 ← Autenticazione cookie
│   ├── openai.ts               ← Wrapper OpenAI
│   ├── store.ts                ← Redis: config + prodotti
│   └── woocommerce.ts          ← Sync WC REST API
├── public/
│   └── widget.js               ← Script embeddabile
├── middleware.ts                ← Protezione route admin
├── vercel.json                 ← Cron config
├── wordpress-snippet.php       ← Snippet per functions.php
└── .env.example
```

---

## Costi stimati

| Servizio | Costo |
|----------|-------|
| Vercel Pro | Già pagato ($20/mese) |
| Upstash Redis | Gratis (free tier: 10k cmd/giorno) |
| OpenAI GPT-4o-mini | ~$0.15/1M input tokens, ~$0.60/1M output tokens |

Con un uso medio (50-100 conversazioni/giorno), il costo OpenAI sarà circa **$2-5/mese**.


