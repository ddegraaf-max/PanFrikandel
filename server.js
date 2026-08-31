// ============================================================
//  PANFRIKANDEL — server.js
//  Holenderskie przekąski · dowozimy sami: Płock + 50 km · PL/EN
//  Stack: Express + EJS + Stripe Checkout + Resend
// ============================================================

// .env laden als het bestand bestaat (Node ≥ 20.12) — op Railway komen de variabelen uit de omgeving
try { process.loadEnvFile(); } catch (e) {}

const express = require('express');
const path = require('path');
const Stripe = require('stripe');
const { Resend } = require('resend');

process.on('unhandledRejection', err => console.error('Onafgevangen promise-fout:', err && err.stack || err));
process.on('uncaughtException', err => console.error('Onafgevangen fout:', err && err.stack || err));

const app = express();
const PORT = process.env.PORT || 3000;
// BASE_URL normaliseren: spaties en slash aan het eind weg, https:// erbij als het schema ontbreekt
const normalizeBase = u => {
  u = String(u || '').trim().replace(/\/+$/, '');
  if (u && !/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u;
};
const BASE_URL = normalizeBase(process.env.BASE_URL) || `http://localhost:${PORT}`;

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const ORDER_EMAIL_FROM = process.env.ORDER_EMAIL_FROM || 'PanFrikandel <zamowienia@panfrikandel.pl>';
const ORDER_EMAIL_BCC  = process.env.ORDER_EMAIL_BCC || null;

// Bedrijfsgegevens (regulamin, privacybeleid, footer) — jednoosobowa działalność, wpis w CEIDG
const COMPANY = {
  name:    process.env.COMPANY_NAME    || 'Budomatch Daniel de Graaf',
  address: process.env.COMPANY_ADDRESS || 'Białka 15, 09-550 Białka',   // gmina Szczawin Kościelny (zoals op budomatch.pl)
  nip:     process.env.COMPANY_NIP     || '7010869430',
  regon:   process.env.COMPANY_REGON   || '381430120',
  email:   process.env.COMPANY_EMAIL   || 'hallo@panfrikandel.pl',
  phone:   process.env.COMPANY_PHONE   || ''
};

const ASSET_V = Date.now().toString(36);

// Versie: package.json + commit-hash van de deploy (Railway zet RAILWAY_GIT_COMMIT_SHA) — zichtbaar in footer/admin
const VERSION = require('./package.json').version;
const BUILD = String(process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_COMMIT || process.env.SOURCE_VERSION || '').slice(0, 7);
const VERSION_LABEL = 'v' + VERSION + (BUILD ? ' · ' + BUILD : '');
const STARTED_AT = new Date();
// Publieke URL: BASE_URL als die gezet is, anders afgeleid van het request (zodat Stripe nooit naar localhost terugstuurt)
const siteUrl = req => normalizeBase(process.env.BASE_URL) || `${req.protocol}://${req.get('host')}`;

app.set('trust proxy', 1);   // Railway/proxy: juiste protocol en host voor redirect-URL's
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use((req, res, next) => {
  if (/\/{2,}/.test(req.path)) return res.redirect(301, req.originalUrl.replace(/\/{2,}/g, '/'));
  next();
});
app.get('/healthz', (req, res) => res.type('text/plain').send('ok ' + VERSION_LABEL + ' · database: ' + dbStatus));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));

// ============================================================
//  CATALOGI
//  catalog/retail.js    — Mora-consumentenverpakkingen: de shop, met prijs
//  catalog/wholesale.js — horeca-catalogus: /hurt, prijs op aanvraag
// ============================================================

const { PRICING, RETAIL } = require('./catalog/retail');
const WHOLESALE = require('./catalog/wholesale');
const PRODUCTS = RETAIL;                                            // alle retailproducten (ook inactieve — voor admin)
const productById = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
const activeProducts = () => PRODUCTS.filter(p => p.active !== false);
const wholesaleById = Object.fromEntries(WHOLESALE.map(p => [p.id, p]));

// Verkoopprijs = inkoop (Vomar, EUR) × koers × opslag, afgerond op ,90 zł — tenzij admin-override
const round90 = pln => Math.max(Math.round(pln) * 100 - 10, 90);
for (const p of PRODUCTS) {
  if (p.buyEur) { p.basePrice = round90(p.buyEur * PRICING.eurPln * PRICING.markup); p.price = p.basePrice; }
}
const zl = gr => (gr / 100).toFixed(2).replace('.', ',') + ' zł';

// ============================================================
//  PRIJS-OVERRIDES  (PostgreSQL op Railway; lokaal JSON-fallback)
// ============================================================

const fs = require('fs');
const PRICES_FILE = path.join(__dirname, 'data', 'prices.json');
let pool = null;
let dbStatus = process.env.DATABASE_URL ? 'verbinden…' : 'geen (DATABASE_URL niet gezet — data gaat verloren bij een redeploy)';
if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('.railway.internal') ? false : { rejectUnauthorized: false },
    max: 5, connectionTimeoutMillis: 8000, idleTimeoutMillis: 30000
  });
  pool.on('error', err => { dbStatus = 'fout: ' + err.message; console.error('PostgreSQL-verbindingsfout (proces blijft draaien):', err.message); });
}

function applyOverrides(overrides) {
  for (const [id, price] of Object.entries(overrides)) {
    const p = productById[id];
    const gr = parseInt(price, 10);
    if (p && Number.isInteger(gr) && gr >= 100 && gr <= 10000000) p.price = gr;
  }
}

async function loadPrices() {
  try {
    if (pool) {
      await pool.query('CREATE TABLE IF NOT EXISTS price_overrides (product_id TEXT PRIMARY KEY, price_gr INTEGER NOT NULL, updated_at TIMESTAMPTZ DEFAULT now())');
      const { rows } = await pool.query('SELECT product_id, price_gr FROM price_overrides');
      dbStatus = 'ok';
      applyOverrides(Object.fromEntries(rows.map(r => [r.product_id, r.price_gr])));
      console.log(`💾 ${rows.length} prijs-overrides geladen uit PostgreSQL`);
    } else if (fs.existsSync(PRICES_FILE)) {
      applyOverrides(JSON.parse(fs.readFileSync(PRICES_FILE, 'utf8')));
      console.log('💾 Prijs-overrides geladen uit data/prices.json (⚠️ zet DATABASE_URL voor persistentie op Railway)');
    }
  } catch (err) {
    if (pool) dbStatus = 'fout: ' + err.message;
    console.error('Prijzen laden mislukt:', err.message);
  }
}

// Actief-vlaggen (welke retailproducten in de shop staan) — zelfde persistentie als prijzen
const FLAGS_FILE = path.join(__dirname, 'data', 'flags.json');
function applyFlags(flags) {
  for (const [id, on] of Object.entries(flags)) if (productById[id]) productById[id].active = !!on;
}
async function loadFlags() {
  try {
    if (pool) {
      await pool.query('CREATE TABLE IF NOT EXISTS product_flags (product_id TEXT PRIMARY KEY, active BOOLEAN NOT NULL, updated_at TIMESTAMPTZ DEFAULT now())');
      const { rows } = await pool.query('SELECT product_id, active FROM product_flags');
      applyFlags(Object.fromEntries(rows.map(r => [r.product_id, r.active])));
    } else if (fs.existsSync(FLAGS_FILE)) {
      applyFlags(JSON.parse(fs.readFileSync(FLAGS_FILE, 'utf8')));
    }
  } catch (err) {
    console.error('Vlaggen laden mislukt:', err.message);
  }
}
async function saveFlags(changes) {
  applyFlags(changes);
  if (pool) {
    for (const [id, on] of Object.entries(changes)) {
      await pool.query(
        'INSERT INTO product_flags (product_id, active, updated_at) VALUES ($1, $2, now()) ON CONFLICT (product_id) DO UPDATE SET active = $2, updated_at = now()',
        [id, !!on]
      );
    }
  } else {
    let all = {};
    try { if (fs.existsSync(FLAGS_FILE)) all = JSON.parse(fs.readFileSync(FLAGS_FILE, 'utf8')); } catch (e) {}
    Object.assign(all, changes);
    fs.mkdirSync(path.dirname(FLAGS_FILE), { recursive: true });
    fs.writeFileSync(FLAGS_FILE, JSON.stringify(all, null, 2));
  }
}

// Voorraad per product (stuks). Standaard STOCK_DEFAULT (10); bij een betaalde bestelling gaat het
// bestelde aantal eraf (/sukces). Mag negatief worden = "na zamówienie" (nog in te kopen).
// In admin bij te stellen na een nieuwe inkoop.
const STOCK_DEFAULT = parseInt(process.env.STOCK_DEFAULT, 10);
for (const p of PRODUCTS) if (p.stock == null) p.stock = Number.isInteger(STOCK_DEFAULT) ? STOCK_DEFAULT : 10;
const STOCK_FILE = path.join(__dirname, 'data', 'stock.json');
function applyStock(rows) {
  for (const [id, qty] of Object.entries(rows)) {
    const n = parseInt(qty, 10);
    if (productById[id] && Number.isInteger(n)) productById[id].stock = n;
  }
}
async function loadStock() {
  try {
    if (pool) {
      await pool.query('CREATE TABLE IF NOT EXISTS stock (product_id TEXT PRIMARY KEY, qty INTEGER NOT NULL, updated_at TIMESTAMPTZ DEFAULT now())');
      const { rows } = await pool.query('SELECT product_id, qty FROM stock');
      applyStock(Object.fromEntries(rows.map(r => [r.product_id, r.qty])));
    } else if (fs.existsSync(STOCK_FILE)) {
      applyStock(JSON.parse(fs.readFileSync(STOCK_FILE, 'utf8')));
    }
  } catch (err) {
    console.error('Voorraad laden mislukt:', err.message);
  }
}
async function saveStock(changes) {
  applyStock(changes);
  if (pool) {
    for (const id of Object.keys(changes)) {
      await pool.query(
        'INSERT INTO stock (product_id, qty, updated_at) VALUES ($1, $2, now()) ON CONFLICT (product_id) DO UPDATE SET qty = $2, updated_at = now()',
        [id, productById[id].stock]
      );
    }
  } else {
    fs.mkdirSync(path.dirname(STOCK_FILE), { recursive: true });
    fs.writeFileSync(STOCK_FILE, JSON.stringify(Object.fromEntries(PRODUCTS.map(p => [p.id, p.stock])), null, 2));
  }
}
// bestelde aantallen afboeken: { id: qty } (mag onder nul: na zamówienie)
async function stockDeduct(items) {
  const changes = {};
  for (const [id, qty] of Object.entries(items)) {
    if (productById[id]) changes[id] = (productById[id].stock || 0) - qty;
  }
  if (Object.keys(changes).length) {
    try { await saveStock(changes); console.log('📦 Voorraad afgeboekt:', JSON.stringify(items)); }
    catch (err) { console.error('Voorraad afboeken mislukt:', err.message); }
  }
}

async function savePrices(changes) {
  applyOverrides(changes);
  if (pool) {
    for (const [id, gr] of Object.entries(changes)) {
      await pool.query(
        'INSERT INTO price_overrides (product_id, price_gr, updated_at) VALUES ($1, $2, now()) ON CONFLICT (product_id) DO UPDATE SET price_gr = $2, updated_at = now()',
        [id, gr]
      );
    }
  } else {
    let all = {};
    try { if (fs.existsSync(PRICES_FILE)) all = JSON.parse(fs.readFileSync(PRICES_FILE, 'utf8')); } catch (e) {}
    Object.assign(all, changes);
    fs.mkdirSync(path.dirname(PRICES_FILE), { recursive: true });
    fs.writeFileSync(PRICES_FILE, JSON.stringify(all, null, 2));
  }
}

