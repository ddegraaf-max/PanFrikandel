// ============================================================
//  PAN FRIKANDEL — server.js
//  Holenderskie przekąski · dostawa w całej Polsce
//  Stack: Express + EJS + Stripe Checkout + Resend
// ============================================================

const express = require('express');
const path = require('path');
const Stripe = require('stripe');
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const ORDER_EMAIL_FROM = process.env.ORDER_EMAIL_FROM || 'Pan Frikandel <zamowienia@panfrikandel.pl>';
const ORDER_EMAIL_BCC  = process.env.ORDER_EMAIL_BCC || null; // eigen kopie van elke order

// Cache-busting versie (zelfde patroon als LumaDak)
const ASSET_V = Date.now().toString(36);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));

// ============================================================
//  CATALOGUS  (prijzen in grosze — 8900 = 89,00 zł)
//  Alles diepvries, verzonden in thermobox met droogijs.
// ============================================================

const PRODUCTS = [
  // ---- Klassiekers ----
  { id: 'frikandel-20',    cat: 'klasyki', name: 'Frikandel · 20 szt.',          desc: 'Legenda holenderskiej frytkowni. 20 sztuk po 70 g — do piekarnika, frytkownicy lub airfryera.', price: 8900,  unit: '20 × 70 g', badge: 'BESTSELLER', icon: 'frikandel' },
  { id: 'frikandel-xxl',   cat: 'klasyki', name: 'Frikandel XXL · 10 szt.',      desc: 'Wersja dla głodnych: 10 gigantów po 100 g. Idealna baza pod frikandel speciaal.', price: 6900,  unit: '10 × 100 g', badge: null, icon: 'frikandel' },
  { id: 'bitterballen-30', cat: 'klasyki', name: 'Bitterballen · 30 szt.',       desc: 'Chrupiące kulki z kremowym ragù wołowym. Obowiązkowe z musztardą przy piwie.', price: 7900,  unit: '30 × 30 g', badge: 'HIT NA IMPREZY', icon: 'bitterbal' },
  { id: 'kroket-10',       cat: 'klasyki', name: 'Kroket wołowy · 10 szt.',      desc: 'Duży brat bitterballen. Holendrzy jedzą go w bułce — "broodje kroket".', price: 6500,  unit: '10 × 80 g', badge: null, icon: 'kroket' },
  { id: 'kaassouffle-10',  cat: 'klasyki', name: 'Kaassoufflé · 10 szt.',        desc: 'Chrupiąca kieszonka z płynnym serem Gouda. Wegetariański klasyk frytkowni.', price: 6900,  unit: '10 × 65 g', badge: 'WEGE', icon: 'kaassouffle' },
  { id: 'bamischijf-8',    cat: 'klasyki', name: 'Bamischijf · 8 szt.',          desc: 'Smażony krążek z indonezyjskim makaronem bami — holendersko-azjatycka fuzja.', price: 5900,  unit: '8 × 90 g', badge: null, icon: 'bamischijf' },
  { id: 'mexicano-8',      cat: 'klasyki', name: 'Mexicano · 8 szt.',            desc: 'Pikantny, płaski kotlet z charakterem. Dla tych, którym frikandel to za mało.', price: 6200,  unit: '8 × 100 g', badge: 'OSTRE', icon: 'mexicano' },

  // ---- Sosy ----
  { id: 'fritessaus-750',  cat: 'sosy', name: 'Fritessaus · 750 ml',             desc: 'NIE mylić z majonezem! Lżejszy, słodszy — jedyny słuszny sos do frytek w NL.', price: 2900, unit: '750 ml', badge: null, icon: 'saus' },
  { id: 'curryketchup-500',cat: 'sosy', name: 'Curry ketchup · 500 ml',          desc: 'Korzenna, curry-owa siostra ketchupu. Fundament frikandel speciaal.', price: 2400, unit: '500 ml', badge: null, icon: 'saus' },
  { id: 'joppiesaus-500',  cat: 'sosy', name: 'Joppiesaus · 500 ml',             desc: 'Kultowy żółty sos z nutą curry i cebuli. Receptura owiana tajemnicą.', price: 2700, unit: '500 ml', badge: 'KULTOWY', icon: 'saus' },
  { id: 'satesaus-500',    cat: 'sosy', name: 'Satésaus · 500 ml',               desc: 'Gęsty sos orzechowy do frytek "patatje oorlog" i do wszystkiego innego.', price: 2600, unit: '500 ml', badge: null, icon: 'saus' },

  // ---- Boxy ----
  { id: 'box-speciaal',    cat: 'boxy', name: 'Box "Speciaal"',                  desc: '20 frikandelli + curry ketchup + fritessaus + suszona cebulka. Wszystko do frikandel speciaal w domu.', price: 13900, unit: 'zestaw', badge: 'POLECAMY', icon: 'box' },
  { id: 'box-party',       cat: 'boxy', name: 'Party Box · 60 szt.',             desc: '20 bitterballen, 20 frikandelli, 10 kroketów, 10 kaassoufflé + 2 sosy. Impreza po holendersku.', price: 24900, unit: '60 szt. + 2 sosy', badge: 'NAJLEPSZA CENA', icon: 'box' },
  { id: 'box-proba',       cat: 'boxy', name: 'Box "Pierwszy raz"',              desc: 'Po 4 sztuki każdego klasyka + mały fritessaus. Poznaj wszystkie smaki bez zobowiązań.', price: 9900, unit: '24 szt. + sos', badge: 'DLA NOWYCH', icon: 'box' }
];

