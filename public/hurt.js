// ===== PanFrikandel — /hurt: katalog hurtowy, zapytanie o cenę =====
// Teksten uit window.T (locales/ui.js → client), producten uit window.CATALOG.
(function () {
  const KEY = 'pf_ask_v1';
  const T = window.T || {};
  const byId = Object.fromEntries(window.CATALOG.map(p => [p.id, p]));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = s => document.querySelector(s);

  // zapytanie: { id: qty(string) }
  let ask = {};
  try { ask = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { ask = {}; }
  for (const id of Object.keys(ask)) if (!byId[id]) delete ask[id];

  const drawer = $('#askDrawer'), overlay = $('#askOverlay');
  function save() { localStorage.setItem(KEY, JSON.stringify(ask)); }
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

  function render() {
    const ids = Object.keys(ask);
    const badge = $('#askCount');
    badge.hidden = ids.length === 0;
    badge.textContent = ids.length;

    const box = $('#askItems');
    if (!ids.length) {
      box.innerHTML = '<p class="cart-empty">' + T.hurtEmptyHtml + '</p>';
    } else {
      box.innerHTML = ids.map(id => {
        const p = byId[id];
        return `<div class="ci ci-ask">
          ${p.img ? `<img src="/img/${p.img}" alt="">` : `<svg viewBox="0 0 140 140"><use href="#snack-${p.icon}"/></svg>`}
          <div><div class="ci-name">${esc(p.name)}</div><div class="ci-price">${esc(p.unit)}</div></div>
          <div class="ci-ask-qty">
            <input data-qty="${id}" value="${esc(ask[id])}" placeholder="${esc(T.hurtQty)}" maxlength="40" aria-label="${esc(T.hurtQty)}">
            <button type="button" data-remove="${id}" aria-label="${esc(T.hurtRemove)}">✕</button>
          </div>
        </div>`;
      }).join('');
    }
    // knoppen in de catalogus markeren
    document.querySelectorAll('[data-ask]').forEach(b => {
      const inAsk = !!ask[b.dataset.ask];
      b.textContent = inAsk ? T.hurtAsked : T.hurtAsk;
      b.classList.toggle('is-asked', inAsk);
    });
    save();
  }

  // ---- product-detailmodal (zelfde markup als de shop) ----
  const pdOverlay = $('#pdOverlay'), pdBody = $('#pdBody');
  function openDetails(id) {
    const src = document.getElementById('pd-' + id);
    if (!src) return;
    pdBody.innerHTML = src.innerHTML;
    pdOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
    render();
  }
  function closeDetails() { pdOverlay.hidden = true; document.body.style.overflow = ''; }
  $('#pdClose').addEventListener('click', closeDetails);
  pdOverlay.addEventListener('click', e => { if (e.target === pdOverlay) closeDetails(); });

  document.addEventListener('click', e => {
    const det = e.target.closest('[data-details]');
    const askBtn = e.target.closest('[data-ask]');
    const rm = e.target.closest('[data-remove]');
    if (det && !askBtn) { openDetails(det.dataset.details); return; }
    if (askBtn) {
      const id = askBtn.dataset.ask;
      if (!ask[id]) { ask[id] = ''; toast(T.hurtAddedToast); }
      render();
      closeDetails();
      return;
    }
    if (rm) { delete ask[rm.dataset.remove]; render(); }
  });
  document.addEventListener('input', e => {
    if (e.target.matches('[data-qty]')) { ask[e.target.dataset.qty] = e.target.value.slice(0, 40); save(); }
  });

  $('#askBtn').addEventListener('click', open);
  $('#askClose').addEventListener('click', close);
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { close(); closeDetails(); } });

  // ---- formulier → /api/zapytanie ----
  const form = $('#askForm'), status = $('#askStatus'), sendBtn = $('#askSend');
  function showStatus(cls, html) { status.innerHTML = html; status.classList.remove('ok', 'no'); status.classList.add(cls); status.hidden = false; }
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(form).entries());
    const items = Object.entries(ask).map(([id, qty]) => ({ id, qty }));
    if (!f.name.trim() || !(f.email.trim() || f.phone.trim())) { showStatus('no', esc(T.hurtErrForm)); return; }
    if (!items.length && !f.message.trim()) { showStatus('no', esc(T.hurtErrEmpty)); return; }
    sendBtn.disabled = true;
    sendBtn.textContent = T.hurtSending;
    try {
      const r = await fetch('/api/zapytanie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, items })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || T.errGeneric);
      ask = {};
      form.reset();
      render();
      showStatus('ok', T.hurtSentHtml);
    } catch (err) {
      showStatus('no', esc(err.message || T.errConn));
    }
    sendBtn.disabled = false;
    sendBtn.textContent = T.hurtSend;
  });

  render();
})();