// ============================================================
//  DOSTAWA — dowozimy sami, Płock + 50 km (jedyna forma dostawy)
//  Straal: env DELIVERY_RADIUS_KM (default 50). Prijs, gratis-drempel en
//  levertekst (PL/EN) hieronder aanpassen.
// ============================================================

const DELIVERY = {
  radiusKm: parseInt(process.env.DELIVERY_RADIUS_KM || process.env.LOCAL_RADIUS_KM, 10) || 50,
  center: { name: 'Płock', lat: 52.5464, lon: 19.7065 },
  priceGr: 1900,             // 19 zł
  freeAboveGr: 15000,        // gratis powyżej 150 zł
  eta: { pl: 'zwykle następnego dnia', en: 'usually the next day' },
  // levertijd als (een deel van) de bestelling boven de voorraad zit — "na zamówienie"
  backorderEta: { pl: process.env.BACKORDER_ETA_PL || 'ok. 5–7 dni', en: process.env.BACKORDER_ETA_EN || 'about 5–7 days' }
};

// ---- Cloudflare Turnstile (anti-spam op formulieren). Zonder sleutels: uitgeschakeld. ----
const TURNSTILE_SITE_KEY = process.env.TURNSTILE_SITE_KEY || null;
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY || null;
const clientIp = req => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
async function turnstileOk(req) {
  if (!TURNSTILE_SECRET) return true;
  const token = String(req.body?.turnstile || '').trim();
  if (!token) return false;
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: TURNSTILE_SECRET, response: token, remoteip: clientIp(req) })
    });
    const d = await r.json();
    if (!d.success) console.warn('Turnstile geweigerd:', (d['error-codes'] || []).join(','));
    return !!d.success;
  } catch (err) {
    console.error('Turnstile-verificatie mislukt:', err.message);
    return false;
  }
}

// ---- Socials (footer, /foodtruck) + food truck ----
const SOCIALS = {
  instagram: process.env.SOCIAL_INSTAGRAM || 'https://www.instagram.com/panfrikandel',
  facebook:  process.env.SOCIAL_FACEBOOK  || 'https://www.facebook.com/panfrikandel',
  tiktok:    process.env.SOCIAL_TIKTOK    || 'https://www.tiktok.com/@panfrikandel'
};
// Starttekst op /foodtruck (bv. "wiosna 2027" / "spring 2027"); leeg = "wkrótce" / "soon"
const FOODTRUCK_LAUNCH = { pl: process.env.FOODTRUCK_LAUNCH_PL || '2027', en: process.env.FOODTRUCK_LAUNCH_EN || '2027' };

// Kody pocztowe → przybliżone współrzędne (centrum miejscowości / gminy).
// Dokładny kod ma pierwszeństwo, potem prefiks "NN-N" (główne miasto podregionu).
// Odległość liczona w linii prostej od centrum Płocka; strefa = DELIVERY.radiusKm.
// Brakuje kodu? Dodaj wiersz — admin pokazuje sprawdzane kody, których nie ma w tabeli.
const ZONE_POSTCODES = [
  // powiat płocki (09-4xx; samo miasto Płock 09-400…09-410 → prefiks)
  ['09-411', 'Stara Biała', 52.585, 19.624],
  ['09-414', 'Brudzeń Duży', 52.643, 19.544],
  ['09-440', 'Staroźreby', 52.632, 19.920],
  ['09-450', 'Wyszogród', 52.389, 20.193],
  ['09-451', 'Radzanowo', 52.584, 19.854],
  ['09-454', 'Bulkowo', 52.592, 20.113],
  ['09-460', 'Mała Wieś', 52.484, 20.095],
  ['09-470', 'Bodzanów', 52.511, 20.016],
  ['09-472', 'Słupno', 52.539, 19.826],
  // powiat gostyniński (09-5xx)
  ['09-500', 'Gostynin', 52.430, 19.460],
  ['09-505', 'Nowy Duninów', 52.585, 19.497],
  ['09-520', 'Łąck', 52.470, 19.632],
  ['09-530', 'Gąbin', 52.399, 19.736],
  ['09-540', 'Sanniki', 52.338, 19.926],
  ['09-541', 'Pacyna', 52.321, 19.703],
  ['09-550', 'Szczawin Kościelny', 52.378, 19.554],
  // powiat sierpecki (09-2xx)
  ['09-200', 'Sierpc', 52.856, 19.670],
  ['09-204', 'Rościszewo', 52.916, 19.761],
  ['09-210', 'Drobin', 52.739, 19.981],
  ['09-213', 'Gozdowo', 52.768, 19.595],
  ['09-214', 'Mochowo', 52.752, 19.443],
  ['09-226', 'Zawidz Kościelny', 52.831, 19.863],
  ['09-227', 'Szczutowo', 52.920, 19.450],
  ['09-230', 'Bielsk', 52.669, 19.803],
  // powiat płoński (09-1xx)
  ['09-100', 'Płońsk', 52.623, 20.376],
  ['09-110', 'Sochocin', 52.698, 20.449],
  ['09-120', 'Nowe Miasto', 52.652, 20.628],
  ['09-130', 'Baboszewo', 52.727, 20.266],
  ['09-131', 'Joniec', 52.635, 20.452],
  ['09-135', 'Siemiątkowo', 52.896, 20.073],
  ['09-140', 'Raciąż', 52.783, 20.117],
  ['09-142', 'Załuski', 52.574, 20.474],
  ['09-150', 'Czerwińsk nad Wisłą', 52.396, 20.313],
  ['09-152', 'Naruszewo', 52.570, 20.241],
  ['09-164', 'Dzierzążnia', 52.668, 20.243],
  // powiat żuromiński (09-3xx) — tylko południowy skraj
  ['09-317', 'Lutocin', 52.980, 19.563],
  ['09-320', 'Bieżuń', 52.961, 19.887],
  // Włocławek i powiat włocławski (87-8xx)
  ['87-811', 'Fabianki', 52.683, 19.118],
  ['87-820', 'Kowal', 52.534, 19.144],
  ['87-821', 'Baruchowo', 52.488, 19.242],
  ['87-840', 'Lubień Kujawski', 52.411, 19.173],
  ['87-850', 'Choceń', 52.548, 19.036],
  ['87-860', 'Chodecz', 52.403, 19.029],
  ['87-880', 'Brześć Kujawski', 52.604, 18.899],
  // powiat lipnowski (87-6xx)
  ['87-600', 'Lipno', 52.847, 19.179],
  ['87-603', 'Wielgie', 52.767, 19.250],
  ['87-605', 'Tłuchowo', 52.741, 19.354],
  ['87-610', 'Dobrzyń nad Wisłą', 52.639, 19.329],
  ['87-617', 'Bobrowniki', 52.772, 19.012],
  ['87-620', 'Kikół', 52.911, 19.101],
  ['87-630', 'Skępe', 52.861, 19.358],
  // Kutno i powiat kutnowski (99-3xx)
  ['99-300', 'Kutno', 52.231, 19.362],
  ['99-306', 'Łanięta', 52.368, 19.328],
  ['99-307', 'Strzelce', 52.313, 19.426],
  ['99-311', 'Bedlno', 52.242, 19.493],
  ['99-314', 'Krzyżanów', 52.193, 19.454],
  ['99-319', 'Dobrzelin', 52.239, 19.611],
  ['99-320', 'Żychlin', 52.244, 19.623],
  ['99-322', 'Oporów', 52.290, 19.488],
  ['99-340', 'Krośniewice', 52.258, 19.175],
  ['99-350', 'Nowe Ostrowy', 52.332, 19.259],
  ['99-352', 'Dąbrowice', 52.317, 19.167],
  // powiat łowicki (99-4xx) — północna część
  ['99-412', 'Kiernozia', 52.270, 19.870],
  ['99-413', 'Chąśno', 52.174, 19.909],
  ['99-414', 'Kocierzew Południowy', 52.201, 20.037],
  ['99-423', 'Bielawy', 52.096, 19.779],
  ['99-440', 'Zduny', 52.141, 19.823],
  // powiat sochaczewski (96-5xx) — zachodnia część
  ['96-500', 'Sochaczew', 52.230, 20.238],
  ['96-512', 'Młodzieszyn', 52.324, 20.176],
  ['96-513', 'Nowa Sucha', 52.206, 20.186],
  ['96-514', 'Rybno', 52.261, 20.124],
  ['96-520', 'Iłów', 52.352, 20.052],
  ['05-088', 'Brochów', 52.358, 20.363],
  // powiat ciechanowski (06-4xx) — zachodni skraj
  ['06-450', 'Glinojeck', 52.821, 20.277],
  ['06-456', 'Ojrzeń', 52.784, 20.474]
];
const ZONE_PREFIXES = {
  '09-4': ['Płock', 52.5464, 19.7065],
  '09-5': ['Gostynin', 52.430, 19.460],
  '09-2': ['Sierpc', 52.856, 19.670],
  '09-1': ['Płońsk', 52.623, 20.376],
  '09-3': ['Żuromin', 53.066, 19.909],
  '87-8': ['Włocławek', 52.648, 19.068],
  '87-6': ['Lipno', 52.847, 19.179],
  '87-5': ['Rypin', 53.065, 19.409],
  '99-3': ['Kutno', 52.231, 19.362],
  '99-4': ['Łowicz', 52.106, 19.945],
  '96-5': ['Sochaczew', 52.230, 20.238],
  '06-4': ['Ciechanów', 52.881, 20.619],
  '05-1': ['Nowy Dwór Mazowiecki', 52.431, 20.716]
};
const postcodeByCode = Object.fromEntries(ZONE_POSTCODES.map(r => [r[0], r.slice(1)]));

