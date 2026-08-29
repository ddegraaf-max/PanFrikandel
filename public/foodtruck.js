// ===== PanFrikandel — /foodtruck: kaart met standplaatsen, live GPS-positie, evenement-aanvraag, powiadomienia =====
(function () {
  const T = window.T || {}, LANG = window.LANG || 'pl';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fill = (s, vars) => Object.entries(vars || {}).reduce((acc, [k, v]) => acc.split('{' + k + '}').join(v), s || '');
  const fmt = d => new Date(d).toLocaleDateString(LANG === 'en' ? 'en-GB' : 'pl-PL', { day: 'numeric', month: 'short' });

  // ---- kaart (Leaflet + OpenStreetMap): standplaatsen + live 🚚 ----
  const mapEl = document.getElementById('map'), grid = document.querySelector('.where-grid');
  const stops = (window.STOPS || []).filter(s => s.lat && s.lon);
  let map = null, liveMarker = null;
  const pin = L => L.divIcon({ className: 'pf-pin', html: '🍟', iconSize: [36, 36], iconAnchor: [18, 34], popupAnchor: [0, -30] });
  const truckPin = L => L.divIcon({ className: 'pf-pin pf-pin-live', html: '🚚', iconSize: [44, 44], iconAnchor: [22, 40], popupAnchor: [0, -36] });

  function ensureMap() {
    if (map || !mapEl || !window.L) return map;
    mapEl.hidden = false;
    if (grid) grid.classList.remove('no-map');
    map = L.map(mapEl, { scrollWheelZoom: false });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    for (const s of stops) {
      const dates = s.dateFrom === s.dateTo ? fmt(s.dateFrom) : fmt(s.dateFrom) + ' – ' + fmt(s.dateTo);
      L.marker([s.lat, s.lon], { icon: pin(L) }).addTo(map)
        .bindPopup(`<b>${esc(s.name)}</b><br>${esc(dates)}${s.hours ? ' · ' + esc(s.hours) : ''}${s.address ? '<br>' + esc(s.address) : ''}`);
    }
    fit();
    document.querySelectorAll('.stop[data-lat]').forEach(el => {
      if (!el.dataset.lat) return;
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => map.setView([+el.dataset.lat, +el.dataset.lon], 14));
    });
    return map;
  }
  function fit() {
    const pts = stops.map(s => [s.lat, s.lon]);
    if (liveMarker) pts.unshift([liveMarker.getLatLng().lat, liveMarker.getLatLng().lng]);
    if (!pts.length) return;
    if (pts.length === 1) map.setView(pts[0], liveMarker ? 15 : 13);
    else map.fitBounds(pts, { padding: [30, 30] });
  }
  if (stops.length) ensureMap();
  else if (grid) grid.classList.add('no-map');

  // ---- live positie: /api/gps elke 30 s ----
  const liveBar = document.getElementById('liveBar');
  async function pollLive() {
    try {
      const r = await fetch('/api/gps', { cache: 'no-store' });
      const d = await r.json();
      if (!liveBar) return;
      if (d.live) {
        const ago = d.ageMin < 1 ? T.liveJustNow : fill(T.liveAgo, { n: d.ageMin });
        liveBar.innerHTML = fill(T.liveNowHtml, { place: esc(d.place || (d.lat.toFixed(4) + ', ' + d.lon.toFixed(4))), ago: esc(ago) }) + (d.info ? ' <span class="live-info">' + esc(d.info) + '</span>' : '');
        liveBar.className = 'live-bar on';
        liveBar.hidden = false;
        const m = ensureMap();
        if (m) {
          const ll = [d.lat, d.lon];
          const popup = `<b>${esc(T.liveHere)}</b>${d.place ? '<br>' + esc(d.place) : ''}`;
          if (!liveMarker) { liveMarker = L.marker(ll, { icon: truckPin(L), zIndexOffset: 1000 }).addTo(m).bindPopup(popup); fit(); }
          else { liveMarker.setLatLng(ll); liveMarker.setPopupContent(popup); }
        }
      } else {
        liveBar.innerHTML = T.liveOffHtml;
        liveBar.className = 'live-bar off';
        liveBar.hidden = false;
        if (liveMarker && map) { map.removeLayer(liveMarker); liveMarker = null; fit(); }
      }
    } catch (e) { /* stil: bar blijft zoals hij was */ }
  }
  pollLive();
  setInterval(pollLive, 30000);

  // ---- powiadomienia: zapis → /api/subskrypcja ----
  const subForm = document.getElementById('subForm');
  if (subForm) {
    const st = document.getElementById('subStatus'), btn = document.getElementById('subSend');
    const show = (cls, html) => { st.innerHTML = html; st.classList.remove('ok', 'no'); st.classList.add(cls); st.hidden = false; };
    subForm.addEventListener('submit', async e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(subForm).entries());
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email || '')) { show('no', esc(T.subErrEmail)); return; }
      if (!f.consent) { show('no', esc(T.subErrConsent)); return; }
      btn.disabled = true; btn.textContent = T.subSending;
      try {
        const r = await fetch('/api/subskrypcja', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: f.email, place: f.place || '', consent: true }) });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || T.errGeneric);
        show('ok', d.confirmed ? T.subAlreadyHtml : T.subSentHtml);
        subForm.reset();
      } catch (err) {
        show('no', esc(err.message || T.errConn));
      }
      btn.disabled = false; btn.textContent = T.subSend;
    });
  }

  // ---- evenement-aanvraag → /api/wydarzenie ----
  const form = document.getElementById('eventForm'), status = document.getElementById('eventStatus'), btn = document.getElementById('eventSend');
  if (!form) return;
  function showStatus(cls, html) { status.innerHTML = html; status.classList.remove('ok', 'no'); status.classList.add(cls); status.hidden = false; }
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(form).entries());
    if (!f.name.trim() || !(f.email.trim() || f.phone.trim()) || !f.date || !f.place.trim()) { showStatus('no', esc(T.eventErrForm)); return; }
    btn.disabled = true;
    btn.textContent = T.eventSending;
    try {
      const r = await fetch('/api/wydarzenie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f)
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || T.errGeneric);
      form.reset();
      showStatus('ok', T.eventSentHtml);
    } catch (err) {
      showStatus('no', esc(err.message || T.errConn));
    }
    btn.disabled = false;
    btn.textContent = T.eventSend;
  });
})();
