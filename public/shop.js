// ===== Pan Frikandel — koszyk =====
(function () {
  const KEY = 'pf_cart_v1';
  const byId = Object.fromEntries(window.CATALOG.map(p => [p.id, p]));
  const zl = gr => (gr / 100).toFixed(2).replace('.', ',') + ' zł';

  const LOCAL = window.LOCAL || { enabled: false };
  const ZKEY = 'pf_zone_v1';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { cart = {}; }
  // strefa dostawy lokalnej (Płock + 50 km) — onthouden per browser
  let zone = null;
  try { zone = LOCAL.enabled ? JSON.parse(localStorage.getItem(ZKEY)) : null; } catch (e) { zone = null; }
  if (zone && !zone.code) zone = null;
  // opschonen: alleen bekende producten
  for (const id of Object.keys(cart)) if (!byId[id]) delete cart[id];

  const $ = s => document.querySelector(s);
  const drawer = $('#cartDrawer'), overlay = $('#cartOverlay');

  function save() { localStorage.setItem(KEY, JSON.stringify(cart)); }
  function count() { return Object.values(cart).reduce((a, b) => a + b, 0); }
  function subtotal() { return Object.entries(cart).reduce((s, [id, q]) => s + byId[id].price * q, 0); }

  function render() {
    const n = count();
    const badge = $('#cartCount');
    badge.hidden = n === 0;
    badge.textContent = n;

    const box = $('#cartItems');
    if (!n) {
      box.innerHTML = '<p class="cart-empty">Koszyk jest pusty…<br>a frikandele same się nie zjedzą 🍟</p>';
    } else {
      box.innerHTML = Object.entries(cart).map(([id, q]) => {
        const p = byId[id];
        return `<div class="ci">
          ${p.img ? `<img src="/img/${p.img}" alt="">` : `<svg viewBox="0 0 140 140"><use href="#snack-${p.icon}"/></svg>`}
          <div><div class="ci-name">${p.name}</div><div class="ci-price">${zl(p.price)} / ${p.unit}</div></div>
          <div class="ci-qty">
            <button data-dec="${id}" aria-label="Mniej">−</button><b>${q}</b><button data-inc="${id}" aria-label="Więcej">+</button>
          </div>
        </div>`;
      }).join('');
    }

    const sub = subtotal();
    const ship = $('#cartShip');
    const s = shippingFor(sub);
    if (!n) { ship.textContent = ''; ship.classList.remove('free'); }
    else { ship.textContent = s.text; ship.classList.toggle('free', s.free); }
    $('#cartTotal').textContent = zl(sub + (n ? s.gr : 0));
    $('#checkoutBtn').disabled = !n;
    save();
  }

  // Verzendkosten: lokale bezorging als de postcode in de zone valt, anders kurier
  function shippingFor(sub) {
    if (zone && zone.inZone) {
      const free = sub >= LOCAL.freeAboveGr;
      return {
        gr: free ? 0 : LOCAL.priceGr, free,
        text: free
          ? `🎉 Dowozimy sami do ${zone.place} — GRATIS!`
          : `🛵 Dowozimy sami (${zone.place}, ${zone.km} km): ${zl(LOCAL.priceGr)} · gratis od ${zl(LOCAL.freeAboveGr)}`
      };
    }
    const free = sub >= window.SHIPPING.freeAboveGr;
    return {
      gr: free ? 0 : window.SHIPPING.standardGr, free,
      text: free
        ? '🎉 Darmowa dostawa!'
        : `Dostawa ${zl(window.SHIPPING.standardGr)} · do darmowej brakuje ${zl(window.SHIPPING.freeAboveGr - sub)}`
    };
  }

  function open() { drawer.hidden = false; overlay.hidden = false; document.body.style.overflow = 'hidden'; }
  function close() { drawer.hidden = true; overlay.hidden = true; document.body.style.overflow = ''; }

  let toastEl = null, toastT = null;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    requestAnimationFrame(() => toastEl.classList.add('show'));
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('show'), 1800);
  }

  // ---- product-detailmodal ----
  const pdOverlay = $('#pdOverlay'), pdBody = $('#pdBody');
  function openDetails(id) {
    const src = document.getElementById('pd-' + id);
    if (!src || !pdOverlay) return;
    pdBody.innerHTML = src.innerHTML;
    pdOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeDetails() {
    if (!pdOverlay) return;
    pdOverlay.hidden = true;
    document.body.style.overflow = '';
  }
  if (pdOverlay) {
    $('#pdClose').addEventListener('click', closeDetails);
    pdOverlay.addEventListener('click', e => { if (e.target === pdOverlay) closeDetails(); });
  }

  // ---- lightbox (powiększanie zdjęć produktów) ----
  let lbOverlay = null, lbImg = null;
  function openLightbox(src, alt) {
    if (!lbOverlay) {
      lbOverlay = document.createElement('div');
      lbOverlay.className = 'lightbox';
      lbOverlay.innerHTML = '<button class="modal-close lightbox-close" aria-label="Zamknij">✕</button><img alt="">';
      document.body.appendChild(lbOverlay);
      lbImg = lbOverlay.querySelector('img');
      lbOverlay.addEventListener('click', e => {
        if (e.target === lbImg) toggleZoom(e);
        else closeLightbox();
      });
    }
    lbImg.src = src; lbImg.alt = alt || '';
    lbImg.classList.remove('zoomed');
    lbImg.style.transformOrigin = '';
    lbOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function toggleZoom(e) {
    const r = lbImg.getBoundingClientRect();
    lbImg.style.transformOrigin =
      ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%';
    lbImg.classList.toggle('zoomed');
  }
  function closeLightbox() {
    if (!lbOverlay) return;
    lbOverlay.classList.remove('open');
    document.body.style.overflow = pdOverlay && !pdOverlay.hidden ? 'hidden' : '';
  }
  const lightboxOpen = () => lbOverlay && lbOverlay.classList.contains('open');

  document.addEventListener('click', e => {
    const zoomImg = e.target.closest('.pd-media img');
    if (zoomImg) { openLightbox(zoomImg.src, zoomImg.alt); return; }
    const det = e.target.closest('[data-details]');
    const add = e.target.closest('[data-add]');
    const inc = e.target.closest('[data-inc]');
    const dec = e.target.closest('[data-dec]');
    if (det && !add) { openDetails(det.dataset.details); return; }
    if (add) { const id = add.dataset.add; cart[id] = (cart[id] || 0) + 1; render(); toast('Dodano do koszyka! Lekker 👌'); closeDetails(); }
    if (inc) { cart[inc.dataset.inc]++; render(); }
    if (dec) {
      const id = dec.dataset.dec;
      cart[id]--;
      if (cart[id] <= 0) delete cart[id];
      render();
    }
  });

  $('#cartBtn').addEventListener('click', open);
  $('#cartClose').addEventListener('click', close);
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (lightboxOpen()) { closeLightbox(); return; }
    close(); closeDetails();
  });

  $('#checkoutBtn').addEventListener('click', async () => {
    const btn = $('#checkoutBtn');
    btn.disabled = true;
    btn.textContent = 'Chwileczkę…';
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: Object.entries(cart).map(([id, qty]) => ({ id, qty })),
          kod: zone ? zone.code : null
        })
      });
      const data = await res.json();
      if (data.url) { location.href = data.url; return; }
      toast(data.error || 'Coś poszło nie tak.');
    } catch (e) {
      toast('Błąd połączenia. Spróbuj ponownie.');
    }
    btn.disabled = false;
    btn.textContent = 'Przejdź do płatności →';
  });

  // ---- strefa dostawy lokalnej: kod pocztowy → /api/strefa ----
  const fmtKod = v => {
    const d = String(v).replace(/\D/g, '').slice(0, 5);
    return d.length > 2 ? d.slice(0, 2) + '-' + d.slice(2) : d;
  };
  function zoneMsg(z) {
    if (z.inZone) return { cls: 'ok', html: `✅ <b>${esc(z.place)}</b> (${z.km} km od Płocka) — dowozimy sami! ${zl(z.priceGr)}, gratis od ${zl(z.freeAboveGr)}, ${esc(z.eta)}.` };
    if (z.known) return { cls: 'no', html: `🚚 <b>${esc(z.place)}</b> to ${z.km} km od Płocka — poza strefą ${z.radiusKm} km. Wyślemy kurierem w termoboxie (24–48 h).` };
    return { cls: 'no', html: `🚚 Kodu ${esc(z.code)} nie ma w naszej strefie — wyślemy kurierem (24–48 h). Mieszkasz blisko Płocka? <a href="mailto:hallo@panfrikandel.pl">Napisz do nas</a>.` };
  }
  function showZoneResult(out, cls, html) {
    if (!out) return;
    out.innerHTML = html;
    out.classList.remove('ok', 'no');
    out.classList.add(cls);
    out.hidden = false;
  }
  function paintZone() {
    if (!zone) return;
    const m = zoneMsg(zone);
    document.querySelectorAll('[data-zone-form]').forEach(f => {
      const inp = f.querySelector('[data-zone-input]');
      if (inp) inp.value = zone.code;
      showZoneResult(f.querySelector('[data-zone-result]'), m.cls, m.html);
    });
  }
  document.addEventListener('input', e => {
    if (e.target.matches('[data-zone-input]')) e.target.value = fmtKod(e.target.value);
  });
  document.addEventListener('submit', async e => {
    const f = e.target.closest('[data-zone-form]');
    if (!f) return;
    e.preventDefault();
    const inp = f.querySelector('[data-zone-input]'), out = f.querySelector('[data-zone-result]');
    const btn = f.querySelector('button[type="submit"]');
    const kod = fmtKod(inp.value);
    inp.value = kod;
    if (kod.length !== 6) { showZoneResult(out, 'no', 'Wpisz pełny kod pocztowy, np. 09-400.'); return; }
    btn.disabled = true;
    try {
      const r = await fetch('/api/strefa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kod, zrodlo: f.dataset.source })
      });
      const z = await r.json();
      if (!r.ok) throw new Error(z.error || 'Błąd');
      zone = z;
      try { localStorage.setItem(ZKEY, JSON.stringify(zone)); } catch (err) {}
      paintZone();
      render();
      if (z.inZone) toast('🛵 Dowozimy do Ciebie sami!');
    } catch (err) {
      showZoneResult(out, 'no', 'Nie udało się sprawdzić kodu — spróbuj ponownie.');
    }
    btn.disabled = false;
  });
  paintZone();

  // na sukces-pagina wordt de cart geleegd; hier: als ?anulowano=1 open drawer weer
  if (new URLSearchParams(location.search).get('anulowano')) open();

  render();
})();