// "09400", "09 400", "09-400" → "09-400"; anders null
function normalizePostcode(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  return d.length === 5 ? d.slice(0, 2) + '-' + d.slice(2) : null;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371, toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// → { code, known, place, km, inZone }
function checkZone(raw) {
  const code = normalizePostcode(raw);
  if (!code) return { code: null, known: false, place: null, km: null, inZone: false };
  const hit = postcodeByCode[code] || ZONE_PREFIXES[code.slice(0, 4)];
  if (!hit) return { code, known: false, place: null, km: null, inZone: false };
  const [place, lat, lon] = hit;
  const km = Math.round(haversineKm(DELIVERY.center.lat, DELIVERY.center.lon, lat, lon));
  return { code, known: true, place, km, inZone: km <= DELIVERY.radiusKm };
}

const deliveryPublic = lang => ({
  radiusKm: DELIVERY.radiusKm,
  city: DELIVERY.center.name,
  priceGr: DELIVERY.priceGr,
  freeAboveGr: DELIVERY.freeAboveGr,
  eta: DELIVERY.eta[lang] || DELIVERY.eta.pl,
  backorderEta: DELIVERY.backorderEta[lang] || DELIVERY.backorderEta.pl
});

// ---- Statistieken: postcodechecks + bestellingen ----
//      PostgreSQL (DATABASE_URL) of fallback data/local-stats.json
//      (tabelnamen local_* zijn historisch; niet hernoemen zonder migratie)
const STATS_FILE = path.join(__dirname, 'data', 'local-stats.json');
let statsMem = { checks: [], orders: [], quotes: [], events: [] };

async function initStats() {
  try {
    if (pool) {
      await pool.query(`CREATE TABLE IF NOT EXISTS local_zone_checks (
        id SERIAL PRIMARY KEY, postal_code TEXT, place TEXT, km INTEGER, in_zone BOOLEAN NOT NULL,
        source TEXT, created_at TIMESTAMPTZ DEFAULT now())`);
      await pool.query(`CREATE TABLE IF NOT EXISTS local_orders (
        session_id TEXT PRIMARY KEY, postal_code TEXT, place TEXT, km INTEGER, amount_gr INTEGER,
        out_of_zone BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now())`);
      await pool.query(`CREATE TABLE IF NOT EXISTS quote_requests (
        id SERIAL PRIMARY KEY, name TEXT, email TEXT, phone TEXT, company TEXT, place TEXT, message TEXT,
        items TEXT, lang TEXT, created_at TIMESTAMPTZ DEFAULT now())`);
    } else if (fs.existsSync(STATS_FILE)) {
      statsMem = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
      statsMem.checks = statsMem.checks || [];
      statsMem.orders = statsMem.orders || [];
      statsMem.quotes = statsMem.quotes || [];
      statsMem.events = statsMem.events || [];
    }
  } catch (err) {
    console.error('Statistieken init mislukt:', err.message);
  }
}

function saveStatsMem() {
  try {
    statsMem.checks = statsMem.checks.slice(-3000);
    fs.mkdirSync(path.dirname(STATS_FILE), { recursive: true });
    fs.writeFileSync(STATS_FILE, JSON.stringify(statsMem));
  } catch (e) {}
}

async function logZoneCheck(z, source) {
  try {
    if (pool) {
      await pool.query(
        'INSERT INTO local_zone_checks (postal_code, place, km, in_zone, source) VALUES ($1, $2, $3, $4, $5)',
        [z.code, z.place, z.km, z.inZone, source]
      );
    } else {
      statsMem.checks.push({ code: z.code, place: z.place, km: z.km, inZone: z.inZone, source, at: Date.now() });
      saveStatsMem();
    }
  } catch (err) {
    console.error('Postcodecheck loggen mislukt:', err.message);
  }
}

async function logOrder(o) {
  try {
    if (pool) {
      await pool.query(
        'INSERT INTO local_orders (session_id, postal_code, place, km, amount_gr, out_of_zone) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (session_id) DO NOTHING',
        [o.sessionId, o.code, o.place, o.km, o.amountGr, o.outOfZone]
      );
    } else if (!statsMem.orders.some(x => x.sessionId === o.sessionId)) {
      statsMem.orders.push({ ...o, at: Date.now() });
      saveStatsMem();
    }
  } catch (err) {
    console.error('Bestelling loggen mislukt:', err.message);
  }
}

async function logQuote(q) {
  try {
    if (pool) {
      await pool.query(
        'INSERT INTO quote_requests (name, email, phone, company, place, message, items, lang) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [q.name, q.email, q.phone, q.company, q.place, q.message, JSON.stringify(q.items), q.lang]
      );
    } else {
      statsMem.quotes.push({ ...q, at: Date.now() });
      statsMem.quotes = statsMem.quotes.slice(-500);
      saveStatsMem();
    }
  } catch (err) {
    console.error('Offerte-aanvraag loggen mislukt:', err.message);
  }
}

async function getQuotes(days = 30) {
  const since = Date.now() - days * 86400000;
  let rows;
  if (pool) {
    rows = (await pool.query(
      'SELECT name, email, phone, company, place, message, items, lang, created_at AS at FROM quote_requests WHERE created_at >= $1 ORDER BY created_at DESC LIMIT 50',
      [new Date(since)]
    )).rows.map(r => ({ ...r, items: JSON.parse(r.items || '[]') }));
  } else {
    rows = statsMem.quotes.filter(q => q.at >= since).slice().reverse().slice(0, 50);
  }
  return rows.map(r => ({ ...r, at: new Date(r.at) }));
}

// ---- Food truck: standplaatsen (beheer in /admin) + evenement-aanvragen ----
//      Datums als TEXT 'YYYY-MM-DD' (geen tijdzone-gedoe met DATE)
const STOPS_FILE = path.join(__dirname, 'data', 'truck-stops.json');
let stopsMem = [];

async function initTruck() {
  try {
    if (pool) {
      await pool.query(`CREATE TABLE IF NOT EXISTS truck_stops (
        id SERIAL PRIMARY KEY, name TEXT NOT NULL, address TEXT, lat DOUBLE PRECISION, lon DOUBLE PRECISION,
        date_from TEXT NOT NULL, date_to TEXT NOT NULL, hours TEXT, note TEXT, created_at TIMESTAMPTZ DEFAULT now())`);
      await pool.query(`CREATE TABLE IF NOT EXISTS event_requests (
        id SERIAL PRIMARY KEY, name TEXT, email TEXT, phone TEXT, event TEXT, date TEXT, place TEXT, guests TEXT,
        message TEXT, lang TEXT, created_at TIMESTAMPTZ DEFAULT now())`);
    } else if (fs.existsSync(STOPS_FILE)) {
      stopsMem = JSON.parse(fs.readFileSync(STOPS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Food truck init mislukt:', err.message);
  }
}
function saveStopsMem() {
  try {
    fs.mkdirSync(path.dirname(STOPS_FILE), { recursive: true });
    fs.writeFileSync(STOPS_FILE, JSON.stringify(stopsMem, null, 2));
  } catch (e) {}
}
const stopRow = r => ({
  id: r.id, name: r.name, address: r.address || '',
  lat: r.lat != null ? Number(r.lat) : null, lon: r.lon != null ? Number(r.lon) : null,
  dateFrom: r.date_from || r.dateFrom, dateTo: r.date_to || r.dateTo, hours: r.hours || '', note: r.note || ''
});
async function getStops(upcomingOnly) {
  const today = new Date().toISOString().slice(0, 10);
  const rows = pool ? (await pool.query('SELECT * FROM truck_stops ORDER BY date_from, id')).rows
                    : stopsMem.slice().sort((a, b) => (a.dateFrom + a.id).localeCompare(b.dateFrom + b.id));
  return rows.map(stopRow).filter(s => !upcomingOnly || s.dateTo >= today);
}
async function addStop(s) {
  if (pool) {
    await pool.query(
      'INSERT INTO truck_stops (name, address, lat, lon, date_from, date_to, hours, note) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [s.name, s.address, s.lat, s.lon, s.dateFrom, s.dateTo, s.hours, s.note]
    );
  } else {
    stopsMem.push({ ...s, id: Date.now() });
    saveStopsMem();
  }
}
async function deleteStop(id) {
  if (pool) await pool.query('DELETE FROM truck_stops WHERE id = $1', [parseInt(id, 10) || 0]);
  else { stopsMem = stopsMem.filter(s => String(s.id) !== String(id)); saveStopsMem(); }
}
async function logEvent(e) {
  try {
    if (pool) {
      await pool.query(
        'INSERT INTO event_requests (name, email, phone, event, date, place, guests, message, lang) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [e.name, e.email, e.phone, e.event, e.date, e.place, e.guests, e.message, e.lang]
      );
    } else {
      statsMem.events.push({ ...e, at: Date.now() });
      statsMem.events = statsMem.events.slice(-500);
      saveStatsMem();
    }
  } catch (err) {
    console.error('Evenement-aanvraag loggen mislukt:', err.message);
  }
}
async function getEvents(days = 60) {
  const since = Date.now() - days * 86400000;
  const rows = pool
    ? (await pool.query('SELECT name, email, phone, event, date, place, guests, message, lang, created_at AS at FROM event_requests WHERE created_at >= $1 ORDER BY created_at DESC LIMIT 50', [new Date(since)])).rows
    : statsMem.events.filter(e => e.at >= since).slice().reverse().slice(0, 50);
  return rows.map(r => ({ ...r, at: new Date(r.at) }));
}

async function getStats(days = 30) {
  const since = Date.now() - days * 86400000;
  let checks, orders;
  if (pool) {
    checks = (await pool.query(
      'SELECT postal_code AS code, place, km, in_zone AS "inZone" FROM local_zone_checks WHERE created_at >= $1',
      [new Date(since)]
    )).rows;
    orders = (await pool.query(
      'SELECT session_id AS "sessionId", postal_code AS code, place, km, amount_gr AS "amountGr", out_of_zone AS "outOfZone", created_at AS at FROM local_orders WHERE created_at >= $1 ORDER BY created_at DESC',
      [new Date(since)]
    )).rows;
  } else {
    checks = statsMem.checks.filter(c => c.at >= since);
    orders = statsMem.orders.filter(o => o.at >= since).slice().reverse();
  }
  const byCode = {};
  for (const c of checks) {
    if (!c.code) continue;
    const b = byCode[c.code] || (byCode[c.code] = { code: c.code, place: c.place, km: c.km, inZone: c.inZone, n: 0 });
    b.n++;
  }
  const codes = Object.values(byCode).sort((a, b) => b.n - a.n);
  return {
    days,
    checks: checks.length,
    inZone: checks.filter(c => c.inZone).length,
    unknown: checks.filter(c => !c.place).length,
    uniqueCodes: codes.length,
    orders: orders.length,
    revenueGr: orders.reduce((s, o) => s + (o.amountGr || 0), 0),
    outOfZone: orders.filter(o => o.outOfZone).length,
    topCodes: codes.slice(0, 12),
    topOutside: codes.filter(c => !c.inZone).slice(0, 8),
    recentOrders: orders.slice(0, 10).map(o => ({ ...o, at: new Date(o.at) }))
  };
}

const escHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ============================================================
//  ADMIN-AUTH  (cookie met HMAC-token, geen extra dependencies)
// ============================================================

const crypto = require('crypto');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || null;
const ADMIN_SECRET = crypto.createHash('sha256').update('pf-admin:' + (ADMIN_PASSWORD || 'x')).digest();
const adminToken = () => crypto.createHmac('sha256', ADMIN_SECRET).update('admin-ok').digest('hex');

function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

function isAdmin(req) {
  if (!ADMIN_PASSWORD) return false;
  const c = getCookie(req, 'pf_admin');
  if (!c) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(c), Buffer.from(adminToken()));
  } catch (e) { return false; }
}

const loginAttempts = new Map(); // ip → { n, until }
function loginAllowed(ip) {
  const a = loginAttempts.get(ip);
  return !a || a.n < 8 || Date.now() > a.until;
}
function registerFail(ip) {
  const a = loginAttempts.get(ip) || { n: 0, until: 0 };
  a.n++;
  if (a.n >= 8) { a.until = Date.now() + 15 * 60 * 1000; a.n = 0; }
  loginAttempts.set(ip, a);
}

// ============================================================
//  FOOD TRUCK LIVE — GPS-positie (chauffeurspagina /kierowca of een tracker
//  → POST /api/gps met GPS_TOKEN), abonnees met locatie-mail + kortingscode,
//  menukaart (catalog/foodtruck-menu.js)
// ============================================================

const FOODTRUCK_MENU = require('./catalog/foodtruck-menu');
const GPS_TOKEN = process.env.GPS_TOKEN || null;
const GPS_STALE_MIN = parseInt(process.env.GPS_STALE_MIN, 10) || 30;
const SUB_SECRET = process.env.SUB_SECRET || ADMIN_PASSWORD || 'pf-dev-secret';
const SUB_DISCOUNT = {
  percent: Math.min(Math.max(parseInt(process.env.SUB_DISCOUNT_PERCENT, 10) || 10, 1), 90),
  once: process.env.SUB_DISCOUNT_ONCE !== 'false'
};
const STATE_FILE = path.join(__dirname, 'data', 'truck-state.json');
const SUBS_FILE = path.join(__dirname, 'data', 'subscribers.json');
let truckState = { lat: null, lon: null, accuracy: null, updatedAt: 0, live: false, place: '', info: '', announcedAt: 0 };
let subsMem = [];

async function initLive() {
  try {
    if (pool) {
      await pool.query('CREATE TABLE IF NOT EXISTS truck_state (id INTEGER PRIMARY KEY, state TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT now())');
      await pool.query(`CREATE TABLE IF NOT EXISTS subscribers (
        id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, lang TEXT, place TEXT, confirmed BOOLEAN DEFAULT false,
        code TEXT UNIQUE, code_used_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(),
        confirmed_at TIMESTAMPTZ, unsubscribed_at TIMESTAMPTZ)`);
      const { rows } = await pool.query('SELECT state FROM truck_state WHERE id = 1');
      if (rows[0]) truckState = { ...truckState, ...JSON.parse(rows[0].state) };
    } else {
      if (fs.existsSync(STATE_FILE)) truckState = { ...truckState, ...JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) };
      if (fs.existsSync(SUBS_FILE)) subsMem = JSON.parse(fs.readFileSync(SUBS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Live init mislukt:', err.message);
  }
}
function saveSubsMem() {
  try { fs.mkdirSync(path.dirname(SUBS_FILE), { recursive: true }); fs.writeFileSync(SUBS_FILE, JSON.stringify(subsMem, null, 2)); } catch (e) {}
}
async function saveState() {
  try {
    if (pool) await pool.query('INSERT INTO truck_state (id, state, updated_at) VALUES (1, $1, now()) ON CONFLICT (id) DO UPDATE SET state = $1, updated_at = now()', [JSON.stringify(truckState)]);
    else { fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true }); fs.writeFileSync(STATE_FILE, JSON.stringify(truckState)); }
  } catch (err) {
    console.error('Live state opslaan mislukt:', err.message);
  }
}
const isLive = () => truckState.live && truckState.lat != null && Date.now() - truckState.updatedAt < GPS_STALE_MIN * 60000;
const publicLive = () => isLive()
  ? { live: true, lat: truckState.lat, lon: truckState.lon, accuracy: truckState.accuracy, place: truckState.place, info: truckState.info,
      updatedAt: truckState.updatedAt, ageMin: Math.round((Date.now() - truckState.updatedAt) / 60000) }
  : { live: false };
function gpsAuth(req) {
  const tok = String(req.headers['x-gps-token'] || req.body?.token || req.query.t || '');
  if (!GPS_TOKEN || !tok || tok.length !== GPS_TOKEN.length) return false;
  return crypto.timingSafeEqual(Buffer.from(tok), Buffer.from(GPS_TOKEN));
}

// ---- abonnees (powiadomienia) + kortingscode PF-XXXXXX ----
const subToken = email => crypto.createHmac('sha256', SUB_SECRET).update(email.toLowerCase()).digest('hex').slice(0, 32);
const tokenOk = (email, tok) => { const a = Buffer.from(String(tok || '')), b = Buffer.from(subToken(email)); return a.length === b.length && crypto.timingSafeEqual(a, b); };
const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 160;
const normCode = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^PF/, '');
const fmtCode = c => 'PF-' + c;
function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[crypto.randomInt(chars.length)];
  return s;
}
const subRow = r => ({
  email: r.email, lang: r.lang || 'pl', place: r.place || '', confirmed: !!r.confirmed, code: r.code || null,
  codeUsedAt: r.code_used_at || r.codeUsedAt || null, createdAt: r.created_at || r.createdAt || null,
  confirmedAt: r.confirmed_at || r.confirmedAt || null, unsubscribedAt: r.unsubscribed_at || r.unsubscribedAt || null
});
async function subFind(email) {
  if (pool) { const { rows } = await pool.query('SELECT * FROM subscribers WHERE email = $1', [email]); return rows[0] ? subRow(rows[0]) : null; }
  const s = subsMem.find(x => x.email === email); return s ? subRow(s) : null;
}
async function subByCode(code) {
  if (pool) { const { rows } = await pool.query('SELECT * FROM subscribers WHERE code = $1', [code]); return rows[0] ? subRow(rows[0]) : null; }
  const s = subsMem.find(x => x.code === code); return s ? subRow(s) : null;
}
async function subUpsert(email, lang, place) {
  const cur = await subFind(email);
  if (cur && cur.confirmed && !cur.unsubscribedAt) return { confirmed: true };
  if (pool) {
    await pool.query('INSERT INTO subscribers (email, lang, place) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET lang = $2, place = $3, unsubscribed_at = NULL', [email, lang, place]);
  } else {
    const s = subsMem.find(x => x.email === email);
    if (s) { s.lang = lang; s.place = place; s.unsubscribedAt = null; }
    else subsMem.push({ email, lang, place, confirmed: false, createdAt: Date.now() });
    saveSubsMem();
  }
  return { confirmed: false };
}
async function subConfirm(email) {
  const cur = await subFind(email);
  if (!cur) return null;
  let code = cur.code;
  if (!code) { do { code = genCode(); } while (await subByCode(code)); }
  if (pool) {
    await pool.query('UPDATE subscribers SET confirmed = true, confirmed_at = COALESCE(confirmed_at, now()), unsubscribed_at = NULL, code = $2 WHERE email = $1', [email, code]);
  } else {
    const s = subsMem.find(x => x.email === email);
    s.confirmed = true; s.confirmedAt = s.confirmedAt || Date.now(); s.unsubscribedAt = null; s.code = code;
    saveSubsMem();
  }
  return { code, wasConfirmed: cur.confirmed && !cur.unsubscribedAt };
}
async function subUnsubscribe(email) {
  if (pool) await pool.query('UPDATE subscribers SET unsubscribed_at = now() WHERE email = $1', [email]);
  else { const s = subsMem.find(x => x.email === email); if (s) { s.unsubscribedAt = Date.now(); saveSubsMem(); } }
}
async function subList() {
  if (pool) return (await pool.query('SELECT * FROM subscribers ORDER BY created_at DESC')).rows.map(subRow);
  return subsMem.slice().reverse().map(subRow);
}
const subActive = list => list.filter(s => s.confirmed && !s.unsubscribedAt);
// → { ok, code, percent, sub } | { ok: false, reason: 'invalid' | 'used', usedAt }
async function codeCheck(raw) {
  const c = normCode(raw);
  if (c.length < 4) return { ok: false, reason: 'invalid' };
  const s = await subByCode(c);
  if (!s || !s.confirmed) return { ok: false, reason: 'invalid' };
  if (SUB_DISCOUNT.once && s.codeUsedAt) return { ok: false, reason: 'used', usedAt: s.codeUsedAt };
  return { ok: true, code: c, percent: SUB_DISCOUNT.percent, sub: s };
}
async function codeUse(code) {
  const c = normCode(code);
  if (!c) return;
  try {
    if (pool) await pool.query('UPDATE subscribers SET code_used_at = now() WHERE code = $1', [c]);
    else { const s = subsMem.find(x => x.code === c); if (s) { s.codeUsedAt = Date.now(); saveSubsMem(); } }
  } catch (err) { console.error('Kortingscode markeren mislukt:', err.message); }
}
// Stripe-coupon voor de abonneekorting: één per percentage, vaste id
const couponCache = {};
async function ensureCoupon(percent) {
  const id = `PF_SUB_${percent}`;
  if (couponCache[id]) return id;
  try { await stripe.coupons.retrieve(id); }
  catch (e) { await stripe.coupons.create({ id, percent_off: percent, duration: 'once', name: `Zniżka dla subskrybentów ${percent}%` }); }
  couponCache[id] = true;
  return id;
}

