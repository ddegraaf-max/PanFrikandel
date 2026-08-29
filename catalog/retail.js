// ============================================================
//  RETAIL-CATALOGUS — Mora-consumentenverpakkingen (de shop)
//
//  Inkoop bij Vomar (vomar.nl, prijzen per 29 aug 2026). Verkoopprijs wordt
//  berekend: buyEur × PRICING.eurPln × PRICING.markup, afgerond op ,90 zł.
//  Admin (/admin) kan de prijs per product overschrijven en producten
//  aan/uit zetten. `active: false` = klaar in de catalogus, nog niet in de
//  shop — opschalen is één vinkje in admin (of hier de vlag omzetten).
//
//  Productinfo (składniki, alergeny, wartości odżywcze, przygotowanie) is
//  overgenomen van mora.nl (`mora`-veld = bronpagina). Bij een receptwijziging
//  door Mora: verpakking is leidend — check bij een nieuwe inkoop.
//  Engelse teksten: locales/products-en-retail.js (zelfde id).
// ============================================================

const PRICING = {
  eurPln: parseFloat(process.env.PRICING_EUR_PLN) || 4.35,   // koers EUR→PLN (29 aug 2026: ~4,30–4,34)
  markup: parseFloat(process.env.PRICING_MARKUP) || 2.2      // opslag op de inkoop (transport, vries, bezorging, btw, marge)
};

const STORAGE = 'Przechowywać w zamrażarce (-18°C). Nie rozmrażać w opakowaniu. Po rozmrożeniu nie zamrażać ponownie.';
const NO_FRY = ['🍟 Frytkownica', 'nie nadaje się do smażenia we frytkownicy'];
const nutri = (kj, kcal, fat, sat, carb, sug, fib, prot, salt) => [
  ['Energia', `${kj} kJ / ${kcal} kcal`], ['Tłuszcz', `${fat} g`], ['— w tym kwasy nasycone', `${sat} g`],
  ['Węglowodany', `${carb} g`], ['— w tym cukry', `${sug} g`], ['Błonnik', `${fib} g`], ['Białko', `${prot} g`], ['Sól', `${salt} g`]
];