// ===== Toppers uitklappen =====
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-more]');
  if (!btn) return;
  const box = document.getElementById('more-' + btn.dataset.more);
  if (!box) return;
  const open = box.hidden;
  box.hidden = !open;
  btn.innerHTML = open
    ? 'Pokaż mniej ▴'
    : 'Pokaż wszystkie <span class="more-count">' + btn.dataset.count + '</span> produktów ▾';
  if (!open) btn.closest('.more-wrap').scrollIntoView({ behavior: 'smooth', block: 'center' });
});
document.querySelectorAll('[data-more]').forEach(b => {
  const c = b.querySelector('.more-count');
  if (c) b.dataset.count = c.textContent;
});

// ===== Pan Frikandel — AI assistent =====
(function () {
  const fab = document.getElementById('aiFab');
  const panel = document.getElementById('aiPanel');
  if (!fab || !panel) return;
  const msgsBox = document.getElementById('aiMsgs');
  const form = document.getElementById('aiForm');
  const input = document.getElementById('aiInput');
  const send = document.getElementById('aiSend');
  const byId = Object.fromEntries(window.CATALOG.map(p => [p.id, p]));
  const zl = gr => (gr / 100).toFixed(2).replace('.', ',') + ' zł';
  const history = [];

  fab.addEventListener('click', () => { panel.hidden = false; fab.hidden = true; input.focus(); });
  document.getElementById('aiClose').addEventListener('click', () => { panel.hidden = true; fab.hidden = false; });

  function esc(s) {
    return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  // [[product-id]] → productchip met + knop
  function renderBot(text) {
    let html = esc(text);
    html = html.replace(/\[\[([a-z0-9-]+)\]\]/g, (m, id) => {
      const p = byId[id];
      if (!p) return '';
      const img = p.img
        ? `<img src="/img/${p.img}" alt="">`
        : `<svg viewBox="0 0 140 140"><use href="#snack-${p.icon}"/></svg>`;
      return `<span class="ai-chip">${img}<span class="ai-chip-info"><b>${esc(p.name)}</b><i>${zl(p.price)}</i></span><button class="ai-chip-add" data-add="${id}">+</button></span>`;
    });
    return html.replace(/\n/g, '<br>');
  }

  function addMsg(cls, html) {
    const div = document.createElement('div');
    div.className = 'ai-msg ' + cls;
    div.innerHTML = html;
    msgsBox.appendChild(div);
    msgsBox.scrollTop = msgsBox.scrollHeight;
    return div;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q || send.disabled) return;
    input.value = '';
    addMsg('ai-msg-user', esc(q));
    history.push({ role: 'user', content: q });
    send.disabled = true;
    const typing = addMsg('ai-msg-bot ai-typing', 'Pan Frikandel myśli…');
    try {
      const r = await fetch('/api/assistent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });
      const data = await r.json();
      typing.remove();
      if (data.reply) {
        history.push({ role: 'assistant', content: data.reply });
        addMsg('ai-msg-bot', renderBot(data.reply));
      } else {
        addMsg('ai-msg-bot', esc(data.error || 'Coś poszło nie tak — spróbuj ponownie.'));
      }
    } catch (err) {
      typing.remove();
      addMsg('ai-msg-bot', 'Błąd połączenia — spróbuj ponownie.');
    }
    send.disabled = false;
    input.focus();
  });
})();