// ---- mails ----
const mailHtml = (headline, bodyHtml, footerHtml) => `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#2a1503">
    <div style="background:#ff4d00;color:#fff8ec;padding:28px 32px;border-radius:16px 16px 0 0">
      <h1 style="margin:0;font-size:26px">${headline}</h1>
    </div>
    <div style="border:2px solid #2a1503;border-top:0;padding:24px 32px;border-radius:0 0 16px 16px">
      ${bodyHtml}
      <p style="color:#8a6a4f;font-size:13px">${footerHtml}</p>
    </div>
  </div>`;
const mailButton = (url, label) => `<p><a href="${url}" style="display:inline-block;background:#ffc93c;color:#2a1503;font-weight:bold;padding:12px 22px;border-radius:999px;text-decoration:none;border:2px solid #2a1503">${label}</a></p>`;
const unsubUrl = email => `${BASE_URL}/subskrypcja/rezygnacja?e=${encodeURIComponent(email)}&t=${subToken(email)}`;
async function sendMailBatch(mails) {
  let sent = 0;
  for (let i = 0; i < mails.length; i += 50) {
    const chunk = mails.slice(i, i + 50);
    try {
      if (resend.batch && resend.batch.send) await resend.batch.send(chunk);
      else for (const m of chunk) await resend.emails.send(m);
      sent += chunk.length;
    } catch (err) { console.error('Mail-batch mislukt:', err.message); }
  }
  return sent;
}

// Reverse geocoding via Nominatim (OSM) — één call per aankondiging, met fallback
async function reverseGeocode(lat, lon) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=17&accept-language=pl`,
      { headers: { 'User-Agent': 'PanFrikandel/1.0 (hallo@panfrikandel.pl)' }, signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) return '';
    const a = (await r.json()).address || {};
    const street = [a.road || a.pedestrian || a.square, a.house_number].filter(Boolean).join(' ');
    const town = a.city || a.town || a.village || a.municipality || '';
    return [street, town].filter(Boolean).join(', ');
  } catch (e) { return ''; }
}

// "Ogłoś lokalizację": plaatsnaam bepalen, state opslaan, mail naar alle bevestigde abonnees
async function announceLocation(info) {
  if (truckState.lat == null) throw new Error('no-position');
  const { lat, lon } = truckState;
  const today = new Date().toISOString().slice(0, 10);
  const stop = (await getStops(true)).find(s => s.dateFrom <= today && s.dateTo >= today);
  const place = (stop && stop.name) || await reverseGeocode(lat, lon) || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  const hours = (stop && stop.hours) || '';
  truckState.place = place; truckState.info = String(info || '').trim().slice(0, 300); truckState.announcedAt = Date.now(); truckState.live = true;
  await saveState();
  const subs = subActive(await subList());
  let sent = 0;
  if (resend && subs.length) {
    const mapUrl = `https://www.google.com/maps?q=${lat},${lon}`;
    const mails = subs.map(s => {
      const lang = LANGS.includes(s.lang) ? s.lang : 'pl';
      const t = makeT(lang);
      const body = t('liveMailBodyHtml', { place: escHtml(place), hours: hours ? t('liveMailHours', { hours: escHtml(hours) }) : '', info: truckState.info ? '<p>' + escHtml(truckState.info) + '</p>' : '', mapUrl, siteUrl: BASE_URL })
        + (s.code && !(SUB_DISCOUNT.once && s.codeUsedAt) ? t('liveMailCodeHtml', { code: fmtCode(s.code), percent: SUB_DISCOUNT.percent }) : '');
      return { from: ORDER_EMAIL_FROM, to: s.email, subject: t('liveMailSubject', { place }), html: mailHtml(t('liveMailSubject', { place: escHtml(place) }), body, t('mailUnsubHtml', { url: unsubUrl(s.email) })) };
    });
    sent = await sendMailBatch(mails);
  } else {
    console.log(`📣 Locatie aangekondigd: ${place} — ${subs.length} abonnees${resend ? '' : ' (geen mail geconfigureerd)'}`);
  }
  return { place, sent, subscribers: subs.length };
}

// ============================================================
//  TAAL (PL/EN)  — ?lang=en zet een cookie en redirect naar de schone URL;
//  daarna cookie, anders Accept-Language (Engels vóór Pools → EN), anders PL.
//  Views krijgen: lang, t(), dict, zl() (geldformaat per taal), delivery.
// ============================================================

const { UI, LANGS, makeT, money } = require('./locales/ui');
const PRODUCTS_EN = { ...require('./locales/products-en'), ...require('./locales/products-en-retail') };
const COOKIE_SECURE = BASE_URL.startsWith('https') ? '; Secure' : '';

