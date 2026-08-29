// ===== PanFrikandel — koszyk =====
// Teksten komen uit window.T (PL/EN, zie locales/ui.js), bezorgconfig uit window.DELIVERY.
(function () {
  const KEY = 'pf_cart_v1', ZKEY = 'pf_zone_v1';
  const T = window.T || {}, D = window.DELIVERY || {}, LANG = window.LANG || 'pl';
  const byId = Object.fromEntries(window.CATALOG.map(p => [p.id, p]));
  const zl = gr => (gr / 100).toFixed(2).replace('.', LANG === 'en' ? '.' : ',') + ' zł';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fill = (s, vars) => Object.entries(vars || {}).reduce((acc, [k, v]) => acc.split('{' + k + '}').join(v), s || '');
  const V = () => ({ radius: D.radiusKm, city: D.city, price: zl(D.priceGr), free: zl(D.freeAboveGr), eta: D.eta });

  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { cart = {}; }
  // opschonen: alleen bekende producten
  for (const id of Object.keys(cart)) if (!byId[id]) delete cart[id];

  // strefa dostawy (Płock + 50 km) — onthouden per browser: { code, known, place, km, inZone }
  let zone = null;
  try { zone = JSON.parse(localStorage.getItem(ZKEY)); } catch (e) { zone = null; }
  if (zone && !zone.code) zone = null;

  // kortingscode van een abonnee: { code: 'PF-XXXXXX', percent }
  const CKEY = 'pf_code_v1';
  let disc = null;
  try { disc = JSON.parse(localStorage.getItem(CKEY)); } catch (e) { disc = null; }
  if (disc && !(disc.code && disc.percent)) disc = null;

  const $ = s => document.querySelector(s);
  const drawer = $('#cartDrawer'), overlay = $('#cartOverlay');

  function save() { localStorage.setItem(KEY, JSON.stringify(cart)); }
  function count() { return Object.values(cart).reduce((a, b) => a + b, 0); }
  function subtotal() { return Object.entries(cart).reduce((s, [id, q]) => s + byId[id].price * q, 0); }

  // Bezorging: alleen binnen de zone kan er afgerekend worden
  function deliveryFor(sub) {
    if (!zone) return { ok: false, gr: 0, cls: 'warn', text: fill(T.needZone, V()) };
    if (!zone.inZone) {
      const vars = { ...V(), place: zone.place, km: zone.km, code: zone.code };
      return { ok: false, gr: 0, cls: 'warn', text: fill(zone.known ? T.outsideZone : T.unknownZone, vars) };
    }
    if (sub >= D.freeAboveGr) return { ok: true, gr: 0, cls: 'free', text: fill(T.shipFree, { place: zone.place }) };
    return { ok: true, gr: D.priceGr, cls: '', text: fill(T.shipLine, { ...V(), place: zone.place, km: zone.km, missing: zl(D.freeAboveGr - sub) }) };
  }

  function render() {
    const n = count();
    const badge = $('#cartCount');
    badge.hidden = n === 0;
    badge.textContent = n;

    const box = $('#cartItems');
    if (!n) {
      box.innerHTML = '<p class="cart-empty">' + T.cartEmptyHtml + '</p>';
    } else {
      box.innerHTML = Object.entries(cart).map(([id, q]) => {
        const p = byId[id];
        return `<div class="ci">
          ${p.img ? `<img src="/img/${p.img}" alt="">` : `<svg viewBox="0 0 140 140"><use href="#snack-${p.icon}"/></svg>`}
          <div><div class="ci-name">${esc(p.name)}</div><div class="ci-price">${zl(p.price)} / ${esc(p.unit)}</div></div>
          <div class="ci-qty">
            <button data-dec="${id}" aria-label="${esc(T.less)}">−</button><b>${q}</b><button data-inc="${id}" aria-label="${esc(T.more)}">+</button>
          </div>
        </div>`;
      }).join('');
    }

    const sub = subtotal();
    const d = deliveryFor(sub);
    const ship = $('#cartShip');
    ship.className = 'cart-ship' + (n && d.cls ? ' ' + d.cls : '');
    ship.textContent = n ? d.text : '';
    // korting (percentage op de producten; gratis-bezorgdrempel blijft op het subtotaal vóór korting)
    const off = disc && n ? Math.round(sub * disc.percent / 100) : 0;
    const discEl = $('#cartDiscount');
    discEl.hidden = !off;
    discEl.textContent = off ? fill(T.discountLine, { percent: disc.percent, code: disc.code, amount: zl(off) }) : '';
    $('#cartTotal').textContent = zl(sub - off + (n && d.ok ? d.gr : 0));
    $('#checkoutBtn').disabled = !n || !d.ok;
    save();
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
      lbOverlay.innerHTML = '<button class="modal-close lightbox-close" aria-label="' + esc(T.close || '✕') + '">✕</button><img alt="">';
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
    if (add) { const id = add.dataset.add; cart[id] = (cart[id] || 0) + 1; render(); toast(T.added); closeDetails(); }
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
    btn.textContent = T.wait;
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: Object.entries(cart).map(([id, qty]) => ({ id, qty })),
          kod: zone ? zone.code : null,
          kod_rabatowy: disc ? disc.code : null
        })
      });
      const data = await res.json();
      if (data.url) { location.href = data.url; return; }
      if (data.badCode) { disc = null; try { localStorage.removeItem(CKEY); } catch (e) {} paintCode(); }
      toast(data.error || T.errGeneric);
    } catch (e) {
      toast(T.errConn);
    }
    btn.disabled = false;
    btn.textContent = T.checkout;
    render();
  });

  // ---- strefa dostawy: kod pocztowy → /api/strefa ----
  const fmtKod = v => {
    const d = String(v).replace(/\D/g, '').slice(0, 5);
    return d.length > 2 ? d.slice(0, 2) + '-' + d.slice(2) : d;
  };
  function zoneMsg(z) {
    const vars = { ...V(), place: esc(z.place || ''), km: z.km, code: esc(z.code || '') };
    if (z.inZone) return { cls: 'ok', html: fill(T.zoneOkHtml, vars) };
    if (z.known) return { cls: 'no', html: fill(T.zoneFarHtml, vars) };
    return { cls: 'no', html: fill(T.zoneUnknownHtml, vars) };
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
    if (kod.length !== 6) { showZoneResult(out, 'no', esc(T.zoneInvalid)); return; }
    btn.disabled = true;
    try {
      const r = await fetch('/api/strefa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kod, zrodlo: f.dataset.source })
      });
      const z = await r.json();
      if (!r.ok) throw new Error(z.error || 'error');
      zone = { code: z.code, known: z.known, place: z.place, km: z.km, inZone: z.inZone };
      try { localStorage.setItem(ZKEY, JSON.stringify(zone)); } catch (err) {}
      paintZone();
      render();
      if (z.inZone) toast(T.zoneToast);
    } catch (err) {
      showZoneResult(out, 'no', esc(T.zoneErr));
    }
    btn.disabled = false;
  });
  paintZone();

  // ---- kortingscode: PF-XXXXXX → /api/kod ----
  const codeForm = document.querySelector('[data-code-form]');
  function paintCode() {
    if (!codeForm) return;
    const inp = codeForm.querySelector('[data-code-input]'), out = codeForm.querySelector('[data-code-result]');
    if (disc) { inp.value = disc.code; showZoneResult(out, 'ok', fill(T.codeOkHtml, { code: esc(disc.code), percent: disc.percent })); }
    else { out.hidden = true; }
  }
  if (codeForm) {
    codeForm.addEventListener('submit', async e => {
      e.preventDefault();
      const inp = codeForm.querySelector('[data-code-input]'), out = codeForm.querySelector('[data-code-result]');
      const btn = codeForm.querySelector('button[type="submit"]');
      const raw = inp.value.trim();
      if (!raw) { disc = null; try { localStorage.removeItem(CKEY); } catch (err) {} paintCode(); render(); return; }
      btn.disabled = true;
      try {
        const r = await fetch('/api/kod', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: raw }) });
        const d = await r.json();
        if (!r.ok) { disc = null; try { localStorage.removeItem(CKEY); } catch (err) {} showZoneResult(out, 'no', esc(d.error || T.codeInvalid)); render(); }
        else { disc = { code: d.code, percent: d.percent }; try { localStorage.setItem(CKEY, JSON.stringify(disc)); } catch (err) {} paintCode(); render(); toast(fill(T.codeOkHtml, { code: d.code, percent: d.percent }).replace(/<[^>]+>/g, '')); }
      } catch (err) {
        showZoneResult(out, 'no', esc(T.codeErr));
      }
      btn.disabled = false;
    });
    paintCode();
  }

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
  const T = window.T || {};
  const open = box.hidden;
  box.hidden = !open;
  btn.innerHTML = open ? T.showLess : (T.showAllHtml || '').split('{n}').join(btn.dataset.count);
  if (!open) btn.closest('.more-wrap').scrollIntoView({ behavior: 'smooth', block: 'center' });
});

// ===== PanFrikandel — AI assistent =====
(function () {
  const fab = document.getElementById('aiFab');
  const panel = document.getElementById('aiPanel');
  if (!fab || !panel) return;
  const T = window.T || {}, LANG = window.LANG || 'pl';
  const msgsBox = document.getElementById('aiMsgs');
  const form = document.getElementById('aiForm');
  const input = document.getElementById('aiInput');
  const send = document.getElementById('aiSend');
  const byId = Object.fromEntries(window.CATALOG.map(p => [p.id, p]));
  const zl = gr => (gr / 100).toFixed(2).replace('.', LANG === 'en' ? '.' : ',') + ' zł';
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
    const typing = addMsg('ai-msg-bot ai-typing', esc(T.aiThinking || '…'));
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
        addMsg('ai-msg-bot', esc(data.error || T.aiErr));
      }
    } catch (err) {
      typing.remove();
      addMsg('ai-msg-bot', esc(T.aiConn));
    }
    send.disabled = false;
    input.focus();
  });
})();
