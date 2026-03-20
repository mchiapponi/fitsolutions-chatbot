/**
 * Fit Solutions Chatbot Widget v4
 * Features: window.FSC_CONFIG, add-to-cart buttons, auto-open on checkout
 */
(function () {
  'use strict';

  var CFG = window.FSC_CONFIG || {};
  CFG.endpoint = CFG.endpoint || '';
  CFG.title = CFG.title || 'Fit Solutions';
  CFG.subtitle = CFG.subtitle || 'Assistente virtuale';
  CFG.color = CFG.color || '#1F7A7A';
  CFG.welcome = CFG.welcome || 'Ciao! Come posso aiutarti?';
  CFG.autoOpenOn = CFG.autoOpenOn || '';
  CFG.autoOpenDelay = CFG.autoOpenDelay || 3000;
  CFG.autoOpenMessage = CFG.autoOpenMessage || '';

  if (!CFG.endpoint) { console.warn('[FSC] Manca endpoint in window.FSC_CONFIG'); return; }
  if (document.getElementById('fsc-widget')) return;

  var messages = [];
  var isOpen = false;
  var isLoading = false;
  var autoOpened = false;

  function darken(hex, pct) {
    var num = parseInt(hex.replace('#', ''), 16);
    var r = Math.max(0, (num >> 16) - Math.round(255 * pct));
    var g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * pct));
    var b = Math.max(0, (num & 0xff) - Math.round(255 * pct));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  var style = document.createElement('style');
  style.textContent = [
    '#fsc-widget{position:fixed;bottom:24px;right:24px;z-index:99990;font-family:"Plus Jakarta Sans","Inter",system-ui,sans-serif;font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased}',
    '#fsc-bubble{width:60px;height:60px;border-radius:50%;background:' + CFG.color + ';color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,.15);transition:all .3s cubic-bezier(.4,0,.2,1)}',
    '#fsc-bubble:hover{transform:scale(1.08);box-shadow:0 8px 32px rgba(0,0,0,.2)}',
    '#fsc-bubble svg{width:28px;height:28px;transition:transform .3s}',
    '#fsc-bubble.open svg{transform:rotate(90deg)}',
    '#fsc-window{position:absolute;bottom:72px;right:0;width:380px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 120px);background:#fff;border-radius:20px;box-shadow:0 12px 48px rgba(0,0,0,.15);display:none;flex-direction:column;overflow:hidden;animation:fsc-in .3s cubic-bezier(.4,0,.2,1)}',
    '#fsc-window.open{display:flex}',
    '@keyframes fsc-in{from{opacity:0;transform:translateY(12px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}',
    '#fsc-header{padding:18px 20px;background:' + CFG.color + ';color:#fff;display:flex;align-items:center;gap:12px;flex-shrink:0}',
    '#fsc-header-dot{width:10px;height:10px;border-radius:50%;background:#6ee7b7;flex-shrink:0}',
    '#fsc-header-title{font-weight:700;font-size:16px}',
    '#fsc-header-sub{font-size:12px;opacity:.8}',
    '#fsc-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}',
    '.fsc-msg{max-width:82%;padding:10px 16px;border-radius:18px;font-size:14px;line-height:1.55;word-wrap:break-word;white-space:pre-wrap}',
    '.fsc-msg.bot{background:#f3f4f6;color:#374151;border-bottom-left-radius:6px;align-self:flex-start}',
    '.fsc-msg.user{background:' + CFG.color + ';color:#fff;border-bottom-right-radius:6px;align-self:flex-end}',
    '.fsc-cart-btn{display:inline-flex;align-items:center;gap:6px;margin-top:8px;padding:8px 16px;background:' + CFG.color + ';color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;transition:all .2s;text-decoration:none}',
    '.fsc-cart-btn:hover{background:' + darken(CFG.color, 0.1) + ';transform:translateY(-1px)}',
    '.fsc-cart-btn:visited{color:#fff}',
    '.fsc-cart-btn svg{width:16px;height:16px}',
    '.fsc-typing{display:flex;gap:5px;padding:10px 16px;background:#f3f4f6;border-radius:18px;border-bottom-left-radius:6px;align-self:flex-start;max-width:60px}',
    '.fsc-dot{width:7px;height:7px;border-radius:50%;background:#9ca3af;animation:fsc-bounce .6s infinite alternate}',
    '.fsc-dot:nth-child(2){animation-delay:.15s}',
    '.fsc-dot:nth-child(3){animation-delay:.3s}',
    '@keyframes fsc-bounce{to{transform:translateY(-5px);opacity:.4}}',
    '#fsc-input-area{padding:12px 16px;border-top:1px solid #e5e7eb;display:flex;gap:8px;flex-shrink:0}',
    '#fsc-input{flex:1;border:1.5px solid #e5e7eb;border-radius:12px;padding:10px 14px;font-size:14px;font-family:inherit;outline:none;transition:border-color .2s;resize:none}',
    '#fsc-input:focus{border-color:' + CFG.color + '}',
    '#fsc-send{width:42px;height:42px;border:none;border-radius:12px;background:' + CFG.color + ';color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s;flex-shrink:0}',
    '#fsc-send:hover{background:' + darken(CFG.color, 0.1) + '}',
    '#fsc-send:disabled{opacity:.4;cursor:default}',
    '#fsc-send svg{width:18px;height:18px}',
    '#fsc-powered{text-align:center;padding:6px;font-size:10px;color:#bbb}',
    '#fsc-auto-toast{position:absolute;bottom:72px;right:0;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.12);padding:14px 18px;max-width:280px;font-size:14px;color:#374151;cursor:pointer;animation:fsc-in .4s cubic-bezier(.4,0,.2,1);line-height:1.4}',
    '#fsc-auto-toast:hover{box-shadow:0 6px 28px rgba(0,0,0,.18)}',
    '#fsc-auto-toast-close{position:absolute;top:6px;right:10px;background:none;border:none;color:#9ca3af;cursor:pointer;font-size:16px;padding:2px}',
    '@media(max-width:480px){#fsc-window{width:100vw;height:100vh;max-height:100vh;bottom:0;right:0;border-radius:0;position:fixed}#fsc-widget{bottom:16px;right:16px}}',
  ].join('\n');
  document.head.appendChild(style);

  var widget = document.createElement('div');
  widget.id = 'fsc-widget';

  var win = document.createElement('div');
  win.id = 'fsc-window';

  win.innerHTML =
    '<div id="fsc-header">' +
    '  <span id="fsc-header-dot"></span>' +
    '  <div><div id="fsc-header-title">' + esc(CFG.title) + '</div>' +
    '  <div id="fsc-header-sub">' + esc(CFG.subtitle) + '</div></div>' +
    '</div>' +
    '<div id="fsc-messages"></div>' +
    '<div id="fsc-input-area">' +
    '  <input type="text" id="fsc-input" placeholder="Scrivi un messaggio..." autocomplete="off">' +
    '  <button id="fsc-send" type="button" aria-label="Invia">' +
    '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
    '  </button>' +
    '</div>' +
    '<div id="fsc-powered">Powered by Fit Solutions</div>';

  var bubble = document.createElement('button');
  bubble.id = 'fsc-bubble';
  bubble.setAttribute('aria-label', 'Apri chat');
  bubble.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>';

  widget.appendChild(win);
  widget.appendChild(bubble);
  document.body.appendChild(widget);

  var msgContainer = document.getElementById('fsc-messages');
  var inputEl = document.getElementById('fsc-input');
  var sendBtn = document.getElementById('fsc-send');

  // === OPEN/CLOSE ===
  function openChat() {
    isOpen = true;
    win.classList.add('open');
    bubble.classList.add('open');
    removeToast();
    if (messages.length === 0) addBotMessage(CFG.welcome);
    inputEl.focus();
  }

  function closeChat() {
    isOpen = false;
    win.classList.remove('open');
    bubble.classList.remove('open');
  }

  bubble.addEventListener('click', function () {
    if (isOpen) closeChat(); else openChat();
  });

  // === AUTO-OPEN ON SPECIFIC PAGES ===
  function removeToast() {
    var toast = document.getElementById('fsc-auto-toast');
    if (toast) toast.remove();
  }

  if (CFG.autoOpenOn && window.location.pathname.indexOf(CFG.autoOpenOn) !== -1) {
    setTimeout(function () {
      if (autoOpened || isOpen) return;
      autoOpened = true;
      var msg = CFG.autoOpenMessage || 'Hai dubbi prima di completare l\'ordine? Sono qui! 💬';
      var toast = document.createElement('div');
      toast.id = 'fsc-auto-toast';
      toast.innerHTML = esc(msg) + '<button id="fsc-auto-toast-close">&times;</button>';
      toast.addEventListener('click', function (e) {
        if (e.target.id === 'fsc-auto-toast-close') { removeToast(); return; }
        removeToast();
        openChat();
      });
      widget.appendChild(toast);
      // Auto-hide toast after 10 seconds
      setTimeout(function () { removeToast(); }, 10000);
    }, CFG.autoOpenDelay);
  }

  // === SEND ===
  function send() {
    var text = inputEl.value.trim();
    if (!text || isLoading) return;
    inputEl.value = '';
    addUserMessage(text);
    messages.push({ role: 'user', content: text });
    callAPI();
  }

  sendBtn.addEventListener('click', send);
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });

  // === API CALL ===
  function callAPI() {
    isLoading = true;
    sendBtn.disabled = true;
    showTyping();

    fetch(CFG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages.slice(-20) }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        hideTyping();
        var reply = data.reply || data.error || 'Mi dispiace, non riesco a rispondere al momento.';
        addBotMessage(reply);
        messages.push({ role: 'assistant', content: reply });
      })
      .catch(function () {
        hideTyping();
        addBotMessage('Si è verificato un errore. Riprova tra qualche istante.');
      })
      .finally(function () {
        isLoading = false;
        sendBtn.disabled = false;
      });
  }

  // === PARSE PRODUCT TAGS ===
  // Matches [PRODOTTO:id:nome] and creates add-to-cart buttons
  var PRODUCT_TAG_RE = /\[PRODOTTO:(\d+):([^\]]+)\]/g;

  function parseProductTags(text) {
    var tags = [];
    var match;
    var cleanText = text;
    while ((match = PRODUCT_TAG_RE.exec(text)) !== null) {
      tags.push({ id: match[1], name: match[2] });
    }
    // Remove tags from visible text
    cleanText = cleanText.replace(PRODUCT_TAG_RE, '').trim();
    return { cleanText: cleanText, products: tags };
  }

  function createCartButton(productId, productName) {
    var btn = document.createElement('a');
    btn.className = 'fsc-cart-btn';
    btn.href = '/?add-to-cart=' + productId;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> Aggiungi ' + esc(productName);
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      // Add to cart via AJAX, then open side cart if available
      var url = '/?add-to-cart=' + productId;
      fetch(url, { method: 'GET', credentials: 'same-origin' }).then(function() {
        // Try to trigger WooCommerce cart update
        if (typeof jQuery !== 'undefined') {
          jQuery(document.body).trigger('wc_fragment_refresh');
          jQuery(document.body).trigger('added_to_cart');
        }
        // Change button to confirm
        btn.innerHTML = '✓ Aggiunto al carrello!';
        btn.style.background = '#059669';
        btn.style.pointerEvents = 'none';
      }).catch(function() {
        // Fallback: navigate to the URL
        window.location.href = url;
      });
    });
    return btn;
  }

  // === DOM HELPERS ===
  function addBotMessage(text) {
    var parsed = parseProductTags(text);
    var el = document.createElement('div');
    el.className = 'fsc-msg bot';

    // Add text content
    var textNode = document.createElement('span');
    textNode.textContent = parsed.cleanText;
    el.appendChild(textNode);

    // Add cart buttons
    if (parsed.products.length > 0) {
      var btnContainer = document.createElement('div');
      btnContainer.style.cssText = 'display:flex;flex-direction:column;gap:6px;margin-top:8px';
      for (var i = 0; i < parsed.products.length; i++) {
        btnContainer.appendChild(createCartButton(parsed.products[i].id, parsed.products[i].name));
      }
      el.appendChild(btnContainer);
    }

    msgContainer.appendChild(el);
    scrollBottom();
  }

  function addUserMessage(text) {
    var el = document.createElement('div');
    el.className = 'fsc-msg user';
    el.textContent = text;
    msgContainer.appendChild(el);
    scrollBottom();
  }

  var typingEl = null;
  function showTyping() {
    typingEl = document.createElement('div');
    typingEl.className = 'fsc-typing';
    typingEl.innerHTML = '<span class="fsc-dot"></span><span class="fsc-dot"></span><span class="fsc-dot"></span>';
    msgContainer.appendChild(typingEl);
    scrollBottom();
  }
  function hideTyping() {
    if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
    typingEl = null;
  }

  function scrollBottom() {
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
})();