function localizeProduct(p, lang) {
  if (lang !== 'en') return p;
  const e = PRODUCTS_EN[p.id];
  if (!e) return p;
  return {
    ...p,
    name: e.name || p.name,
    unit: e.unit || p.unit,
    badge: e.badge !== undefined ? e.badge : p.badge,
    desc: e.desc || p.desc,
    details: p.details ? { ...p.details, ...(e.details || {}) } : p.details
  };
}
const catalog = lang => activeProducts().map(p => localizeProduct(p, lang));
const wholesaleCatalog = lang => WHOLESALE.filter(p => p.cat !== 'boxy').map(p => localizeProduct(p, lang));

function pickLang(req) {
  const q = String(req.query.lang || '').toLowerCase();
  if (LANGS.includes(q)) return q;
  const c = getCookie(req, 'pf_lang');
  if (LANGS.includes(c)) return c;
  const al = String(req.headers['accept-language'] || '').toLowerCase();
  const iPl = al.indexOf('pl'), iEn = al.indexOf('en');
  return iEn >= 0 && (iPl < 0 || iEn < iPl) ? 'en' : 'pl';
}

app.use((req, res, next) => {
  const lang = pickLang(req);
  if (req.method === 'GET' && LANGS.includes(String(req.query.lang || '').toLowerCase())) {
    res.setHeader('Set-Cookie', `pf_lang=${lang}; Path=/; Max-Age=${365 * 86400}; SameSite=Lax${COOKIE_SECURE}`);
    const url = new URL(req.originalUrl, 'http://localhost');   // alleen pad + query zijn nodig
    url.searchParams.delete('lang');
    return res.redirect(url.pathname + url.search);
  }
  req.lang = lang;
  res.locals.lang = lang;
  res.locals.t = makeT(lang);
  res.locals.dict = UI[lang] || UI.pl;
  res.locals.zl = gr => money(gr, lang);
  res.locals.delivery = deliveryPublic(lang);
  res.locals.socials = SOCIALS;
  res.locals.company = COMPANY;
  res.locals.version = VERSION_LABEL;
  res.locals.turnstileSiteKey = TURNSTILE_SITE_KEY;
  const base = siteUrl(req);
  res.locals.siteUrl = base;
  res.locals.meta = {
    title: res.locals.t('title'), description: res.locals.t('metaDesc'),
    url: base + req.path.replace(/\/+$/, '') || base + '/', image: base + '/img/mora-frikandellen-5.png', type: 'website'
  };
  next();
});

// ============================================================
//  ROUTES
// ============================================================

// Structured data: het bedrijf (LocalBusiness) — op de homepage
const businessJsonLd = (req) => ({
  '@context': 'https://schema.org', '@type': 'LocalBusiness', name: 'PanFrikandel', legalName: COMPANY.name,
  url: siteUrl(req), image: siteUrl(req) + '/img/mora-frikandellen-5.png', description: res_t(req, 'metaDesc'),
  email: COMPANY.email, ...(COMPANY.phone ? { telephone: COMPANY.phone } : {}),
  address: { '@type': 'PostalAddress', streetAddress: 'Białka 15', postalCode: '09-550', addressLocality: 'Białka', addressRegion: 'mazowieckie', addressCountry: 'PL' },
  areaServed: { '@type': 'GeoCircle', geoMidpoint: { '@type': 'GeoCoordinates', latitude: DELIVERY.center.lat, longitude: DELIVERY.center.lon }, geoRadius: DELIVERY.radiusKm * 1000 },
  priceRange: 'zł', currenciesAccepted: 'PLN', paymentAccepted: 'BLIK, Przelewy24, karta',
  sameAs: Object.values(SOCIALS)
});
const res_t = (req, key, vars) => makeT(req.lang)(key, vars);
const productUrl = (req, p) => `${siteUrl(req)}/produkt/${p.id}`;
const productJsonLd = (req, p) => ({
  '@context': 'https://schema.org', '@type': 'Product', name: p.name, sku: p.id, description: p.desc,
  image: p.img ? [siteUrl(req) + '/img/' + p.img] : undefined,
  brand: { '@type': 'Brand', name: 'Mora' },
  offers: {
    '@type': 'Offer', url: productUrl(req, p), priceCurrency: 'PLN', price: (p.price / 100).toFixed(2),
    availability: (p.stock == null || p.stock > 0) ? 'https://schema.org/InStock' : 'https://schema.org/BackOrder',
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@type': 'Organization', name: 'PanFrikandel' },
    areaServed: { '@type': 'GeoCircle', geoMidpoint: { '@type': 'GeoCoordinates', latitude: DELIVERY.center.lat, longitude: DELIVERY.center.lon }, geoRadius: DELIVERY.radiusKm * 1000 }
  }
});

app.get('/', (req, res) => {
  res.render('index', { products: catalog(req.lang), v: ASSET_V, jsonld: businessJsonLd(req) });
});

// Productpagina's (eigen URL per product → indexeerbaar, met Product/Offer-JSON-LD)
app.get('/produkt/:id', (req, res) => {
  const base = productById[req.params.id];
  if (!base || base.active === false) return res.redirect('/#sklep');
  const p = localizeProduct(base, req.lang);
  const others = catalog(req.lang).filter(o => o.cat === p.cat && o.id !== p.id).slice(0, 3);
  res.locals.meta = {
    ...res.locals.meta, type: 'product',
    title: `${p.name} — ${money(p.price, req.lang)} — PanFrikandel`,
    description: p.desc, url: productUrl(req, p), image: p.img ? siteUrl(req) + '/img/' + p.img : res.locals.meta.image
  };
  res.render('produkt', { p, others, v: ASSET_V, jsonld: [productJsonLd(req, p), {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'PanFrikandel', item: siteUrl(req) + '/' },
      { '@type': 'ListItem', position: 2, name: res_t(req, 'navShop'), item: siteUrl(req) + '/#sklep' },
      { '@type': 'ListItem', position: 3, name: p.name, item: productUrl(req, p) }
    ] }] });
});

// robots.txt + sitemap.xml (dynamisch, met de publieke URL)
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send([
    'User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /api/', 'Disallow: /kierowca', 'Disallow: /sukces', 'Disallow: /subskrypcja/',
    '', `Sitemap: ${siteUrl(req)}/sitemap.xml`
  ].join('\n'));
});
app.get('/sitemap.xml', (req, res) => {
  const base = siteUrl(req), today = new Date().toISOString().slice(0, 10);
  const urls = [
    ['/', '1.0', 'daily'], ['/hurt', '0.7', 'weekly'], ['/foodtruck', '0.8', 'weekly'], ['/degustacja', '0.9', 'weekly'], ['/regulamin', '0.2', 'yearly'], ['/prywatnosc', '0.2', 'yearly'],
    ...activeProducts().map(p => ['/produkt/' + p.id, '0.8', 'weekly'])
  ];
  res.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(([u, pr, f]) => `  <url><loc>${base}${u}</loc><lastmod>${today}</lastmod><changefreq>${f}</changefreq><priority>${pr}</priority></url>`).join('\n') + '\n</urlset>');
});

app.get('/hurt', (req, res) => {
  res.locals.meta = { ...res.locals.meta, title: res_t(req, 'hurtTitle'), description: res_t(req, 'hurtMetaDesc') };
  res.render('hurt', { products: wholesaleCatalog(req.lang), v: ASSET_V });
});

app.get('/foodtruck', async (req, res) => {
  let stops = [];
  try { stops = await getStops(true); } catch (err) { console.error('Standplaatsen:', err.message); }
  res.locals.meta = { ...res.locals.meta, title: res_t(req, 'truckTitle'), description: res_t(req, 'truckMetaDesc') };
  res.render('foodtruck', { stops, menu: FOODTRUCK_MENU, launch: FOODTRUCK_LAUNCH[req.lang] || '', v: ASSET_V });
});

app.get('/kierowca', (req, res) => { res.locals.meta.noindex = true; res.render('kierowca', { v: ASSET_V, gpsConfigured: !!GPS_TOKEN }); });

app.get('/api/version', (req, res) => res.json({
  version: VERSION, build: BUILD || null, startedAt: STARTED_AT.toISOString(),
  baseUrl: process.env.BASE_URL || null,
  database: dbStatus, stripe: !!stripe, resend: !!resend, turnstile: !!TURNSTILE_SECRET, gps: !!GPS_TOKEN,
  successUrl: `${siteUrl(req)}/sukces?session_id={CHECKOUT_SESSION_ID}`
}));

app.get('/degustacja', (req, res) => {
  res.locals.meta = { ...res.locals.meta, title: res_t(req, 'cateringTitle'), description: res_t(req, 'cateringMetaDesc') };
  res.render('catering', { v: ASSET_V, jsonld: {
    '@context': 'https://schema.org', '@type': 'Service', name: res_t(req, 'cateringTitle').split(' — ')[0], serviceType: 'Catering',
    provider: { '@type': 'LocalBusiness', name: 'PanFrikandel', url: siteUrl(req) },
    areaServed: { '@type': 'GeoCircle', geoMidpoint: { '@type': 'GeoCoordinates', latitude: DELIVERY.center.lat, longitude: DELIVERY.center.lon }, geoRadius: DELIVERY.radiusKm * 1000 },
    description: res_t(req, 'cateringMetaDesc'), url: siteUrl(req) + '/degustacja'
  } });
});

app.get('/regulamin',   (req, res) => { res.locals.meta.title = res_t(req, 'termsTitle');   res.render(req.lang === 'en' ? 'regulamin-en'  : 'regulamin',  { v: ASSET_V }); });
app.get('/prywatnosc',  (req, res) => { res.locals.meta.title = res_t(req, 'privacyTitle'); res.render(req.lang === 'en' ? 'prywatnosc-en' : 'prywatnosc', { v: ASSET_V }); });

// ---- Admin: prijzenbeheer + statistieken (Nederlands, altijd PL-geldformaat) ----
const adminLocals = extra => ({ products: PRODUCTS, pricing: PRICING, v: ASSET_V, zl: gr => money(gr, 'pl'), delivery: deliveryPublic('pl'), stats: null, quotes: [], stops: [], events: [], subs: [], live: publicLive(), truck: truckState, gpsToken: GPS_TOKEN, subDiscount: SUB_DISCOUNT, error: null,
  system: { db: dbStatus, stripe: !!stripe, stripeLive: !!(process.env.STRIPE_SECRET_KEY || '').startsWith('sk_live_'), resend: !!resend, turnstile: !!TURNSTILE_SECRET, baseUrl: process.env.BASE_URL || '' }, ...extra });

app.get('/admin', async (req, res) => {
  if (!ADMIN_PASSWORD) return res.status(503).send('Admin is niet geconfigureerd: zet de ADMIN_PASSWORD environment variable.');
  const authed = isAdmin(req);
  let stats = null, quotes = [], stops = [], events = [], subs = [];
  if (authed) {
    try {
      stats = await getStats(30); quotes = await getQuotes(30);
      stops = await getStops(false); events = await getEvents(60); subs = await subList();
    } catch (err) { console.error('Statistieken:', err.message); }
  }
  res.render('admin', adminLocals({ authed, stats, quotes, stops, events, subs }));
});

app.post('/admin/login', express.urlencoded({ extended: false }), (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '?';
  if (!ADMIN_PASSWORD || !loginAllowed(ip)) {
    return res.status(429).render('admin', adminLocals({ authed: false, error: 'Te veel pogingen — probeer het over 15 minuten opnieuw.' }));
  }
  const given = String(req.body.password || '');
  const ok = given.length === ADMIN_PASSWORD.length &&
    crypto.timingSafeEqual(Buffer.from(given), Buffer.from(ADMIN_PASSWORD));
  if (!ok) {
    registerFail(ip);
    return res.status(401).render('admin', adminLocals({ authed: false, error: 'Onjuist wachtwoord.' }));
  }
  res.setHeader('Set-Cookie', `pf_admin=${adminToken()}; HttpOnly; Path=/; Max-Age=${8 * 3600}; SameSite=Lax${COOKIE_SECURE}`);
  res.redirect('/admin');
});

