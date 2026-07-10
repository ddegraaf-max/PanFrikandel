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
  // ---- Frikandele & klasyki ----
  { id: 'frikandel-40', top: true, cat: 'klasyki', name: 'Frikandel · 40 szt.', price: 12900, unit: '40 × 85 g (3400 g)', badge: 'BESTSELLER', icon: 'frikandel', img: 'frikandel-karton.webp', img2: 'frikandel.webp',
    desc: 'Legenda holenderskiej frytkowni w kartonie horeca. 40 sztuk po 85 g — zapas na długo.',
    details: { prep: FRIKANDEL_PREP, ingredients: FRIKANDEL_INGREDIENTS, allergens: 'Gluten (pszenica)', nutrition: FRIKANDEL_NUTRITION,
      storage: 'Produkt głęboko mrożony (-18°C). Po rozmrożeniu nie zamrażać ponownie. W lodówce (+4°C): 48 h.' } },

  { id: 'frikandel-kingsize-40', top: true, cat: 'klasyki', name: 'Frikandel Kingsize · 40 szt.', price: 14900, unit: '40 × 100 g (4000 g)', badge: 'XXL', icon: 'frikandel', img: 'frikandel-kingsize-karton.webp', img2: 'frikandel.webp',
    desc: 'Ekstra duży frikandel 100 g. Idealna baza pod frikandel speciaal — z sosem curry, majonezem i cebulką.',
    details: { prep: FRIKANDEL_PREP, ingredients: FRIKANDEL_INGREDIENTS, allergens: 'Gluten (pszenica)', nutrition: FRIKANDEL_NUTRITION,
      storage: 'Produkt głęboko mrożony (-18°C). Po rozmrożeniu nie zamrażać ponownie. W lodówce (+4°C): 48 h.' } },

  { id: 'frikandel-halal-40', cat: 'klasyki', name: 'Frikadel halal · 40 szt.', price: 13900, unit: '40 × 85 g (3400 g)', badge: 'HALAL', icon: 'frikandel', img: 'frikandel-halal-karton.webp',
    desc: 'Frikadel z certyfikatem halal (Halal Certification Authority Netherlands) od De Vries Snacks — pioniera frikandela na holenderskim rynku.',
    details: {
      prep: [
        ['🍟 Frytkownica', '180°C · 5 min z zamrożenia (3 min po rozmrożeniu)'],
        ['🔥 Piekarnik', '225°C · 7,5–8 min z zamrożenia (4 min po rozmrożeniu)'],
        ['💨 Airfryer', '180°C · ok. 9–10 min z zamrożenia']
      ],
      ingredients: '51% mięso oddzielone mechanicznie z kurczaka, kolagen z kurczaka, bułka tarta (PSZENICA), woda, tłuszcz z kurczaka, 4% wołowina, hydrolizat białka roślinnego (SOJA), sól, cebula, zioła, przyprawy, stabilizatory: E450, E451, E452, cukier, wzmacniacz smaku: E621, przeciwutleniacze: E301, E331, ekstrakt drożdżowy, aromat, olej słonecznikowy.',
      allergens: 'Gluten (pszenica), soja',
      nutrition: [['Energia', '767 kJ / 184 kcal'], ['Tłuszcz', '13 g'], ['— w tym kwasy nasycone', '3,9 g'], ['Węglowodany', '8,9 g'], ['— w tym cukry', '0,5 g'], ['Białko', '12 g'], ['Sól', '2 g']],
      storage: 'Przechowywać w -18°C. Po wyjęciu z zamrażarki: 48 h w lodówce (maks. 7°C). Nie rozmrażać w opakowaniu.' } },

  { id: 'frikandel-bezglutenowy', cat: 'klasyki', name: 'Frikandel bezglutenowy', price: 3900, unit: 'tacka 5 × 70 g', badge: 'BEZ GLUTENU', icon: 'frikandel', img: 'frikandel-bezglutenowy.webp',
    desc: 'Klasyczny smak i struktura frikandela — bez glutenu. Idealny dla osób z celiakią lub nietolerancją glutenu. Sprawdzi się też na grillu.',
    details: {
      prep: [['🍳 Patelnia', 'na średnim ogniu, regularnie obracać'], ['🍟 Frytkownica', '180°C · ok. 4 min z zamrożenia'], ['🔥 Grill / BBQ', 'na umiarkowanym żarze, często obracać']],
      ingredients: '72% mięso oddzielone mechanicznie z kurczaka, skrobia ziemniaczana, tłuszcz wołowy, woda, 2% wołowina, sól, bulion (hydrolizowane białko (SOJA, kukurydza), sól, ekstrakt przypraw), kolagen wołowy, cebula w proszku, zioła, przyprawy, wzmacniacz smaku: E621, stabilizatory: E450/E452, przeciwutleniacz: E300, aromat.',
      allergens: 'Soja (bez glutenu)',
      nutrition: [['Energia', '1106 kJ / 264 kcal'], ['Tłuszcz', '20 g'], ['— w tym kwasy nasycone', '8 g'], ['Węglowodany', '7 g'], ['— w tym cukry', '0 g'], ['Białko', '12 g'], ['Sól', '2,3 g']],
      storage: 'Przechowywać w -18°C.' } },

  { id: 'mora-frikandel-vege', cat: 'klasyki', name: 'Mora Frikandel wegetariański · 20 szt.', price: 10900, unit: '20 × 70 g', badge: 'WEGE · PROMOCJA', icon: 'frikandel',
    desc: 'Wegetariański frikandel od Mora — ten sam kształt, ta sama przyprawowa dusza, zero mięsa. Także dla mięsożerców trudny do odróżnienia.',
    details: { prep: [['🍟 Frytkownica', '180°C · 3–4 min z zamrożenia'], ['💨 Airfryer', '180°C · 8–9 min z zamrożenia'], ['🔥 Piekarnik', '200°C · 12 min']] } },

  { id: 'vanreusel-xxl-250', top: true, cat: 'klasyki', name: 'Vanreusel Frikandel XXL · 250 g', price: 15900, unit: '10 × 250 g (2500 g)', badge: 'ĆWIERĆ KILO', icon: 'frikandel',
    desc: 'Frikandel ważący ćwierć kilograma. Belgijska odpowiedź na pytanie, którego nikt nie zadał — a jednak wszyscy chcą spróbować. Jeden = pełny obiad.',
    details: { prep: [['🍟 Frytkownica', '180°C · 6–7 min z zamrożenia'], ['💨 Airfryer', '180°C · 13–15 min z zamrożenia, obrócić w połowie'], ['🔥 Piekarnik', '200°C · 18–20 min']] } },

  { id: 'vanreusel-best-bite', cat: 'klasyki', name: 'Vanreusel Best Bite · 100 g', price: 13900, unit: '40 × 100 g', badge: 'BELGIJSKI PREMIUM', icon: 'frikandel',
    desc: 'Flagowy frikandel belgijskiej marki Vanreusel — delikatniejsza struktura i pełniejsze przyprawienie. Belgia vs Holandia: oceń sam.',
    details: { prep: FRIKANDEL_PREP } },

  { id: 'van-lieshout-goudfrik', cat: 'klasyki', name: 'Van Lieshout Goudfrik · 100 g', price: 13900, unit: '40 × 100 g', badge: null, icon: 'frikandel',
    desc: 'Złota wersja frikandela od Van Lieshout — rodzinnej firmy, która smaży frikandele od pokoleń. Cięższy, bardziej mięsny profil.',
    details: { prep: FRIKANDEL_PREP } },

  { id: 'beckers-original', cat: 'klasyki', name: 'Beckers Frikandel Original · 85 g', price: 12900, unit: '40 × 85 g', badge: 'KLASYK Z LIMBURGII', icon: 'frikandel',
    desc: 'Beckers z Limburgii to jedna z najstarszych marek frikandeli w Holandii — receptura Original niezmienna od dekad.',
    details: { prep: FRIKANDEL_PREP } },

  { id: 'kaassouffle-10', top: true, cat: 'klasyki', name: 'Souflesse Kaassoufflé · 10 szt.', price: 6900, unit: '10 × 75 g', badge: 'WEGE', icon: 'kaassouffle',
    desc: 'Chrupiąca kieszonka z płynnym serem od Souflesse — holenderskiego specjalisty od soufflé. Wegetariański klasyk frytkowni.',
    details: { prep: [['🍟 Frytkownica', '180°C · 3–4 min z zamrożenia'], ['💨 Airfryer', '180°C · 8–9 min z zamrożenia'], ['🔥 Piekarnik', '200°C · 12 min']] } },

  { id: 'van-dobben-kaassouffle', cat: 'klasyki', name: 'Van Dobben Kaassoufflé · 10 szt.', price: 8900, unit: '10 × 75 g', badge: 'PREMIUM · WEGE', icon: 'kaassouffle',
    desc: 'Kaassoufflé od kultowego Van Dobben — więcej sera, cieńsze ciasto, amsterdamska klasa.',
    details: { prep: [['🍟 Frytkownica', '180°C · 3–4 min z zamrożenia'], ['💨 Airfryer', '180°C · 8–9 min z zamrożenia']] } },

  { id: 'souflesse-mini', cat: 'klasyki', name: 'Souflesse Kaassoufflé mini · 30 szt.', price: 7900, unit: '30 × 25 g', badge: 'NA IMPREZY · WEGE', icon: 'kaassouffle',
    desc: 'Miniaturowe soufflé serowe na jeden kęs — obok bitterballen obowiązkowy punkt każdej holenderskiej deski przekąsek.',
    details: { prep: [['🍟 Frytkownica', '180°C · 2,5–3 min z zamrożenia'], ['💨 Airfryer', '180°C · 6–7 min z zamrożenia']] } },

  { id: 'souflesse-tomaat-mozzarella', cat: 'klasyki', name: 'Souflesse Kaassoufflé pomidor-mozzarella · 10 szt.', price: 7900, unit: '10 × 75 g', badge: 'WEGE', icon: 'kaassouffle',
    desc: 'Włoski akcent w holenderskim soufflé: mozzarella z pomidorami w chrupiącym cieście. Caprese z frytkownicy.',
    details: { prep: [['🍟 Frytkownica', '180°C · 3–4 min z zamrożenia'], ['💨 Airfryer', '180°C · 8–9 min z zamrożenia']] } },

  { id: 'souflesse-ham-kaas', cat: 'klasyki', name: 'Souflesse Kaassoufflé szynka-ser · 10 szt.', price: 7900, unit: '10 × 75 g', badge: null, icon: 'kaassouffle',
    desc: 'Klasyczne duo szynki i sera w wersji soufflé — tost hawajski bez ananasa, za to z chrupiącą skorupką.',
    details: { prep: [['🍟 Frytkownica', '180°C · 3–4 min z zamrożenia'], ['💨 Airfryer', '180°C · 8–9 min z zamrożenia']] } },

  { id: 'borrelmaatjes-kaas', cat: 'klasyki', name: 'Borrelmaatjes serowe · 48 szt.', price: 13900, unit: '48 × 23,5 g', badge: 'PROMOCJA · WEGE', icon: 'kaassouffle',
    desc: 'Serowe kąski „borrelmaatjes" od Ad van Geloven — 48 sztuk w kartonie, czyli holenderska impreza w wersji instant.',
    details: { prep: [['🍟 Frytkownica', '180°C · 3 min z zamrożenia'], ['💨 Airfryer', '180°C · 7 min z zamrożenia']] } },

  { id: 'bamischijf-8', cat: 'klasyki', name: 'Elite Bamischijf · 8 szt.', price: 6900, unit: '8 × 130 g', badge: null, icon: 'bamischijf',
    desc: 'Smażony krążek z indonezyjskim makaronem bami od Elite — specjalisty od tej holendersko-azjatyckiej fuzji. Solidne 130 g.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4–5 min z zamrożenia'], ['💨 Airfryer', '180°C · 10–11 min z zamrożenia']] } },

  { id: 'elite-bamischijf-pittig', cat: 'klasyki', name: 'Elite Bamischijf extra ostry · 8 szt.', price: 6900, unit: '8 × 130 g', badge: 'BARDZO OSTRE', icon: 'bamischijf',
    desc: 'Ta sama bami-klasyka, ale z porządnym kopem sambala. Dla tych, którym zwykły bamischijf to za mało ognia.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4–5 min z zamrożenia'], ['💨 Airfryer', '180°C · 10–11 min z zamrożenia']] } },

  { id: 'elite-bamischijf-vege', cat: 'klasyki', name: 'Elite Bamischijf wegetariański · 8 szt.', price: 6900, unit: '8 × 130 g', badge: 'WEGE', icon: 'bamischijf',
    desc: 'Bamischijf w wersji w pełni wegetariańskiej — makaron, warzywa i indonezyjskie przyprawy, zero mięsa.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4–5 min z zamrożenia'], ['💨 Airfryer', '180°C · 10–11 min z zamrożenia']] } },

  { id: 'welten-bami-mini', cat: 'klasyki', name: 'Welten Bamischijf mini oriental', price: 7900, unit: '30 szt. mini', badge: 'NA IMPREZY', icon: 'bamischijf',
    desc: 'Miniaturowe krążki bami na jeden kęs — orientalny akcent na desce przekąsek obok bitterballen i mini soufflé.',
    details: { prep: [['🍟 Frytkownica', '180°C · 3 min z zamrożenia'], ['💨 Airfryer', '180°C · 7–8 min z zamrożenia']] } },

  { id: 'elite-nasischijf', cat: 'klasyki', name: 'Elite Nasischijf · 8 szt.', price: 6900, unit: '8 × 130 g', badge: null, icon: 'bamischijf',
    desc: 'Brat bamischijfa: smażony krążek z indonezyjskim ryżem nasi goreng zamiast makaronu. Druga połowa holendersko-indonezyjskiego duetu.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4–5 min z zamrożenia'], ['💨 Airfryer', '180°C · 10–11 min z zamrożenia']] } },

  { id: 'elite-nasischijf-pittig-vega', cat: 'klasyki', name: 'Elite Nasischijf extra ostry wege · 8 szt.', price: 6900, unit: '8 × 130 g', badge: 'BARDZO OSTRE · WEGE', icon: 'bamischijf',
    desc: 'Nasischijf z podwójną dawką sambala i w pełni roślinny — najostrzejszy wegetariański snack w naszej frytkowni.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4–5 min z zamrożenia'], ['💨 Airfryer', '180°C · 10–11 min z zamrożenia']] } },

  { id: 'mexicano-8', cat: 'klasyki', name: 'De Vries Mexicano · 8 szt.', price: 6900, unit: '8 × 135 g', badge: 'OSTRE', icon: 'mexicano',
    desc: 'Pikantny, płaski kotlet z charakterem od De Vries — twórcy oryginału. Dla tych, którym frikandel to za mało.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4–5 min z zamrożenia'], ['💨 Airfryer', '180°C · 10–12 min z zamrożenia']] } },

  { id: 'de-vries-super-mexicano-xxl', cat: 'klasyki', name: 'De Vries Super Mexicano XXL · 245 g', price: 14900, unit: '10 × 245 g', badge: 'ĆWIERĆ KILO', icon: 'mexicano',
    desc: 'Mexicano w rozmiarze ćwierć kilograma — pikantny kolos do pary z naszym frikandelem XXL. Jeden = obiad z kopem.',
    details: { prep: [['🍟 Frytkownica', '180°C · 6–7 min z zamrożenia'], ['💨 Airfryer', '180°C · 13–15 min z zamrożenia, obrócić w połowie']] } },

  { id: 'de-vries-mexicano-mini', cat: 'klasyki', name: 'De Vries Mexicano mini · 30 g', price: 8900, unit: '30 szt. × 30 g', badge: 'OSTRE · NA IMPREZY', icon: 'mexicano',
    desc: 'Mini mexicano na jeden kęs — pikantny element deski przekąsek dla gości, którzy lubią ogień.',
    details: { prep: [['🍟 Frytkownica', '180°C · 3 min z zamrożenia'], ['💨 Airfryer', '180°C · 7–8 min z zamrożenia']] } },

  { id: 'de-vries-mexicano-halal', cat: 'klasyki', name: 'De Vries Mexicano halal · 8 szt.', price: 7900, unit: '8 × 135 g', badge: 'HALAL · OSTRE', icon: 'mexicano',
    desc: 'Pełnoprawny mexicano z wołowiny i kurczaka, z certyfikatem halal — pikantna klasyka dostępna dla każdego.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4–5 min z zamrożenia'], ['💨 Airfryer', '180°C · 10–12 min z zamrożenia']] } },

  // ---- Bitterballen & krokiety ----
  { id: 'bitterbal-20-100', top: true, cat: 'bitterballen', name: 'Bitterballen 20% · ok. 100 szt.', price: 9900, unit: 'ok. 100 × 20 g (2000 g)', badge: 'KARTON HORECA', icon: 'bitterbal', img: 'bitterbal-20-karton.webp',
    desc: 'Klasyczne bitterballen z 20% wypełnieniem mięsnym (uwaga: mięso końskie — tradycyjna holenderska receptura) o bogatym, pełnym smaku. Karton na dużą imprezę.',
    details: {
      prep: [['🍟 Frytkownica', '180°C · 4 min z zamrożenia (3 min po rozmrożeniu) · maks. 10 szt. naraz'], ['💨 Airfryer', '180°C · 9–10 min z zamrożenia']],
      ingredients: 'Woda, mięso końskie 29%*, bułka tarta (mąka PSZENNA, mąka PSZENNA pełnoziarnista, olej słonecznikowy, drożdże, sól, woda, otręby PSZENNE, cukier, siemię lniane, margaryna, ekstrakt słodowy (zawiera JĘCZMIEŃ)), panier (woda, mąka PSZENNA, skrobia PSZENNA, sól), mąka PSZENNA, oleje roślinne (palmowy, rzepakowy), hydrolizat białka SOJOWEGO, żelatyna wołowa, sól, substancje zagęszczające: E464, E466, przyprawy, aromat (zawiera PSZENICĘ, SOJĘ), wzmacniacze smaku: E621, E631, błonnik PSZENNY, maltodekstryna. *odpowiada 20% gotowanego mięsa końskiego.',
      allergens: 'Gluten (pszenica, jęczmień), soja',
      nutrition: [['Energia', '721 kJ / 172 kcal'], ['Tłuszcz', '7,2 g'], ['— w tym kwasy nasycone', '3,4 g'], ['Węglowodany', '18 g'], ['— w tym cukry', '2,4 g'], ['Błonnik', '1,6 g'], ['Białko', '8,5 g'], ['Sól', '1,1 g']],
      storage: 'Produkt głęboko mrożony (-18°C). Po rozmrożeniu nie zamrażać ponownie. W lodówce (+4°C): 48 h.' } },

  { id: 'kwekkeboom-oven-bitterballen', top: true, cat: 'bitterballen', name: 'Kwekkeboom Bitterballen wołowe do piekarnika · 50 szt.', price: 10900, unit: '2 × 25 szt. × 25 g', badge: 'PIEKARNIK / AIRFRYER', icon: 'bitterbal', img: 'kwekkeboom-bitterballen-karton.webp',
    desc: 'Legendarna amsterdamska marka od 1900 r. Chrupiąca skorupka, kremowe wnętrze z wołowiną — bez frytkownicy, prosto z piekarnika lub airfryera.',
    details: {
      prep: [['🔥 Piekarnik', '220°C · 8 min z zamrożenia (nie rozmrażać!), po upieczeniu odczekać min. 2 min'], ['💨 Airfryer', '200°C · ok. 7–8 min z zamrożenia']],
      ingredients: 'Woda, MĄKA PSZENNA, 14% gotowana wołowina, olej roślinny (rzepakowy, palmowy), 2% śmietanka (MLEKO), sól, białko SOJOWE, aromat (zawiera SOJĘ, SELER), substancje zagęszczające (polidekstroza, E415, E461), skrobia (zawiera PSZENICĘ), stabilizator (E466), mąka SOJOWA, żelatyna (wołowa), zioła i przyprawy (zawiera SELER), skrobia modyfikowana, barwniki (E160b, karmel), białko JAJ kurzych, ekstrakt drożdżowy, błonnik (ziemniaczany, bambusowy, cytrusowy, inulina), SOJA, substancja konserwująca (E223 — zawiera SIARCZYNY), glukoza, maltodekstryna, hydrolizowane białko kukurydziane, suszona cebula, białko MLEKA, kwas mlekowy, palony cukier, syrop z palonego cukru, przeciwutleniacz (ekstrakt z rozmarynu). Wyprodukowano w zakładzie przetwarzającym orzeszki ziemne.',
      allergens: 'Gluten, jaja, mleko, seler, soja, siarczyny · może zawierać orzeszki ziemne',
      nutrition: [['Energia', '1122 kJ / 268 kcal'], ['Tłuszcz', '15,8 g'], ['— w tym kwasy nasycone', '4,4 g'], ['Węglowodany', '23,1 g'], ['— w tym cukry', '2,2 g'], ['Białko', '8,3 g'], ['Sól', '1,3 g']],
      storage: 'Przechowywać w -18°C. Nie rozmrażać przed przygotowaniem.' } },

  { id: 'kwekkeboom-bitterbal-30', cat: 'bitterballen', name: 'Kwekkeboom Bitterbal wołowy · 30 g', price: 11900, unit: '30 szt. × 30 g', badge: null, icon: 'bitterbal',
    desc: 'Duży bitterbal 30 g z bogatym wołowym ragù — wersja klasyczna do frytkownicy. Obowiązkowy z musztardą przy piwie.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4 min z zamrożenia'], ['💨 Airfryer', '180°C · 9–11 min z zamrożenia']] } },

  { id: 'old-amsterdam-bitterballen', cat: 'bitterballen', name: 'Kwekkeboom Bitterballen Old Amsterdam · 25 g', price: 12900, unit: '40 szt. × 25 g · piekarnik', badge: 'SEROWE', icon: 'bitterbal',
    desc: 'Bitterballen z dojrzewającym serem Old Amsterdam — wytrawne, pełne umami. Wersja do piekarnika i airfryera.',
    details: { prep: [['🔥 Piekarnik', '220°C · 8 min z zamrożenia'], ['💨 Airfryer', '200°C · 7–8 min z zamrożenia']] } },

  { id: 'van-dobben-bitterbal', top: true, cat: 'bitterballen', name: 'Van Dobben Bitterbal wołowy · 30 g', price: 11900, unit: '30 szt. × 30 g', badge: 'IKONA AMSTERDAMU', icon: 'bitterbal',
    desc: 'Van Dobben to bitterbal, po który amsterdamczycy stoją w kolejce od 1945 roku. Kremowe wołowe ragù w cienkiej, chrupiącej panierce — punkt odniesienia dla całej kategorii.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4 min z zamrożenia · maks. 10 szt. naraz'], ['💨 Airfryer', '180°C · 9–10 min z zamrożenia']] } },

  { id: 'bourgondier-bitterbal-35', cat: 'bitterballen', name: 'De Bourgondiër Bitterbal wołowy · 35 g', price: 10900, unit: '30 szt. × 35 g', badge: null, icon: 'bitterbal',
    desc: 'Większy, rustykalny bitterbal 35 g w burgundzkim stylu — więcej nadzienia, więcej przyjemności.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4–5 min z zamrożenia'], ['💨 Airfryer', '180°C · 10 min z zamrożenia']] } },

  { id: 'rotterdamse-bitterbal', cat: 'bitterballen', name: 'Rotterdamse Bitterbal · 60 szt.', price: 8900, unit: '60 szt. × 30 g', badge: 'PROMOCJA', icon: 'bitterbal',
    desc: 'Solidny bitterbal z Rotterdamu — bez zadęcia, za to w dużym kartonie w świetnej cenie. Miasto pracy, kulka konkretu.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4 min z zamrożenia · maks. 10 szt. naraz'], ['💨 Airfryer', '180°C · 9–10 min z zamrożenia']] } },

  { id: 'amsterdamse-bitterbal', cat: 'bitterballen', name: 'Amsterdamse Bitterbal wołowy · 50 szt.', price: 15900, unit: '50 szt. × 30 g', badge: 'PROMOCJA', icon: 'bitterbal',
    desc: 'Rzemieślniczy bitterbal od Amsterdamse Croquetten — gęste ragù wołowe według stołecznej tradycji.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4 min z zamrożenia'], ['💨 Airfryer', '180°C · 9–10 min z zamrożenia']] } },

  { id: 'mekkafood-bitterballen-halal', cat: 'bitterballen', name: 'Mekkafood Bitterballen halal', price: 13900, unit: 'karton', badge: 'HALAL', icon: 'bitterbal',
    desc: 'Bitterballen z certyfikatem halal — klasyczny smak holenderskiej frytkowni dostępny dla każdego.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4 min z zamrożenia'], ['💨 Airfryer', '180°C · 9–10 min z zamrożenia']] } },

  { id: 'oma-bobs-draadjesvlees', cat: 'bitterballen', name: 'Oma Bob’s Bitterballen draadjesvlees · 30 g', price: 12900, unit: '30 szt. × 30 g', badge: 'JAK U BABCI', icon: 'bitterbal',
    desc: 'Z długo duszonej, rozpadającej się wołowiny (draadjesvlees) — jak niedzielny obiad u holenderskiej babci, zamknięty w chrupiącej kulce.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4 min z zamrożenia'], ['💨 Airfryer', '180°C · 9–10 min z zamrożenia']] } },

  { id: 'holtkamp-kalfsvlees', cat: 'bitterballen', name: 'Holtkamp Bitterbal cielęcy · 30 g', price: 16900, unit: '30 szt. × 30 g', badge: 'PREMIUM', icon: 'bitterbal',
    desc: 'Holtkamp to legendarna amsterdamska patisserie — ich cielęcy bitterbal serwują najlepsze bary i restauracje w kraju. Klasa mistrzowska.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4 min z zamrożenia · maks. 10 szt. naraz']] } },

  { id: 'holtkamp-garnaal', cat: 'bitterballen', name: 'Holtkamp Bitterbal z krewetkami · 30 g', price: 18900, unit: '30 szt. × 30 g', badge: 'PREMIUM', icon: 'bitterbal',
    desc: 'Bitterbal z holenderskimi krewetkami północnomorskimi — morska elegancja od Holtkamp. Do kieliszka wytrawnego białego wina.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4 min z zamrożenia']] } },

  { id: 'holtkamp-kreeft', cat: 'bitterballen', name: 'Holtkamp Bitterbal z homarem · 30 g', price: 21900, unit: '30 szt. × 30 g', badge: 'LUKSUS', icon: 'bitterbal',
    desc: 'Homar w bitterbalu. Tak, naprawdę. Najbardziej luksusowa kulka Holandii — na specjalne okazje albo po prostu dlatego, że można.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4 min z zamrożenia']] } },

  { id: 'holtkamp-oude-kaas', cat: 'bitterballen', name: 'Holtkamp Bitterbal z serem dojrzewającym · 30 g', price: 15900, unit: '30 szt. × 30 g', badge: 'WEGE', icon: 'bitterbal',
    desc: 'Kremowe wnętrze z dojrzewającego holenderskiego sera — wegetariański bitterbal w wydaniu premium.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4 min z zamrożenia']] } },

  { id: 'la-trappe-bitterbal', top: true, cat: 'bitterballen', name: 'Bitterbal La Trappe Quadrupel · 64 szt.', price: 19900, unit: '64 szt. × 30 g', badge: 'Z PIWEM TRAPISTÓW', icon: 'bitterbal',
    desc: 'Ragù wołowe duszone w piwie trapistów La Trappe Quadrupel (10%). Głęboki, słodowo-karmelowy smak — bitterbal dla koneserów. Idealna para: to samo piwo w szklance.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4 min z zamrożenia'], ['💨 Airfryer', '180°C · 9–10 min z zamrożenia']] } },

  { id: 'mora-bitterbal-vege', cat: 'bitterballen', name: 'Mora Bitterbal wegetariański · 25 g', price: 10900, unit: '54 szt. × 25 g', badge: 'WEGE · PROMOCJA', icon: 'bitterbal',
    desc: 'Wegetariański bitterbal od Mora — największej marki snackowej w Holandii. Duży karton, mała cena.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4 min z zamrożenia'], ['💨 Airfryer', '180°C · 9 min z zamrożenia']] } },

  { id: 'captain-food-vegan', cat: 'bitterballen', name: 'Captain Food Bitterbal vegan · 30 g', price: 11900, unit: '54 szt. × 30 g', badge: 'VEGAN · PROMOCJA', icon: 'bitterbal',
    desc: 'W 100% roślinny bitterbal, który smakuje jak oryginał. Nikt na imprezie nie zauważy różnicy — sprawdzone.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4 min z zamrożenia'], ['💨 Airfryer', '180°C · 9 min z zamrożenia']] } },

  { id: 'oesterzwam-bitterbal', cat: 'bitterballen', name: 'Bitterbal z boczniaków · 30 g (vegan)', price: 13900, unit: '30 szt. × 30 g', badge: 'VEGAN', icon: 'bitterbal',
    desc: 'Roślinny bitterbal na bazie boczniaków z holenderskiej uprawy — mięsista struktura i głębia umami prosto z natury.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4 min z zamrożenia'], ['💨 Airfryer', '180°C · 9 min z zamrożenia']] } },

  { id: 'kwekkeboom-rundvleeskroket', cat: 'bitterballen', name: 'Kwekkeboom Kroket wołowy · 100 g', price: 8900, unit: '10 × 100 g', badge: null, icon: 'kroket',
    desc: 'Pełnowymiarowy kroket wołowy 100 g. Holendrzy jedzą go w bułce — „broodje kroket". Marka premium z Amsterdamu.',
    details: { prep: [['🍟 Frytkownica', '180°C · 5 min z zamrożenia'], ['💨 Airfryer', '180°C · 11–12 min z zamrożenia']] } },

  { id: 'kwekkeboom-kalfsvleeskroket', cat: 'bitterballen', name: 'Kwekkeboom Kroket cielęcy · 90 g', price: 9900, unit: '10 × 90 g', badge: 'PREMIUM', icon: 'kroket',
    desc: 'Najszlachetniejsza wersja kroketa — z delikatną cielęciną. Klasa sama w sobie.',
    details: { prep: [['🍟 Frytkownica', '180°C · 5 min z zamrożenia'], ['💨 Airfryer', '180°C · 11–12 min z zamrożenia']] } },

  { id: 'kwekkeboom-oven-croquetten', cat: 'bitterballen', name: 'Kwekkeboom Krokiety do piekarnika · 70 g', price: 9900, unit: '4 × 5 szt. × 70 g', badge: 'PIEKARNIK / AIRFRYER', icon: 'kroket',
    desc: 'Krokiety, które piecze się zamiast smażyć — chrupiące z piekarnika lub airfryera, bez kropli oleju.',
    details: { prep: [['🔥 Piekarnik', '220°C · ok. 10 min z zamrożenia'], ['💨 Airfryer', '200°C · ok. 9 min z zamrożenia']] } },

  { id: 'old-amsterdam-croquetten', cat: 'bitterballen', name: 'Kwekkeboom Krokiety Old Amsterdam · 60 g', price: 9900, unit: '10 × 60 g · piekarnik', badge: 'SEROWE', icon: 'kroket',
    desc: 'Serowe krokiety z Old Amsterdam do piekarnika — wegetariańska gratka dla fanów sera.',
    details: { prep: [['🔥 Piekarnik', '220°C · ok. 10 min z zamrożenia'], ['💨 Airfryer', '200°C · ok. 9 min z zamrożenia']] } },

  { id: 'kwekkeboom-kaashapjes', cat: 'bitterballen', name: 'Kwekkeboom Kaashapjes · 12 szt.', price: 4900, unit: '12 × 20 g · piekarnik', badge: 'WEGE', icon: 'kaassouffle',
    desc: 'Małe serowe kąski do piekarnika — idealne obok bitterballen na desce przekąsek.',
    details: { prep: [['🔥 Piekarnik', '220°C · ok. 8 min z zamrożenia'], ['💨 Airfryer', '200°C · ok. 7 min z zamrożenia']] } },

  { id: 'rotterdamse-kroket', cat: 'bitterballen', name: 'Rotterdamse Kroket · 24 szt.', price: 9900, unit: '24 × 100 g', badge: 'PROMOCJA', icon: 'kroket',
    desc: 'Solidny kroket z Rotterdamu w dużym kartonie — konkret bez zadęcia, idealny do bułki na drugie śniadanie po holendersku.',
    details: { prep: [['🍟 Frytkownica', '180°C · 5 min z zamrożenia'], ['💨 Airfryer', '180°C · 11–12 min z zamrożenia']] } },

  { id: 'amsterdamse-kroket', cat: 'bitterballen', name: 'Amsterdamse Kroket wołowy · 18 szt.', price: 16900, unit: '18 × 100 g', badge: 'RZEMIEŚLNICZY', icon: 'kroket',
    desc: 'Rzemieślniczy kroket od Amsterdamse Croquetten — gęste, wolno gotowane ragù wołowe. Stołeczna klasa do pary z ich bitterballen.',
    details: { prep: [['🍟 Frytkownica', '180°C · 5 min z zamrożenia'], ['💨 Airfryer', '180°C · 11–12 min z zamrożenia']] } },

  { id: 'mora-kroket-vege', cat: 'bitterballen', name: 'Mora Kroket wegetariański · 21 szt.', price: 13900, unit: '21 × 75 g', badge: 'WEGE · PROMOCJA', icon: 'kroket',
    desc: 'Wegetariański kroket od największej marki snackowej Holandii — kremowe wnętrze bez grama mięsa.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4–5 min z zamrożenia'], ['💨 Airfryer', '180°C · 10–11 min z zamrożenia']] } },

  { id: 'captain-kroket-vegan', cat: 'bitterballen', name: 'Captain Food Kroket vegan · 20 szt.', price: 11900, unit: '20 × 100 g', badge: 'VEGAN · PROMOCJA', icon: 'kroket',
    desc: 'Pełnowymiarowy kroket 100 g w wersji 100% roślinnej. „Broodje kroket" bez kompromisów.',
    details: { prep: [['🍟 Frytkownica', '180°C · 5 min z zamrożenia'], ['💨 Airfryer', '180°C · 11 min z zamrożenia']] } },

  { id: 'cas-mini-kroket-chorizo', cat: 'bitterballen', name: 'Mini kroket chorizo · 30 g', price: 12900, unit: '30 szt. × 30 g', badge: 'HISZPAŃSKI TWIST', icon: 'kroket',
    desc: 'Mini kroket z pikantnym chorizo — holendersko-hiszpańska fuzja na deskę przekąsek. Ostrzejszy kuzyn bitterbala.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4 min z zamrożenia'], ['💨 Airfryer', '180°C · 9 min z zamrożenia']] } },

  { id: 'ambachterie-zeeuws-spek', cat: 'bitterballen', name: 'Kroket z boczkiem zelandzkim · 65 g', price: 11900, unit: '20 × 65 g', badge: 'SPECJALNOŚĆ', icon: 'kroket',
    desc: 'Rzemieślniczy kroket z wędzonym boczkiem z Zelandii (Zeeuws spek) — dymny, głęboki smak od De Ambachterie.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4–5 min z zamrożenia'], ['💨 Airfryer', '180°C · 10 min z zamrożenia']] } },

  // ---- Sosy ----
  { id: 'sos-curry-900', top: true, cat: 'sosy', name: 'Oliehoorn Sos curry · 900 ml', price: 3400, unit: 'butelka 900 ml', badge: 'DO SPECIAAL', icon: 'saus', img: 'sos-curry.webp',
    desc: 'Korzenny, lekko słodki sos curry — fundament frikandel speciaal. Tradycyjna receptura z Hoorn, praktyczna butelka z dozownikiem.',
    details: {
      ingredients: 'Woda, cukier, skrobia modyfikowana kukurydziana, koncentrat pomidorowy, ocet, sól, zioła i przyprawy (zawiera GORCZYCĘ), barwnik (karmel), substancja konserwująca (sorbinian potasu), naturalny aromat.',
      allergens: 'Gorczyca',
      nutrition: [['Energia', '655 kJ / 154 kcal'], ['Tłuszcz', '0,1 g'], ['— w tym kwasy nasycone', '0 g'], ['Węglowodany', '37,7 g'], ['— w tym cukry', '32,7 g'], ['Białko', '0,3 g'], ['Sól', '1,4 g']],
      storage: 'Po otwarciu przechowywać w lodówce (4–20°C).' } },

  { id: 'majonez-900', top: true, cat: 'sosy', name: 'Oliehoorn Majonez 80% · 900 ml', price: 3900, unit: 'butelka 900 ml', badge: null, icon: 'saus', img: 'majonez.webp',
    desc: 'Klasyczny, pełny majonez 80% według autentycznej receptury. W Holandii frytki je się z majonezem — kropka.',
    details: {
      ingredients: '78% olej rzepakowy, woda, 6% żółtko JAJ z chowu ściółkowego, cukier, ocet, MUSZTARDA (woda, nasiona GORCZYCY, ocet, sól, cukier, przyprawy), sól, substancja konserwująca (sorbinian potasu), regulator kwasowości (kwas cytrynowy), substancja zagęszczająca (guma ksantanowa), barwnik (beta-karoten), przeciwutleniacz (E385).',
      allergens: 'Jaja, gorczyca',
      nutrition: [['Energia', '3023 kJ / 735 kcal'], ['Tłuszcz', '79,9 g'], ['— w tym kwasy nasycone', '6,5 g'], ['Węglowodany', '2,6 g'], ['— w tym cukry', '2,5 g'], ['Białko', '1,1 g'], ['Sól', '0,9 g']],
      storage: 'Po otwarciu przechowywać w lodówce (4–20°C).' } },

  { id: 'fritessaus-750', top: true, cat: 'sosy', name: 'Oliehoorn Fritessaus 25% · 900 ml', price: 3400, unit: 'butelka 900 ml', badge: 'HOLENDERSKI KLASYK', icon: 'saus', img: 'fritessaus.webp',
    desc: 'NIE mylić z majonezem! Kremowy, świeży, lekko słodszy — jedyny słuszny sos do frytek w Holandii. 25% oleju, stabilny nawet na ciepłych daniach.',
    details: {
      ingredients: 'Woda, 25% olej rzepakowy, cukier, skrobia PSZENNA, ocet, żółtko JAJ z chowu ściółkowego, sól, MUSZTARDA (woda, nasiona GORCZYCY, ocet, sól, cukier, przyprawy), modyfikowana skrobia ziemniaczana, substancja konserwująca (sorbinian potasu), regulator kwasowości (kwas cytrynowy), substancje zagęszczające (guma guar, guma ksantanowa), barwnik (beta-karoten), przeciwutleniacz (E385), aromat.',
      allergens: 'Gluten (pszenica), jaja, gorczyca',
      nutrition: [['Energia', '1205 kJ / 291 kcal'], ['Tłuszcz', '25,7 g'], ['— w tym kwasy nasycone', '2,1 g'], ['Węglowodany', '14,1 g'], ['— w tym cukry', '8,3 g'], ['Białko', '0,5 g'], ['Sól', '1,8 g']],
      storage: 'Po otwarciu przechowywać w lodówce (4–20°C).' } },

  { id: 'joppiesaus-500', top: true, cat: 'sosy', name: 'Joppie Original · 850 ml', price: 3200, unit: 'butelka 850 ml', badge: 'KULTOWY', icon: 'saus', img: 'joppiesaus.webp',
    desc: 'Kultowy żółty sos z nutą curry i 11% cebuli. Receptura owiana tajemnicą — Holendrzy wylewają go na wszystko, od frytek po kanapki.',
    details: {
      ingredients: 'Woda, olej roślinny (rzepakowy), 11% cebula, cukier, syrop glukozowo-fruktozowy, regulatory kwasowości (kwas octowy, kwas mlekowy, kwas cytrynowy, mleczan sodu), modyfikowana skrobia kukurydziana, żółtko JAJ z chowu ściółkowego, syrop glukozowy, sól, koncentrat pomidorowy, skrobia PSZENNA, skrobia kukurydziana, mąka PSZENNA, substancje konserwujące (E202, E211), substancje zagęszczające (E412, E415), zioła, barwniki (luteina, E150c), błonnik grochowy, przyprawy, substancje słodzące (acesulfam K, aspartam — zawiera źródło fenyloalaniny), aromat, przeciwutleniacze (E385, E392), nasiona GORCZYCY, SELER, skrobia ziemniaczana.',
      allergens: 'Jaja, gluten (pszenica), gorczyca, seler · zawiera źródło fenyloalaniny',
      nutrition: [['Energia', '1272 kJ / 306 kcal'], ['Tłuszcz', '23 g'], ['— w tym kwasy nasycone', '1,8 g'], ['Węglowodany', '24 g'], ['— w tym cukry', '20 g'], ['Białko', '1,1 g'], ['Sól', '1,3 g']],
      storage: 'Po otwarciu przechowywać w lodówce (1–7°C).' } },

  { id: 'wijko-satesaus', cat: 'sosy', name: 'Wijko Sos satay gotowy', price: 2900, unit: 'butelka', badge: 'DO „PATATJE OORLOG"', icon: 'saus',
    desc: 'Gęsty sos orzechowy — standard każdej holenderskiej frytkowni. Podstawa legendarnego „patatje oorlog": frytki + saté + majonez + surowa cebulka.',
    details: { allergens: 'Orzeszki ziemne', storage: 'Po otwarciu przechowywać w lodówce.' } },

  { id: 'calve-satesaus', cat: 'sosy', name: 'Calvé Sos satay indonezyjski', price: 3200, unit: 'słoik', badge: null, icon: 'saus',
    desc: 'Indonezyjski sos satay od Calvé — marki, na której wychowały się pokolenia Holendrów. Do snacków, szaszłyków i oczywiście frytek.',
    details: { allergens: 'Orzeszki ziemne', storage: 'Po otwarciu przechowywać w lodówce.' } },

  { id: 'oliehoorn-ketchup-900', cat: 'sosy', name: 'Oliehoorn Ketchup pomidorowy · 900 ml', price: 2700, unit: 'butelka 900 ml', badge: null, icon: 'saus', img: 'ketchup.webp',
    desc: 'Ketchup z dojrzałych pomidorów — 165 g pomidorów na każde 100 g ketchupu. Pełny, świeży smak, delikatnie przyprawiony. Bez zbędnych dodatków.',
    details: {
      ingredients: 'Woda, koncentrat pomidorowy (165 g pomidorów na 100 g ketchupu), cukier, ocet, modyfikowana skrobia ziemniaczana, sól, regulator kwasowości (kwas cytrynowy), substancja konserwująca (sorbinian potasu), zioła i przyprawy.',
      allergens: 'Brak',
      nutrition: [['Energia', '375 kJ / 88 kcal'], ['Tłuszcz', '0,2 g'], ['— w tym kwasy nasycone', '0,1 g'], ['Węglowodany', '20,2 g'], ['— w tym cukry', '17,5 g'], ['Białko', '1,3 g'], ['Sól', '1,8 g']],
      storage: 'Po otwarciu przechowywać w lodówce (4–20°C).' } },

  { id: 'oliehoorn-musztarda-900', cat: 'sosy', name: 'Oliehoorn Musztarda francuska · 900 ml', price: 2900, unit: 'butelka 900 ml', badge: 'DO BITTERBALLEN', icon: 'saus', img: 'musztarda.webp',
    desc: 'Łagodna, aromatyczna musztarda w stylu francuskim — obowiązkowy towarzysz bitterballen i kroketów. Krótki, uczciwy skład: woda, gorczyca, ocet, sól, cukier, zioła.',
    details: {
      ingredients: 'Woda, nasiona GORCZYCY, ocet, sól, cukier, zioła.',
      allergens: 'Gorczyca',
      nutrition: [['Energia', '428 kJ / 103 kcal'], ['Tłuszcz', '5,8 g'], ['— w tym kwasy nasycone', '0,3 g'], ['Węglowodany', '4,1 g'], ['— w tym cukry', '3,2 g'], ['Białko', '5 g'], ['Sól', '3,8 g']],
      storage: 'Po otwarciu przechowywać w lodówce (4–20°C).' } },

  // ---- Boxy ----
  { id: 'box-niespodzianka', top: true, cat: 'boxy', name: 'Box Niespodzianka', price: 14900, unit: 'min. 40 szt. + sos', badge: 'MY WYBIERAMY', icon: 'box', img: 'box-niespodzianka.webp',
    desc: 'Ty ufasz, my pakujemy: minimum 40 przekąsek-niespodzianek + sos, o wartości zawsze wyższej niż cena boxu. Idealny sposób na odkrycie holenderskich smaków, których sam byś nie wybrał. Podaj w koszyku ewentualne wykluczenia (np. wege, bez ostrych) — uwzględnimy je.',
    details: { prep: [['💨 Airfryer / 🍟 Frytkownica', '180°C · czasy przygotowania znajdziesz przy poszczególnych produktach na stronie']],
      storage: 'Produkty głęboko mrożone (-18°C). Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'box-speciaal', top: true, cat: 'boxy', name: 'Box „Speciaal"', price: 16900, unit: 'zestaw', badge: 'POLECAMY', icon: 'box', img: 'box-speciaal.webp',
    desc: '40 frikandeli + sos curry Oliehoorn + majonez Oliehoorn + suszona cebulka. Wszystko do frikandel speciaal w domu.',
    details: { prep: FRIKANDEL_PREP } },

  { id: 'box-party', top: true, cat: 'boxy', name: 'Party Box · 60 szt.', price: 24900, unit: '60 szt. + 2 sosy', badge: 'NAJLEPSZA CENA', icon: 'box', img: 'box-party.webp',
    desc: '20 bitterballen, 20 frikandeli, 10 kroketów, 10 kaassoufflé + 2 sosy. Impreza po holendersku.',
    details: { prep: [['💨 Airfryer / 🍟 Frytkownica', '180°C · patrz czasy przy poszczególnych produktach']] } },

  { id: 'box-proba', top: true, cat: 'boxy', name: 'Box „Pierwszy raz"', price: 9900, unit: '24 szt. + sos', badge: 'DLA NOWYCH', icon: 'box', img: 'box-proba.webp',
    desc: 'Po 4 sztuki każdego klasyka + mały fritessaus. Poznaj wszystkie smaki bez zobowiązań.',
    details: { prep: [['💨 Airfryer / 🍟 Frytkownica', '180°C · patrz czasy przy poszczególnych produktach']] } },

  // ---- Olej & sprzęt ----
  { id: 'olej-oersterk-10l', top: true, cat: 'sprzet', name: 'Oliehoorn Frituur Oersterk · 10 l', price: 18900, unit: 'Bag-in-Box 10 l', badge: 'BEZ OLEJU PALMOWEGO', icon: 'saus', img: 'olej-oersterk-10l.webp',
    desc: 'Profesjonalny olej do frytkownicy o wyjątkowej stabilności i długiej żywotności. Neutralny smak, minimalne pryskanie, złocisty i chrupiący efekt. Higieniczne opakowanie Bag-in-Box z kranikiem.',
    details: {
      ingredients: 'Olej rzepakowy, olej słonecznikowy wysokooleinowy, substancja przeciwpieniąca: E900, aromat. Bez oleju palmowego.',
      allergens: 'Brak',
      nutrition: [['Energia', '3404 kJ / 828 kcal'], ['Tłuszcz', '92 g'], ['— w tym kwasy nasycone', '7 g'], ['Węglowodany', '0 g'], ['Białko', '0 g'], ['Sól', '0 g']],
      storage: 'Przechowywać w 4–20°C, z dala od światła.' } },

  { id: 'puntzak-friet', cat: 'sprzet', name: 'Puntzak kraft z przegródką na sos · 50 szt.', price: 3900, unit: '50 szt. · 16 × 27 cm · FSC', badge: 'JAK W HOLANDII', icon: 'box', img: 'puntzak.webp', top: true,
    desc: 'Kultowa holenderska „puntzak" — papierowa tutka na frytki z osobną przegródką na sos. Frytki w domu smakują lepiej, gdy wyglądają jak z frytkowni. Kraft z certyfikatem FSC, wytrzymały materiał.',
    details: { specs: [['Wymiary', '16 × 27 cm'], ['Przegródka na sos', 'tak'], ['Materiał', 'karton kraft (bambus), certyfikat FSC'], ['Zastosowanie', 'frytki, snacki, przekąski'], ['Ilość', '50 sztuk']] } },

  { id: 'frytkownica-8l', top: true, cat: 'sprzet', name: 'Frytkownica profesjonalna 8 l', price: 64900, unit: '3500 W · stal nierdzewna', badge: 'HORECA', icon: 'box', img: 'frytkownica-8l-front.webp', img2: 'frytkownica-8l-bok.webp',
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

  { id: 'frytkownica-4l', cat: 'sprzet', name: 'Princess Frytkownica 5 l', price: 29900, unit: '5 l · stal nierdzewna', badge: null, icon: 'box', img: 'princess-friteuse-5l.webp', img2: 'princess-friteuse-5l-frytki.webp',
    desc: 'Domowa frytkownica Princess o pojemności 5 l — duże porcje frytek i przekąsek dla całej rodziny. Stal nierdzewna, regulacja temperatury do 190°C, okienko w pokrywie i lampki kontrolne.',
    details: { specs: [
      ['Pojemność', '5 l — duże porcje'],
      ['Kosz', '1, z zimnym uchwytem'],
      ['Temperatura', 'pokrętło 130–190°C, lampki kontrolne'],
      ['Pokrywa', 'z okienkiem podglądowym'],
      ['Materiał', 'stal nierdzewna']
    ] } },

  { id: 'airfryer-55', top: true, cat: 'sprzet', name: 'Princess Airfryer Slimfry 8 l', price: 44900, unit: '8 l · dotykowy panel · dla 6 osób', badge: 'BEZ OLEJU', icon: 'box', img: 'princess-slimfry-front.webp', img2: 'princess-slimfry-frytki.webp',
    desc: 'Smukły airfryer 8 l od Princess: frytki i przekąski dla 6 osób bez kropli oleju. Cyfrowy ekran dotykowy, 8 gotowych programów, a wąska konstrukcja zajmuje niewiele miejsca na blacie.',
    details: { specs: [
      ['Pojemność', '8 l — dla maks. 6 osób'],
      ['Sterowanie', 'cyfrowy ekran dotykowy'],
      ['Programy', '8 zaprogramowanych ustawień'],
      ['Funkcje', 'smażenie, pieczenie i grillowanie bez tłuszczu'],
      ['Zalety', 'mniej tłuszczu, ograniczone zapachy smażenia'],
      ['Wymiary', '29,4 × 46,5 × 26,7 cm (dł. z uchwytem)'],
      ['Konstrukcja', 'smukła — mało miejsca na blacie']
    ] } },

  { id: 'airfryer-9-dual', cat: 'sprzet', name: 'GreenPan Airfryer Bistro Dual Zone · 2 × 4 l', price: 69900, unit: '2 × 4 l · 3000 W · Sync Air', badge: 'DLA RODZINY', icon: 'box', img: 'greenpan-dual-front.webp', img2: 'greenpan-dual-open.webp',
    desc: 'Dwie niezależne komory po 4 l: w jednej frikandele, w drugiej frytki — dzięki technologii Sync Air oba dania są gotowe w tym samym momencie. Chrupiące comfort food dla maks. 6 osób, w zdrowszym wydaniu.',
    details: { specs: [
      ['Pojemność', '2 × 4 l (razem 8 l) — dla maks. 6 osób'],
      ['System', 'gorące powietrze, technologia Sync Air'],
      ['Moc', '3000 W'],
      ['Temperatura', 'regulowana 80–200°C, zabezpieczenie przed przegrzaniem'],
      ['Obsługa', 'wyświetlacz, timer, automatyczne wyłączanie'],
      ['Kosze', '2, z chłodnymi uchwytami (mycie ręczne)'],
      ['Wymiary', '42 × 37,5 × 32 cm'],
      ['Kolor', 'czarny']
    ] } }
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

// ---- AI Frikandel-assistent (Pan Frikandel) ----
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || null;

const CATALOG_FOR_AI = PRODUCTS.map(p =>
  `${p.id} | ${p.name} | ${zl(p.price)} | ${p.unit} | kat: ${p.cat}${p.badge ? ' | ' + p.badge : ''} | ${p.desc}`
).join('\n');

const ASSISTANT_SYSTEM = `Jesteś "Panem Frikandelem" — sympatycznym asystentem sklepu panfrikandel.pl z holenderskimi przekąskami (dostawa mrożonek kurierem w całej Polsce, 24-48h, darmowa dostawa od 250 zł, wysyłka 49 zł).

Twoje zadanie: pomagasz klientom wybrać przekąski z katalogu poniżej. Doradzasz jak holenderski przyjaciel — konkretnie, ciepło, z humorem, ale krótko (maks. 4-5 zdań + polecenia).

ZASADY:
- Odpowiadasz WYŁĄCZNIE po polsku.
- Polecasz TYLKO produkty z katalogu. Gdy polecasz produkt, wstaw jego ID w podwójnych nawiasach: [[id-produktu]]. Maksymalnie 3-4 polecenia naraz.
- Pytaj o preferencje gdy potrzeba (mięsne/wege, ostre/łagodne, na imprezę/na obiad, piekarnik/frytkownica/airfryer).
- Znasz się na holenderskiej kulturze frytkowni (frikandel speciaal, broodje kroket, patatje oorlog, bitterballen z musztardą przy piwie) i chętnie ją tłumaczysz.
- Nie wymyślasz cen, składników ani produktów spoza katalogu. Przy pytaniach o alergeny odsyłaj do szczegółów produktu na stronie.
- Nie odpowiadasz na pytania niezwiązane ze sklepem — uprzejmie wracasz do tematu przekąsek.

KATALOG:
${CATALOG_FOR_AI}`;

app.post('/api/assistent', async (req, res) => {
  try {
    if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'Asystent nie jest jeszcze skonfigurowany (ANTHROPIC_API_KEY).' });

    let msgs = Array.isArray(req.body.messages) ? req.body.messages : [];
    msgs = msgs.slice(-12).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 1500)
    })).filter(m => m.content);
    if (!msgs.length || msgs[msgs.length - 1].role !== 'user') {
      return res.status(400).json({ error: 'Brak wiadomości.' });
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
        system: ASSISTANT_SYSTEM,
        messages: msgs
      })
    });

    if (!r.ok) {
      console.error('Anthropic API error:', r.status, await r.text());
      return res.status(502).json({ error: 'Asystent chwilowo niedostępny. Spróbuj za moment.' });
    }
    const data = await r.json();
    const reply = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
    res.json({ reply: reply || 'Hmm, spróbuj zapytać inaczej 🍟' });
  } catch (err) {
    console.error('Assistent error:', err.message);
    res.status(500).json({ error: 'Asystent chwilowo niedostępny.' });
  }
});

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
