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
const ORDER_EMAIL_BCC  = process.env.ORDER_EMAIL_BCC || null;

const ASSET_V = Date.now().toString(36);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));

// ============================================================
//  CATALOGUS  (prijzen in grosze — 12900 = 129,00 zł)
//  details.prep / ingredients / allergens / nutrition → productmodal
//  (składniki + alergeny verplicht bij online voedselverkoop, EU 1169/2011)
// ============================================================

const FRIKANDEL_NUTRITION = [
  ['Energia', '945 kJ / 226 kcal'],
  ['Tłuszcz', '16 g'],
  ['— w tym kwasy nasycone', '5,1 g'],
  ['Węglowodany', '7 g'],
  ['— w tym cukry', '0,6 g'],
  ['Błonnik', '1,7 g'],
  ['Białko', '13 g'],
  ['Sól', '2,1 g']
];

const FRIKANDEL_INGREDIENTS = 'Mięso oddzielone mechanicznie z kurczaka, słonina wieprzowa, woda, bułka tarta (mąka PSZENNA, drożdże, sól), cebula, sól, przyprawy, emulgatory: E450, E452, przeciwutleniacze: kwas cytrynowy, E316, wzmacniacz smaku: E621, aromat (zawiera PSZENICĘ).';

const FRIKANDEL_PREP = [
  ['🍟 Frytkownica', '180°C · 4 min z zamrożenia (3 min po rozmrożeniu)'],
  ['💨 Airfryer', '180°C · 8–10 min z zamrożenia, obrócić w połowie'],
  ['🔥 Piekarnik', '200°C · 12–15 min z zamrożenia'],
  ['🍳 Patelnia', 'na średnim ogniu, regularnie obracać']
];