app.post('/admin/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'pf_admin=; HttpOnly; Path=/; Max-Age=0');
  res.redirect('/admin');
});

app.post('/admin/prices', async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Niet ingelogd.' });
    const changes = {};
    for (const [id, val] of Object.entries(req.body.prices || {})) {
      if (!productById[id]) continue;
      const gr = Math.round(parseFloat(String(val).replace(',', '.')) * 100);
      if (!Number.isInteger(gr) || gr < 100 || gr > 10000000) {
        return res.status(400).json({ error: `Ongeldige prijs voor ${productById[id].name}.` });
      }
      if (gr !== productById[id].price) changes[id] = gr;
    }
    const flags = {};
    for (const [id, on] of Object.entries(req.body.active || {})) {
      if (productById[id] && (productById[id].active !== false) !== !!on) flags[id] = !!on;
    }
    const stock = {};
    for (const [id, val] of Object.entries(req.body.stock || {})) {
      const n = parseInt(val, 10);
      if (!productById[id] || !Number.isInteger(n) || n < -100000 || n > 100000) continue;
      if (n !== productById[id].stock) stock[id] = n;
    }
    if (Object.keys(changes).length) await savePrices(changes);
    if (Object.keys(flags).length) await saveFlags(flags);
    if (Object.keys(stock).length) await saveStock(stock);
    res.json({ saved: Object.keys(changes).length + Object.keys(flags).length + Object.keys(stock).length });
  } catch (err) {
    console.error('Prijzen opslaan mislukt:', err.message);
    res.status(500).json({ error: 'Opslaan mislukt — probeer opnieuw.' });
  }
});

// ---- Admin: food truck standplaatsen ----
app.post('/admin/foodtruck', express.urlencoded({ extended: false }), async (req, res) => {
  if (!isAdmin(req)) return res.status(401).send('Niet ingelogd.');
  const s = (v, n) => String(v || '').trim().slice(0, n);
  const num = v => { const n = parseFloat(String(v || '').replace(',', '.')); return Number.isFinite(n) ? n : null; };
  const stop = {
    name: s(req.body.name, 120), address: s(req.body.address, 200),
    lat: num(req.body.lat), lon: num(req.body.lon),
    dateFrom: s(req.body.dateFrom, 10), dateTo: s(req.body.dateTo, 10) || s(req.body.dateFrom, 10),
    hours: s(req.body.hours, 60), note: s(req.body.note, 300)
  };
  if (stop.name && /^\d{4}-\d{2}-\d{2}$/.test(stop.dateFrom)) {
    if (stop.dateTo < stop.dateFrom) stop.dateTo = stop.dateFrom;
    try { await addStop(stop); } catch (err) { console.error('Standplaats opslaan mislukt:', err.message); }
  }
  res.redirect('/admin#foodtruck');
});
app.post('/admin/foodtruck/usun', express.urlencoded({ extended: false }), async (req, res) => {
  if (!isAdmin(req)) return res.status(401).send('Niet ingelogd.');
  try { await deleteStop(req.body.id); } catch (err) { console.error('Standplaats verwijderen mislukt:', err.message); }
  res.redirect('/admin#foodtruck');
});

app.post('/admin/oglos', express.urlencoded({ extended: false }), async (req, res) => {
  if (!isAdmin(req)) return res.status(401).send('Niet ingelogd.');
  try { await announceLocation(req.body.info); } catch (err) { console.error('Aankondigen mislukt:', err.message); }
  res.redirect('/admin#live');
});

// ---- AI-assistent (PanFrikandel) ----
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || null;

const CATALOG_FOR_AI = lang => catalog(lang).map(p =>
  `${p.id} | ${p.name} | ${money(p.price, lang)} | ${p.unit} | kat: ${p.cat}${p.badge ? ' | ' + p.badge : ''} | ${p.desc}`
).join('\n');

const ASSISTANT_SYSTEM = lang => `Jesteś "PanFrikandel" — sympatycznym asystentem sklepu panfrikandel.pl z holenderskimi przekąskami.
Dostawa: dowozimy sami WYŁĄCZNIE w promieniu ${DELIVERY.radiusKm} km od Płocka (${DELIVERY.eta.pl}), koszt ${money(DELIVERY.priceGr, 'pl')}, gratis od ${money(DELIVERY.freeAboveGr, 'pl')}. Klient sprawdza kod pocztowy w koszyku. Poza strefą na razie nie dowozimy — zapisujemy zainteresowanie i rozszerzamy zasięg tam, gdzie jest popyt.
Sklep sprzedaje konsumenckie opakowania Mora (najpopularniejsza holenderska marka snacków). Większe ilości (kartony horeca, sosy 900 ml, olej, frytkownice) są w katalogu hurtowym na stronie /hurt — tam cena jest na zapytanie; kieruj tam klientów pytających o duże ilości, firmy lub gastronomię.
Mamy też food trucka (frytkownia na kółkach — frytki, frikandel speciaal, bitterballen): grafik, mapa lokalizacji, socials i zgłoszenia wydarzeń są na stronie /foodtruck.
Degustacje i catering (już teraz): przyjeżdżamy z frytkownicą do firm (integracja, przerwa lunchowa), na urodziny, wesela i festyny; pakiety od 39 zł/os., wycena w 1 dzień roboczy — kieruj na stronę /degustacja i zachęcaj do wysłania zgłoszenia. Kto zapisze się tam na powiadomienia e-mail o lokalizacji, dostaje osobisty kod rabatowy ${SUB_DISCOUNT.percent}% (PF-XXXXXX) na zamówienie w sklepie lub przy okienku.

Twoje zadanie: pomagasz klientom wybrać przekąski z katalogu poniżej. Doradzasz jak holenderski przyjaciel — konkretnie, ciepło, z humorem, ale krótko (maks. 4-5 zdań + polecenia).

ZASADY:
- Język odpowiedzi: ${lang === 'en' ? 'ANGIELSKI (klient korzysta z angielskiej wersji sklepu)' : 'POLSKI'}. Jeśli klient wyraźnie pisze w innym języku, odpowiadaj w jego języku.
- Polecasz TYLKO produkty z katalogu. Gdy polecasz produkt, wstaw jego ID w podwójnych nawiasach: [[id-produktu]]. Maksymalnie 3-4 polecenia naraz.
- Pytaj o preferencje gdy potrzeba (mięsne/wege, ostre/łagodne, na imprezę/na obiad, piekarnik/frytkownica/airfryer).
- Znasz się na holenderskiej kulturze frytkowni (frikandel speciaal, broodje kroket, patatje oorlog, bitterballen z musztardą przy piwie) i chętnie ją tłumaczysz.
- Porównanie, które działa w Polsce: frikandel to holenderski kuzyn kiełbasy i hot doga — bez skórki, gładki, lekko korzenny; broodje frikandel speciaal (w bułce z curry ketchupem, majonezem i cebulą) to "holenderski hot dog". Używaj tego, gdy ktoś pyta, co to jest frikandel lub z czym to porównać.
- Ulubiona porada: Polacy kochają grillowanie, a frikandel Classics świetnie wychodzi na grillu (ok. 14 min z zamrożenia, często obracać) — podany w miękkiej bułce z curry ketchupem, majonezem i surową cebulką to "broodje frikandel speciaal". Polecaj to przy pytaniach o grilla, imprezę w ogrodzie lub "jak zjeść frikandela".
- Nie wymyślasz cen, składników ani produktów spoza katalogu. Przy pytaniach o alergeny odsyłaj do szczegółów produktu na stronie.
- Pytania o dostawę: dowozimy tylko w promieniu ${DELIVERY.radiusKm} km od Płocka — odsyłaj do sprawdzenia kodu pocztowego w koszyku; nie obiecuj dostawy poza strefą.
- Nie odpowiadasz na pytania niezwiązane ze sklepem — uprzejmie wracasz do tematu przekąsek.

KATALOG:
${CATALOG_FOR_AI(lang)}`;

const aiHits = new Map(); // ip → [timestamps]
function aiAllowed(ip) {
  const now = Date.now();
  const arr = (aiHits.get(ip) || []).filter(ts => now - ts < 3600000);
  arr.push(now);
  aiHits.set(ip, arr);
  return arr.length <= 40;
}

app.post('/api/assistent', async (req, res) => {
  const t = res.locals.t;
  try {
    if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: t('errAiConfig') });
    if (!aiAllowed(clientIp(req))) return res.status(429).json({ error: t('errAiRate') });

    let msgs = Array.isArray(req.body.messages) ? req.body.messages : [];
    msgs = msgs.slice(-12).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 1500)
    })).filter(m => m.content);
    if (!msgs.length || msgs[msgs.length - 1].role !== 'user') {
      return res.status(400).json({ error: t('errAiEmpty') });
    }

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',   // snel & goedkoop; evt. 'claude-sonnet-4-6' voor slimmere antwoorden
        max_tokens: 600,
        system: ASSISTANT_SYSTEM(req.lang),
        messages: msgs
      })
    });

    if (!r.ok) {
      console.error('Anthropic API error:', r.status, await r.text());
      return res.status(502).json({ error: t('errAiDown') });
    }
    const data = await r.json();
    const reply = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
    res.json({ reply: reply || t('aiFallback') });
  } catch (err) {
    console.error('Assistent error:', err.message);
    res.status(500).json({ error: t('errAiDown') });
  }
});

// ---- Strefa dostawy: sprawdzenie kodu pocztowego ----
app.post('/api/strefa', (req, res) => {
  const z = checkZone(req.body.kod);
  if (!z.code) return res.status(400).json({ error: res.locals.t('errZone') });
  const source = ['koszyk', 'sekcja'].includes(req.body.zrodlo) ? req.body.zrodlo : 'inne';
  logZoneCheck(z, source);   // fire-and-forget (statistiek: ook vraag buiten de zone)
  res.json({ ...z, ...deliveryPublic(req.lang) });
});

// ---- Hurt: zapytanie o cenę → mail naar eigenaar + bevestiging klant + log ----
const QUOTE_EMAIL_TO = process.env.QUOTE_EMAIL_TO || ORDER_EMAIL_BCC || null;
const quoteHits = new Map(); // ip → [timestamps]
function quoteAllowed(ip) {
  const now = Date.now();
  const arr = (quoteHits.get(ip) || []).filter(t => now - t < 3600000);
  quoteHits.set(ip, arr);
  return arr.length < 5;
}

