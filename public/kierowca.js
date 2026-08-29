// ===== PanFrikandel — /kierowca: telefoon in de frietkar zendt GPS-positie + "ogłoś lokalizację" =====
(function () {
  const T = window.T || {}, TT = window.TT || {}, LANG = window.LANG || 'pl';
  const KEY = 'pf_gps_token';
  const $ = s => document.querySelector(s);
  const fill = (s, vars) => Object.entries(vars || {}).reduce((acc, [k, v]) => acc.split('{' + k + '}').join(v), s || '');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // token: uit ?t= (eenmalig, daarna uit de URL), anders localStorage
  const url = new URL(location.href);
  let token = url.searchParams.get('t') || '';
  if (token) { try { localStorage.setItem(KEY, token); } catch (e) {} url.searchParams.delete('t'); history.replaceState(null, '', url.pathname + url.search); }
  else { try { token = localStorage.getItem(KEY) || ''; } catch (e) {} }
  const tokenInput = $('#gpsToken');
  tokenInput.value = token;
  $('#gpsTokenSave').addEventListener('click', () => {
    token = tokenInput.value.trim();
    try { localStorage.setItem(KEY, token); } catch (e) {}
    loadStatus();
  });

  const status = $('#gpsStatus'), startBtn = $('#gpsStart'), stopBtn = $('#gpsStop');
  const headers = () => ({ 'Content-Type': 'application/json', 'x-gps-token': token });
  const setStatus = (msg, bad) => { status.textContent = msg; status.classList.toggle('bad', !!bad); };

  // ---- uitzenden ----
  let watchId = null, lastSent = 0, lastPos = null, heartbeat = null, wakeLock = null;
  const dist = (a, b) => { // meters, ruwe benadering
    const dx = (a.lon - b.lon) * 111320 * Math.cos(a.lat * Math.PI / 180), dy = (a.lat - b.lat) * 110540;
    return Math.sqrt(dx * dx + dy * dy);
  };
  async function send(pos, force) {
    if (!token) { setStatus(T.gpsNoTokenSaved, true); return; }
    const p = { lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy || 0) };
    const now = Date.now();
    const moved = !lastPos || dist(p, lastPos) > 25;
    if (!force && now - lastSent < 15000 && !moved) return;
    try {
      const r = await fetch('/api/gps', { method: 'POST', headers: headers(), body: JSON.stringify(p) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || r.status);
      lastSent = now; lastPos = p;
      setStatus(fill(T.gpsSent, { time: new Date().toLocaleTimeString(LANG === 'en' ? 'en-GB' : 'pl-PL', { hour: '2-digit', minute: '2-digit' }), acc: p.accuracy }));
    } catch (err) {
      setStatus(fill(T.gpsErr, { msg: err.message }), true);
    }
  }
  async function start() {
    if (!navigator.geolocation) { setStatus(fill(T.gpsErr, { msg: 'no geolocation' }), true); return; }
    if (!token) { setStatus(T.gpsNoTokenSaved, true); return; }
    setStatus(T.gpsWaiting);
    watchId = navigator.geolocation.watchPosition(pos => send(pos, false), err => {
      setStatus(err.code === 1 ? T.gpsDenied : fill(T.gpsErr, { msg: err.message }), true);
    }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 });
    // heartbeat: ook stilstaand elke minuut een ping, zodat de positie "vers" blijft
    heartbeat = setInterval(() => { if (lastPos) send({ coords: { latitude: lastPos.lat, longitude: lastPos.lon, accuracy: lastPos.accuracy } }, true); }, 60000);
    try { if (navigator.wakeLock) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {}
    startBtn.hidden = true; stopBtn.hidden = false;
  }
  async function stop() {
    if (watchId != null) navigator.geolocation.clearWatch(watchId);
    watchId = null; clearInterval(heartbeat); heartbeat = null;
    try { if (wakeLock) { await wakeLock.release(); wakeLock = null; } } catch (e) {}
    try { await fetch('/api/gps/stop', { method: 'POST', headers: headers(), body: '{}' }); } catch (e) {}
    startBtn.hidden = false; stopBtn.hidden = true;
    setStatus(T.gpsIdle);
  }
  startBtn.addEventListener('click', start);
  stopBtn.addEventListener('click', stop);
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && watchId != null && navigator.wakeLock && !wakeLock) {
      try { wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {}
    }
  });

  // ---- ogłoś lokalizację ----
  const annBtn = $('#gpsAnnounce'), annStatus = $('#gpsAnnounceStatus'), subsEl = $('#gpsSubs');
  annBtn.addEventListener('click', async () => {
    if (!token) { annStatus.hidden = false; annStatus.textContent = T.gpsNoTokenSaved; return; }
    annBtn.disabled = true;
    annStatus.hidden = false; annStatus.textContent = T.gpsAnnouncing;
    try {
      const r = await fetch('/api/gps/oglos', { method: 'POST', headers: headers(), body: JSON.stringify({ info: $('#gpsInfo').value }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || r.status);
      annStatus.textContent = fill(T.gpsAnnounced, { place: d.place, sent: d.sent, subs: d.subscribers });
      loadStatus();
    } catch (err) {
      annStatus.textContent = fill(T.gpsErr, { msg: err.message });
    }
    annBtn.disabled = false;
  });

  // ---- kortingscode aan het loket: checken + als gebruikt markeren ----
  const codeInput = $('#gpsCode'), codeStatus = $('#gpsCodeStatus'), codeUseBtn = $('#gpsCodeUse');
  let checkedCode = '';
  async function codeCall(use) {
    if (!token) { codeStatus.hidden = false; codeStatus.textContent = T.gpsNoTokenSaved; return; }
    codeStatus.hidden = false;
    try {
      const r = await fetch('/api/gps/kod', { method: 'POST', headers: headers(), body: JSON.stringify({ code: use ? checkedCode : codeInput.value, use: !!use }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || r.status);
      if (!d.ok) { codeStatus.textContent = d.reason === 'used' ? T.gpsCodeUsed : T.gpsCodeInvalid; codeUseBtn.hidden = true; checkedCode = ''; return; }
      if (use) { codeStatus.textContent = fill(T.gpsCodeMarked, { percent: d.percent }); codeUseBtn.hidden = true; checkedCode = ''; codeInput.value = ''; return; }
      checkedCode = d.code;
      codeStatus.textContent = fill(T.gpsCodeOk, { percent: d.percent, email: d.email });
      codeUseBtn.hidden = false;
    } catch (err) {
      codeStatus.textContent = fill(T.gpsErr, { msg: err.message });
    }
  }
  $('#gpsCodeCheck').addEventListener('click', () => codeCall(false));
  codeUseBtn.addEventListener('click', () => codeCall(true));

  async function loadStatus() {
    if (!token) { subsEl.textContent = ''; return; }
    try {
      const r = await fetch('/api/gps/status', { headers: { 'x-gps-token': token } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || r.status);
      const when = d.announcedAt ? new Date(d.announcedAt).toLocaleString(LANG === 'en' ? 'en-GB' : 'pl-PL', { dateStyle: 'short', timeStyle: 'short' }) : TT.never;
      subsEl.innerHTML = esc(fill(TT.subs, { n: d.subscribers })) + '<br>' + esc(fill(TT.last, { when, place: d.place || '–' }));
    } catch (err) {
      subsEl.textContent = fill(T.gpsErr, { msg: err.message });
    }
  }
  loadStatus();
})();