const PRODUCTS = [
  // ---- Klassiekers ----
  { id: 'frikandel-40', cat: 'klasyki', name: 'Frikandel · 40 szt.', price: 12900, unit: '40 × 85 g (3400 g)', badge: 'BESTSELLER', icon: 'frikandel', img: 'frikandel-karton.webp', img2: 'frikandel.webp',
    desc: 'Legenda holenderskiej frytkowni w kartonie horeca. 40 sztuk po 85 g — zapas na długo.',
    details: { prep: FRIKANDEL_PREP, ingredients: FRIKANDEL_INGREDIENTS, allergens: 'Gluten (pszenica)', nutrition: FRIKANDEL_NUTRITION,
      storage: 'Produkt głęboko mrożony (-18°C). Po rozmrożeniu nie zamrażać ponownie. W lodówce (+4°C): 48 h.' } },

  { id: 'frikandel-kingsize-40', cat: 'klasyki', name: 'Frikandel Kingsize · 40 szt.', price: 14900, unit: '40 × 100 g (4000 g)', badge: 'XXL', icon: 'frikandel', img: 'frikandel-kingsize-karton.webp', img2: 'frikandel.webp',
    desc: 'Ekstra duży frikandel 100 g. Idealna baza pod frikandel speciaal — z sosem curry, majonezem i cebulką.',
    details: { prep: FRIKANDEL_PREP, ingredients: FRIKANDEL_INGREDIENTS, allergens: 'Gluten (pszenica)', nutrition: FRIKANDEL_NUTRITION,
      storage: 'Produkt głęboko mrożony (-18°C). Po rozmrożeniu nie zamrażać ponownie. W lodówce (+4°C): 48 h.' } },

  { id: 'bitterballen-30', cat: 'klasyki', name: 'Bitterballen · 30 szt.', price: 7900, unit: '30 × 30 g', badge: 'HIT NA IMPREZY', icon: 'bitterbal',
    desc: 'Chrupiące kulki z kremowym ragù wołowym. Obowiązkowe z musztardą przy piwie.',
    details: { prep: [['🍟 Frytkownica', '180°C · 3–4 min z zamrożenia'], ['💨 Airfryer', '180°C · 9–11 min z zamrożenia']] } },

  { id: 'kroket-10', cat: 'klasyki', name: 'Kroket wołowy · 10 szt.', price: 6500, unit: '10 × 80 g', badge: null, icon: 'kroket',
    desc: 'Duży brat bitterballen. Holendrzy jedzą go w bułce — „broodje kroket".',
    details: { prep: [['🍟 Frytkownica', '180°C · 4–5 min z zamrożenia'], ['💨 Airfryer', '180°C · 10–12 min z zamrożenia']] } },

  { id: 'kaassouffle-10', cat: 'klasyki', name: 'Kaassoufflé · 10 szt.', price: 6900, unit: '10 × 65 g', badge: 'WEGE', icon: 'kaassouffle',
    desc: 'Chrupiąca kieszonka z płynnym serem Gouda. Wegetariański klasyk frytkowni.',
    details: { prep: [['🍟 Frytkownica', '180°C · 3–4 min z zamrożenia'], ['💨 Airfryer', '180°C · 8–9 min z zamrożenia'], ['🔥 Piekarnik', '200°C · 12 min']] } },

  { id: 'bamischijf-8', cat: 'klasyki', name: 'Bamischijf · 8 szt.', price: 5900, unit: '8 × 90 g', badge: null, icon: 'bamischijf',
    desc: 'Smażony krążek z indonezyjskim makaronem bami — holendersko-azjatycka fuzja.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4 min z zamrożenia'], ['💨 Airfryer', '180°C · 10 min z zamrożenia']] } },

  { id: 'mexicano-8', cat: 'klasyki', name: 'Mexicano · 8 szt.', price: 6200, unit: '8 × 100 g', badge: 'OSTRE', icon: 'mexicano',
    desc: 'Pikantny, płaski kotlet z charakterem. Dla tych, którym frikandel to za mało.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4–5 min z zamrożenia'], ['💨 Airfryer', '180°C · 10–12 min z zamrożenia']] } },

  // ---- Sosy ----
  { id: 'sos-curry-900', cat: 'sosy', name: 'Oliehoorn Sos curry · 900 ml', price: 3400, unit: 'butelka 900 ml', badge: 'DO SPECIAAL', icon: 'saus', img: 'sos-curry.webp',
    desc: 'Korzenny, lekko słodki sos curry — fundament frikandel speciaal. Tradycyjna receptura z Hoorn, praktyczna butelka z dozownikiem.',
    details: {
      ingredients: 'Woda, cukier, skrobia modyfikowana kukurydziana, koncentrat pomidorowy, ocet, sól, zioła i przyprawy (zawiera GORCZYCĘ), barwnik (karmel), substancja konserwująca (sorbinian potasu), naturalny aromat.',
      allergens: 'Gorczyca',
      nutrition: [['Energia', '655 kJ / 154 kcal'], ['Tłuszcz', '0,1 g'], ['— w tym kwasy nasycone', '0 g'], ['Węglowodany', '37,7 g'], ['— w tym cukry', '32,7 g'], ['Białko', '0,3 g'], ['Sól', '1,4 g']],
      storage: 'Po otwarciu przechowywać w lodówce (4–20°C).' } },

  { id: 'majonez-900', cat: 'sosy', name: 'Oliehoorn Majonez 80% · 900 ml', price: 3900, unit: 'butelka 900 ml', badge: null, icon: 'saus', img: 'majonez.webp',
    desc: 'Klasyczny, pełny majonez 80% według autentycznej receptury. W Holandii frytki je się z majonezem — kropka.',
    details: {
      ingredients: '78% olej rzepakowy, woda, 6% żółtko JAJ z chowu ściółkowego, cukier, ocet, MUSZTARDA (woda, nasiona GORCZYCY, ocet, sól, cukier, przyprawy), sól, substancja konserwująca (sorbinian potasu), regulator kwasowości (kwas cytrynowy), substancja zagęszczająca (guma ksantanowa), barwnik (beta-karoten), przeciwutleniacz (E385).',
      allergens: 'Jaja, gorczyca',
      nutrition: [['Energia', '3023 kJ / 735 kcal'], ['Tłuszcz', '79,9 g'], ['— w tym kwasy nasycone', '6,5 g'], ['Węglowodany', '2,6 g'], ['— w tym cukry', '2,5 g'], ['Białko', '1,1 g'], ['Sól', '0,9 g']],
      storage: 'Po otwarciu przechowywać w lodówce (4–20°C).' } },

  { id: 'fritessaus-750', cat: 'sosy', name: 'Fritessaus · 750 ml', price: 2900, unit: '750 ml', badge: null, icon: 'saus',
    desc: 'NIE mylić z majonezem! Lżejszy, słodszy — jedyny słuszny sos do frytek w NL.',
    details: { storage: 'Po otwarciu przechowywać w lodówce.' } },

  { id: 'joppiesaus-500', cat: 'sosy', name: 'Joppiesaus · 500 ml', price: 2700, unit: '500 ml', badge: 'KULTOWY', icon: 'saus',
    desc: 'Kultowy żółty sos z nutą curry i cebuli. Receptura owiana tajemnicą.',
    details: { storage: 'Po otwarciu przechowywać w lodówce.' } },

  // ---- Boxy ----
  { id: 'box-speciaal', cat: 'boxy', name: 'Box „Speciaal"', price: 16900, unit: 'zestaw', badge: 'POLECAMY', icon: 'box',
    desc: '40 frikandeli + sos curry Oliehoorn + majonez Oliehoorn + suszona cebulka. Wszystko do frikandel speciaal w domu.',
    details: { prep: FRIKANDEL_PREP } },

  { id: 'box-party', cat: 'boxy', name: 'Party Box · 60 szt.', price: 24900, unit: '60 szt. + 2 sosy', badge: 'NAJLEPSZA CENA', icon: 'box',
    desc: '20 bitterballen, 20 frikandeli, 10 kroketów, 10 kaassoufflé + 2 sosy. Impreza po holendersku.',
    details: { prep: [['💨 Airfryer / 🍟 Frytkownica', '180°C · patrz czasy przy poszczególnych produktach']] } },

  { id: 'box-proba', cat: 'boxy', name: 'Box „Pierwszy raz"', price: 9900, unit: '24 szt. + sos', badge: 'DLA NOWYCH', icon: 'box',
    desc: 'Po 4 sztuki każdego klasyka + mały fritessaus. Poznaj wszystkie smaki bez zobowiązań.',
    details: { prep: [['💨 Airfryer / 🍟 Frytkownica', '180°C · patrz czasy przy poszczególnych produktach']] } },

  // ---- Olej & sprzęt ----
  { id: 'olej-oersterk-10l', cat: 'sprzet', name: 'Oliehoorn Frituur Oersterk · 10 l', price: 18900, unit: 'Bag-in-Box 10 l', badge: 'BEZ OLEJU PALMOWEGO', icon: 'saus', img: 'olej-oersterk-10l.webp',
    desc: 'Profesjonalny olej do frytkownicy o wyjątkowej stabilności i długiej żywotności. Neutralny smak, minimalne pryskanie, złocisty i chrupiący efekt. Higieniczne opakowanie Bag-in-Box z kranikiem.',
    details: {
      ingredients: 'Olej rzepakowy, olej słonecznikowy wysokooleinowy, substancja przeciwpieniąca: E900, aromat. Bez oleju palmowego.',
      allergens: 'Brak',
      nutrition: [['Energia', '3404 kJ / 828 kcal'], ['Tłuszcz', '92 g'], ['— w tym kwasy nasycone', '7 g'], ['Węglowodany', '0 g'], ['Białko', '0 g'], ['Sól', '0 g']],
      storage: 'Przechowywać w 4–20°C, z dala od światła.' } },

  { id: 'frytkownica-8l', cat: 'sprzet', name: 'Frytkownica profesjonalna 8 l', price: 64900, unit: '3500 W · stal nierdzewna', badge: 'HORECA', icon: 'box', img: 'frytkownica-8l-front.webp', img2: 'frytkownica-8l-bok.webp',
    desc: 'Solidna frytkownica ze stali nierdzewnej 18/0 z zimną strefą chroniącą jakość oleju. Wyjmowana misa i element grzewczy — łatwe czyszczenie. Kosz z ekstra długim uchwytem, w zestawie pokrywa.',
    details: { specs: [
      ['Pojemność', '8 l'],
      ['Moc', '3500 W · 230 V (wtyczka w zestawie)'],
      ['Temperatura', 'regulowana 50–190°C, lampka kontrolna'],
      ['Zabezpieczenia', 'termostat maksymalny z resetem, wyłączanie przy wyjęciu elementu'],
      ['Czyszczenie', 'wyjmowana misa i element grzewczy'],
      ['Zimna strefa', 'tak — dłuższa żywotność oleju'],
      ['W zestawie', 'kosz z długim uchwytem, pokrywa'],
      ['Wymiary', '26,5 × 43 × 34,5 cm'],
      ['Materiał', 'stal nierdzewna 18/0']
    ] } },

  { id: 'frytkownica-4l', cat: 'sprzet', name: 'Frytkownica kompakt 4 l', price: 39900, unit: '2200 W · stal nierdzewna', badge: null, icon: 'box',
    desc: 'Mniejsza siostra modelu 8 l — dla domowej frytkowni na 2–4 osoby. Regulacja do 190°C, wyjmowana misa, kosz i pokrywa w zestawie.',
    details: { specs: [['Pojemność', '4 l'], ['Moc', '2200 W · 230 V'], ['Temperatura', 'regulowana do 190°C'], ['Czyszczenie', 'wyjmowana misa'], ['W zestawie', 'kosz, pokrywa']] } },

  { id: 'airfryer-55', cat: 'sprzet', name: 'Airfryer 5,5 l', price: 34900, unit: '1700 W · cyfrowy panel', badge: 'BEZ OLEJU', icon: 'box',
    desc: 'Frikandel bez kropli oleju? Airfryer 5,5 l z cyfrowym panelem i 8 programami. Kosz na całą blachę przekąsek dla rodziny.',
    details: { specs: [['Pojemność', '5,5 l'], ['Moc', '1700 W'], ['Temperatura', '80–200°C'], ['Programy', '8 + timer 60 min'], ['Kosz', 'nieprzywierający, do mycia w zmywarce']] } },

  { id: 'airfryer-9-dual', cat: 'sprzet', name: 'Airfryer XL Dual 9 l', price: 54900, unit: '2 × 4,5 l · 2600 W', badge: 'DLA RODZINY', icon: 'box',
    desc: 'Dwie niezależne komory: w jednej frikandele, w drugiej frytki — gotowe w tym samym momencie dzięki funkcji synchronizacji.',
    details: { specs: [['Pojemność', '2 × 4,5 l'], ['Moc', '2600 W'], ['Temperatura', '80–200°C na komorę'], ['Funkcje', 'sync finish, match cook, timer'], ['Kosze', 'nieprzywierające, do mycia w zmywarce']] } }
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
const emailedSessions = new Set();

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
                  <p>📦 Mrożonki wysyłamy w termoboxie z suchym lodem — kurier dostarczy paczkę w 24–48 h. Produkty włóż od razu do zamrażarki.</p>
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