app.post('/api/zapytanie', async (req, res) => {
  const t = res.locals.t, lang = req.lang;
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '?';
    if (!quoteAllowed(ip)) return res.status(429).json({ error: t('errQuoteRate') });
    if (!(await turnstileOk(req))) return res.status(400).json({ error: t('errBot') });
    const s = (v, n) => String(v || '').trim().slice(0, n);
    const q = {
      name: s(req.body.name, 120), email: s(req.body.email, 160), phone: s(req.body.phone, 40),
      company: s(req.body.company, 120), place: s(req.body.place, 120), message: s(req.body.message, 2000),
      items: (Array.isArray(req.body.items) ? req.body.items : []).slice(0, 60)
        .map(it => ({ id: String(it.id || ''), qty: s(it.qty, 40) }))
        .filter(it => wholesaleById[it.id]),
      lang
    };
    if (!q.name || !(q.email || q.phone)) return res.status(400).json({ error: t('errQuoteForm') });
    if (!q.items.length && !q.message) return res.status(400).json({ error: t('errQuoteEmpty') });
    quoteHits.get(ip).push(Date.now());

    const itemLines = q.items.map(it => {
      const p = localizeProduct(wholesaleById[it.id], lang);
      return { name: p.name, unit: p.unit, qty: it.qty };
    });
    logQuote(q);   // fire-and-forget

    if (resend && QUOTE_EMAIL_TO) {
      const rows = itemLines.map(i => `<li>${escHtml(i.name)} — ${escHtml(i.unit)}${i.qty ? ' · <b>' + escHtml(i.qty) + '</b>' : ''}</li>`).join('');
      // 1) eigenaar (Nederlands)
      await resend.emails.send({
        from: ORDER_EMAIL_FROM, to: QUOTE_EMAIL_TO,
        ...(q.email ? { reply_to: q.email } : {}),
        subject: `Offerte-aanvraag hurt: ${q.name}${q.company ? ' (' + q.company + ')' : ''}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;color:#2a1503">
          <h2 style="margin:0 0 12px">Nieuwe offerte-aanvraag (/hurt)</h2>
          <p><b>${escHtml(q.name)}</b>${q.company ? ' · ' + escHtml(q.company) : ''}<br>
          ${q.email ? 'E-mail: ' + escHtml(q.email) + '<br>' : ''}${q.phone ? 'Tel: ' + escHtml(q.phone) + '<br>' : ''}${q.place ? 'Plaats: ' + escHtml(q.place) + '<br>' : ''}Taal: ${lang}</p>
          ${rows ? '<p><b>Producten</b></p><ul>' + rows + '</ul>' : ''}
          ${q.message ? '<p><b>Bericht</b><br>' + escHtml(q.message).replace(/\n/g, '<br>') + '</p>' : ''}
        </div>`
      });
      // 2) bevestiging klant (in zijn taal)
      if (q.email) {
        await resend.emails.send({
          from: ORDER_EMAIL_FROM, to: q.email,
          subject: t('quoteMailSubject'),
          html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#2a1503">
            <div style="background:#ff4d00;color:#fff8ec;padding:28px 32px;border-radius:16px 16px 0 0">
              <h1 style="margin:0;font-size:26px">${t('mailThanks', { name: escHtml(q.name) })}</h1>
            </div>
            <div style="border:2px solid #2a1503;border-top:0;padding:24px 32px;border-radius:0 0 16px 16px">
              <p>${t('quoteMailBody')}</p>
              ${rows ? '<p><b>' + t('quoteMailItems') + '</b></p><ul>' + rows + '</ul>' : ''}
              ${q.message ? '<p><b>' + t('quoteMailMessage') + '</b><br>' + escHtml(q.message).replace(/\n/g, '<br>') + '</p>' : ''}
              <p style="color:#8a6a4f;font-size:13px">${t('mailFooterHtml')}</p>
            </div>
          </div>`
        });
      }
    } else {
      console.log('📦 Offerte-aanvraag (geen mail geconfigureerd):', JSON.stringify({ ...q, items: itemLines }));
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Offerte-aanvraag mislukt:', err.message);
    res.status(500).json({ error: t('errQuoteSend') });
  }
});

// ---- Food truck: zgłoszenie wydarzenia → mail eigenaar + bevestiging + log ----
app.post('/api/wydarzenie', async (req, res) => {
  const t = res.locals.t, lang = req.lang;
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '?';
    if (!quoteAllowed(ip)) return res.status(429).json({ error: t('errQuoteRate') });
    if (!(await turnstileOk(req))) return res.status(400).json({ error: t('errBot') });
    const s = (v, n) => String(v || '').trim().slice(0, n);
    const TYPES = { firma: 'Degustacja/integracja w firmie', impreza: 'Impreza prywatna', wesele: 'Wesele', festyn: 'Festyn/event', inne: 'Inne' };
    const type = TYPES[String(req.body.type || '')] || '';
    const company = s(req.body.company, 120);
    const source = String(req.body.source || '') === 'degustacja' ? 'catering' : 'food truck';
    const e = {
      name: s(req.body.name, 120), email: s(req.body.email, 160), phone: s(req.body.phone, 40),
      event: [type, company, s(req.body.event, 160)].filter(Boolean).join(' — ').slice(0, 300) || source,
      date: s(req.body.date, 10), place: s(req.body.place, 200),
      guests: s(req.body.guests, 20), message: s(req.body.message, 2000), lang
    };
    if (!e.name || !(e.email || e.phone) || !e.date || !e.place) return res.status(400).json({ error: t('errEventForm') });
    quoteHits.get(ip).push(Date.now());
    logEvent(e);   // fire-and-forget

    const details = [
      e.event && ['Wydarzenie', e.event], ['Data', e.date], ['Miejsce', e.place],
      e.guests && ['Goście', e.guests]
    ].filter(Boolean).map(([k, v]) => `<li><b>${k}:</b> ${escHtml(v)}</li>`).join('');

    if (resend && QUOTE_EMAIL_TO) {
      await resend.emails.send({
        from: ORDER_EMAIL_FROM, to: QUOTE_EMAIL_TO,
        ...(e.email ? { reply_to: e.email } : {}),
        subject: `${source === 'catering' ? 'Catering/degustatie' : 'Food truck'} aanvraag: ${e.event || e.place} (${e.date})`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;color:#2a1503">
          <h2 style="margin:0 0 12px">Nieuwe aanvraag: ${source} (${source === 'catering' ? '/degustacja' : '/foodtruck'})</h2>
          <p><b>${escHtml(e.name)}</b><br>${e.email ? 'E-mail: ' + escHtml(e.email) + '<br>' : ''}${e.phone ? 'Tel: ' + escHtml(e.phone) + '<br>' : ''}Taal: ${lang}</p>
          <ul>${details}</ul>
          ${e.message ? '<p><b>Bericht</b><br>' + escHtml(e.message).replace(/\n/g, '<br>') + '</p>' : ''}
        </div>`
      });
      if (e.email) {
        await resend.emails.send({
          from: ORDER_EMAIL_FROM, to: e.email,
          subject: t('eventMailSubject'),
          html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#2a1503">
            <div style="background:#ff4d00;color:#fff8ec;padding:28px 32px;border-radius:16px 16px 0 0">
              <h1 style="margin:0;font-size:26px">${t('mailThanks', { name: escHtml(e.name) })}</h1>
            </div>
            <div style="border:2px solid #2a1503;border-top:0;padding:24px 32px;border-radius:0 0 16px 16px">
              <p>${t('eventMailBody')}</p>
              <p><b>${t('eventMailDetails')}</b></p><ul>${details}</ul>
              ${e.message ? '<p>' + escHtml(e.message).replace(/\n/g, '<br>') + '</p>' : ''}
              <p style="color:#8a6a4f;font-size:13px">${t('mailFooterHtml')}</p>
            </div>
          </div>`
        });
      }
    } else {
      console.log('🚚 Evenement-aanvraag (geen mail geconfigureerd):', JSON.stringify(e));
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Evenement-aanvraag mislukt:', err.message);
    res.status(500).json({ error: t('errEventSend') });
  }
});

// ---- Food truck LIVE: GPS-positie ----
app.get('/api/gps', (req, res) => { res.set('Cache-Control', 'no-store'); res.json(publicLive()); });
function gpsGuard(req, res) {
  if (!GPS_TOKEN) { res.status(503).json({ error: res.locals.t('errGpsNoToken') }); return false; }
  if (!gpsAuth(req)) { res.status(401).json({ error: res.locals.t('errGpsAuth') }); return false; }
  return true;
}
app.post('/api/gps', async (req, res) => {
  if (!gpsGuard(req, res)) return;
  const lat = parseFloat(req.body.lat), lon = parseFloat(req.body.lon);
  if (!(lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180)) return res.status(400).json({ error: 'lat/lon' });
  truckState = { ...truckState, lat, lon, accuracy: Math.min(Math.max(parseInt(req.body.accuracy, 10) || 0, 0), 99999), updatedAt: Date.now(), live: true };
  await saveState();
  res.json({ ok: true, updatedAt: truckState.updatedAt });
});
app.post('/api/gps/stop', async (req, res) => {
  if (!gpsGuard(req, res)) return;
  truckState.live = false;
  await saveState();
  res.json({ ok: true });
});
app.get('/api/gps/status', async (req, res) => {
  if (!gpsGuard(req, res)) return;
  const subs = subActive(await subList());
  res.json({ live: isLive(), lat: truckState.lat, lon: truckState.lon, updatedAt: truckState.updatedAt, place: truckState.place, announcedAt: truckState.announcedAt, subscribers: subs.length });
});
app.post('/api/gps/oglos', async (req, res) => {
  if (!gpsGuard(req, res)) return;
  try {
    res.json({ ok: true, ...(await announceLocation(req.body.info)) });
  } catch (err) {
    if (err.message === 'no-position') return res.status(400).json({ error: res.locals.t('errGpsPos') });
    console.error('Aankondigen mislukt:', err.message);
    res.status(500).json({ error: err.message });
  }
});
// Kortingscode aan het loket: checken en (optioneel) als gebruikt markeren
app.post('/api/gps/kod', async (req, res) => {
  if (!gpsGuard(req, res)) return;
  const r = await codeCheck(req.body.code);
  if (!r.ok) return res.json({ ok: false, reason: r.reason, usedAt: r.usedAt || null });
  if (req.body.use) await codeUse(r.code);
  res.json({ ok: true, code: fmtCode(r.code), percent: r.percent, email: r.sub.email.replace(/^(.{2}).*(@.*)$/, '$1…$2'), used: !!req.body.use });
});

// ---- Powiadomienia: zapis (double opt-in), potwierdzenie, rezygnacja; kortingscode ----
app.post('/api/subskrypcja', async (req, res) => {
  const t = res.locals.t, lang = req.lang;
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '?';
    if (!quoteAllowed(ip)) return res.status(429).json({ error: t('errQuoteRate') });
    if (!(await turnstileOk(req))) return res.status(400).json({ error: t('errBot') });
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!validEmail(email)) return res.status(400).json({ error: t('errSubEmail') });
    if (!req.body.consent) return res.status(400).json({ error: t('errSubConsent') });
    quoteHits.get(ip).push(Date.now());
    const r = await subUpsert(email, lang, String(req.body.place || '').trim().slice(0, 120));
    if (r.confirmed) return res.json({ ok: true, confirmed: true });
    const url = `${siteUrl(req)}/subskrypcja/potwierdz?e=${encodeURIComponent(email)}&t=${subToken(email)}`;
    if (resend) {
      await resend.emails.send({
        from: ORDER_EMAIL_FROM, to: email, subject: t('subMailSubject'),
        html: mailHtml(t('subMailSubject'), '<p>' + t('subMailBodyHtml') + '</p>' + mailButton(url, t('subMailButton')), t('mailFooterHtml'))
      });
    } else {
      console.log('🔔 Bevestigingslink (geen mail geconfigureerd):', url);
    }
    res.json({ ok: true, confirmed: false });
  } catch (err) {
    console.error('Zapis mislukt:', err.message);
    res.status(500).json({ error: t('errSubSend') });
  }
});
app.get('/subskrypcja/potwierdz', async (req, res) => {
  const t = res.locals.t;
  const email = String(req.query.e || '').trim().toLowerCase();
  if (!validEmail(email) || !tokenOk(email, req.query.t)) {
    return res.status(400).render('info', { ok: false, title: t('infoBadLinkTitle'), text: t('infoBadLinkText'), v: ASSET_V });
  }
  try {
    const r = await subConfirm(email);
    if (!r) return res.status(400).render('info', { ok: false, title: t('infoBadLinkTitle'), text: t('infoBadLinkText'), v: ASSET_V });
    if (!r.wasConfirmed && resend) {
      await resend.emails.send({
        from: ORDER_EMAIL_FROM, to: email, subject: t('subWelcomeSubject'),
        html: mailHtml(t('subWelcomeSubject'), t('subWelcomeBodyHtml', { code: fmtCode(r.code), percent: SUB_DISCOUNT.percent, siteUrl: BASE_URL }), t('mailUnsubHtml', { url: unsubUrl(email) }))
      });
    }
    res.render('info', { ok: true, title: t('infoConfirmedTitle'), text: t('infoConfirmedText') + ' ' + t('infoCodeText', { code: fmtCode(r.code), percent: SUB_DISCOUNT.percent }), v: ASSET_V });
  } catch (err) {
    console.error('Bevestigen mislukt:', err.message);
    res.status(500).render('info', { ok: false, title: t('infoBadLinkTitle'), text: t('errSubSend'), v: ASSET_V });
  }
});
app.get('/subskrypcja/rezygnacja', async (req, res) => {
  const t = res.locals.t;
  const email = String(req.query.e || '').trim().toLowerCase();
  if (!validEmail(email) || !tokenOk(email, req.query.t)) {
    return res.status(400).render('info', { ok: false, title: t('infoBadLinkTitle'), text: t('infoBadLinkText'), v: ASSET_V });
  }
  try { await subUnsubscribe(email); } catch (err) { console.error('Afmelden mislukt:', err.message); }
  res.render('info', { ok: true, title: t('infoUnsubTitle'), text: t('infoUnsubText'), v: ASSET_V });
});
// Kortingscode in de winkelmand
app.post('/api/kod', async (req, res) => {
  const t = res.locals.t;
  const r = await codeCheck(req.body.code);
  if (!r.ok) return res.status(404).json({ error: t(r.reason === 'used' ? 'errCodeUsed' : 'errCodeInvalid') });
  res.json({ ok: true, code: fmtCode(r.code), percent: r.percent });
});

// ---- Stripe Checkout ----
app.post('/api/checkout', async (req, res) => {
  const t = res.locals.t, lang = req.lang;
  try {
    // Alleen bezorgen binnen de zone — server beslist, niet de browser
    const zone = checkZone(req.body.kod);
    if (!zone.inZone) {
      return res.status(400).json({ error: t('errOutsideZone', { radius: DELIVERY.radiusKm }), outsideZone: true });
    }
    if (!stripe) return res.status(500).json({ error: t('errStripe') });

    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const lineItems = [];
    let subtotal = 0, backorder = false;

    for (const it of items) {
      const base = productById[it.id];
      const qty = Math.min(Math.max(parseInt(it.qty, 10) || 0, 1), 50);
      if (!base || base.active === false) continue;
      const p = localizeProduct(base, lang);
      if (qty > (base.stock || 0)) backorder = true;   // boven de voorraad: mag, maar langere levertijd
      subtotal += p.price * qty;
      lineItems.push({
        quantity: qty,
        price_data: {
          currency: 'pln',
          unit_amount: p.price,
          product_data: { name: p.name, description: p.unit, metadata: { id: p.id } }
        }
      });
    }

    if (!lineItems.length) return res.status(400).json({ error: t('errEmptyCart') });

    // Kortingscode van een abonnee (PF-XXXXXX) → Stripe-coupon; ongeldig = duidelijke fout, niet stil negeren
    let disc = null;
    if (String(req.body.kod_rabatowy || '').trim()) {
      disc = await codeCheck(req.body.kod_rabatowy);
      if (!disc.ok) return res.status(400).json({ error: t(disc.reason === 'used' ? 'errCodeUsed' : 'errCodeInvalid'), badCode: true });
    }

    const free = subtotal >= DELIVERY.freeAboveGr;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: lang === 'en' ? 'en' : 'pl',
      payment_method_types: ['card', 'p24', 'blik'],
      line_items: lineItems,
      shipping_address_collection: { allowed_countries: ['PL'] },
      phone_number_collection: { enabled: true },
      shipping_options: [{
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: free ? 0 : DELIVERY.priceGr, currency: 'pln' },
          display_name: t(free ? 'shipLocalFree' : 'shipLocal', { place: zone.place, km: zone.km }),
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 1 },
            maximum: { unit: 'business_day', value: backorder ? 7 : 1 }
          },
          metadata: { typ: 'lokalna', kod: zone.code, km: String(zone.km) }
        }
      }],
      ...(disc ? { discounts: [{ coupon: await ensureCoupon(disc.percent) }] } : {}),
      metadata: {
        kod_pocztowy: zone.code,
        miejscowosc: zone.place,
        odleglosc_km: String(zone.km),
        kod_rabatowy: disc ? disc.code : '',
        na_zamowienie: backorder ? 'tak' : 'nie',
        lang
      },
      success_url: `${siteUrl(req)}/sukces?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl(req)}/?anulowano=1#sklep`
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err.message);
    res.status(500).json({ error: t('errCheckout') });
  }
});

// ---- Success page + orderbevestiging via Resend ----
const emailedSessions = new Set();
const loggedSessions = new Set();

app.get('/sukces', async (req, res) => {
  let order = null;
  try {
    if (stripe && req.query.session_id) {
      const session = await stripe.checkout.sessions.retrieve(req.query.session_id, {
        expand: ['line_items.data.price.product', 'payment_intent.payment_method']
      });
      const paid = session.payment_status === 'paid';
      // BLIK/P24 kunnen even "in behandeling" zijn: sessie compleet, betaling nog niet bevestigd
      if (paid || session.status === 'complete') {
        // Taal van de bestelling = taal waarin de klant afrekende (metadata), niet de huidige cookie
        const lang = LANGS.includes(session.metadata?.lang) ? session.metadata.lang : 'pl';
        const t = makeT(lang);
        const m = session.metadata || {};
        const addr = (session.shipping_details || session.collected_information?.shipping_details)?.address || null;
        const pm = session.payment_intent && typeof session.payment_intent === 'object' ? session.payment_intent.payment_method : null;
        const shippingGr = session.shipping_cost?.amount_total || 0;
        const discountGr = session.total_details?.amount_discount || 0;
        order = {
          paid, pending: !paid,
          orderNo: 'PF-' + session.id.slice(-8).toUpperCase(),
          email: session.customer_details?.email || null,
          name: session.customer_details?.name || '',
          phone: session.customer_details?.phone || '',
          eta: m.na_zamowienie === 'tak' ? DELIVERY.backorderEta[lang] : DELIVERY.eta[lang],
          backorder: m.na_zamowienie === 'tak',
          address: addr ? [addr.line1, addr.line2, ((addr.postal_code || '') + ' ' + (addr.city || '')).trim()].filter(Boolean).join(', ') : '',
          items: (session.line_items?.data || []).map(li => ({
            name: li.description, qty: li.quantity, total: money(li.amount_total, lang)
          })),
          subtotal: money(session.amount_subtotal, lang),
          discount: discountGr ? money(discountGr, lang) : null,
          code: m.kod_rabatowy ? 'PF-' + m.kod_rabatowy : null,
          shippingGr, shipping: money(shippingGr, lang),
          place: m.miejscowosc || '', km: m.odleglosc_km || '',
          total: money(session.amount_total, lang),
          payMethod: pm && typeof pm === 'object' ? pm.type : null
        };

        if (paid) {
          // Statistiek: bestelling registreren + checken of het afleveradres echt in de zone ligt
          if (!loggedSessions.has(session.id)) {
            loggedSessions.add(session.id);
            if (m.kod_rabatowy) codeUse(m.kod_rabatowy);
            // voorraad afboeken (product-id zit in de metadata van het Stripe-product)
            const bought = {};
            for (const li of (session.line_items?.data || [])) {
              const pid = li.price?.product?.metadata?.id;
              if (pid) bought[pid] = (bought[pid] || 0) + (li.quantity || 0);
            }
            stockDeduct(bought);
            const z = checkZone(addr?.postal_code || m.kod_pocztowy);
            if (!z.inZone) console.warn(`⚠️ Bestelling buiten de zone: ${session.id}, kod ${addr?.postal_code || '?'}`);
            logOrder({
              sessionId: session.id, code: z.code || addr?.postal_code || null, place: z.place, km: z.km,
              amountGr: session.amount_total, outOfZone: !z.inZone
            });
          }

          if (resend && order.email && !emailedSessions.has(session.id)) {
            emailedSessions.add(session.id);
            const rows = order.items.map(i =>
              `<tr><td style="padding:6px 12px 6px 0">${i.qty} × ${escHtml(i.name)}</td><td style="padding:6px 0;text-align:right">${i.total}</td></tr>`
            ).join('');
            const sumRow = (label, val) => `<tr><td style="padding:4px 12px 4px 0;color:#8a6a4f">${label}</td><td style="padding:4px 0;text-align:right;color:#8a6a4f">${val}</td></tr>`;
            await resend.emails.send({
              from: ORDER_EMAIL_FROM,
              to: order.email,
              ...(ORDER_EMAIL_BCC ? { bcc: ORDER_EMAIL_BCC } : {}),
              subject: t('mailSubject') + ' · ' + order.orderNo,
              html: mailHtml(
                t('mailThanks', { name: escHtml(order.name || t('mailGuest')) }),
                `<p style="margin:0 0 12px">${t('mailPacking')} <span style="color:#8a6a4f">${t('successOrderNo')} ${order.orderNo}</span></p>
                 <table style="width:100%;border-collapse:collapse;font-size:15px">${rows}
                   ${sumRow(t('successSubtotal'), order.subtotal)}
                   ${order.discount ? sumRow(t('successDiscount', { code: order.code }), '−' + order.discount) : ''}
                   ${sumRow(order.place ? t('successDelivery', { place: escHtml(order.place), km: order.km }) : t('navDelivery'), shippingGr ? order.shipping : t('successFree'))}
                 </table>
                 <p style="border-top:2px dashed #2a1503;padding-top:12px;font-weight:bold">${t('mailTotal')}: ${order.total}</p>
                 <p>${t('mailDeliveryHtml', { eta: order.eta })}${order.address ? '<br>' + t('mailAddress') + escHtml(order.address) : ''}</p>
                 ${order.backorder ? '<p>' + t('backorderNoteHtml', { eta: order.eta }) + '</p>' : ''}`,
                t('mailFooterHtml')
              )
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Success page error:', err.message);
  }
  res.locals.meta = { ...res.locals.meta, title: res_t(req, 'successTitle'), noindex: true };
  res.render('sukces', { order, v: ASSET_V });
});

app.use((req, res) => {
  console.warn(`↩️  onbekende URL → / : ${req.method} ${req.originalUrl}`);
  res.redirect('/');
});

console.log(`🍟 PanFrikandel ${VERSION_LABEL} start · Node ${process.version} · poort ${PORT} · BASE_URL ${process.env.BASE_URL || '(leeg → afgeleid van het request)'}`);
console.log(`   database: ${pool ? 'PostgreSQL' : 'geen (JSON-bestanden in data/)'} · Stripe: ${stripe ? 'ja' : 'nee'} · Resend: ${resend ? 'ja' : 'nee'} · admin: ${ADMIN_PASSWORD ? 'ja' : 'nee'} · GPS: ${GPS_TOKEN ? 'ja' : 'nee'} · Turnstile: ${TURNSTILE_SECRET ? 'ja' : 'nee'}`);
let listening = false;
function listen(reason) {
  if (listening) return;
  listening = true;
  app.listen(PORT, () => console.log(`🍟 PanFrikandel ${VERSION_LABEL} draait op ${BASE_URL} (${reason})`));
}
const init = Promise.all([loadPrices(), loadFlags(), loadStock(), initStats(), initTruck(), initLive()])
  .then(() => listen('initialisatie klaar'))
  .catch(err => { console.error('Initialisatie mislukt (server start toch):', err.message); listen('ondanks init-fout'); });
setTimeout(() => { if (!listening) { console.warn('⚠️ Initialisatie duurt > 15 s (database bereikbaar?) — server start alvast, init loopt door'); listen('init nog bezig'); } }, 15000);