const SHIPPING = {
  standardGr: 4900,          // 49 zł — kurier z termoboxem
  freeAboveGr: 25000         // gratis powyżej 250 zł
};

const productById = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
const zl = gr => (gr / 100).toFixed(2).replace('.', ',') + ' zł';

// ============================================================
//  ROUTES
// ============================================================

app.get('/', (req, res) => {
  res.render('index', { products: PRODUCTS, shipping: SHIPPING, v: ASSET_V, zl });
});

app.get('/regulamin',   (req, res) => res.render('regulamin',   { v: ASSET_V }));
app.get('/prywatnosc',  (req, res) => res.render('prywatnosc',  { v: ASSET_V }));

// ---- Stripe Checkout ----
app.post('/api/checkout', async (req, res) => {
  try {
    if (!stripe) return res.status(500).json({ error: 'Płatności nie są jeszcze skonfigurowane (STRIPE_SECRET_KEY).' });

    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const lineItems = [];
    let subtotal = 0;

    for (const it of items) {
      const p = productById[it.id];
      const qty = Math.min(Math.max(parseInt(it.qty, 10) || 0, 1), 50);
      if (!p) continue;
      subtotal += p.price * qty;
      lineItems.push({
        quantity: qty,
        price_data: {
          currency: 'pln',
          unit_amount: p.price,
          product_data: { name: p.name, description: p.unit }
        }
      });
    }

    if (!lineItems.length) return res.status(400).json({ error: 'Koszyk jest pusty.' });

    const freeShipping = subtotal >= SHIPPING.freeAboveGr;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'pl',
      payment_method_types: ['card', 'p24', 'blik'],
      line_items: lineItems,
      shipping_address_collection: { allowed_countries: ['PL'] },
      phone_number_collection: { enabled: true },
      shipping_options: [{
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: freeShipping ? 0 : SHIPPING.standardGr, currency: 'pln' },
          display_name: freeShipping
            ? 'Kurier z termoboxem — GRATIS'
            : 'Kurier z termoboxem (24–48 h)',
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 1 },
            maximum: { unit: 'business_day', value: 2 }
          }
        }
      }],
      success_url: `${BASE_URL}/sukces?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/?anulowano=1#sklep`
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err.message);
    res.status(500).json({ error: 'Nie udało się rozpocząć płatności. Spróbuj ponownie.' });
  }
});

// ---- Success page + orderbevestiging via Resend ----
const emailedSessions = new Set(); // simpele dubbel-send guard

app.get('/sukces', async (req, res) => {
  let order = null;
  try {
    if (stripe && req.query.session_id) {
      const session = await stripe.checkout.sessions.retrieve(req.query.session_id, {
        expand: ['line_items']
      });
      if (session.payment_status === 'paid') {
        order = {
          email: session.customer_details?.email || null,
          name: session.customer_details?.name || '',
          total: zl(session.amount_total),
          items: (session.line_items?.data || []).map(li => ({
            name: li.description, qty: li.quantity, total: zl(li.amount_total)
          }))
        };
        if (resend && order.email && !emailedSessions.has(session.id)) {
          emailedSessions.add(session.id);
          const rows = order.items.map(i =>
            `<tr><td style="padding:6px 12px 6px 0">${i.qty} × ${i.name}</td><td style="padding:6px 0;text-align:right">${i.total}</td></tr>`
          ).join('');
          await resend.emails.send({
            from: ORDER_EMAIL_FROM,
            to: order.email,
            ...(ORDER_EMAIL_BCC ? { bcc: ORDER_EMAIL_BCC } : {}),
            subject: 'Lekker! Twoje zamówienie w Pan Frikandel 🍟',
            html: `
              <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#2a1503">
                <div style="background:#ff4d00;color:#fff8ec;padding:28px 32px;border-radius:16px 16px 0 0">
                  <h1 style="margin:0;font-size:26px">Dziękujemy, ${order.name || 'smakoszu'}!</h1>
                  <p style="margin:8px 0 0">Twoje holenderskie przekąski już się pakują.</p>
                </div>
                <div style="border:2px solid #2a1503;border-top:0;padding:24px 32px;border-radius:0 0 16px 16px">
                  <table style="width:100%;border-collapse:collapse;font-size:15px">${rows}</table>
                  <p style="border-top:2px dashed #2a1503;padding-top:12px;font-weight:bold">Razem: ${order.total}</p>
                  <p>📦 Wysyłamy w termoboxie z suchym lodem — kurier dostarczy paczkę w 24–48 h. Produkty włóż od razu do zamrażarki.</p>
                  <p style="color:#8a6a4f;font-size:13px">Pan Frikandel · panfrikandel.pl<br>Pytania? Odpowiedz na tego maila.</p>
                </div>
              </div>`
          });
        }
      }
    }
  } catch (err) {
    console.error('Success page error:', err.message);
  }
  res.render('sukces', { order, v: ASSET_V });
});

app.use((req, res) => res.redirect('/'));

app.listen(PORT, () => console.log(`🍟 Pan Frikandel draait op ${BASE_URL}`));
