// ===== Pan Frikandel — koszyk =====
(function () {
  const KEY = 'pf_cart_v1';
  const byId = Object.fromEntries(window.CATALOG.map(p => [p.id, p]));
  const zl = gr => (gr / 100).toFixed(2).replace('.', ',') + ' zł';

  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { cart = {}; }
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
    if (!n) { ship.textContent = ''; }
    else if (sub >= window.SHIPPING.freeAboveGr) {
      ship.textContent = '🎉 Darmowa dostawa!';
      ship.classList.add('free');
    } else {
      ship.textContent = `Dostawa ${zl(window.SHIPPING.standardGr)} · do darmowej brakuje ${zl(window.SHIPPING.freeAboveGr - sub)}`;
      ship.classList.remove('free');
    }
    $('#cartTotal').textContent = zl(sub + (n && sub < window.SHIPPING.freeAboveGr ? window.SHIPPING.standardGr : 0));
    $('#checkoutBtn').disabled = !n;
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

  document.addEventListener('click', e => {
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
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { close(); closeDetails(); } });

  $('#checkoutBtn').addEventListener('click', async () => {
    const btn = $('#checkoutBtn');
    btn.disabled = true;
    btn.textContent = 'Chwileczkę…';
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: Object.entries(cart).map(([id, qty]) => ({ id, qty })) })
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