const RETAIL = [
  // ---------------- Frikandele i klasyki ----------------
  { id: 'mora-frikandellen-5', active: true, top: true, cat: 'klasyki', name: 'Mora Frikandellen Classics · 5 szt.', unit: '5 × 70 g (350 g)', buyEur: 2.15, badge: 'KLASYK', icon: 'frikandel', img: 'mora-frikandellen-5.png',
    mora: 'https://www.mora.nl/snacks/frikandellen-5x70g',
    desc: 'Ten frikandel. Oryginalna receptura Mora od 1962 roku — dokładnie to, co Holendrzy wrzucają do koszyka w supermarkecie. Do frytkownicy, na patelnię lub na grilla.',
    details: {
      prep: [['🍟 Frytkownica', '175°C · 4 min z zamrożenia (2 min po rozmrożeniu)'], ['🍳 Patelnia', 'odrobina oleju, średni ogień · 9 min z zamrożenia (5 min po rozmrożeniu), obracać'], ['💨 Airfryer', '200°C (nagrzany) · ok. 6 min z zamrożenia (4 min po rozmrożeniu)'], ['🔥 Grill / BBQ', '14 min z zamrożenia (10 min po rozmrożeniu), często obracać']],
      ingredients: 'Mięso oddzielone mechanicznie z kurczaka, woda, słonina wieprzowa, bułka tarta (mąka (zawiera PSZENICĘ), sól, drożdże), sól, cebula, przyprawy, dekstroza, maltodekstryna, syrop glukozowy, ekstrakt drożdżowy, emulgator: E450, przeciwutleniacz: kwas askorbinowy, stabilizator: E452, naturalny aromat, regulator kwasowości: kwas cytrynowy, ekstrakt przypraw.',
      allergens: 'Gluten (pszenica)',
      nutrition: nutri(877, 211, 14, '4,5', '8,2', '0,7', '1,1', 12, '1,6'),
      storage: STORAGE } },

  { id: 'mora-oven-frikandellen-8', active: true, top: true, cat: 'klasyki', name: 'Mora Oven & Airfryer Frikandellen · 8 szt.', unit: '8 × 70 g (560 g)', buyEur: 4.55, badge: 'PIEKARNIK / AIRFRYER', icon: 'frikandel', img: 'mora-oven-frikandellen-8.png',
    mora: 'https://www.mora.nl/snacks/oven-airfryer-frikandellen-560g',
    desc: 'Frikandel stworzony do piekarnika i airfryera — bez frytkownicy, bez oleju, bez zapachu smażenia. 8 sztuk po 70 g, chrupiące w 6 minut.',
    details: {
      prep: [['💨 Airfryer', '200°C (nagrzany) · ok. 6 min z zamrożenia'], ['🔥 Piekarnik', '220°C (termoobieg, nagrzany) · 8–10 min z zamrożenia'], NO_FRY],
      ingredients: 'Mięso oddzielone mechanicznie z kurczaka, słonina wieprzowa, woda, mąka (zawiera PSZENICĘ), cebula, oleje roślinne (palmowy, rzepakowy), dekstroza, sól, przyprawy, syrop glukozowy, stabilizatory: E450 i E452, ekstrakt drożdżowy, przeciwutleniacz: kwas askorbinowy, drożdże, naturalne aromaty, regulator kwasowości: kwas cytrynowy.',
      allergens: 'Gluten (pszenica)',
      nutrition: nutri(1027, 247, 18, '4,9', '8,7', 2, '1,1', 13, '1,8'),
      storage: STORAGE } },

  { id: 'mora-bamischijven-4', active: true, top: true, cat: 'klasyki', name: 'Mora Bamischijf Originals · 4 szt.', unit: '4 × 100 g (400 g)', buyEur: 2.59, badge: null, icon: 'bamischijf', img: 'mora-bamischijven-4.png',
    mora: 'https://www.mora.nl/snacks/originals-bamischijf-400g',
    desc: 'Indonezyjsko-holenderski klasyk: smażony makaron bami z warzywami i przyprawami w chrupiącej panierce. Sycący jak obiad — do frytkownicy.',
    details: {
      prep: [['🍟 Frytkownica', '175°C · 7 min z zamrożenia (5 min po rozmrożeniu)']],
      ingredients: 'Gotowany makaron 55% (woda, semolina z PSZENICY durum), bułka tarta (mąka (zawiera PSZENICĘ), sól, drożdże, barwniki: annato norbiksyna i annato biksyna, przyprawy), woda, warzywa 7% (cebula, groszek, marchew, por, papryka, SOJA, kapusta biała), olej palmowy, cukier, mąka (zawiera PSZENICĘ), naturalny aromat (zawiera SOJĘ), wołowina <1%, skrobia (zawiera PSZENICĘ), sól, przyprawy, maltodekstryna, żelatyna wołowa, skrobia modyfikowana, czosnek, papryczka chili, inulina, kolagen wołowy, PSZENICA, zioła, konserwant: ocet buforowany, pieczarki w proszku, koncentrat pomidorowy, ocet, substancje spulchniające: E450 i E500, emulgator: mączka guar, białko wołowe, regulator kwasowości: kwas octowy, stabilizator: E452.',
      allergens: 'Gluten (pszenica), soja',
      nutrition: nutri(727, 172, '2,6', '1,1', 31, '3,8', '1,8', '5,3', '1,7'),
      storage: STORAGE } },

  // ---------------- Bitterballen i krokiety ----------------
  { id: 'mora-oven-bitterballen-12', active: true, top: true, cat: 'bitterballen', name: 'Mora Oven & Airfryer Bitterballen wołowe · 12 szt.', unit: '12 × 25 g (300 g)', buyEur: 4.29, badge: 'BESTSELLER', icon: 'bitterbal', img: 'mora-oven-bitterballen-12.png',
    mora: 'https://www.mora.nl/snacks/oven-airfryer-rundvlees-bitterballen-300g',
    desc: 'Klasyk holenderskiego baru: kremowy ragout z wołowiną w złocistej, chrupiącej panierce. Wersja do piekarnika i airfryera — podawaj z musztardą.',
    details: {
      prep: [['💨 Airfryer', '200°C (nagrzany) · ok. 9 min z zamrożenia'], ['🔥 Piekarnik', '220°C (termoobieg, nagrzany) · 10–12 min z zamrożenia, na ruszcie'], NO_FRY],
      ingredients: 'Woda, wołowina 21%*, bułka tarta (mąka PSZENNA, mąka PSZENNA pełnoziarnista, olej słonecznikowy, woda, sól, drożdże), mąka PSZENNA, oleje roślinne (palmowy, rzepakowy, słonecznikowy), masło (MLEKO), sól, żelatyna wołowa, naturalny aromat, syrop glukozowy, cukier, syrop cukru inwertowanego, zioła, przyprawy, dekstroza, zagęstnik: E466, białko PSZENNE, syrop cukrowy, barwnik: E150c. *15% gotowanej wołowiny. Może zawierać orzeszki ziemne.',
      allergens: 'Gluten (pszenica), mleko · może zawierać orzeszki ziemne',
      nutrition: nutri(1041, 250, 15, '5,5', 20, '0,9', '1,7', '7,8', '1,1'),
      storage: STORAGE } },

  { id: 'mora-oven-kroketten-4', active: true, top: true, cat: 'bitterballen', name: 'Mora Oven & Airfryer Krokiety wołowe · 4 szt.', unit: '4 × 80 g (320 g)', buyEur: 4.19, badge: 'PIEKARNIK / AIRFRYER', icon: 'kroket', img: 'mora-oven-kroketten-4.png',
    mora: 'https://www.mora.nl/snacks/oven-airfryer-rundvlees-kroketten-320g',
    desc: 'Kroket jak z holenderskiej frytkowni — kremowy ragout z wołowiną w chrupiącej panierce. Na bułce z musztardą („broodje kroket”) albo do frytek. Piekarnik lub airfryer.',
    details: {
      prep: [['💨 Airfryer', '200°C (nagrzany) · ok. 13 min z zamrożenia, jedna warstwa'], ['🔥 Piekarnik', '220°C (termoobieg) · 14–16 min z zamrożenia, na ruszcie bez papieru'], NO_FRY],
      ingredients: 'Woda, bułka tarta (mąka PSZENNA, mąka PSZENNA pełnoziarnista, olej słonecznikowy, drożdże, sól, woda), gotowana wołowina 16%, oleje roślinne (palmowy, rzepakowy, słonecznikowy), mąka PSZENNA, sól, tłuszcz maślany (MLEKO), kolagen wołowy, naturalny aromat, syrop glukozowy, cukier, przyprawy, dekstroza, stabilizator: E466, ekstrakt drożdżowy, syrop cukru inwertowanego, białko PSZENNE, zioła. Może zawierać orzeszki ziemne.',
      allergens: 'Gluten (pszenica), mleko · może zawierać orzeszki ziemne',
      nutrition: nutri(1101, 264, 15, '5,1', 24, '1,8', '1,7', '7,2', '1,1'),
      storage: STORAGE } },

  { id: 'mora-rundvleeskroket-4', active: true, top: true, cat: 'bitterballen', name: 'Mora Krokiety wołowe Classics · 4 szt.', unit: '4 × 70 g (280 g)', buyEur: 2.39, badge: null, icon: 'kroket', img: 'mora-rundvleeskroket-4.png',
    mora: 'https://mora.nl/snacks/rundvlees-kroketten-4x70-gram',
    desc: 'Klasyczny kroket wołowy Mora do frytkownicy — cienka, chrupiąca panierka i gorący ragout w środku. Da się też zrobić w airfryerze i piekarniku.',
    details: {
      prep: [['🍟 Frytkownica', '175°C · 5,5 min z zamrożenia'], ['💨 Airfryer', '200°C (nagrzany) · 11 min z zamrożenia'], ['🔥 Piekarnik', '220°C (termoobieg) · 11–13 min z zamrożenia, regularnie obracać']],
      ingredients: 'Woda, mąka (PSZENICA), bułka tarta (mąka (PSZENICA), mąka pełnoziarnista (PSZENICA), olej słonecznikowy, sól, drożdże), oleje roślinne (palmowy, rzepakowy, słonecznikowy), gotowana wołowina 10%, białko JAJ z chowu ściółkowego, sól, naturalne aromaty, białko roślinne (PSZENICA), kolagen wołowy, przyprawy, skrobia (PSZENICA), ekstrakt drożdżowy, dekstroza, żelatyna wołowa, białko wołowe, zagęstnik: mączka guar, zioła, barwnik: E150d, stabilizatory: E450 i E452, emulgator: lecytyny.',
      allergens: 'Gluten (pszenica), jaja, seler',
      nutrition: nutri(955, 229, 13, '5,1', 20, '0,9', '1,3', '6,7', '1,2'),
      storage: STORAGE } },

  // ---------------- Kaassoufflé ----------------
  { id: 'mora-kaassouffles-6', active: true, top: true, cat: 'ser', name: 'Mora Kaassoufflés · 6 szt.', unit: '6 × 60 g (360 g)', buyEur: 3.15, badge: 'WEGE', icon: 'kaassouffle', img: 'mora-kaassouffles-6.png',
    mora: 'https://www.mora.nl/snacks/kaassouffles-360g',
    desc: 'Ciągnący się ser Gouda w cienkim, chrupiącym cieście — najsłynniejsza wegetariańska przekąska Holandii. Klasyczna wersja do frytkownicy: 3 minuty i gotowe.',
    details: {
      prep: [['🍟 Frytkownica', '175°C · 3 min z zamrożenia (2 min po rozmrożeniu)']],
      ingredients: 'Mąka (PSZENICA), woda, ser Gouda 19% (MLEKO), oleje roślinne (palmowy, rzepakowy), skrobia, sól, masło (MLEKO), regulator kwasowości: kwas cytrynowy, sól emulgująca: E452, drożdże, przyprawy, barwnik: kurkumina, zagęstnik: E461, skrobia modyfikowana, emulgator: E471, substancje spulchniające: E500, E451, E450.',
      allergens: 'Gluten (pszenica), mleko',
      nutrition: nutri(1284, 307, 16, '8,5', 32, '0,8', '1,4', '7,2', '1,3'),
      storage: STORAGE } },

  { id: 'mora-oven-goudse-kaassouffles-4', active: true, top: true, cat: 'ser', name: 'Mora Oven & Airfryer Goudse Kaassoufflés · 4 szt.', unit: '4 × 70 g (280 g)', buyEur: 4.39, badge: 'WEGE · AIRFRYER', icon: 'kaassouffle', img: 'mora-oven-goudse-kaassouffles-4.png',
    mora: 'https://www.mora.nl/snacks/mora-oven-airfryer-goudse-kaassouffles-280g',
    desc: 'Kaassoufflé ze 100% sera Gouda (23%) w złocistej panierce — wersja do piekarnika i airfryera. Wegetariańska, gotowa w 8 minut.',
    details: {
      prep: [['💨 Airfryer', '200°C (nagrzany) · ok. 8 min z zamrożenia'], ['🔥 Piekarnik', '220°C (termoobieg) · 6–9 min z zamrożenia'], NO_FRY],
      ingredients: 'Mąka (zawiera PSZENICĘ), ser Gouda 23% (MLEKO), woda, oleje roślinne (palmowy, rzepakowy), skrobia, masło (MLEKO), sól, regulator kwasowości: kwas cytrynowy, sól emulgująca: E452, zagęstniki: E461 i E401, drożdże, barwniki: kurkumina, ekstrakt papryki i annato norbiksyna, skrobia modyfikowana, emulgator: E471, substancje spulchniające: E500, E451 i E450, przyprawy. Może zawierać orzeszki ziemne.',
      allergens: 'Gluten (pszenica), mleko · może zawierać orzeszki ziemne',
      nutrition: nutri(1462, 350, 21, '9,9', 31, '0,4', '1,7', '7,6', '1,6'),
      storage: STORAGE } },

  // ---------------- Miksy na imprezę ----------------
  { id: 'mora-oven-mini-frikandellen-20', active: true, top: true, cat: 'mix', name: 'Mora Oven & Airfryer Mini Frikandellen · 20 szt.', unit: '20 × 20 g (400 g)', buyEur: 4.49, badge: 'NA IMPREZĘ', icon: 'frikandel', img: 'mora-oven-mini-frikandellen-20.png',
    mora: 'https://mora.nl/snacks/oven-mini-frikandellen',
    desc: 'Frikandel w wersji mini — 20 sztuk po 20 g. Idealne do piwa, na imprezę i dla dzieci. Piekarnik lub airfryer, gotowe w 6 minut.',
    details: {
      prep: [['💨 Airfryer', '200°C (nagrzany) · ok. 6 min z zamrożenia'], ['🔥 Piekarnik', '220°C (termoobieg) · 7–9 min z zamrożenia'], NO_FRY],
      ingredients: 'Mięso oddzielone mechanicznie z kurczaka, słonina wieprzowa, woda, mąka (zawiera PSZENICĘ), sól, cebula, przyprawy, dekstroza, barwnik: karmel, syrop glukozowy, maltodekstryna, emulgatory: E450 i E452, ekstrakt drożdżowy, regulatory kwasowości: kwas cytrynowy i kwas askorbinowy, drożdże, naturalne aromaty, ekstrakty przypraw.',
      allergens: 'Gluten (pszenica)',
      nutrition: nutri(963, 231, 16, '5,2', '8,2', '0,8', '1,1', 14, '1,9'),
      storage: STORAGE } },

  { id: 'mora-oven-hapjes-mix-16', active: true, top: true, cat: 'mix', name: 'Mora Oven & Airfryer Hapjes Mix · 16 szt.', unit: '16 × 20 g (320 g) · 4 rodzaje', buyEur: 4.19, badge: 'NA IMPREZĘ', icon: 'box', img: 'mora-oven-hapjes-mix-16.png',
    mora: 'https://www.mora.nl/snacks/oven-airfryer-hapjes-mix-320g',
    desc: 'Mieszanka na imprezę: bitterballen wołowe, mini frikandellen, nuggetsy z kurczaka i mini bamischijfy — 16 sztuk, piekarnik lub airfryer, 7 minut.',
    details: {
      prep: [['💨 Airfryer', '200°C (nagrzany) · ok. 7 min z zamrożenia, jedna warstwa'], ['🔥 Piekarnik', '220°C (termoobieg) · 7–9 min z zamrożenia, na ruszcie'], NO_FRY],
      ingredients: 'Bitterbal wołowy: woda, mąka (zawiera PSZENICĘ), gotowana wołowina 15%, oleje roślinne (palmowy, rzepakowy, słonecznikowy), mąka pełnoziarnista (zawiera PSZENICĘ), sól, tłuszcz maślany (MLEKO), drożdże, kolagen wołowy, cukier, syrop glukozowy, naturalny aromat, dekstroza, ekstrakt drożdżowy, stabilizator E466, cebula, przyprawy, białko roślinne (PSZENICA), zioła. Mini frikandel: mięso oddzielone mechanicznie z kurczaka, słonina wieprzowa, woda, mąka (zawiera PSZENICĘ), sól, cebula, przyprawy, dekstroza, barwnik: karmel, syrop glukozowy, maltodekstryna, ekstrakt drożdżowy, emulgator E450, drożdże, przeciwutleniacz: kwas askorbinowy, stabilizator E452, naturalny aromat, regulator kwasowości: kwas cytrynowy. Nugget z kurczaka: mięso z kurczaka 56%, mąka (zawiera PSZENICĘ), woda, oleje roślinne (palmowy, rzepakowy), sól, skrobia modyfikowana, dekstryna, dekstroza, cukier, drożdże, sok z cytryny, stabilizator: guma ksantanowa, naturalny aromat, przyprawy, regulator kwasowości E450, substancja spulchniająca E500, ekstrakt papryki. Mini bamischijf: gotowany makaron 48% (woda, semolina z PSZENICY durum), mąka (zawiera PSZENICĘ), oleje roślinne (palmowy, rzepakowy, słonecznikowy), cebula, woda, marchew, por, cukier, sól, naturalny aromat (zawiera SOJĘ), przyprawy, papryka, maltodekstryna, syrop glukozowy, drożdże, skrobia (zawiera PSZENICĘ), zagęstniki: agar i E466, kapusta biała, papryka w proszku, dekstroza, pieczarki, barwniki: annato biksyna i norbiksyna, zioła, gluten PSZENNY, regulatory kwasowości: kwas octowy i cytrynowy, PSZENICA, SOJA, papryczka chili, melasa, skrobia modyfikowana, konserwant E211, ocet. Może zawierać orzeszki ziemne i jaja.',
      allergens: 'Gluten (pszenica), soja, mleko · może zawierać jaja i orzeszki ziemne',
      nutrition: nutri(1003, 240, 13, 4, 21, '1,6', '1,3', 10, '1,5'),
      storage: STORAGE } },

  // ============================================================
  //  KLAAR VOOR LATER (active: false) — aanzetten in /admin
  // ============================================================
  { id: 'mora-vegetarische-kroketten-4', active: false, top: true, cat: 'bitterballen', name: 'Mora Krokiety wegetariańskie · 4 szt.', unit: '4 × 75 g (300 g)', buyEur: 4.29, badge: 'WEGE', icon: 'kroket', img: 'mora-vegetarische-kroketten-4.png',
    mora: 'https://www.mora.nl/snacks/vegetarische-draadjesvleesch-kroketten-300g',
    desc: 'Wegetariański kroket z „draadjesvleesch” — roślinnym odpowiednikiem szarpanego mięsa — w chrupiącej panierce. Piekarnik lub airfryer.',
    details: {
      prep: [['💨 Airfryer', '200°C (nagrzany) · ok. 13 min z zamrożenia'], ['🔥 Piekarnik', '220°C · 17–19 min z zamrożenia'], NO_FRY],
      ingredients: 'Woda, bułka tarta (PSZENICA), mąka PSZENNA, wegetariańskie „draadjesvleesch” 8% (woda, białko JAJ w proszku z chowu na wolnym wybiegu, barwnik E150d), olej palmowy, olej słonecznikowy, mąka PSZENNA pełnoziarnista, olej rzepakowy, masło (MLEKO), naturalny aromat, skrobia modyfikowana, sól, laktoza (MLEKO), syrop glukozowy, cukier, syrop cukru inwertowanego, zagęstniki (agar, E466), cebula, czosnek, białka MLEKA, dekstroza, przyprawy (pieprz <1%), zioła (pietruszka <1%), białko PSZENNE. Może zawierać orzeszki ziemne.',
      allergens: 'Gluten (pszenica), jaja, mleko · może zawierać orzeszki ziemne',
      nutrition: nutri(1010, 241, 15, '5,2', 21, '1,2', '3,7', '4,7', 1),
      storage: STORAGE } },

  { id: 'mora-oven-bamischijven-4', active: false, top: true, cat: 'klasyki', name: 'Mora Oven & Airfryer Bamischijven · 4 szt.', unit: '4 × 80 g (320 g)', buyEur: 3.99, badge: 'PIEKARNIK / AIRFRYER', icon: 'bamischijf', img: 'mora-oven-bamischijven-4.png',
    mora: 'https://www.mora.nl/snacks/mora-oven-airfryer-bamischijven-320g',
    desc: 'Bamischijf do piekarnika i airfryera — przyprawiony makaron bami z warzywami w chrupiącej panierce, bez frytkownicy.',
    details: {
      prep: [['💨 Airfryer', '200°C (nagrzany) · ok. 11 min z zamrożenia'], ['🔥 Piekarnik', '220°C (termoobieg) · 14–17 min z zamrożenia, na ruszcie'], NO_FRY],
      ingredients: 'Gotowany makaron 59% (woda, semolina z PSZENICY durum), bułka tarta (mąka (zawiera PSZENICĘ), sól, drożdże, przyprawy, barwniki: annato norbiksyna i annato biksyna), oleje roślinne (palmowy, rzepakowy, słonecznikowy), woda, cebula, marchew, cukier, przyprawy, naturalny aromat (zawiera SOJĘ), melasa, sól, papryka, skrobia modyfikowana, por, maltodekstryna, skrobia (zawiera PSZENICĘ), papryczka chili, syrop glukozowy (zawiera PSZENICĘ), konserwanty: E267, E202 i E211, zioła, dekstroza, zagęstnik: E466, kapusta biała, ocet, gluten (zawiera PSZENICĘ), SOJA, PSZENICA, regulator kwasowości: kwas octowy. Może zawierać orzeszki ziemne.',
      allergens: 'Gluten (pszenica, żyto), soja · może zawierać orzeszki ziemne',
      nutrition: nutri(1009, 240, '8,9', '2,9', 34, 4, '1,7', '5,1', '1,5'),
      storage: STORAGE } },

  { id: 'mora-kipkorn-5', active: false, top: true, cat: 'klasyki', name: 'Mora Kipkorn® · 5 szt.', unit: '5 × 60 g (300 g)', buyEur: 3.75, badge: 'KULTOWY', icon: 'frikandel', img: 'mora-kipkorn-5.png',
    mora: 'https://www.mora.nl/snacks/kipkornr-5-stuks',
    desc: 'Delikatny kurczak w chrupiącej panierce z płatków kukurydzianych — kultowy snack Mora od lat 70. Frytkownica, airfryer, piekarnik albo patelnia.',
    details: {
      prep: [['🍟 Frytkownica', '175°C · 4 min z zamrożenia (3 min po rozmrożeniu)'], ['💨 Airfryer', '200°C (nagrzany) · 8 min z zamrożenia'], ['🔥 Piekarnik', '220°C (nagrzany) · 9 min z zamrożenia, obracać'], ['🍳 Patelnia', 'olej, średni ogień · 11 min z zamrożenia (8 min po rozmrożeniu), obracać']],
      ingredients: 'Mięso oddzielone mechanicznie z kurczaka 23%, mięso z kurczaka 15%, oleje roślinne (palmowy, rzepakowy), woda, mąka (zawiera PSZENICĘ), drożdże, sól, płatki kukurydziane 8% (kukurydza, cukier, ekstrakt słodu JĘCZMIENNEGO, sól), tłuszcz z kurczaka, kolagen z kurczaka, sól, białko SOJOWE, skrobia (zawiera PSZENICĘ), naturalny aromat, emulgator: E451, substancje spulchniające: E450 i E500, przyprawy, zioła, stabilizator: E452, gluten PSZENNY, przeciwutleniacz: kwas askorbinowy, koncentrat białek serwatkowych (MLEKO), białko MLEKA. Może zawierać jaja.',
      allergens: 'Gluten (pszenica, żyto, jęczmień), soja, mleko · może zawierać jaja',
      nutrition: nutri(1429, 344, 24, '7,9', 19, '0,6', '0,9', 11, '1,5'),
      storage: STORAGE } },

  { id: 'mora-viandel-5', active: false, top: true, cat: 'klasyki', name: 'Mora Viandel® · 5 szt.', unit: '5 × 70 g (350 g)', buyEur: 4.25, badge: 'PIKANTNY', icon: 'frikandel', img: 'mora-viandel-5.png',
    mora: 'https://www.mora.nl/snacks/viandel-350g',
    desc: 'Viandel — pikantniejszy, bardziej mięsny kuzyn frikandela w cieniutkiej panierce. Frytkownica, airfryer, piekarnik lub patelnia.',
    details: {
      prep: [['🍟 Frytkownica', '175°C · 3,5 min z zamrożenia (2 min po rozmrożeniu), maks. 4 szt. naraz'], ['💨 Airfryer', '200°C (nagrzany) · 8 min z zamrożenia'], ['🔥 Piekarnik', '250°C · 12 min z zamrożenia (6 min po rozmrożeniu), obracać'], ['🍳 Patelnia', 'średni ogień · 8 min z zamrożenia (4 min po rozmrożeniu), obracać']],
      ingredients: 'Mięso oddzielone mechanicznie z kurczaka, mąka (PSZENICA, ŻYTO), woda, słonina wieprzowa, cebula, sól, oleje roślinne (słonecznikowy, palmowy, rzepakowy), syrop glukozowy, maltodekstryna, przyprawy (SELER), skrobia modyfikowana, skrobia (PSZENICA), zioła, stabilizator: E450, dekstroza, naturalne aromaty, ekstrakt drożdżowy, emulgator: E339, hydrolizat białka SOJOWEGO, drożdże, ekstrakty rozmarynu, kwas cytrynowy, gluten PSZENNY, substancja spulchniająca: E500.',
      allergens: 'Gluten (pszenica, żyto), soja, seler',
      nutrition: nutri(1078, 259, 16, '5,1', 18, '0,8', '1,4', '9,2', '1,9'),
      storage: STORAGE } },

  { id: 'mora-crispy-chickn-8', active: false, top: true, cat: 'klasyki', name: 'Mora Crispy Chick\'n Original · 8 szt.', unit: '8 × 30 g (240 g)', buyEur: 4.09, badge: 'NOWOŚĆ', icon: 'frikandel', img: 'mora-crispy-chickn-8.png',
    mora: 'https://www.mora.nl/snacks/crispy-chickn-original',
    desc: '100% filet z kurczaka w ekstra chrupiącej panierce. Piekarnik, airfryer lub frytkownica — na przekąskę, do frytek, do wrapa.',
    details: {
      prep: [['💨 Airfryer', '200°C (nagrzany) · 6 min z zamrożenia'], ['🔥 Piekarnik', '220°C · 9–10 min z zamrożenia'], ['🍟 Frytkownica', '175°C · 2,5 min z zamrożenia']],
      ingredients: 'Mięso z kurczaka 51% (100% filet z kurczaka), bułka tarta (mąka (zawiera PSZENICĘ), mąka pełnoziarnista (zawiera PSZENICĘ), drożdże, sól, olej słonecznikowy), woda, oleje roślinne (palmowy, rzepakowy), mąka (zawiera PSZENICĘ, SOJĘ), kolagen z kurczaka, sól, przyprawy, skrobia (zawiera PSZENICĘ), naturalne aromaty, białko SOJOWE, stabilizator: E452, cukier, substancje spulchniające: E450 i E500, emulgator: E451, zioła, dekstroza, hydrolizowane białko roślinne, ekstrakt drożdżowy, maltodekstryna. Może zawierać jaja.',
      allergens: 'Gluten (pszenica), soja · może zawierać jaja',
      nutrition: nutri(1039, 248, 11, '3,8', 22, '0,7', '1,3', 15, '1,4'),
      storage: STORAGE } },

  { id: 'mora-oven-chili-cheese-bites-12', active: false, top: true, cat: 'ser', name: 'Mora Oven & Airfryer Chili Cheese Bites · 12 szt.', unit: '12 × 20 g (240 g)', buyEur: 4.75, badge: 'OSTRE · WEGE', icon: 'kaassouffle', img: 'mora-oven-chili-cheese-bites-12.png',
    mora: 'https://www.mora.nl/snacks/oven-airfryer-chili-cheese-bites-240g',
    desc: 'Gouda, cheddar i mozzarella z zielonym jalapeño w chrupiącej panierce. Wegetariańskie, pikantne, 5 minut w airfryerze.',
    details: {
      prep: [['💨 Airfryer', '200°C (nagrzany) · 5 min z zamrożenia, odstawić na 2 min'], ['🔥 Piekarnik', '220°C (termoobieg) · 8–9 min z zamrożenia, odstawić na 2 min'], NO_FRY],
      ingredients: 'Wegetariańskie nadzienie serowe 55% (ser 55% (Gouda, cheddar, mozzarella), woda, 4% zielone jalapeño, 3% zielona papryka, białko MLEKA, sole emulgujące: E341, E450, E452, sól, stabilizator: E461, skrobia modyfikowana, olej słonecznikowy, skrobia, naturalny aromat (zawiera MLEKO), zagęstnik: mączka guar, ocet naturalny, barwnik: karoten), bułka tarta (mąka (zawiera PSZENICĘ), sól, drożdże, olej słonecznikowy, ekstrakt słodu (zawiera JĘCZMIEŃ), cukier), woda, oleje roślinne (palmowy, rzepakowy, słonecznikowy), syrop glukozowy, cukier, stabilizatory: E464 i E466, mąka (zawiera PSZENICĘ), dekstroza, sól, syrop cukru inwertowanego, białko PSZENNE. Może zawierać orzeszki ziemne.',
      allergens: 'Gluten (pszenica, jęczmień), mleko · może zawierać orzeszki ziemne',
      nutrition: nutri(1142, 274, 17, '7,7', 18, '1,7', '1,6', 10, '1,8'),
      storage: STORAGE } },

  { id: 'mora-minis-mega-mix-52', active: false, top: true, cat: 'mix', name: 'Mora Mini\'s Mega Mix · 52 szt.', unit: '52 szt. (962 g) · 4 rodzaje', buyEur: 6.65, badge: 'DUŻA IMPREZA', icon: 'box', img: 'mora-minis-mega-mix-52.png',
    mora: 'https://mora.nl/snacks/mega-mix',
    desc: 'Mega miks do frytkownicy: mini frikandellen, bitterballen, kipkantjes i mini bamischijfy — 52 sztuki na dużą imprezę. Frytkownica, 4 minuty.',
    details: {
      prep: [['🍟 Frytkownica', '175°C · 4 min z zamrożenia']],
      ingredients: 'Mini frikandel: mięso oddzielone mechanicznie z kurczaka, woda, słonina wieprzowa, bułka tarta (mąka PSZENNA, drożdże, sól), sól, cebula, przyprawy, dekstroza, emulgator E450, kwas askorbinowy, ekstrakt drożdżowy, stabilizator E452, naturalny aromat, ekstrakt przypraw, kwas cytrynowy, syrop glukozowy. Bitterbal: woda, bułka tarta (mąka PSZENNA, sól, drożdże), mąka PSZENNA, oleje roślinne, wołowina 6%, sól, kolagen wołowy, białko PSZENNE, naturalny aromat, skrobia PSZENNA, przyprawy, ekstrakt drożdżowy, barwniki, żelatyna wołowa, stabilizatory, emulgator E450. Kipkantje: mięso oddzielone mechanicznie z kurczaka 27%, woda, oleje roślinne, kaszka kukurydziana, mąka (PSZENICA, SOJA, ŻYTO), bułka tarta, mięso z kurczaka 5%, tłuszcz z kurczaka, kolagen z kurczaka, sól, przyprawy, białko SOJOWE, emulgatory, cukier, skrobia, ekstrakt drożdżowy, ekstrakt słodu JĘCZMIENNEGO, gluten PSZENNY, koncentrat białek serwatkowych (MLEKO), białko MLEKA. Mini bamischijf: gotowany makaron 43%, woda, mąka PSZENNA, bułka tarta, cebula, oleje roślinne, por, kapusta biała, papryka, sól, skrobia PSZENNA, kolagen wołowy, dekstroza, papryczka chili, przyprawy (SELER), ekstrakt drożdżowy, gluten PSZENNY, konserwant, cukier, syrop cukrowy, melasa, naturalny aromat, SOJA, zioła. Może zawierać orzeszki ziemne.',
      allergens: 'Gluten (pszenica, żyto, jęczmień), jaja, soja, mleko, seler · może zawierać orzeszki ziemne',
      nutrition: nutri(946, 226, 12, '4,3', 20, '1,1', '1,2', '8,4', '1,7'),
      storage: STORAGE } }
];

module.exports = { PRICING, RETAIL };
