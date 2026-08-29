// ============================================================
//  PANFRIKANDEL — server.js
//  Holenderskie przekąski · dowozimy sami: Płock + 50 km · PL/EN
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

const ORDER_EMAIL_FROM = process.env.ORDER_EMAIL_FROM || 'PanFrikandel <zamowienia@panfrikandel.pl>';
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

  { id: 'mora-frikandel-vege', cat: 'klasyki', name: 'Mora Frikandel wegetariański · 20 szt.', price: 10900, unit: '20 × 70 g', badge: 'WEGE · PROMOCJA', icon: 'frikandel', img: 'mora-frikandel-vege.webp',
    desc: 'Wegetariański frikandel od Mora — ten sam kształt, ta sama przyprawowa dusza, zero mięsa. Także dla mięsożerców trudny do odróżnienia.',
    details: { prep: [['🍟 Frytkownica', '180°C · 3–4 min z zamrożenia'], ['💨 Airfryer', '180°C · 8–9 min z zamrożenia'], ['🔥 Piekarnik', '200°C · 12 min']],
      ingredients: 'Woda, struktura SOJOWA (woda, białka roślinne (PSZENICA, SOJA), skrobia), oleje roślinne (słonecznikowy, palmowy), białko JAJ w proszku (z chowu na wolnym wybiegu), emulgatory: metyloceluloza, guma ksantanowa i mączka chleba świętojańskiego, cebula, błonnik roślinny (bambusowy, psyllium), sól, gluten PSZENNY, skrobia, naturalne aromaty, barwnik: karmel amoniakalno-siarczynowy, przyprawy, stabilizator: przetworzone wodorosty Eucheuma, dekstroza, syrop glukozowy, ekstrakt drożdżowy, maltodekstryna.',
      allergens: 'Jaja, gluten (pszenica), soja',
      nutrition: [['Energia', '982 kJ / 237 kcal'], ['Tłuszcz', '20 g'], ['— w tym kwasy nasycone', '4,7 g'], ['Węglowodany', '4,4 g'], ['— w tym cukry', '0,6 g'], ['Błonnik', '5 g'], ['Białko', '8,3 g'], ['Sól', '1,8 g']],
      storage: 'Produkt głęboko mrożony (-18°C). Po rozmrożeniu nie zamrażać ponownie. W lodówce: 48 h.' } },

  { id: 'vanreusel-xxl-250', top: true, cat: 'klasyki', name: 'Vanreusel Frikandel XXL · 250 g', price: 15900, unit: '10 × 250 g (2500 g)', badge: 'ĆWIERĆ KILO', icon: 'frikandel', img: 'vanreusel-xxl-250.webp',
    desc: 'Frikandel ważący ćwierć kilograma. Belgijska odpowiedź na pytanie, którego nikt nie zadał — a jednak wszyscy chcą spróbować. Jeden = pełny obiad.',
    details: { prep: [['🍟 Frytkownica', '170°C · 8 min z zamrożenia (4 min po rozmrożeniu)'], ['💨 Airfryer', '200°C · 8 min z zamrożenia (6 min po rozmrożeniu)'], ['🔥 Piekarnik', '200°C · 18–20 min']],
      ingredients: 'Kurczak 57% (mięso oddzielone mechanicznie, kolagen), woda, bułka tarta (mąka PSZENNA, woda, sól, drożdże), tłuszcz wołowy 9%, sól, skrobia PSZENNA, hydrolizat białka SOJOWEGO, cebula w proszku, suszone warzywa (cebula), przyprawy, emulgatory: E450, E452, wzmacniacz smaku: E621, przeciwutleniacz: E316, regulator kwasowości: E330.',
      allergens: 'Gluten (pszenica), soja · może zawierać jaja i mleko',
      nutrition: [['Energia', '1005 kJ / 241 kcal'], ['Tłuszcz', '16 g'], ['— w tym kwasy nasycone', '6,5 g'], ['Węglowodany', '11 g'], ['— w tym cukry', '1 g'], ['Białko', '12 g'], ['Sól', '2,1 g']],
      storage: 'Produkt głęboko mrożony (-18°C). Po rozmrożeniu nie zamrażać ponownie. W lodówce: 48 h.' } },

  { id: 'vanreusel-best-bite', cat: 'klasyki', name: 'Vanreusel Best Bite · 100 g', price: 13900, unit: '40 × 100 g', badge: 'BELGIJSKI PREMIUM', icon: 'frikandel', img: 'vanreusel-best-bite.webp',
    desc: 'Flagowy frikandel belgijskiej marki Vanreusel — delikatniejsza struktura i pełniejsze przyprawienie (tradycyjna receptura z mięsem końskim). Belgia vs Holandia: oceń sam.',
    details: { prep: [['🍟 Frytkownica', '170°C · 4 min z zamrożenia (3 min po rozmrożeniu)'], ['💨 Airfryer', '200°C · 8 min z zamrożenia (6 min po rozmrożeniu)'], ['🔥 Piekarnik', '200°C · 12 min z zamrożenia (10 min po rozmrożeniu)']],
      ingredients: 'Mięso oddzielone mechanicznie z kurczaka 44%, woda, słonina wieprzowa 17%, bułka tarta (mąka PSZENNA, woda, sól, drożdże), mięso końskie 8%, sól, skrobia PSZENNA, hydrolizat białka SOJOWEGO, cebula w proszku, aromat, suszone warzywa (cebula), przyprawy, emulgatory: E450, E452, wzmacniacz smaku: E621, przeciwutleniacz: E316, regulator kwasowości: E330.',
      allergens: 'Gluten (pszenica), soja · może zawierać jaja i mleko',
      nutrition: [['Energia', '911 kJ / 218 kcal'], ['Tłuszcz', '14 g'], ['— w tym kwasy nasycone', '4,9 g'], ['Węglowodany', '8,2 g'], ['— w tym cukry', '0,9 g'], ['Błonnik', '0,3 g'], ['Białko', '13,5 g'], ['Sól', '2 g']],
      storage: 'Produkt głęboko mrożony (-18°C). Po rozmrożeniu nie zamrażać ponownie. W lodówce: 48 h.' } },

  { id: 'van-lieshout-goudfrik', cat: 'klasyki', name: 'Van Lieshout Goudfrik · 100 g', price: 13900, unit: '40 × 100 g', badge: null, icon: 'frikandel', img: 'van-lieshout-goudfrik.webp',
    desc: 'Złota wersja frikandela od Van Lieshout — rodzinnej firmy, która smaży frikandele od pokoleń. Cięższy, bardziej mięsny profil.',
    details: { prep: [['🍟 Frytkownica', '175°C · ok. 5 min z zamrożenia (3,5 min po rozmrożeniu)'], ['💨 Airfryer', '180°C · 8–10 min z zamrożenia'], ['🔥 Piekarnik', '200°C · 12–15 min z zamrożenia']],
      ingredients: 'Mięso oddzielone mechanicznie z kurczaka, słonina wieprzowa, woda, wołowina (9%), bułka tarta (mąka PSZENNA, sól, drożdże), cebula, sól, zioła i przyprawy, ekstrakt drożdżowy, aromaty, bulion w proszku (sól, maltodekstryna, dekstroza, karmelizowany cukier, aromaty, olej słonecznikowy), przeciwutleniacz: kwas cytrynowy.',
      allergens: 'Gluten (pszenica)',
      nutrition: [['Energia', '892 kJ / 213 kcal'], ['Tłuszcz', '15 g'], ['— w tym kwasy nasycone', '5 g'], ['Węglowodany', '7 g'], ['— w tym cukry', '0,2 g'], ['Błonnik', '1,2 g'], ['Białko', '13 g'], ['Sól', '2,2 g']],
      storage: 'Produkt głęboko mrożony (-18°C). Po rozmrożeniu nie zamrażać ponownie. W lodówce (maks. 4°C): 48 h.' } },

  { id: 'beckers-original', cat: 'klasyki', name: 'Beckers Frikandel Original · 85 g', price: 12900, unit: '40 × 85 g', badge: 'KLASYK Z LIMBURGII', icon: 'frikandel', img: 'beckers-original.webp',
    desc: 'Beckers z Limburgii to jedna z najstarszych marek frikandeli w Holandii — receptura Original niezmienna od dekad.',
    details: { prep: [['🍟 Frytkownica', '175°C · 4–5 min z zamrożenia (2–3 min po rozmrożeniu)'], ['💨 Airfryer', '180°C · 8–10 min z zamrożenia'], ['🔥 Piekarnik', '200°C · 12–15 min z zamrożenia']],
      ingredients: '56% mięso oddzielone mechanicznie z kurczaka, 20% słonina wieprzowa, bułka tarta (PSZENICA), sól, zioła i przyprawy, suszona cebula, wzmacniacz smaku: E621, przeciwutleniacze: E316, E331, dekstroza, stabilizator: E450, hydrolizowane białko roślinne (SOJA).',
      allergens: 'Gluten (pszenica), soja',
      nutrition: [['Energia', '1084 kJ / 261 kcal'], ['Tłuszcz', '19,6 g'], ['— w tym kwasy nasycone', '6 g'], ['Węglowodany', '7,9 g'], ['— w tym cukry', '1,3 g'], ['Białko', '12,8 g'], ['Sól', '2,5 g']],
      storage: 'Produkt głęboko mrożony (-18°C). Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'kaassouffle-10', top: true, cat: 'klasyki', name: 'Souflesse Kaassoufflé · 10 szt.', price: 6900, unit: '10 × 75 g', badge: 'WEGE', icon: 'kaassouffle', img: 'kaassouffle-10.webp',
    desc: 'Chrupiąca kieszonka z płynnym serem od Souflesse — holenderskiego specjalisty od soufflé. Wegetariański klasyk frytkowni.',
    details: { prep: [['🍟 Frytkownica', '175°C · ok. 4 min z zamrożenia (3 min po rozmrożeniu), obrócić w połowie'], ['💨 Airfryer', '180°C · 8–9 min z zamrożenia'], ['🔥 Piekarnik', '200°C · 12 min']],
      ingredients: 'Mąka (zawiera PSZENICĘ), SER 25% (MLEKO, sól, kultury bakterii, podpuszczka, barwnik: karoten), woda, oleje roślinne (palmowy, rzepakowy), skrobia, SER <1%, sole emulgujące: E452 i kwas cytrynowy, ekstrakt drożdżowy, przeciwutleniacze: E339 i kwas askorbinowy, drożdże, barwniki: norbiksyna annato i kurkumina, substancje zagęszczające: E461 i E401, serwatka w proszku (MLEKO), skrobia modyfikowana, emulgator: E471, substancje spulchniające: E500, E451 i E450, przyprawy. Może zawierać śladowe ilości JAJ.',
      allergens: 'Gluten (pszenica), mleko · może zawierać jaja',
      nutrition: [['Energia', '1211 kJ / 289 kcal'], ['Tłuszcz', '15 g'], ['— w tym kwasy nasycone', '8 g'], ['Węglowodany', '30 g'], ['— w tym cukry', '1 g'], ['Błonnik', '1,2 g'], ['Białko', '7,9 g'], ['Sól', '1,9 g']],
      storage: 'Przechowywać w -18°C. Po wyjęciu z zamrażarki: 24 h w lodówce (+6°C). Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'van-dobben-kaassouffle', cat: 'klasyki', name: 'Van Dobben Kaassoufflé · 10 szt.', price: 8900, unit: '10 × 75 g', badge: 'PREMIUM · WEGE', icon: 'kaassouffle', img: 'van-dobben-kaassouffle.webp',
    desc: 'Kaassoufflé od kultowego Van Dobben — ser Gouda w złocistym cieście posypanym makiem, ekstra kremowe wnętrze. Amsterdamska klasa.',
    details: { prep: [['🍟 Frytkownica', '175°C · ok. 3,5 min z zamrożenia (2,5 min po rozmrożeniu), obrócić w połowie'], ['💨 Airfryer', '180°C · 8–9 min z zamrożenia']],
      ingredients: 'Mąka (zawiera PSZENICĘ), ser topiony 28% (woda, SER Gouda 32% (MLEKO, sól, kultury bakterii, podpuszczka, barwnik: karoten), masło (MLEKO), białka MLEKA, skrobia modyfikowana, serwatka w proszku (MLEKO), sole emulgujące: E450 i E452, sól, barwnik: karoten), woda, oleje roślinne (palmowy, rzepakowy), sól, mak, SER w proszku (MLEKO), drożdże, ekstrakt drożdżowy, kurkuma, wzmacniacz smaku: E621, emulgator: E471, kwas cytrynowy, skrobia modyfikowana, barwnik: kurkumina, substancja zagęszczająca: mączka guar.',
      allergens: 'Gluten (pszenica), mleko',
      nutrition: [['Energia', '1288 kJ / 308 kcal'], ['Tłuszcz', '16 g'], ['— w tym kwasy nasycone', '8,7 g'], ['Węglowodany', '33 g'], ['— w tym cukry', '1,2 g'], ['Błonnik', '1,4 g'], ['Białko', '7,8 g'], ['Sól', '1,8 g']],
      storage: 'Przechowywać w -18°C. Po wyjęciu z zamrażarki: 24 h w lodówce (+4°C). Uwaga: po usmażeniu nadzienie jest płynne i bardzo gorące.' } },

  { id: 'souflesse-mini', cat: 'klasyki', name: 'Souflesse Kaassoufflé mini · 30 szt.', price: 7900, unit: '30 × 25 g', badge: 'NA IMPREZY · WEGE', icon: 'kaassouffle', img: 'souflesse-mini.webp',
    desc: 'Miniaturowe soufflé serowe na jeden kęs — obok bitterballen obowiązkowy punkt każdej holenderskiej deski przekąsek.',
    details: { prep: [['🍟 Frytkownica', '175°C · 2,5–3 min z zamrożenia, obrócić w połowie'], ['💨 Airfryer', '180°C · 6–7 min z zamrożenia']],
      ingredients: 'Mąka (zawiera PSZENICĘ), SER dojrzewający 23% (MLEKO, sól, kultury bakterii, podpuszczka, barwnik: karoten), woda, oleje roślinne (palmowy, rzepakowy), skrobia, sól, SER <1%, ekstrakt drożdżowy, sole emulgujące: E452 i kwas cytrynowy, przeciwutleniacze: E339 i kwas askorbinowy, drożdże, barwniki: norbiksyna annato i kurkumina, gluten PSZENNY, serwatka w proszku (MLEKO), substancje zagęszczające: E461 i E401, kwas cytrynowy, emulgator: E471, skrobia modyfikowana, substancje spulchniające: E500, E451 i E450, przyprawy. Może zawierać śladowe ilości JAJ.',
      allergens: 'Gluten (pszenica), mleko · może zawierać jaja',
      nutrition: [['Energia', '1235 kJ / 295 kcal'], ['Tłuszcz', '15 g'], ['— w tym kwasy nasycone', '7,9 g'], ['Węglowodany', '32 g'], ['— w tym cukry', '1,1 g'], ['Błonnik', '1,3 g'], ['Białko', '8,4 g'], ['Sól', '1,9 g']],
      storage: 'Przechowywać w -18°C. Po wyjęciu z zamrażarki: 24 h w lodówce (+6°C). Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'souflesse-tomaat-mozzarella', cat: 'klasyki', name: 'Souflesse Kaassoufflé pomidor-mozzarella · 10 szt.', price: 7900, unit: '10 × 75 g', badge: 'WEGE', icon: 'kaassouffle', img: 'souflesse-tomaat-mozzarella.webp',
    desc: 'Włoski akcent w holenderskim soufflé: mozzarella z pomidorami i bazylią w chrupiącym cieście. Caprese z frytkownicy (uwaga: zawiera białko jaj).',
    details: { prep: [['🍟 Frytkownica', '175°C · ok. 4 min z zamrożenia (3 min po rozmrożeniu), obrócić w połowie'], ['💨 Airfryer', '180°C · 8–9 min z zamrożenia']],
      ingredients: 'Mąka PSZENNA, woda, oleje roślinne (palmowy, rzepakowy, słonecznikowy), 5% mozzarella (MLEKO, sól, kultury bakterii, podpuszczka), 3% ser (MLEKO, sól, kultury bakterii, podpuszczka), syrop glukozowy, skrobia modyfikowana, sól, 1% pomidor, bazylia, drożdże, naturalny aromat (zawiera MLEKO, PSZENICĘ), skrobia (zawiera PSZENICĘ), JAJA w proszku (z chowu ściółkowego), błonnik PSZENNY, substancje zagęszczające: E1414 i E401, suszona skrobia, zioła, hydrolizowane białko roślinne (SOJA), stabilizatory: mączka guar i guma ksantanowa, przyprawy, dekstroza, cebula, emulgator: E471, kwas cytrynowy, barwnik: biksyna annato, substancje spulchniające: E450, E451 i E500.',
      allergens: 'Jaja, gluten (pszenica), mleko, soja',
      nutrition: [['Energia', '1175 kJ / 290 kcal'], ['Tłuszcz', '13 g'], ['— w tym kwasy nasycone', '6,8 g'], ['Węglowodany', '32 g'], ['— w tym cukry', '0,9 g'], ['Błonnik', '1,5 g'], ['Białko', '7,6 g'], ['Sól', '1,6 g']],
      storage: 'Przechowywać w -18°C. Po wyjęciu z zamrażarki: 24 h w lodówce (+6°C). Nie rozmrażać w opakowaniu. Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'souflesse-ham-kaas', cat: 'klasyki', name: 'Souflesse Kaassoufflé szynka-ser · 10 szt.', price: 7900, unit: '10 × 75 g', badge: null, icon: 'kaassouffle', img: 'souflesse-ham-kaas.webp',
    desc: 'Klasyczne duo szynki i sera w wersji soufflé — tost hawajski bez ananasa, za to z chrupiącą skorupką.',
    details: { prep: [['🍟 Frytkownica', '175°C · ok. 4 min z zamrożenia (3 min po rozmrożeniu), obrócić w połowie'], ['💨 Airfryer', '180°C · 8–9 min z zamrożenia']],
      ingredients: 'Mąka PSZENNA, woda, 18% ser (MLEKO), oleje roślinne (palmowy, rzepakowy, słonecznikowy), 8% szynka (70% mięso wieprzowe, woda, skrobia, syrop glukozowy, sól, stabilizator: E451, substancja konserwująca: E250, przeciwutleniacz: E301), skrobia, sól, 1% ser w proszku (MLEKO), suszone ziemniaki, hydrolizowane białko roślinne, substancje zagęszczające: E1414, E401 i E461, kwas cytrynowy, sól emulgująca: E452, ekstrakt drożdżowy, drożdże, maltodekstryna, substancja przeciwzbrylająca: E339, serwatka w proszku (MLEKO), przyprawy, emulgator: E471, barwniki: kurkumina i norbiksyna annato, substancje spulchniające: E450, E451 i E500. Może zawierać śladowe ilości JAJ.',
      allergens: 'Gluten (pszenica), mleko · może zawierać jaja',
      nutrition: [['Energia', '1197 kJ / 286 kcal'], ['Tłuszcz', '15 g'], ['— w tym kwasy nasycone', '7,9 g'], ['Węglowodany', '29 g'], ['— w tym cukry', '1,2 g'], ['Błonnik', '1,3 g'], ['Białko', '9 g'], ['Sól', '2 g']],
      storage: 'Przechowywać w -18°C. Po wyjęciu z zamrażarki: 24 h w lodówce (+6°C). Nie rozmrażać w opakowaniu. Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'borrelmaatjes-kaas', cat: 'klasyki', name: 'Borrelmaatjes serowe · 48 szt.', price: 13900, unit: '48 × 23,5 g', badge: 'PROMOCJA · WEGE', icon: 'kaassouffle', img: 'borrelmaatjes-kaas.webp',
    desc: 'Serowe kąski „borrelmaatjes" od Ad van Geloven — mix mini nacho cheese i mini kroketów serowych. 48 sztuk w kartonie, czyli holenderska impreza w wersji instant.',
    details: { prep: [['🍟 Frytkownica', '175°C · 3 min z zamrożenia'], ['💨 Airfryer', '180°C · 7 min z zamrożenia']],
      ingredients: 'Mini Nacho Cheese: nadzienie SEROWE 42% (woda, SER Gouda 22%, cheddar dojrzewający 12% (MLEKO), masło (MLEKO), białka MLEKA, skrobia modyfikowana, emulgatory: E452 i E331, sól, błonnik bambusowy, regulatory kwasowości: E500 i kwas cytrynowy, przyprawy, stabilizator: E461, zioła, naturalny aromat, dekstroza, maltodekstryna, koncentrat cytrynowy, zielony pieprz, ekstrakt drożdżowy, czosnek, olej rzepakowy, cebula, barwnik: biksyna annato), mąka (zawiera PSZENICĘ), płatki kukurydziane 10% (kukurydza, sól, ekstrakt słodowy (zawiera JĘCZMIEŃ)), oleje roślinne (palmowy, rzepakowy, słonecznikowy), woda, sól, cukier, syrop glukozowy, stabilizatory: E466 i E464, drożdże, przyprawy, emulgator: E471, białko PSZENNE, barwniki: kurkumina i ekstrakt z papryki. Mini kroket serowy: woda, mąka (zawiera PSZENICĘ), ser PARMEZAN 15% (MLEKO), ser Emmentaler 11% (MLEKO), skrobia (zawiera PSZENICĘ), skrobia modyfikowana, sól, substancja zagęszczająca: E464 (pełny wykaz składników na opakowaniu).',
      allergens: 'Jaja, gluten (pszenica, jęczmień), mleko · może zawierać orzeszki ziemne i orzechy',
      nutrition: [['Energia', '1116 kJ / 267 kcal'], ['Tłuszcz', '13 g'], ['— w tym kwasy nasycone', '6,7 g'], ['Węglowodany', '27 g'], ['— w tym cukry', '1,1 g'], ['Błonnik', '1,4 g'], ['Białko', '8,9 g'], ['Sól', '1,8 g']],
      storage: 'Produkt głęboko mrożony (-18°C). Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'bamischijf-8', cat: 'klasyki', name: 'Elite Bamischijf · 8 szt.', price: 6900, unit: '8 × 130 g', badge: null, icon: 'bamischijf', img: 'bamischijf-8.webp',
    desc: 'Smażony krążek z indonezyjskim makaronem bami od Elite — specjalisty od tej holendersko-azjatyckiej fuzji. Solidne 130 g.',
    details: { prep: [['🍟 Frytkownica', '175°C · ok. 7 min z zamrożenia (4 min po rozmrożeniu)'], ['💨 Airfryer', '180°C · 10–11 min z zamrożenia']],
      ingredients: 'Woda, mąka PSZENNA, bułka tarta (mąka PSZENNA, otręby PSZENNE, drożdże, sól), mięso wieprzowe, oleje i tłuszcze roślinne (palmowy), hydrolizat białka roślinnego (SOJA), cebula, cukier, sól, żelatyna, koncentrat pomidorowy, białko roślinne (SOJA), mąka PSZENNA, mąka kukurydziana, por, modyfikowana skrobia PSZENNA, regulatory kwasowości (kwas octowy, cytrynowy, askorbinowy), papryka, skrobia modyfikowana, olej rzepakowy, czerwona papryczka chili, substancje spulchniające (E450, E500), stabilizatory (E415, E461), karmelizowany cukier, substancje konserwujące (E211, E202, E262), zioła, barwniki (E150d, czerwień buraczana, ekstrakt z papryki), substancja zagęszczająca (E412), naturalny aromat.',
      allergens: 'Gluten (pszenica), soja',
      nutrition: [['Energia', '796 kJ / 189 kcal'], ['Tłuszcz', '6,5 g'], ['— w tym kwasy nasycone', '3 g'], ['Węglowodany', '25 g'], ['— w tym cukry', '3,9 g'], ['Błonnik', '1,2 g'], ['Białko', '7,8 g'], ['Sól', '1,3 g']],
      storage: 'Produkt głęboko mrożony (-18°C). Maks. 48 h w lodówce (1–7°C). Nie rozmrażać w opakowaniu. Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'elite-bamischijf-pittig', cat: 'klasyki', name: 'Elite Bamischijf extra ostry · 8 szt.', price: 6900, unit: '8 × 130 g', badge: 'BARDZO OSTRE · WEGE', icon: 'bamischijf', img: 'elite-bamischijf-pittig.webp',
    desc: 'Ta sama bami-klasyka, ale z porządnym kopem chili — i w wersji wegetariańskiej. Dla tych, którym zwykły bamischijf to za mało ognia.',
    details: { prep: [['🍟 Frytkownica', '175°C · ok. 7 min z zamrożenia (4 min po rozmrożeniu)'], ['💨 Airfryer', '180°C · 10–11 min z zamrożenia']],
      ingredients: 'Woda, mąka PSZENNA, bułka tarta (mąka PSZENNA, otręby PSZENNE, drożdże, sól, barwniki (E160b)), oleje i tłuszcze roślinne (palmowy), hydrolizat białka roślinnego (SOJA), cebula, cukier, sól, białko roślinne (SOJA), koncentrat pomidorowy, mąka PSZENNA, mąka kukurydziana, por, regulatory kwasowości (kwas octowy, cytrynowy, askorbinowy), modyfikowana skrobia PSZENNA, wzmacniacze smaku (E621, E631 pochodzenia roślinnego), skrobia modyfikowana, papryka, olej rzepakowy, przyprawy, czerwona papryczka chili, substancje spulchniające (E450, E500), stabilizatory (E415, E461), substancje konserwujące (E202, E211, E262), zioła, barwniki (E150d, czerwień buraczana, ekstrakt z papryki), syrop glukozowo-fruktozowy, ekstrakt drożdżowy, tłuszcz roślinny (palmowy), substancja zagęszczająca (E412), aromat, naturalny aromat.',
      allergens: 'Gluten (pszenica), soja',
      nutrition: [['Energia', '899 kJ / 214 kcal'], ['Tłuszcz', '7,9 g'], ['— w tym kwasy nasycone', '3,6 g'], ['Węglowodany', '30 g'], ['— w tym cukry', '3,9 g'], ['Białko', '5 g'], ['Sól', '1,8 g']],
      storage: 'Produkt głęboko mrożony (-18°C). Maks. 48 h w lodówce (1–7°C). Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'elite-bamischijf-vege', cat: 'klasyki', name: 'Elite Bamischijf wegetariański · 8 szt.', price: 6900, unit: '8 × 130 g', badge: 'WEGE', icon: 'bamischijf', img: 'elite-bamischijf-vege.webp',
    desc: 'Bamischijf w wersji w pełni wegetariańskiej — makaron, warzywa i indonezyjskie przyprawy, zero mięsa.',
    details: { prep: [['🍟 Frytkownica', '175°C · ok. 7 min z zamrożenia (4 min po rozmrożeniu)'], ['💨 Airfryer', '180°C · 10–11 min z zamrożenia']],
      ingredients: 'Woda, mąka PSZENNA, bułka tarta (mąka PSZENNA, otręby PSZENNE, drożdże, sól), oleje i tłuszcze roślinne (palmowy), hydrolizat białka roślinnego (SOJA), cebula, cukier, sól, białko roślinne (SOJA), koncentrat pomidorowy, mąka PSZENNA, mąka kukurydziana, por, regulatory kwasowości (kwas octowy, cytrynowy, askorbinowy), modyfikowana skrobia PSZENNA, wzmacniacze smaku (E621, E631 pochodzenia roślinnego), skrobia modyfikowana, papryka, olej rzepakowy, czerwona papryczka chili, substancje spulchniające (E450, E500), stabilizatory (E415, E461), barwniki (E150d, czerwień buraczana, ekstrakt z papryki), zioła, substancje konserwujące (E202, E211, E262), przyprawy, syrop glukozowo-fruktozowy, ekstrakt drożdżowy, tłuszcz roślinny (palmowy), substancja zagęszczająca (E412), aromat, naturalny aromat.',
      allergens: 'Gluten (pszenica), soja',
      nutrition: [['Energia', '813 kJ / 193 kcal'], ['Tłuszcz', '5,2 g'], ['— w tym kwasy nasycone', '2,4 g'], ['Węglowodany', '31 g'], ['— w tym cukry', '4,1 g'], ['Białko', '5,2 g'], ['Sól', '1,9 g']],
      storage: 'Produkt głęboko mrożony (-18°C). Maks. 48 h w lodówce (1–7°C). Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'welten-bami-mini', cat: 'klasyki', name: 'Welten Bamischijf mini oriental', price: 7900, unit: '30 szt. mini (à 20 g)', badge: 'NA IMPREZY', icon: 'bamischijf', img: 'welten-bami-mini.webp',
    desc: 'Miniaturowe krążki bami na jeden kęs — orientalny akcent na desce przekąsek obok bitterballen i mini soufflé.',
    details: { prep: [['🍟 Frytkownica', '180°C · 5 min z zamrożenia (3 min po rozmrożeniu)'], ['💨 Airfryer', '180°C · 7–8 min z zamrożenia']],
      ingredients: 'Ugotowany makaron mie (PSZENICA), bułka tarta (mąka PSZENNA, pełnoziarnista mąka PSZENNA, olej słonecznikowy, drożdże, sól), woda, warzywa (por, cebula, papryka, kapusta, czosnek), mieszanka przypraw (dekstroza, wzmacniacze smaku: E621, E627 i E631, sól, przyprawy, czosnek, cebula, aromat (zawiera SOJĘ, PSZENICĘ), barwniki: ekstrakt z papryki i karmel), cukier, ketjap (cukier, melasa, woda, sos SOJOWY (woda, ziarna SOI, PSZENICA, sól), sól, ocet, skrobia, aromat), ketchup pomidorowy (koncentrat pomidorowy, syrop glukozowo-fruktozowy, ocet, skrobia modyfikowana, sól, cukier), żelatyna wołowa, skrobia modyfikowana, margaryna (oleje roślinne (palmowy, rzepakowy, kokosowy), woda, sól, barwnik: karoten), sambal (czerwone papryczki, sól), mąka PSZENNA, stabilizatory: guma guar i E466, inulina, aromat (zawiera PSZENICĘ, SELER), sól, trassi w proszku (mąka, sól, KREWETKI), substancje spulchniające: E450 i E500. Może zawierać śladowe ilości ORZESZKÓW ZIEMNYCH.',
      allergens: 'Gluten (pszenica), skorupiaki, seler, soja · może zawierać orzeszki ziemne',
      nutrition: [['Energia', '775 kJ / 185 kcal'], ['Tłuszcz', '1,8 g'], ['— w tym kwasy nasycone', '0,4 g'], ['Węglowodany', '33 g'], ['— w tym cukry', '8,3 g'], ['Białko', '7,5 g'], ['Sól', '2 g']],
      storage: 'Produkt głęboko mrożony (-18°C). Po rozmrożeniu nie zamrażać ponownie. W lodówce: 48 h (pod przykryciem).' } },

  { id: 'elite-nasischijf', cat: 'klasyki', name: 'Elite Nasischijf · 8 szt.', price: 6900, unit: '8 × 130 g', badge: null, icon: 'bamischijf', img: 'elite-nasischijf.webp',
    desc: 'Brat bamischijfa: smażony krążek z indonezyjskim ryżem nasi goreng zamiast makaronu. Druga połowa holendersko-indonezyjskiego duetu.',
    details: { prep: [['🍟 Frytkownica', '175°C · ok. 7 min z zamrożenia (4 min po rozmrożeniu)'], ['💨 Airfryer', '180°C · 10–11 min z zamrożenia']],
      ingredients: 'Woda, ryż, bułka tarta (mąka PSZENNA, drożdże, sól, mąka PSZENNA, otręby PSZENNE, dekstroza), mięso wieprzowe, oleje i tłuszcze roślinne, częściowo utwardzone (kokosowy, palmowy, rzepakowy), hydrolizat białka roślinnego (SOJA), cebula, cukier, sól, koncentrat pomidorowy, modyfikowana skrobia kukurydziana, por, mąka PSZENNA, skrobia PSZENNA, regulatory kwasowości (kwas octowy, cytrynowy, askorbinowy), mąka kukurydziana, skrobia kukurydziana, papryka, olej rzepakowy, czerwona papryczka chili, karmelizowany cukier, białko roślinne (SOJA), emulgatory (E415, E466), substancje spulchniające (E450, E500), białko MLEKA (laktoza), substancje konserwujące (E202, E211, E262), substancja zagęszczająca (E412), zioła, barwniki (E150d, czerwień buraczana, ekstrakt z papryki), naturalny aromat.',
      allergens: 'Gluten (pszenica), mleko, soja',
      nutrition: [['Energia', '837 kJ / 200 kcal'], ['Tłuszcz', '5,6 g'], ['— w tym kwasy nasycone', '2,8 g'], ['Węglowodany', '30,5 g'], ['— w tym cukry', '4,1 g'], ['Błonnik', '2,2 g'], ['Białko', '5,5 g'], ['Sól', '1,5 g']],
      storage: 'Produkt głęboko mrożony (-18°C). Maks. 48 h w lodówce (1–7°C). Nie rozmrażać w opakowaniu. Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'elite-nasischijf-pittig-vega', cat: 'klasyki', name: 'Elite Nasischijf extra ostry wege · 8 szt.', price: 6900, unit: '8 × 130 g', badge: 'BARDZO OSTRE · WEGE', icon: 'bamischijf', img: 'elite-nasischijf-pittig-vega.webp',
    desc: 'Nasischijf z podwójną dawką chili, w wersji wegetariańskiej — najostrzejszy wegetariański snack w naszej frytkowni.',
    details: { prep: [['🍟 Frytkownica', '175°C · ok. 7 min z zamrożenia (4 min po rozmrożeniu)'], ['💨 Airfryer', '180°C · 10–11 min z zamrożenia']],
      ingredients: 'Woda, ryż, bułka tarta (mąka PSZENNA, drożdże, sól, barwnik: kurkumina), oleje i tłuszcze roślinne, częściowo utwardzone (kokosowy, palmowy, rzepakowy), hydrolizat białka roślinnego (SOJA), cukier, cebula, sól, białko roślinne (SOJA), koncentrat pomidorowy, modyfikowana skrobia kukurydziana, por, regulatory kwasowości (kwas octowy, cytrynowy, askorbinowy), mąka PSZENNA, skrobia PSZENNA, wzmacniacze smaku (E621, E631 pochodzenia roślinnego), mąka kukurydziana, skrobia kukurydziana, papryka, czerwona papryczka chili, przyprawy, olej rzepakowy, substancje konserwujące (E202, E211, E262), emulgatory (E415, E466), substancje spulchniające (E450, E500), białko MLEKA (laktoza), zioła, substancja zagęszczająca (E412), barwniki (E150d, czerwień buraczana, ekstrakt z papryki), aromat, ekstrakt drożdżowy, syrop glukozowy, tłuszcz roślinny (palmowy), naturalny aromat.',
      allergens: 'Gluten (pszenica), mleko, soja',
      nutrition: [['Energia', '838 kJ / 199 kcal'], ['Tłuszcz', '5 g'], ['— w tym kwasy nasycone', '2,3 g'], ['Węglowodany', '33,1 g'], ['— w tym cukry', '4,2 g'], ['Białko', '4,8 g'], ['Sól', '1,8 g']],
      storage: 'Produkt głęboko mrożony (-18°C). Maks. 48 h w lodówce (1–7°C). Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'mexicano-8', cat: 'klasyki', name: 'De Vries Mexicano · 8 szt.', price: 6900, unit: '8 × 135 g', badge: 'OSTRE', icon: 'mexicano', img: 'mexicano-8.webp',
    desc: 'Pikantny, płaski kotlet z charakterem od De Vries — twórcy oryginału (Mexicano® Classic, od 1984). Dla tych, którym frikandel to za mało.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4–5 min z zamrożenia (2–3 min po rozmrożeniu)'], ['💨 Airfryer', '180°C · 10–12 min z zamrożenia']],
      ingredients: '37% mięso (wieprzowe, wołowe), 35% mięso oddzielone mechanicznie z kurczaka, woda, bułka tarta (mąka PSZENNA, drożdże, sól), skrobia PSZENNA, warzywa (papryka, cebula), sól, przyprawy, kolagen wieprzowy, stabilizator (E451), wzmacniacz smaku (E621), cukier, olej słonecznikowy, ekstrakt drożdżowy, hydrolizowane białko (rzepak), aromat, substancja konserwująca (E250), przeciwutleniacz (E321).',
      allergens: 'Gluten (pszenica)',
      nutrition: [['Energia', '901 kJ / 217 kcal'], ['Tłuszcz', '14,6 g'], ['— w tym kwasy nasycone', '4,9 g'], ['Węglowodany', '7,8 g'], ['— w tym cukry', '0,4 g'], ['Białko', '13,3 g'], ['Sól', '2,3 g']],
      storage: 'Przechowywać w -18°C. Po wyjęciu z zamrażarki: 48 h w lodówce (maks. 7°C). Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'de-vries-super-mexicano-xxl', cat: 'klasyki', name: 'De Vries Super Mexicano XXL · 245 g', price: 14900, unit: '10 × 245 g', badge: 'ĆWIERĆ KILO', icon: 'mexicano', img: 'de-vries-super-mexicano-xxl.webp',
    desc: 'Mexicano w rozmiarze ćwierć kilograma — pikantny kolos do pary z naszym frikandelem XXL. Jeden = obiad z kopem.',
    details: { prep: [['🍟 Frytkownica', '180°C · 6–7 min z zamrożenia (4–5 min po rozmrożeniu)'], ['💨 Airfryer', '180°C · 13–15 min z zamrożenia, obrócić w połowie']],
      ingredients: '37% mięso (wieprzowe, wołowe), 35% mięso oddzielone mechanicznie z kurczaka, woda, bułka tarta (mąka PSZENNA, drożdże, sól), skrobia PSZENNA, warzywa (papryka, cebula), sól, przyprawy, kolagen wieprzowy, stabilizator (E451), wzmacniacz smaku (E621), cukier, olej słonecznikowy, ekstrakt drożdżowy, hydrolizowane białko (rzepak), aromat, substancja konserwująca (E250), przeciwutleniacz (E321).',
      allergens: 'Gluten (pszenica)',
      nutrition: [['Energia', '901 kJ / 217 kcal'], ['Tłuszcz', '14,6 g'], ['— w tym kwasy nasycone', '4,9 g'], ['Węglowodany', '7,8 g'], ['— w tym cukry', '0,4 g'], ['Białko', '13,3 g'], ['Sól', '2,3 g']],
      storage: 'Przechowywać w -18°C. Po wyjęciu z zamrażarki: 48 h w lodówce (maks. 7°C).' } },

  { id: 'de-vries-mexicano-mini', cat: 'klasyki', name: 'De Vries Mexicano mini · 30 g', price: 8900, unit: '30 szt. × 30 g', badge: 'OSTRE · NA IMPREZY', icon: 'mexicano', img: 'de-vries-mexicano-mini.webp',
    desc: 'Mini mexicano na jeden kęs — pikantny element deski przekąsek dla gości, którzy lubią ogień.',
    details: { prep: [['🍟 Frytkownica', '180°C · 2,5–3 min z zamrożenia (2 min po rozmrożeniu)'], ['💨 Airfryer', '180°C · 7–8 min z zamrożenia']],
      ingredients: '37% mięso (wieprzowe, wołowe), 35% mięso oddzielone mechanicznie z kurczaka, woda, bułka tarta (mąka PSZENNA, drożdże, sól), skrobia PSZENNA, warzywa (papryka, cebula), sól, przyprawy, kolagen wieprzowy, stabilizator (E451), wzmacniacz smaku (E621), cukier, olej słonecznikowy, ekstrakt drożdżowy, hydrolizowane białko (rzepak), aromat, substancja konserwująca (E250), przeciwutleniacz (E321).',
      allergens: 'Gluten (pszenica)',
      nutrition: [['Energia', '901 kJ / 217 kcal'], ['Tłuszcz', '14,6 g'], ['— w tym kwasy nasycone', '4,9 g'], ['Węglowodany', '7,8 g'], ['— w tym cukry', '0,4 g'], ['Błonnik', '0,6 g'], ['Białko', '13,3 g'], ['Sól', '2,3 g']],
      storage: 'Przechowywać w -18°C. Po wyjęciu z zamrażarki: 48 h w lodówce (maks. 7°C). Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'de-vries-mexicano-halal', cat: 'klasyki', name: 'De Vries Mexicano halal · 8 szt.', price: 7900, unit: '8 × 135 g', badge: 'HALAL · OSTRE', icon: 'mexicano', img: 'de-vries-mexicano-halal.webp',
    desc: 'Pełnoprawny mexicano z kurczaka i wołowiny, z oficjalnym certyfikatem halal — pikantna klasyka dostępna dla każdego.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4–5 min z zamrożenia (2–3 min po rozmrożeniu)'], ['💨 Airfryer', '180°C · 10–12 min z zamrożenia']],
      ingredients: '54% mięso oddzielone mechanicznie z kurczaka, 19% wołowina, woda, bułka tarta (mąka PSZENNA, sól, woda, drożdże), sól, cebula, skrobia (PSZENICA), przyprawy, białko SOJOWE, stabilizator (E451), hydrolizowane białko rzepakowe, suszona papryka, wzmacniacz smaku (E621), naturalny aromat, aromat, cukier, ekstrakt drożdżowy, substancja konserwująca (E250), olej słonecznikowy.',
      allergens: 'Gluten (pszenica), soja',
      nutrition: [['Energia', '782 kJ / 187 kcal'], ['Tłuszcz', '10,5 g'], ['— w tym kwasy nasycone', '3,8 g'], ['Węglowodany', '7,9 g'], ['— w tym cukry', '0,3 g'], ['Błonnik', '0,8 g'], ['Białko', '15 g'], ['Sól', '2,1 g']],
      storage: 'Przechowywać w -18°C. Po wyjęciu z zamrażarki: 48 h w lodówce (maks. 7°C). Po rozmrożeniu nie zamrażać ponownie.' } },

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

  { id: 'kwekkeboom-bitterbal-30', cat: 'bitterballen', name: 'Kwekkeboom Bitterbal wołowy · 30 g', price: 11900, unit: '30 szt. × 30 g', badge: null, icon: 'bitterbal', img: 'kwekkeboom-bitterbal-30.webp',
    desc: 'Duży bitterbal 30 g z bogatym wołowym ragù — wersja klasyczna do frytkownicy. Obowiązkowy z musztardą przy piwie.',
    details: { prep: [['🍟 Frytkownica', '175°C · 6 min z zamrożenia (3,5 min po rozmrożeniu)'], ['💨 Airfryer', '180°C · 9–11 min z zamrożenia']],
      ingredients: 'Woda, mąka PSZENNA, 12% gotowana wołowina (84% wołowina, woda, białko SOJOWE, sól, błonnik (ziemniaczany, bambusowy, cytrusowy, inulina), naturalny aromat (zawiera SOJĘ)), oleje roślinne (palmowy, rzepakowy), 3% śmietanka (MLEKO), sól, żelatyna wołowa, sos sojowy (woda, ziarna SOI, skrobia PSZENNA, sól), cebula, mąka ŁUBINOWA, aromat (zawiera SOJĘ, SELER), substancje zagęszczające (E466, mączka guar), przyprawy, skrobia PSZENNA, wzmacniacz smaku (E621), ekstrakt drożdżowy, zioła (zawierają SELER), drożdże, dekstroza, hydrolizowane białko PSZENNE, maltodekstryna, stabilizatory (E451, E450), suszona cebula, kwas mlekowy, syrop z palonego cukru, ekstrakt z kurkumy, ekstrakt warzywny. Wyprodukowano w zakładzie przetwarzającym orzeszki ziemne.',
      allergens: 'Gluten (pszenica), łubin, mleko, seler, soja · może zawierać orzeszki ziemne i orzechy',
      nutrition: [['Energia', '797 kJ / 190 kcal'], ['Tłuszcz', '9,1 g'], ['— w tym kwasy nasycone', '4,9 g'], ['Węglowodany', '19,6 g'], ['— w tym cukry', '2,2 g'], ['Białko', '6,5 g'], ['Sól', '1,1 g']],
      storage: 'Przechowywać w -18°C. Po rozmrożeniu nie zamrażać ponownie. W lodówce (maks. 4°C): 48 h.' } },

  { id: 'old-amsterdam-bitterballen', cat: 'bitterballen', name: 'Kwekkeboom Bitterballen Old Amsterdam · 25 g', price: 12900, unit: '50 szt. × 25 g · piekarnik', badge: 'SEROWE', icon: 'bitterbal', img: 'old-amsterdam-bitterballen.webp',
    desc: 'Bitterballen z dojrzewającym serem Old Amsterdam — wytrawne, pełne umami. Wersja do piekarnika i airfryera (nie nadaje się do frytkownicy).',
    details: { prep: [['🔥 Piekarnik', '220°C · 10 min z zamrożenia, po upieczeniu odczekać min. 2 min'], ['💨 Airfryer', '200°C · 7–8 min z zamrożenia']],
      ingredients: 'Woda, mąka (PSZENICA, SOJA), oleje roślinne (palmowy, rzepakowy, słonecznikowy), 8% ser 48+ (pasteryzowane MLEKO, sól, kultury bakterii (zawierają MLEKO), podpuszczka, substancja konserwująca (E251), barwnik (karoteny)), koncentrat pełnego MLEKA, białko roślinne (SOJA), śmietanka (MLEKO), sól, żelatyna wołowa, skrobia (kukurydziana, ziemniaczana), aromat (zawiera MLEKO, SOJĘ, PSZENICĘ), substancje zagęszczające (E466, E461, E415, E412), ekstrakt drożdżowy, dekstroza, barwniki (E150a, E160b), cebula, MLEKO w proszku, białko MLEKA, stabilizator (E407), zioła, przyprawy, substancja spulchniająca (E500), przeciwutleniacz (E392), marchew.',
      allergens: 'Gluten (pszenica), mleko, soja',
      nutrition: [['Energia', '1266 kJ / 304 kcal'], ['Tłuszcz', '18,5 g'], ['— w tym kwasy nasycone', '6,7 g'], ['Węglowodany', '25,4 g'], ['— w tym cukry', '1,5 g'], ['Białko', '8 g'], ['Sól', '1,7 g']],
      storage: 'Przechowywać w -18°C. Nie rozmrażać przed przygotowaniem! Uwaga: produkt nie nadaje się do frytkownicy.' } },

  { id: 'van-dobben-bitterbal', top: true, cat: 'bitterballen', name: 'Van Dobben Bitterbal wołowy · 30 g', price: 11900, unit: '30 szt. × 30 g', badge: 'IKONA AMSTERDAMU', icon: 'bitterbal', img: 'van-dobben-bitterbal.webp',
    desc: 'Van Dobben to bitterbal, po który amsterdamczycy stoją w kolejce od 1945 roku. Kremowe wołowe ragù w cienkiej, chrupiącej panierce — punkt odniesienia dla całej kategorii.',
    details: { prep: [['🍟 Frytkownica', '175°C · 6 min z zamrożenia (3,5 min po rozmrożeniu) · maks. 10 szt. naraz'], ['💨 Airfryer', '180°C · 9–10 min z zamrożenia']],
      ingredients: 'Woda, mąka (zawiera PSZENICĘ), gotowana wołowina 11%, oleje roślinne (palmowy, słonecznikowy, rzepakowy), tłuszcz maślany (zawiera MLEKO), sól, cebula, żelatyna wołowa, cukier, hydrolizat białka roślinnego (rzepak, kukurydza, SOJA), syrop glukozowy, drożdże, naturalne aromaty, ekstrakt drożdżowy, izolat białka SOJOWEGO, maltodekstryna, zioła i przyprawy, dekstroza, bulion wołowy, błonnik roślinny (ziemniaczany, bambusowy, inulina, cytrynowy, limonkowy), substancja zagęszczająca: E466, syrop cukru inwertowanego, białko roślinne (zawiera PSZENICĘ), ziarna SOI, płatki ziemniaczane, koncentrat warzywny (marchew, cebula), koncentrat soku z cytryny, kwas mlekowy, ekstrakt z kurkumy.',
      allergens: 'Gluten (pszenica), mleko, soja · może zawierać orzeszki ziemne',
      nutrition: [['Energia', '794 kJ / 189 kcal'], ['Tłuszcz', '8,3 g'], ['— w tym kwasy nasycone', '4,1 g'], ['Węglowodany', '22 g'], ['— w tym cukry', '1,3 g'], ['Błonnik', '1 g'], ['Białko', '6,7 g'], ['Sól', '1,3 g']],
      storage: 'Produkt głęboko mrożony (-18°C). Po rozmrożeniu nie zamrażać ponownie. Najlepiej rozmrażać w lodówce.' } },

  { id: 'bourgondier-bitterbal-35', cat: 'bitterballen', name: 'De Bourgondiër Bitterbal wołowy · 35 g', price: 10900, unit: '30 szt. × 35 g', badge: null, icon: 'bitterbal', img: 'bourgondier-bitterbal-35.webp',
    desc: 'Większy, rustykalny bitterbal 35 g w burgundzkim stylu — widoczne kawałki długo duszonej wołowiny w kremowym ragù.',
    details: { prep: [['🍟 Frytkownica', '175°C · ok. 6 min z zamrożenia (4 min po rozmrożeniu) · maks. 10 szt. naraz'], ['💨 Airfryer', '180°C · 10 min z zamrożenia']],
      ingredients: 'Woda, wołowina 24%*, mąka (zawiera PSZENICĘ), oleje roślinne (palmowy, słonecznikowy), sól, masło (zawiera MLEKO), żelatyna wołowa, naturalne aromaty, substancja zagęszczająca: E466, białko ryżowe, laktoza (zawiera MLEKO), przyprawy, drożdże, ocet w proszku, wzmacniacz smaku: E621, dekstroza, emulgator: E451, białko MLEKA, zioła, cukier, stabilizator: E450, substancja spulchniająca: E500. *odpowiada 17% gotowanej wołowiny.',
      allergens: 'Gluten (pszenica), mleko',
      nutrition: [['Energia', '783 kJ / 187 kcal'], ['Tłuszcz', '10 g'], ['— w tym kwasy nasycone', '4,2 g'], ['Węglowodany', '17 g'], ['— w tym cukry', '0,7 g'], ['Błonnik', '0,9 g'], ['Białko', '5,9 g'], ['Sól', '1,7 g']],
      storage: 'Produkt głęboko mrożony (-18°C). Po rozmrożeniu nie zamrażać ponownie. W lodówce: 48 h.' } },

  { id: 'rotterdamse-bitterbal', cat: 'bitterballen', name: 'Rotterdamse Bitterbal · 60 szt.', price: 8900, unit: '60 szt. × 30 g', badge: 'PROMOCJA', icon: 'bitterbal', img: 'rotterdamse-bitterbal.webp',
    desc: 'Solidny bitterbal z Rotterdamu — bez zadęcia, za to w dużym kartonie w świetnej cenie. Miasto pracy, kulka konkretu.',
    details: { prep: [['🍟 Frytkownica', '180°C · 4 min z zamrożenia · maks. 10 szt. naraz'], ['💨 Airfryer', '180°C · 9–10 min z zamrożenia']],
      ingredients: 'Woda, mąka (PSZENICA, SOJA), 17,5% wkład mięsny (72% wołowina, woda, skrobia ziemniaczana, sól, cukier, stabilizatory (E450, E451), przeciwutleniacze (E300, E330), substancja zagęszczająca (E407)), tłuszcze roślinne (palmowy, nieutwardzony), skrobia (kukurydziana, ziemniaczana), żelatyna, syrop glukozowy, ocet w proszku, brązowy cukier, modyfikowana skrobia PSZENNA, aromat (zawiera SOJĘ, GLUTEN), sól, białko JAJ kurzych, drożdże, substancja żelująca (E407a), barwnik (E150d), hydrolizat białka roślinnego (zawiera SOJĘ), ekstrakt przypraw (zawiera GORCZYCĘ), dekstroza, zioła (SELER), ekstrakt drożdżowy, przeciwutleniacz (E330), przyprawy, oleje roślinne (słonecznikowy), substancje zagęszczające (E464, E412, E415), stabilizatory (E508, E466), wzmacniacze smaku (E631, E621), cebula.',
      allergens: 'Jaja, gluten (pszenica), gorczyca, seler, soja',
      nutrition: [['Energia', '765 kJ / 178 kcal'], ['Tłuszcz', '7,2 g'], ['— w tym kwasy nasycone', '3,5 g'], ['Węglowodany', '21,9 g'], ['— w tym cukry', '1 g'], ['Białko', '6,2 g'], ['Sól', '0,5 g']],
      storage: 'Produkt głęboko mrożony (-18°C). Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'amsterdamse-bitterbal', cat: 'bitterballen', name: 'Amsterdamse Bitterbal wołowy · 50 szt.', price: 15900, unit: '50 szt. × 30 g', badge: 'PROMOCJA', icon: 'bitterbal', img: 'amsterdamse-bitterbal.webp',
    desc: 'Rzemieślniczy bitterbal od Amsterdamse Croquetten — gęste ragù wołowe według stołecznej tradycji.',
    details: { prep: [['🍟 Frytkownica', '175°C · 5 min z zamrożenia (3 min po rozmrożeniu), po usmażeniu odczekać ok. 1 min'], ['💨 Airfryer', '180°C · 9–10 min z zamrożenia']],
      ingredients: 'Woda, bułka tarta (mąka PSZENNA, sól, woda, drożdże), 12% gotowana wołowina (wołowina, woda, sól morska, modyfikowana skrobia kukurydziana, regulator kwasowości (E640), sól, stabilizatory (E450, E451)), mąka PSZENNA, oleje roślinne (rzepakowy), cebula, żelatyna wołowa, sól, przyprawy (SELER), suszony syrop glukozowy, wzmacniacz smaku (E621), cukier, dekstroza, aromat (SELER), ekstrakt wołowy, emulgator (E466), laktoza (MLEKO), zioła, ekstrakt drożdżowy, gluten PSZENNY, sos sojowy (maltodekstryna, sól, ziarna SOI, PSZENICA, woda), tłuszcz palmowy, wołowina w proszku, stabilizator (E450), skrobia ziemniaczana, karmelizowany cukier, regulator kwasowości (węglany sodu).',
      allergens: 'Gluten (pszenica), mleko, seler, soja',
      nutrition: [['Energia', '762 kJ / 182 kcal'], ['Tłuszcz', '7,7 g'], ['— w tym kwasy nasycone', '0,8 g'], ['Węglowodany', '21,3 g'], ['— w tym cukry', '1 g'], ['Białko', '6,9 g'], ['Sól', '1,2 g']],
      storage: 'Przechowywać w -18°C. Po rozmrożeniu: 2 dni w lodówce (4°C). Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'mekkafood-bitterballen-halal', cat: 'bitterballen', name: 'Mekkafood Bitterballen halal', price: 13900, unit: 'karton 1200 g', badge: 'HALAL', icon: 'bitterbal', img: 'mekkafood-bitterballen-halal.webp',
    desc: 'Bitterballen z 20% gotowanej wołowiny, z certyfikatem halal — klasyczny smak holenderskiej frytkowni dostępny dla każdego.',
    details: { prep: [['🍟 Frytkownica', 'maks. 175°C · maks. 5 min z zamrożenia, po usmażeniu odczekać 2 min'], ['💨 Airfryer', '180°C · 9–10 min z zamrożenia']],
      ingredients: 'Woda, mąka PSZENNA, gotowana wołowina 20%, olej palmowy, żelatyna wołowa, sól, drożdże, hydrolizowane białko SOJOWE, cukier, słód JĘCZMIENNY, przyprawy, skrobia (zawiera PSZENICĘ), białka MLEKA, cukier karmelizowany, zioła (zawierają SELER), aromaty (zawierają SOJĘ, PSZENICĘ), wzmacniacze smaku (glutaminian sodu, inozynian disodowy), substancje zagęszczające (hydroksypropylometyloceluloza, metyloceluloza, mączka guar, guma ksantanowa, E466). Może zawierać ŻYTO.',
      allergens: 'Gluten (pszenica, jęczmień), mleko, seler, soja',
      nutrition: [['Energia', '687 kJ / 164 kcal'], ['Tłuszcz', '6,4 g'], ['— w tym kwasy nasycone', '2,9 g'], ['Węglowodany', '18 g'], ['— w tym cukry', '1,1 g'], ['Białko', '7,8 g'], ['Sól', '1,3 g']],
      storage: 'Przechowywać w -18°C. W lodówce: 48 h. Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'oma-bobs-draadjesvlees', cat: 'bitterballen', name: 'Oma Bob’s Bitterballen draadjesvlees · 30 g', price: 12900, unit: '30 szt. × 30 g', badge: 'JAK U BABCI', icon: 'bitterbal', img: 'oma-bobs-draadjesvlees.webp',
    desc: 'Z długo duszonej, rozpadającej się wołowiny (draadjesvlees) — jak niedzielny obiad u holenderskiej babci, zamknięty w chrupiącej kulce.',
    details: { prep: [['🍟 Frytkownica', 'min. 180°C · 5 min z zamrożenia (3 min po rozmrożeniu)'], ['💨 Airfryer', '180°C · 9–10 min z zamrożenia']],
      ingredients: 'Woda, 20% gotowana wołowina, mąka PSZENNA (zawiera GLUTEN), ŁUBIN, skrobia PSZENNA (zawiera GLUTEN), masło (zawiera białko MLEKA i laktozę), sól, zioła i przyprawy (SELER), warzywa, śmietanka, żelatyna wołowa, drożdże, hydrolizowane białko roślinne, musztarda (zawiera GORCZYCĘ), aromat (SOJA), emulgatory: E464, E466, E451, substancja zagęszczająca: E412, wzmacniacze smaku: E621, E631.',
      allergens: 'Gluten (pszenica), łubin, mleko, gorczyca, seler, soja',
      nutrition: [['Energia', '771 kJ / 183 kcal'], ['Tłuszcz', '8,5 g'], ['— w tym kwasy nasycone', '4,4 g'], ['Węglowodany', '19 g'], ['— w tym cukry', '1 g'], ['Błonnik', '1,3 g'], ['Białko', '7,1 g'], ['Sól', '1,2 g']],
      storage: 'Produkt głęboko mrożony (-18°C). Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'holtkamp-kalfsvlees', cat: 'bitterballen', name: 'Holtkamp Bitterbal cielęcy · 30 g', price: 16900, unit: '30 szt. × 30 g', badge: 'PREMIUM', icon: 'bitterbal', img: 'holtkamp-kalfsvlees.webp',
    desc: 'Holtkamp to legendarna amsterdamska patisserie — ich cielęcy bitterbal (32% cielęciny w ragù) serwują najlepsze bary i restauracje w kraju. Klasa mistrzowska.',
    details: { prep: [['🍟 Frytkownica', '175°C · ok. 5,5 min z zamrożenia (3 min po rozmrożeniu) · najlepiej rozmrozić powoli w lodówce']],
      ingredients: 'Ragout cielęcy: woda, cielęcina, mąka PSZENNA, olej roślinny (utwardzony), śmietanka (MLEKO), żelatyna wołowa, pietruszka, zioła i przyprawy (pieprz, gałka muszkatołowa, GORCZYCA, liść laurowy, goździki), bulion cielęcy, cytryna, czosnek, skrobia ziemniaczana, aromat, JAJA, emulgatory (E471, E477), enzymy, tłuszcz roślinny (kokosowy, palmowy), ekstrakt drożdżowy, barwnik (E160a), SELER korzeniowy, białko z soczewicy, skrobia kukurydziana, przeciwutleniacz (E300), ocet naturalny, olej rzepakowy, por, ekstrakt wołowy, SELER, wzmacniacze smaku (E631, E621), stabilizatory (E407, E415, E450, E451), cukier, białko PSZENNE, mąka ze słodu PSZENNEGO, suszony pomidor, cebula, koper włoski, regulatory kwasowości (E330, E270), ocet winny, marchew, sól morska, skrobia modyfikowana, tabasco. Panier: BIAŁKO JAJ, woda, sól, JAJA, mąka PSZENNA, gluten PSZENNY, modyfikowana skrobia PSZENNA (pełny wykaz składników na opakowaniu).',
      allergens: 'Jaja, gluten (pszenica), mleko, gorczyca, seler, soja · może zawierać orzeszki ziemne i orzechy',
      nutrition: [['Energia', '746 kJ / 178 kcal'], ['Tłuszcz', '7 g'], ['— w tym kwasy nasycone', '3,4 g'], ['Węglowodany', '20,5 g'], ['— w tym cukry', '0,6 g'], ['Błonnik', '0,5 g'], ['Białko', '7,5 g'], ['Sól', '1,9 g']],
      storage: 'Przechowywać w -18°C. Po rozmrożeniu trzymać w maks. 6°C i zużyć w ciągu 72 h.' } },

  { id: 'holtkamp-garnaal', cat: 'bitterballen', name: 'Holtkamp Bitterbal z krewetkami · 30 g', price: 18900, unit: '30 szt. × 30 g', badge: 'PREMIUM', icon: 'bitterbal', img: 'holtkamp-garnaal.webp',
    desc: 'Bitterbal z 30% holenderskich krewetek północnomorskich w kremowym ragù — morska elegancja od Holtkamp. Do kieliszka wytrawnego białego wina.',
    details: { prep: [['🍟 Frytkownica', '175°C · ok. 5,5 min z zamrożenia (3 min po rozmrożeniu) · najlepiej rozmrozić powoli w lodówce']],
      ingredients: 'Ragout: woda, mąka PSZENNA, KREWETKI północnomorskie, olej roślinny (utwardzony), śmietanka (MLEKO), żelatyna wołowa, cebula, pietruszka, sól, zioła i przyprawy (gałka muszkatołowa, pieprz mielony), cytryna, papryczka chili, aromat, JAJA, emulgatory (E471, E477), enzymy, suszony syrop glukozowy, tłuszcz roślinny (palmowy), skrobia modyfikowana (E1414), ekstrakt drożdżowy, bulion cielęcy, barwnik (E160a), ekstrakt z czosnku, ekstrakt z LANGUSTYNEK, białko z soczewicy, kukurydza ekstrudowana, skrobia kukurydziana, MLEKO w proszku, ekstrakt z papryki, olej rzepakowy, wzmacniacz smaku (E621), hydrolizowane białko SOJOWE, stabilizatory (E407, E415), mąka ze słodu PSZENNEGO, ekstrakt z cebuli, RYBY w proszku, kwas mlekowy, ocet winny, regulator kwasowości (E330), sherry, tabasco. Panier: BIAŁKO JAJ, woda, sól, JAJA, mąka PSZENNA, gluten PSZENNY, skrobia PSZENNA (pełny wykaz składników na opakowaniu).',
      allergens: 'Skorupiaki, jaja, gluten (pszenica), mleko, ryby, mięczaki, soja · może zawierać orzeszki ziemne, orzechy, gorczycę i sezam',
      nutrition: [['Energia', '703 kJ / 168 kcal'], ['Tłuszcz', '5,8 g'], ['— w tym kwasy nasycone', '2,9 g'], ['Węglowodany', '18,8 g'], ['— w tym cukry', '0,5 g'], ['Błonnik', '0,4 g'], ['Białko', '9,4 g'], ['Sól', '0,8 g']],
      storage: 'Przechowywać w -18°C. Po rozmrożeniu trzymać w maks. 6°C i zużyć w ciągu 72 h.' } },

  { id: 'holtkamp-kreeft', cat: 'bitterballen', name: 'Holtkamp Bitterbal z homarem · 30 g', price: 21900, unit: '30 szt. × 30 g', badge: 'LUKSUS', icon: 'bitterbal', img: 'holtkamp-kreeft.webp',
    desc: 'Homar w bitterbalu — z koniakiem, świeżym czosnkiem i bazylią. Najbardziej luksusowa kulka Holandii, na specjalne okazje albo po prostu dlatego, że można.',
    details: { prep: [['🍟 Frytkownica', '175°C · ok. 5,5 min z zamrożenia (3 min po rozmrożeniu) · najlepiej rozmrozić powoli w lodówce']],
      ingredients: 'Bulion z HOMARA (woda, LANGUSTYNKI, pulpa z KREWETEK, cebulka, świeży imbir, czosnek, papryczka chili), masło (MLEKO), cebulka, koncentrat pomidorowy (pomidory, sól), mąka PSZENNA, sól, gałka muszkatołowa, biały pieprz, solone żółtko JAJ (żółtko z chowu ściółkowego, E330, E202, sól), ŚMIETANKA (MLEKO, E407), koniak, tabasco (czerwona papryka, ocet naturalny), sok z cytryny, bazylia, żelatyna, mięso RAKA rzecznego, BIAŁKO JAJ (z chowu ściółkowego), pasteryzowane żółtko JAJ, skrobia kukurydziana, składniki MLEKA w proszku (E330, E500, E410), oleje roślinne (słonecznikowy, palmowy, rzepakowy, E900), bułka tarta drobna i gruba (woda, sól, drożdże, mąka PSZENNA (białka PSZENICY)).',
      allergens: 'Skorupiaki, jaja, gluten (pszenica), mleko',
      nutrition: [['Energia', '597 kJ / 143 kcal'], ['Tłuszcz', '6,4 g'], ['— w tym kwasy nasycone', '3,6 g'], ['Węglowodany', '11,7 g'], ['— w tym cukry', '0,4 g'], ['Białko', '7,5 g'], ['Sól', '0,5 g']],
      storage: 'Przechowywać w -18°C. Po rozmrożeniu trzymać w maks. 6°C i zużyć w ciągu 72 h.' } },

  { id: 'holtkamp-oude-kaas', cat: 'bitterballen', name: 'Holtkamp Bitterbal z serem dojrzewającym · 30 g', price: 15900, unit: '30 szt. × 30 g', badge: 'SEROWE', icon: 'bitterbal', img: 'holtkamp-oude-kaas.webp',
    desc: 'Kremowe wnętrze z dojrzewającego holenderskiego sera i sera Blue des Causses, na bazie bulionu warzywnego — bitterbal serowy w wydaniu premium.',
    details: { prep: [['🍟 Frytkownica', '175°C · ok. 5,5 min z zamrożenia (3 min po rozmrożeniu) · najlepiej rozmrozić powoli w lodówce']],
      ingredients: 'Bulion SEROWY (woda, sól, biały pieprz, włoszczyzna (marchew, por, SELER naciowy), przyprawa (białka PSZENICY, woda, aromat, glutaminian sodu, inozynian disodowy, sól, cukier)), margaryna (oleje i tłuszcze roślinne, woda, składniki MLEKA, E471, E330, lecytyna SOJOWA, E270, E202, aromat, E160a), pulpa czosnkowa (czosnek, sól, E330, E223, kwas cytrynowy), cebulka, MUSZTARDA (woda, nasiona GORCZYCY, sól, ocet naturalny, przyprawy, naturalny aromat), mąka PSZENNA, sól, biały i czarny pieprz, gałka muszkatołowa, pieprz cayenne, solone żółtko JAJ, ŚMIETANKA (MLEKO, E407), tabasco, sok z cytryny, SER dojrzewający, ser Blue des Causses (MLEKO), pietruszka, BIAŁKO JAJ, pasteryzowane żółtko JAJ, skrobia kukurydziana, składniki MLEKA w proszku (E330, E500, E410), oleje roślinne (słonecznikowy, palmowy, rzepakowy, E900), bułka tarta drobna i gruba (woda, sól, drożdże, mąka PSZENNA) (pełny wykaz składników na opakowaniu).',
      allergens: 'Gluten (pszenica), jaja, mleko, gorczyca, seler, soja · zawiera siarczyny (E223)',
      nutrition: [['Energia', '490 kJ / 117 kcal'], ['Tłuszcz', '8,7 g'], ['— w tym kwasy nasycone', '4,8 g'], ['Węglowodany', '10,3 g'], ['— w tym cukry', '2,2 g'], ['Błonnik', '0,7 g'], ['Białko', '1,7 g'], ['Sól', '0,5 g']],
      storage: 'Przechowywać w -18°C. Po rozmrożeniu trzymać w maks. 6°C i zużyć w ciągu 72 h.' } },

  { id: 'la-trappe-bitterbal', top: true, cat: 'bitterballen', name: 'Bitterbal La Trappe Quadrupel · 64 szt.', price: 19900, unit: '64 szt. × 30 g', badge: 'Z PIWEM TRAPISTÓW', icon: 'bitterbal', img: 'la-trappe-bitterbal.webp',
    desc: 'Ragù wołowe na bulionie z 15% dodatkiem piwa trapistów La Trappe Quadrupel. Głęboki, słodowo-karmelowy smak — bitterbal dla koneserów. Idealna para: to samo piwo w szklance.',
    details: { prep: [['🍟 Frytkownica', '175°C · 5 min z zamrożenia (2,5 min po rozmrożeniu) · maks. 8 szt. naraz'], ['💨 Airfryer', '180°C · 9–10 min z zamrożenia']],
      ingredients: 'Bulion wołowy (woda, wołowina), piwo La Trappe Quadrupel 15% (woda, słód JĘCZMIENNY (GLUTEN), chmiel, drożdże), wołowina 12,5%, bułka tarta (mąka PSZENNA (GLUTEN), woda, otręby PSZENNE, cukier, drożdże, sól, margaryna, ekstrakt słodowy (JĘCZMIEŃ, GLUTEN), barwnik E160b), margaryna (oleje roślinne: palmowy, rzepakowy), sól, emulgator (E471), regulator kwasowości: kwas MLEKOWY, cebula, modyfikowana skrobia kukurydziana, panier (mąka łubinowa, skrobia PSZENNA, substancje zagęszczające (E412, E466), emulgatory (E451, E450), substancje przeciwzbrylające (E341, E551)), hydrolizowane białko SOJOWE i JAJ, emulgator (E464), zioła i przyprawy (zawierają SELER).',
      allergens: 'Jaja, gluten (pszenica, jęczmień), łubin, mleko, seler, soja',
      nutrition: [['Energia', '709 kJ / 169 kcal'], ['Tłuszcz', '6,2 g'], ['— w tym kwasy nasycone', '2 g'], ['Węglowodany', '19,2 g'], ['— w tym cukry', '1,6 g'], ['Błonnik', '1,7 g'], ['Białko', '8,3 g'], ['Sól', '1,2 g']],
      storage: 'Produkt głęboko mrożony (-18°C). Po rozmrożeniu nie zamrażać ponownie. Nie smażyć częściowo rozmrożonych.' } },

  { id: 'mora-bitterbal-vege', cat: 'bitterballen', name: 'Mora Bitterbal wegetariański · 25 g', price: 10900, unit: '54 szt. × 25 g', badge: 'WEGE · PROMOCJA', icon: 'bitterbal', img: 'mora-bitterbal-vege.webp',
    desc: 'Wegetariański bitterbal od Mora — największej marki snackowej w Holandii. Duży karton, mała cena.',
    details: { prep: [['🍟 Frytkownica', '175°C · ok. 5 min z zamrożenia (2–3 min po rozmrożeniu)'], ['💨 Airfryer', '180°C · 9 min z zamrożenia']],
      ingredients: 'Woda, mąka (zawiera PSZENICĘ), wegetariańskie „draadjesvleesch" 8% (woda, białko JAJ w proszku*, stabilizatory: guma ksantanowa i E401, barwnik: E150d), oleje roślinne (palmowy, słonecznikowy), masło (zawiera MLEKO), sól, naturalny aromat (zawiera SELER), skrobia modyfikowana, laktoza (MLEKO), substancja zagęszczająca: agar, przyprawy, zioła, cukier, syrop glukozowy, białka MLEKA, dekstroza, drożdże, stabilizator: E466, białko roślinne (zawiera PSZENICĘ). *z chowu na wolnym wybiegu. Może zawierać śladowe ilości ORZESZKÓW ZIEMNYCH.',
      allergens: 'Jaja, gluten (pszenica), mleko, seler · może zawierać orzeszki ziemne',
      nutrition: [['Energia', '853 kJ / 204 kcal'], ['Tłuszcz', '9,4 g'], ['— w tym kwasy nasycone', '4,2 g'], ['Węglowodany', '24 g'], ['— w tym cukry', '1,5 g'], ['Błonnik', '1,3 g'], ['Białko', '5,1 g'], ['Sól', '1,3 g']],
      storage: 'Przechowywać w -18°C. W lodówce (maks. 7°C): 48 h. Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'captain-food-vegan', cat: 'bitterballen', name: 'Captain Food Bitterbal vegan · 30 g', price: 11900, unit: '54 szt. × 30 g', badge: 'VEGAN · PROMOCJA', icon: 'bitterbal', img: 'captain-food-vegan.webp',
    desc: 'W 100% roślinny bitterbal, który smakuje jak oryginał. Nikt na imprezie nie zauważy różnicy — sprawdzone.',
    details: { prep: [['🍟 Frytkownica', '175°C · ok. 5 min z zamrożenia (3 min po rozmrożeniu)'], ['💨 Airfryer', '180°C · 9 min z zamrożenia']],
      ingredients: 'Woda, mąka PSZENNA, oleje i tłuszcze roślinne (słonecznikowy, kokosowy, rzepakowy), białko roślinne (ŁUBIN, PSZENICA, kukurydza), skrobia (PSZENNA, ziemniaczana), hydrolizowane białko roślinne (SOJA), błonnik roślinny, cebula, sok z cytryny, dekstroza, maltodekstryna, suszony syrop glukozowy, drożdże, ekstrakt drożdżowy, cukier, sól, agar, pietruszka, zioła i przyprawy (m.in. SELER, nasiona GORCZYCY), barwniki (E150a i E150c), substancja zagęszczająca E461, aromat.',
      allergens: 'Gluten (pszenica), łubin, soja, seler, gorczyca',
      nutrition: [['Energia', '756 kJ / 185 kcal'], ['Tłuszcz', '8,9 g'], ['— w tym kwasy nasycone', '4,6 g'], ['Węglowodany', '20,9 g'], ['— w tym cukry', '0,9 g'], ['Białko', '4,5 g'], ['Sól', '1,3 g']],
      storage: 'Przechowywać w -18°C. Po rozmrożeniu: 48 h w lodówce (maks. 7°C). Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'oesterzwam-bitterbal', cat: 'bitterballen', name: 'Bitterbal z boczniaków · 30 g (vegan)', price: 13900, unit: '30 szt. × 30 g', badge: 'VEGAN', icon: 'bitterbal', img: 'oesterzwam-bitterbal.webp',
    desc: 'Roślinny bitterbal od GRO na bazie boczniaków hodowanych cyrkularnie na fusach z kawy — mięsista struktura, głębia umami i chrupiąca panierka panko.',
    details: { prep: [['🍟 Frytkownica', 'maks. 175°C · 4–5 min z zamrożenia (3–4 min po rozmrożeniu), po usmażeniu odczekać 1 min'], ['💨 Airfryer', '180°C · 9 min z zamrożenia']],
      ingredients: 'Woda, mąka PSZENNA, SELER korzeniowy, boczniaki, olej palmowy, śmietanka roślinna (woda, olej z ziaren palmowych, substancja zagęszczająca: E420, emulgatory: E435, E472e, E464, syrop glukozowy, sól, aromat), cebula, emulgatory: E464, E471, syrop glukozowy, skrobia ziemniaczana, drożdże, aromat, sól, dekstroza, regulator kwasowości: E330, stabilizator: E450, borowiki, suszone płatki ziemniaczane, karmelizowany cukier, ekstrakt drożdżowy, maltodekstryna, naturalny aromat, ekstrakt z grzybów, por, cukier, pietruszka, substancja zagęszczająca: E466, cukry (cukier, syrop cukru inwertowanego, barwnik: E150a), przeciwutleniacz: E304, oleje roślinne (rzepakowy, słonecznikowy), zioła i przyprawy (SELER, pieprz, czosnek, chili, liść laurowy).',
      allergens: 'Gluten (pszenica), seler',
      nutrition: [['Energia', '762 kJ / 181 kcal'], ['Tłuszcz', '8,1 g'], ['— w tym kwasy nasycone', '4,3 g'], ['Węglowodany', '22,3 g'], ['— w tym cukry', '1,3 g'], ['Błonnik', '2,9 g'], ['Białko', '3,7 g'], ['Sól', '1 g']],
      storage: 'Przechowywać w -18°C. Po rozmrożeniu: 2 dni w lodówce (maks. 4°C). Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'kwekkeboom-rundvleeskroket', cat: 'bitterballen', name: 'Kwekkeboom Kroket wołowy · 100 g', price: 8900, unit: '10 × 100 g', badge: null, icon: 'kroket', img: 'kwekkeboom-rundvleeskroket.webp',
    desc: 'Pełnowymiarowy kroket wołowy 100 g. Holendrzy jedzą go w bułce — „broodje kroket". Marka premium z Amsterdamu.',
    details: { prep: [['🍟 Frytkownica', '175°C · 8 min z zamrożenia (4 min po rozmrożeniu)'], ['💨 Airfryer', '180°C · 11–12 min z zamrożenia']],
      ingredients: 'Woda, mąka PSZENNA, 12% gotowana wołowina (84% wołowina, woda, białko SOJOWE, sól, błonnik (ziemniaczany, bambusowy, cytrusowy, inulina), naturalny aromat (zawiera SOJĘ)), oleje roślinne (palmowy, rzepakowy), 3% śmietanka (MLEKO), sól, żelatyna wołowa, mąka ŁUBINOWA, sos sojowy (woda, ziarna SOI, skrobia PSZENNA, sól), cebula, skrobia PSZENNA, aromat (zawiera SOJĘ, SELER), substancje zagęszczające (E466, mączka guar), przyprawy (zawierają pieprz), wzmacniacz smaku (E621), ekstrakt drożdżowy, zioła (zawierają SELER), drożdże, dekstroza, hydrolizowane białko PSZENNE, maltodekstryna, stabilizatory (E451, E450), suszona cebula, kwas mlekowy, syrop z palonego cukru, ekstrakt z kurkumy, ekstrakt warzywny.',
      allergens: 'Gluten (pszenica), łubin, mleko, seler, soja · może zawierać orzeszki ziemne',
      nutrition: [['Energia', '797 kJ / 190 kcal'], ['Tłuszcz', '9,1 g'], ['— w tym kwasy nasycone', '4,9 g'], ['Węglowodany', '19,6 g'], ['— w tym cukry', '2,2 g'], ['Białko', '6,5 g'], ['Sól', '1,1 g']],
      storage: 'Przechowywać w -18°C. Po rozmrożeniu nie zamrażać ponownie. Maks. 48 h w lodówce (maks. 4°C).' } },

  { id: 'kwekkeboom-kalfsvleeskroket', cat: 'bitterballen', name: 'Kwekkeboom Kroket cielęcy · 90 g', price: 9900, unit: '10 × 90 g', badge: 'PREMIUM', icon: 'kroket', img: 'kwekkeboom-kalfsvleeskroket.webp',
    desc: 'Najszlachetniejsza wersja kroketa — z 14% delikatnej cielęciny w ragù z nutą czerwonego wina. Klasa sama w sobie.',
    details: { prep: [['🍟 Frytkownica', '175°C · 8 min z zamrożenia (4 min po rozmrożeniu)'], ['💨 Airfryer', '180°C · 11–12 min z zamrożenia']],
      ingredients: 'Woda, mąka PSZENNA, 14% gotowana cielęcina (91% cielęcina, skrobia PSZENNA, woda, sól, białko MLEKA, stabilizator (E450)), koncentrat pełnego MLEKA, oleje roślinne (palmowy, rzepakowy, słonecznikowy, oliwa), 2% śmietanka (MLEKO), cebula, sól, żelatyna wołowa, hydrolizowane białko roślinne (SOJA, PSZENICA), mąka ŁUBINOWA, skrobia PSZENNA, zioła (zawierają SELER), wzmacniacz smaku (E621), przyprawy, dekstroza, drożdże, barwniki (biksyna i norbiksyna annato, E150c), substancje zagęszczające (mączka guar, E466), aromat, skoncentrowany bulion wołowy, ocet, cukier, suszone warzywa (cebula, czosnek), ekstrakt drożdżowy, stabilizatory (E451, E450), <2% bulion cielęcy, glukoza, czerwone wino, tłuszcz wołowy, koncentrat pomidorowy, ekstrakt z kurkumy, maltodekstryna, ekstrakt warzywny.',
      allergens: 'Gluten (pszenica), łubin, mleko, seler, soja · może zawierać orzeszki ziemne',
      nutrition: [['Energia', '836 kJ / 200 kcal'], ['Tłuszcz', '10,8 g'], ['— w tym kwasy nasycone', '5,7 g'], ['Węglowodany', '19 g'], ['— w tym cukry', '2,1 g'], ['Białko', '6,3 g'], ['Sól', '1,5 g']],
      storage: 'Przechowywać w -18°C. Po rozmrożeniu nie zamrażać ponownie. Najlepiej rozmrażać w lodówce.' } },

  { id: 'kwekkeboom-oven-croquetten', cat: 'bitterballen', name: 'Kwekkeboom Krokiety do piekarnika · 70 g', price: 9900, unit: '4 × 5 szt. × 70 g', badge: 'PIEKARNIK / AIRFRYER', icon: 'kroket', img: 'kwekkeboom-oven-croquetten.webp',
    desc: 'Krokiety wołowe, które piecze się zamiast smażyć — chrupiące z piekarnika lub airfryera, bez kropli oleju.',
    details: { prep: [['🔥 Piekarnik', '220°C · 11 min z zamrożenia (nie rozmrażać!), po upieczeniu odczekać min. 2 min'], ['💨 Airfryer', '200°C · ok. 9 min z zamrożenia']],
      ingredients: 'Woda, mąka PSZENNA, olej roślinny (rzepakowy, palmowy), 14% gotowana wołowina, 2% śmietanka (MLEKO), sól, aromat (zawiera SOJĘ, SELER), białko SOJOWE, stabilizatory (E466), substancje zagęszczające (polidekstroza, E461, E415), skrobia (zawiera PSZENICĘ), żelatyna wołowa, zioła i przyprawy (zawierają SELER), mąka SOJOWA, skrobia modyfikowana, barwniki (E160b, karmel), białko JAJ kurzych, ekstrakt drożdżowy, błonnik (ziemniaczany, bambusowy, cytrusowy, inulina), ziarna SOI, substancja konserwująca (E223 — zawiera SIARCZYNY), glukoza, maltodekstryna, hydrolizowane białko kukurydziane, suszona cebula, kwas mlekowy, białko MLEKA, palony cukier, syrop z palonego cukru, przeciwutleniacz: ekstrakt z rozmarynu. Wyprodukowano w zakładzie przetwarzającym orzeszki ziemne.',
      allergens: 'Jaja, gluten (pszenica), mleko, seler, soja, siarczyny · może zawierać orzeszki ziemne',
      nutrition: [['Energia', '1086 kJ / 260 kcal'], ['Tłuszcz', '15,8 g'], ['— w tym kwasy nasycone', '4,5 g'], ['Węglowodany', '21,1 g'], ['— w tym cukry', '1,4 g'], ['Białko', '8,4 g'], ['Sól', '1,4 g']],
      storage: 'Przechowywać w -18°C. Nie rozmrażać przed przygotowaniem!' } },

  { id: 'old-amsterdam-croquetten', cat: 'bitterballen', name: 'Kwekkeboom Krokiety Old Amsterdam · 60 g', price: 9900, unit: '20 × 60 g · piekarnik', badge: 'SEROWE', icon: 'kroket', img: 'old-amsterdam-croquetten.webp',
    desc: 'Serowe krokiety z Old Amsterdam do piekarnika — gratka dla fanów sera (nie nadają się do frytkownicy).',
    details: { prep: [['🔥 Piekarnik', '220°C · 10 min z zamrożenia (nie rozmrażać!), po upieczeniu odczekać min. 2 min'], ['💨 Airfryer', '200°C · ok. 9 min z zamrożenia']],
      ingredients: 'Woda, mąka (PSZENICA, SOJA), 9% ser 48+ (pasteryzowane MLEKO, sól, kultury bakterii (zawierają MLEKO), podpuszczka, substancja konserwująca (E251), barwnik (karoteny)), oleje roślinne (palmowy, rzepakowy, słonecznikowy), koncentrat pełnego MLEKA, olej rzepakowy, śmietanka (MLEKO), sól, białko roślinne (SOJA), żelatyna wołowa, aromat (zawiera MLEKO, SOJĘ, PSZENICĘ), skrobia (kukurydziana, ziemniaczana), substancje zagęszczające (E466, E461, E415, E412), ekstrakt drożdżowy, dekstroza, barwniki (E150a, E160b), cebula, MLEKO w proszku, stabilizator (E407), białko MLEKA, zioła, przeciwutleniacz (E392), substancja spulchniająca (E500), przyprawy, marchew.',
      allergens: 'Gluten (pszenica), mleko, soja',
      nutrition: [['Energia', '1233 kJ / 296 kcal'], ['Tłuszcz', '18 g'], ['— w tym kwasy nasycone', '6,8 g'], ['Węglowodany', '24,2 g'], ['— w tym cukry', '2,1 g'], ['Błonnik', '2,1 g'], ['Białko', '8,1 g'], ['Sól', '1,7 g']],
      storage: 'Przechowywać w -18°C. Nie rozmrażać przed przygotowaniem! Uwaga: produkt nie nadaje się do frytkownicy.' } },

  { id: 'kwekkeboom-kaashapjes', cat: 'bitterballen', name: 'Kwekkeboom Kaashapjes · 12 szt.', price: 4900, unit: '12 × 20 g · piekarnik', badge: 'WEGE', icon: 'kaassouffle', img: 'kwekkeboom-kaashapjes.webp',
    desc: 'Małe serowe kąski do piekarnika — 49% sera cheddar w chrupiącej otoczce. Idealne obok bitterballen na desce przekąsek.',
    details: { prep: [['🔥 Piekarnik', '220°C · 10 min z zamrożenia, po upieczeniu odczekać 2 min'], ['💨 Airfryer', '200°C · ok. 7 min z zamrożenia']],
      ingredients: '49% ser topiony cheddar 45+ (19% ser cheddar (pasteryzowane MLEKO, sól, kultury bakterii kwasu mlekowego, podpuszczka mikrobiologiczna, substancja konserwująca (E509)), 13% ser (MLEKO), woda, masło (MLEKO), białko MLEKA, skrobia kukurydziana, sole emulgujące (E339, E452, E331), sól, barwniki (karoteny, ekstrakt z papryki)), mąka (PSZENICA, SOJA), woda, olej rzepakowy, modyfikowana skrobia PSZENNA, sól, skrobia kukurydziana, barwnik (karmel), substancje zagęszczające (guma ksantanowa, mączka guar, E466), drożdże, substancja spulchniająca (E500), przeciwutleniacz (ekstrakt z rozmarynu).',
      allergens: 'Gluten (pszenica), mleko, soja',
      nutrition: [['Energia', '1415 kJ / 340 kcal'], ['Tłuszcz', '22 g'], ['— w tym kwasy nasycone', '7,7 g'], ['Węglowodany', '23 g'], ['— w tym cukry', '1,6 g'], ['Białko', '12 g'], ['Sól', '2,5 g']],
      storage: 'Przechowywać w -18°C. Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'rotterdamse-kroket', cat: 'bitterballen', name: 'Rotterdamse Kroket · 24 szt.', price: 9900, unit: '24 × 100 g', badge: 'PROMOCJA', icon: 'kroket', img: 'rotterdamse-kroket.webp',
    desc: 'Solidny kroket z Rotterdamu w dużym kartonie — konkret bez zadęcia, idealny do bułki na drugie śniadanie po holendersku.',
    details: { prep: [['🍟 Frytkownica', '180°C · 5 min z zamrożenia'], ['💨 Airfryer', '180°C · 11–12 min z zamrożenia']],
      ingredients: 'Woda, mąka (PSZENICA, SOJA), 16,6% wkład mięsny (72% wołowina, woda, skrobia ziemniaczana, sól, cukier, stabilizatory (E450, E451), przeciwutleniacze (E300, E330), substancja zagęszczająca (E407)), tłuszcze roślinne (palmowy, nieutwardzony), skrobia (kukurydziana, ziemniaczana), żelatyna, syrop glukozowy, ocet w proszku, brązowy cukier, modyfikowana skrobia PSZENNA, aromat (zawiera SOJĘ, GLUTEN), sól, białko JAJ kurzych, drożdże, substancja żelująca (E407a), barwnik (E150d), hydrolizat białka roślinnego (zawiera SOJĘ), ekstrakt przypraw (zawiera GORCZYCĘ), dekstroza, zioła (SELER), ekstrakt drożdżowy, przeciwutleniacz (E330), przyprawy, oleje roślinne (słonecznikowy), substancje zagęszczające (E464, E412, E415), stabilizatory (E508, E466), wzmacniacze smaku (E631, E621), cebula.',
      allergens: 'Jaja, gluten (pszenica), gorczyca, seler, soja',
      nutrition: [['Energia', '717 kJ / 166 kcal'], ['Tłuszcz', '6,7 g'], ['— w tym kwasy nasycone', '3,3 g'], ['Węglowodany', '20,5 g'], ['— w tym cukry', '0,9 g'], ['Białko', '5,8 g'], ['Sól', '0,5 g']],
      storage: 'Produkt głęboko mrożony (-18°C). Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'amsterdamse-kroket', cat: 'bitterballen', name: 'Amsterdamse Kroket wołowy · 18 szt.', price: 16900, unit: '18 × 100 g', badge: 'RZEMIEŚLNICZY', icon: 'kroket', img: 'amsterdamse-kroket.webp',
    desc: 'Rzemieślniczy kroket od Amsterdamse Croquetten — gęste, wolno gotowane ragù wołowe. Stołeczna klasa do pary z ich bitterballen.',
    details: { prep: [['🍟 Frytkownica', '175°C · 7 min z zamrożenia (3 min po rozmrożeniu), po usmażeniu odczekać ok. 1 min'], ['💨 Airfryer', '180°C · 11–12 min z zamrożenia']],
      ingredients: 'Woda, bułka tarta (mąka PSZENNA, sól, woda, drożdże), 12% gotowana wołowina (wołowina, woda, sól morska, modyfikowana skrobia kukurydziana, regulator kwasowości (E640), sól, stabilizatory (E450, E451)), mąka PSZENNA, oleje roślinne (rzepakowy), cebula, żelatyna wołowa, sól, przyprawy (SELER), suszony syrop glukozowy, dekstroza, aromat (SELER), ekstrakt wołowy, emulgator (E466), laktoza (MLEKO), zioła, ekstrakt drożdżowy, gluten PSZENNY, sos sojowy (maltodekstryna, sól, ziarna SOI, PSZENICA, woda), tłuszcz palmowy, wołowina w proszku, stabilizator (E450), skrobia ziemniaczana, karmelizowany cukier, regulator kwasowości (węglany sodu).',
      allergens: 'Gluten (pszenica), mleko, seler, soja',
      nutrition: [['Energia', '762 kJ / 182 kcal'], ['Tłuszcz', '7,7 g'], ['— w tym kwasy nasycone', '0,8 g'], ['Węglowodany', '21,3 g'], ['— w tym cukry', '1 g'], ['Białko', '6,9 g'], ['Sól', '1,2 g']],
      storage: 'Przechowywać w -18°C. Po rozmrożeniu: 2 dni w lodówce (4°C). Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'mora-kroket-vege', cat: 'bitterballen', name: 'Mora Kroket wegetariański · 21 szt.', price: 13900, unit: '21 × 75 g', badge: 'WEGE · PROMOCJA', icon: 'kroket', img: 'mora-kroket-vege.webp',
    desc: 'Wegetariański kroket od największej marki snackowej Holandii — kremowe wnętrze bez grama mięsa.',
    details: { prep: [['🍟 Frytkownica', '175°C · ok. 6 min z zamrożenia (3–4 min po rozmrożeniu)'], ['💨 Airfryer', '180°C · 10–11 min z zamrożenia']],
      ingredients: 'Woda, mąka (zawiera PSZENICĘ), wegetariańskie „draadjesvleesch" 8% (woda, białko JAJ w proszku*, stabilizatory: E401 i guma ksantanowa, barwnik: E150d), oleje roślinne (palmowy, słonecznikowy), masło (zawiera MLEKO), sól, naturalny aromat (zawiera SELER), skrobia modyfikowana, laktoza (MLEKO), substancja zagęszczająca: agar, przyprawy, zioła, cukier, białka MLEKA, syrop glukozowy, drożdże, dekstroza, stabilizator: E466, białko roślinne (zawiera PSZENICĘ). *z chowu na wolnym wybiegu. Może zawierać śladowe ilości ORZESZKÓW ZIEMNYCH.',
      allergens: 'Jaja, gluten (pszenica), mleko, seler · może zawierać orzeszki ziemne',
      nutrition: [['Energia', '852 kJ / 203 kcal'], ['Tłuszcz', '9,3 g'], ['— w tym kwasy nasycone', '4,1 g'], ['Węglowodany', '24 g'], ['— w tym cukry', '1,6 g'], ['Błonnik', '1,4 g'], ['Białko', '5,2 g'], ['Sól', '1,3 g']],
      storage: 'Przechowywać w -18°C. W lodówce (maks. 7°C): 48 h. Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'captain-kroket-vegan', cat: 'bitterballen', name: 'Captain Food Kroket vegan · 20 szt.', price: 11900, unit: '20 × 100 g', badge: 'VEGAN · PROMOCJA', icon: 'kroket', img: 'captain-kroket-vegan.webp',
    desc: 'Pełnowymiarowy kroket 100 g w wersji 100% roślinnej. „Broodje kroket" bez kompromisów.',
    details: { prep: [['🍟 Frytkownica', '175°C · ok. 7 min z zamrożenia (5 min po rozmrożeniu)'], ['💨 Airfryer', '180°C · 11 min z zamrożenia']],
      ingredients: 'Woda, mąka PSZENNA, oleje i tłuszcze roślinne (słonecznikowy, kokosowy, rzepakowy), białko roślinne (ŁUBIN, PSZENICA, kukurydza), skrobia (PSZENNA, ziemniaczana), hydrolizowane białko roślinne (SOJA), błonnik roślinny, cebula, sok z cytryny, dekstroza, maltodekstryna, suszony syrop glukozowy, drożdże, ekstrakt drożdżowy, cukier, sól, agar, pietruszka, zioła i przyprawy (m.in. SELER, nasiona GORCZYCY), barwniki (E150a i E150c), substancja zagęszczająca E461, aromat.',
      allergens: 'Gluten (pszenica), łubin, soja, seler, gorczyca',
      nutrition: [['Energia', '756 kJ / 185 kcal'], ['Tłuszcz', '8,9 g'], ['— w tym kwasy nasycone', '4,6 g'], ['Węglowodany', '20,6 g'], ['— w tym cukry', '0,9 g'], ['Białko', '4,5 g'], ['Sól', '1,3 g']],
      storage: 'Przechowywać w -18°C. Po rozmrożeniu: 48 h w lodówce (maks. 7°C). Po rozmrożeniu nie zamrażać ponownie.' } },

  { id: 'cas-mini-kroket-chorizo', cat: 'bitterballen', name: 'Mini kroket chorizo · 30 g', price: 12900, unit: '30 szt. × 30 g', badge: 'HISZPAŃSKI TWIST', icon: 'kroket', img: 'cas-mini-kroket-chorizo.webp',
    desc: 'Mini kroket od CAS Culinair z wołowym chorizo i dojrzewającym serem z Middenbeemster — holendersko-hiszpańska fuzja na deskę przekąsek. Ostrzejszy kuzyn bitterbala.',
    details: { prep: [['🍟 Frytkownica', '175°C · 5 min z zamrożenia (3 min po rozmrożeniu), po usmażeniu odczekać ok. 1 min'], ['💨 Airfryer', '180°C · 9 min z zamrożenia']],
      ingredients: 'Woda, bułka tarta (mąka PSZENNA (GLUTEN), drożdże, cukier, sól, gluten PSZENNY, barwnik (E160b), przeciwutleniacz (E300)), 10% chorizo (wołowina, sól, zioła i przyprawy, cukier, laktoza (MLEKO), białka MLEKA, substancja konserwująca (E252), przeciwutleniacz (E301)), mąka PSZENNA (GLUTEN), olej palmowy, ser dojrzewający (MLEKO krowie, sól, barwnik (E160b), kultury bakterii, skrobia ziemniaczana, podpuszczka), olej rzepakowy, cebula, mieszanka panierująca (suszony syrop glukozowy, cukier, dekstroza, emulgatory (E466, E500), sól, mąka PSZENNA (GLUTEN), ciemny cukier, gluten PSZENNY, stabilizator (E450)), żelatyna wołowa, emulgator, przyprawy (m.in. SELER), sól, wzmacniacze smaku (E621, E631), zioła, aromat, sok z cytryny, skrobia PSZENNA, dekstroza, skrobia ziemniaczana, maltodekstryna, warzywa, ekstrakt drożdżowy, cukier, tłuszcz palmowy, hydrolizowane białko roślinne (zawiera GLUTEN, PSZENICĘ), aromat (zawiera JAJA), olej słonecznikowy, hydrolizowane białko SOJOWE (pełny wykaz składników na opakowaniu).',
      allergens: 'Jaja, gluten (pszenica), mleko, seler, soja · może zawierać orzeszki ziemne',
      nutrition: [['Energia', '966 kJ / 231 kcal'], ['Tłuszcz', '12,3 g'], ['— w tym kwasy nasycone', '5,3 g'], ['Węglowodany', '21,3 g'], ['— w tym cukry', '1,2 g'], ['Białko', '8,1 g'], ['Sól', '1 g']],
      storage: 'Przechowywać w -18°C. Po rozmrożeniu: 2 dni w lodówce (4°C).' } },

  { id: 'ambachterie-zeeuws-spek', cat: 'bitterballen', name: 'Kroket z boczkiem zelandzkim · 65 g', price: 11900, unit: '20 × 65 g', badge: 'SPECJALNOŚĆ', icon: 'kroket', img: 'ambachterie-zeeuws-spek.webp',
    desc: 'Rzemieślniczy kroket z 25% boczku zelandzkiego marki Scheldelander, peklowanego w filtrowanej wodzie z Oosterschelde. Ragù dopełnione mieszanką przypraw i sosem ketjap — dymny, głęboki smak od De Ambachterie.',
    details: { prep: [['🍟 Frytkownica', '175°C · 6 min z zamrożenia'], ['💨 Airfryer', '180°C · 10 min z zamrożenia']],
      ingredients: 'MLEKO, boczek zelandzki 25% (mięso wieprzowe, woda z Oosterschelde, suszony syrop glukozowy, cukier, syrop z palonego cukru, zioła i przyprawy (zawierają SELER, SOJĘ, PSZENICĘ — GLUTEN), olej słonecznikowy, naturalny aromat (zawiera SELER), regulator kwasowości: E330, wzmacniacz smaku: E621, przeciwutleniacze: E301, E331, substancja zagęszczająca: E407, stabilizatory: E450, E451), mąka PSZENNA, margaryna (oleje i tłuszcze roślinne (palmowy, rzepakowy), woda, emulgator: E471, regulator kwasowości: E330), śmietanka (skrobia), żółtko JAJ kurzych, ketjap (melasa, woda, sól, hydrolizat białka SOJOWEGO, barwnik: E150c, substancje zagęszczające: E407, E412, E466, regulator kwasowości: E330, substancja konserwująca: E211), bułka tarta (PSZENICA i ŻYTO), panier (mąka SOJOWA, mąka PSZENNA, skrobia PSZENNA, białko JAJ kurzych, substancje zagęszczające: E466, E415, E412), żelatyna wołowa, sambal (mielone czerwone papryczki, regulator kwasowości: E260, substancje konserwujące: E202, E250, E211), aromat boczku (syrop glukozowy, glutaminian sodu, SOJA), zioła i przyprawy, skrobia grochowa, emulgatory: E331, E461.',
      allergens: 'Jaja, gluten (pszenica, żyto), mleko, seler, soja',
      storage: 'Przechowywać w zamkniętym opakowaniu w -18°C.' } },

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

  { id: 'wijko-satesaus', cat: 'sosy', name: 'Wijko Sos satay gotowy', price: 2900, unit: 'słoik 520 g', badge: 'DO „PATATJE OORLOG"', icon: 'saus', img: 'wijko-satesaus.webp',
    desc: 'Gęsty sos orzechowy z 26% orzeszków ziemnych — nr 1 w Holandii i standard każdej frytkowni. Podstawa legendarnego „patatje oorlog": frytki + saté + majonez + surowa cebulka.',
    details: {
      prep: [['♨️ Mikrofala', 'zdjąć wieczko, nakłuć folię · ok. 3 min przy maks. 650 W, wymieszać przed podaniem'], ['🍳 Rondelek', 'podgrzewać na małym ogniu, mieszając']],
      ingredients: 'Woda, ORZESZKI ZIEMNE 26%, cukier, sos sojowy (woda, ziarna SOI, sól, PSZENICA, substancja konserwująca (sorbinian potasu)), serwatka w proszku (MLEKO), ocet, hydrolizowane białko SOJOWE, olej rzepakowy, skrobia modyfikowana, przyprawy, sambal (czerwone papryczki, sól, kwas octowy, substancja konserwująca (kwas benzoesowy)), sól, regulatory kwasowości (kwas mlekowy, mleczan sodu), cebula w proszku, imbir, substancja konserwująca (sorbinian potasu), emulgator (lecytyna SOJOWA), aromat, ekstrakt z papryki, przeciwutleniacz (E385).',
      allergens: 'Orzeszki ziemne, gluten (pszenica), mleko, soja',
      nutrition: [['Energia', '1035 kJ / 248 kcal'], ['Tłuszcz', '14 g'], ['— w tym kwasy nasycone', '1,9 g'], ['Węglowodany', '22 g'], ['— w tym cukry', '16 g'], ['Białko', '7,3 g'], ['Sól', '1,2 g']],
      storage: 'Po otwarciu przechowywać w lodówce.' } },

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

const productById = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
const zl = gr => (gr / 100).toFixed(2).replace('.', ',') + ' zł';

// ============================================================
//  PRIJS-OVERRIDES  (PostgreSQL op Railway; lokaal JSON-fallback)
// ============================================================

const fs = require('fs');
const PRICES_FILE = path.join(__dirname, 'data', 'prices.json');
let pool = null;
if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });
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
      applyOverrides(Object.fromEntries(rows.map(r => [r.product_id, r.price_gr])));
      console.log(`💾 ${rows.length} prijs-overrides geladen uit PostgreSQL`);
    } else if (fs.existsSync(PRICES_FILE)) {
      applyOverrides(JSON.parse(fs.readFileSync(PRICES_FILE, 'utf8')));
      console.log('💾 Prijs-overrides geladen uit data/prices.json (⚠️ zet DATABASE_URL voor persistentie op Railway)');
    }
  } catch (err) {
    console.error('Prijzen laden mislukt:', err.message);
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
  eta: { pl: 'zwykle następnego dnia', en: 'usually the next day' }
};

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
  eta: DELIVERY.eta[lang] || DELIVERY.eta.pl
});

// ---- Statistieken: postcodechecks + bestellingen ----
//      PostgreSQL (DATABASE_URL) of fallback data/local-stats.json
//      (tabelnamen local_* zijn historisch; niet hernoemen zonder migratie)
const STATS_FILE = path.join(__dirname, 'data', 'local-stats.json');
let statsMem = { checks: [], orders: [] };

async function initStats() {
  try {
    if (pool) {
      await pool.query(`CREATE TABLE IF NOT EXISTS local_zone_checks (
        id SERIAL PRIMARY KEY, postal_code TEXT, place TEXT, km INTEGER, in_zone BOOLEAN NOT NULL,
        source TEXT, created_at TIMESTAMPTZ DEFAULT now())`);
      await pool.query(`CREATE TABLE IF NOT EXISTS local_orders (
        session_id TEXT PRIMARY KEY, postal_code TEXT, place TEXT, km INTEGER, amount_gr INTEGER,
        out_of_zone BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now())`);
    } else if (fs.existsSync(STATS_FILE)) {
      statsMem = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
      statsMem.checks = statsMem.checks || [];
      statsMem.orders = statsMem.orders || [];
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
//  TAAL (PL/EN)  — ?lang=en zet een cookie en redirect naar de schone URL;
//  daarna cookie, anders Accept-Language (Engels vóór Pools → EN), anders PL.
//  Views krijgen: lang, t(), dict, zl() (geldformaat per taal), delivery.
// ============================================================

const { UI, LANGS, makeT, money } = require('./locales/ui');
const PRODUCTS_EN = require('./locales/products-en');
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
const catalog = lang => PRODUCTS.map(p => localizeProduct(p, lang));

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
    const url = new URL(req.originalUrl, BASE_URL);
    url.searchParams.delete('lang');
    return res.redirect(url.pathname + url.search);
  }
  req.lang = lang;
  res.locals.lang = lang;
  res.locals.t = makeT(lang);
  res.locals.dict = UI[lang] || UI.pl;
  res.locals.zl = gr => money(gr, lang);
  res.locals.delivery = deliveryPublic(lang);
  next();
});

// ============================================================
//  ROUTES
// ============================================================

app.get('/', (req, res) => {
  res.render('index', { products: catalog(req.lang), v: ASSET_V });
});

app.get('/regulamin',   (req, res) => res.render(req.lang === 'en' ? 'regulamin-en'  : 'regulamin',  { v: ASSET_V }));
app.get('/prywatnosc',  (req, res) => res.render(req.lang === 'en' ? 'prywatnosc-en' : 'prywatnosc', { v: ASSET_V }));

// ---- Admin: prijzenbeheer + statistieken (Nederlands, altijd PL-geldformaat) ----
const adminLocals = extra => ({ products: PRODUCTS, v: ASSET_V, zl: gr => money(gr, 'pl'), delivery: deliveryPublic('pl'), stats: null, error: null, ...extra });

app.get('/admin', async (req, res) => {
  if (!ADMIN_PASSWORD) return res.status(503).send('Admin is niet geconfigureerd: zet de ADMIN_PASSWORD environment variable.');
  const authed = isAdmin(req);
  let stats = null;
  if (authed) {
    try { stats = await getStats(30); } catch (err) { console.error('Statistieken:', err.message); }
  }
  res.render('admin', adminLocals({ authed, stats }));
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
    if (Object.keys(changes).length) await savePrices(changes);
    res.json({ saved: Object.keys(changes).length });
  } catch (err) {
    console.error('Prijzen opslaan mislukt:', err.message);
    res.status(500).json({ error: 'Opslaan mislukt — probeer opnieuw.' });
  }
});

// ---- AI-assistent (PanFrikandel) ----
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || null;

const CATALOG_FOR_AI = lang => catalog(lang).map(p =>
  `${p.id} | ${p.name} | ${money(p.price, lang)} | ${p.unit} | kat: ${p.cat}${p.badge ? ' | ' + p.badge : ''} | ${p.desc}`
).join('\n');

const ASSISTANT_SYSTEM = lang => `Jesteś "PanFrikandel" — sympatycznym asystentem sklepu panfrikandel.pl z holenderskimi przekąskami.
Dostawa: dowozimy sami WYŁĄCZNIE w promieniu ${DELIVERY.radiusKm} km od Płocka (${DELIVERY.eta.pl}), koszt ${money(DELIVERY.priceGr, 'pl')}, gratis od ${money(DELIVERY.freeAboveGr, 'pl')}. Klient sprawdza kod pocztowy w koszyku. Poza strefą na razie nie dowozimy — zapisujemy zainteresowanie i rozszerzamy zasięg tam, gdzie jest popyt.

Twoje zadanie: pomagasz klientom wybrać przekąski z katalogu poniżej. Doradzasz jak holenderski przyjaciel — konkretnie, ciepło, z humorem, ale krótko (maks. 4-5 zdań + polecenia).

ZASADY:
- Język odpowiedzi: ${lang === 'en' ? 'ANGIELSKI (klient korzysta z angielskiej wersji sklepu)' : 'POLSKI'}. Jeśli klient wyraźnie pisze w innym języku, odpowiadaj w jego języku.
- Polecasz TYLKO produkty z katalogu. Gdy polecasz produkt, wstaw jego ID w podwójnych nawiasach: [[id-produktu]]. Maksymalnie 3-4 polecenia naraz.
- Pytaj o preferencje gdy potrzeba (mięsne/wege, ostre/łagodne, na imprezę/na obiad, piekarnik/frytkownica/airfryer).
- Znasz się na holenderskiej kulturze frytkowni (frikandel speciaal, broodje kroket, patatje oorlog, bitterballen z musztardą przy piwie) i chętnie ją tłumaczysz.
- Nie wymyślasz cen, składników ani produktów spoza katalogu. Przy pytaniach o alergeny odsyłaj do szczegółów produktu na stronie.
- Pytania o dostawę: dowozimy tylko w promieniu ${DELIVERY.radiusKm} km od Płocka — odsyłaj do sprawdzenia kodu pocztowego w koszyku; nie obiecuj dostawy poza strefą.
- Nie odpowiadasz na pytania niezwiązane ze sklepem — uprzejmie wracasz do tematu przekąsek.

KATALOG:
${CATALOG_FOR_AI(lang)}`;

app.post('/api/assistent', async (req, res) => {
  const t = res.locals.t;
  try {
    if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: t('errAiConfig') });

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
    let subtotal = 0;

    for (const it of items) {
      const base = productById[it.id];
      const qty = Math.min(Math.max(parseInt(it.qty, 10) || 0, 1), 50);
      if (!base) continue;
      const p = localizeProduct(base, lang);
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

    if (!lineItems.length) return res.status(400).json({ error: t('errEmptyCart') });

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
            maximum: { unit: 'business_day', value: 1 }
          },
          metadata: { typ: 'lokalna', kod: zone.code, km: String(zone.km) }
        }
      }],
      metadata: {
        kod_pocztowy: zone.code,
        miejscowosc: zone.place,
        odleglosc_km: String(zone.km),
        lang
      },
      success_url: `${BASE_URL}/sukces?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/?anulowano=1#sklep`
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
        expand: ['line_items']
      });
      if (session.payment_status === 'paid') {
        // Taal van de bestelling = taal waarin de klant afrekende (metadata), niet de huidige cookie
        const lang = LANGS.includes(session.metadata?.lang) ? session.metadata.lang : 'pl';
        const t = makeT(lang);
        const addr = (session.shipping_details || session.collected_information?.shipping_details)?.address || null;
        order = {
          email: session.customer_details?.email || null,
          name: session.customer_details?.name || '',
          total: money(session.amount_total, lang),
          eta: DELIVERY.eta[lang],
          address: addr ? [addr.line1, addr.line2, ((addr.postal_code || '') + ' ' + (addr.city || '')).trim()].filter(Boolean).join(', ') : '',
          items: (session.line_items?.data || []).map(li => ({
            name: li.description, qty: li.quantity, total: money(li.amount_total, lang)
          }))
        };

        // Statistiek: bestelling registreren + checken of het afleveradres echt in de zone ligt
        if (!loggedSessions.has(session.id)) {
          loggedSessions.add(session.id);
          const z = checkZone(addr?.postal_code || session.metadata?.kod_pocztowy);
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
          await resend.emails.send({
            from: ORDER_EMAIL_FROM,
            to: order.email,
            ...(ORDER_EMAIL_BCC ? { bcc: ORDER_EMAIL_BCC } : {}),
            subject: t('mailSubject'),
            html: `
              <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#2a1503">
                <div style="background:#ff4d00;color:#fff8ec;padding:28px 32px;border-radius:16px 16px 0 0">
                  <h1 style="margin:0;font-size:26px">${t('mailThanks', { name: escHtml(order.name || t('mailGuest')) })}</h1>
                  <p style="margin:8px 0 0">${t('mailPacking')}</p>
                </div>
                <div style="border:2px solid #2a1503;border-top:0;padding:24px 32px;border-radius:0 0 16px 16px">
                  <table style="width:100%;border-collapse:collapse;font-size:15px">${rows}</table>
                  <p style="border-top:2px dashed #2a1503;padding-top:12px;font-weight:bold">${t('mailTotal')}: ${order.total}</p>
                  <p>${t('mailDeliveryHtml', { eta: order.eta })}${order.address ? '<br>' + t('mailAddress') + escHtml(order.address) : ''}</p>
                  <p style="color:#8a6a4f;font-size:13px">${t('mailFooterHtml')}</p>
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

Promise.all([loadPrices(), initStats()]).then(() => {
  app.listen(PORT, () => console.log(`🍟 PanFrikandel draait op ${BASE_URL}`));
});
