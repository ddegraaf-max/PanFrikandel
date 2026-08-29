// ===== PanFrikandel — /foodtruck: kaart met standplaatsen + evenement-aanvraag =====
(function () {
  const T = window.T || {}, LANG = window.LANG || 'pl';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = d => new Date(d).toLocaleDateString(LANG === 'en' ? 'en-GB' : 'pl-PL', { day: 'numeric', month: 'short' });

  // ---- kaart (Leaflet + OpenStreetMap), alleen als er standplaatsen zijn ----
  const mapEl = document.getElementById('map');
  const stops = (window.STOPS || []).filter(s => s.lat && s.lon);
  if (mapEl && window.L && stops.length) {
    const map = L.map(mapEl, { scrollWheelZoom: false });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    const icon = L.divIcon({ className: 'pf-pin', html: '🍟', iconSize: [36, 36], iconAnchor: [18, 34], popupAnchor: [0, -30] });
    const bounds = [];
    for (const s of stops) {
      const dates = s.dateFrom === s.dateTo ? fmt(s.dateFrom) : fmt(s.dateFrom) + ' – ' + fmt(s.dateTo);
      L.marker([s.lat, s.lon], { icon }).addTo(map)
        .bindPopup(`<b>${esc(s.name)}</b><br>${esc(dates)}${s.hours ? ' · ' + esc(s.hours) : ''}${s.address ? '<br>' + esc(s.address) : ''}`);
      bounds.push([s.lat, s.lon]);
    }
    if (bounds.length === 1) map.setView(bounds[0], 13);
    else map.fitBounds(bounds, { padding: [30, 30] });
    // klik op een stop in de lijst → kaart centreren
    document.querySelectorAll('.stop[data-lat]').forEach(el => {
      if (!el.dataset.lat) return;
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => map.setView([+el.dataset.lat, +el.dataset.lon], 14));
    });
  } else if (mapEl) {
    mapEl.hidden = true;
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
