// ============================================================
//  UI-TEKSTEN — PL (standaard) / EN
//  t(key, vars) in de views vervangt {naam} door vars.naam.
//  Keys met suffix "Html" bevatten opmaak en worden met <%- %> geplaatst.
//  `client` gaat als window.T naar shop.js.
//  Bezorgmodel: alleen eigen bezorging, Płock + {radius} km.
// ============================================================

const UI = {};

UI.pl = {
  langName: 'Polski',
  title: 'PanFrikandel — holenderskie przekąski z dostawą w Płocku i okolicach',
  metaDesc: 'PanFrikandel — oryginalne holenderskie przekąski: frikandel, bitterballen, kroket. Dowozimy sami w Płocku i w promieniu 50 km. Płatność BLIK, P24, karta.',
  marquee: ['FRIKANDEL', 'BITTERBALLEN', 'KROKET', 'KAASSOUFFLÉ', 'PŁOCK +{radius} KM: DOWOZIMY SAMI', 'LEKKER!'],
  navShop: 'Sklep', navDelivery: 'Dostawa', navFaq: 'FAQ', navCart: 'Koszyk', langLabel: 'Język',

  heroKicker: '🇳🇱 Prosto z Holandii → 🇵🇱 Płock i okolice',
  heroH1Html: 'Tęsknisz za <em>frikandelem</em>?<br>My go przywozimy.',
  heroSubHtml: 'Oryginalne przekąski z holenderskiej frytkowni — mrożone, przywozimy sami prosto z mroźni. <strong>Płock i okolice do {radius} km, {eta}.</strong> <a href="#strefa">Sprawdź swój kod pocztowy.</a>',
  heroCta: 'Zamów teraz', heroCta2: 'Jak działa dostawa?',
  badgeFrozen: '❄️ Zawsze mrożone', badgePay: '💳 BLIK · P24 · karta',
  badgeDelivery: '🛵 Dostawa {price} · gratis od {free}', badgeZone: '📍 Płock +{radius} km',
  stickerHtml: '100%<br>lekker',

  shopH2Html: 'Frytkownia <em>online</em>',
  shopSub: 'Wszystko mrożone, gotowe w 10 minut w piekarniku lub airfryerze.',
  cats: { klasyki: 'Frikandele i klasyki', bitterballen: 'Bitterballen i krokiety — największy wybór w Polsce', sosy: 'Sosy — połowa magii', boxy: 'Boxy — najlepiej się opłaca', sprzet: 'Olej i sprzęt — frytkownia w domu' },
  showAllHtml: 'Pokaż wszystkie <span class="more-count">{n}</span> produktów ▾',
  cardSpecs: 'Specyfikacja', cardIngredients: 'Składniki i przygotowanie', addToCart: '+ Do koszyka', productDetails: 'Szczegóły produktu',
  pdPrep: 'Przygotowanie', pdSpecs: 'Specyfikacja', pdIngredients: 'Składniki', pdAllergens: 'Alergeny', pdNutrition: 'Wartości odżywcze (na 100 g)', pdStorage: 'Przechowywanie',

  deliveryH2Html: 'Frikandel pod Twoje drzwi?<br><em>Dowozimy sami.</em>',
  steps: [
    { t: 'Sprawdzasz kod pocztowy', p: 'Mieszkasz do {radius} km od Płocka? Wpisz kod w koszyku — od razu wiesz, czy dowozimy.' },
    { t: 'Zamawiasz', p: 'Wybierasz przekąski, płacisz BLIK-iem, Przelewy24 lub kartą przez bezpieczny Stripe.' },
    { t: 'Dowozimy sami', p: 'Dzwonimy, umawiamy godzinę i przywozimy prosto z mroźni — {eta}. Dostawa {price}, <strong>gratis od {free}</strong>.' },
    { t: 'Do zamrażarki → airfryer', p: '10 minut i masz w domu prawdziwą holenderską frytkownię. Eet smakelijk!' }
  ],
  zoneKicker: '🛵 Strefa dostawy · {city} +{radius} km',
  zoneH3Html: 'Dowozimy do Ciebie?<br><em>Sprawdź kod pocztowy.</em>',
  zonePHtml: 'Na razie dowozimy w promieniu {radius} km od Płocka — Gostynin, Sierpc, Płońsk, Kutno, Włocławek i wszystko pomiędzy. Nie ma Cię w strefie? Zapisujemy każde sprawdzenie i rozszerzamy zasięg tam, gdzie jest zainteresowanie.',
  zoneLabel: 'Sprawdź, czy dowozimy do Ciebie', zonePlaceholder: 'np. 09-400', zoneCheck: 'Sprawdź', zoneAria: 'Kod pocztowy',

  faqH2Html: 'Pytania? <em>Mamy odpowiedzi</em>',
  faq: [
    { q: 'Czym właściwie jest frikandel?', a: 'Najpopularniejsza przekąska w Holandii: podłużny, smażony kotlecik z mieszanki mięs, o gładkiej konsystencji i lekko korzennym smaku. Holendrzy zjadają ich ponad 600 milionów rocznie. „Frikandel speciaal" = z curry ketchupem, fritessaus i surową cebulką.' },
    { q: 'Czy produkty dojadą naprawdę zamrożone?', a: 'Tak. Przywozimy je prosto z mroźni (-18°C) w torbie termicznej i przekazujemy z ręki do ręki. Po odbiorze włóż produkty od razu do zamrażarki.' },
    { q: 'Jak przygotować przekąski?', a: 'Najlepiej w airfryerze (ok. 8–10 min, 180°C) lub piekarniku (ok. 12–15 min, 200°C). Można też klasycznie we frytkownicy — 3–4 minuty w 180°C. Zawsze prosto z zamrażarki, bez rozmrażania.' },
    { q: 'Jakie są metody płatności?', a: 'BLIK, Przelewy24 i karty płatnicze — wszystko obsługiwane przez Stripe, bez zakładania konta.' },
    { q: 'Mieszkam dalej niż {radius} km od Płocka — co teraz?', a: 'Na razie dowozimy tylko w promieniu {radius} km od Płocka. Sprawdź swój kod — każde sprawdzenie zapisujemy i jeśli w Twojej okolicy będzie zainteresowanie, rozszerzymy strefę. Możesz też napisać na hallo@panfrikandel.pl.' },
    { q: 'Co jeśli nie będzie mnie w domu?', a: 'Przed dostawą dzwonimy i umawiamy godzinę. Jeśli plany się zmienią, daj znać — przełożymy dostawę na inny dzień.' }
  ],

  footerTaglineHtml: 'Holenderskie przekąski z dostawą<br>w Płocku i okolicach. Echt lekker.',
  footerShop: 'Sklep', footerAll: 'Wszystkie produkty', footerInfo: 'Informacje', footerTerms: 'Regulamin', footerPrivacy: 'Polityka prywatności',
  footerPayAria: 'Dostępne metody płatności', footerPayLabel: 'Bezpieczne płatności przez Stripe:', footerNote: 'Echt lekker.',

  cartTitle: 'Twój koszyk', close: 'Zamknij',
  cartZoneLabel: '📍 Podaj kod pocztowy — dowozimy w promieniu {radius} km od Płocka', cartZonePlaceholder: '09-400',
  cartTotal: 'Razem', checkout: 'Przejdź do płatności →', cartPay: '💳 BLIK · Przelewy24 · karta — przez Stripe',

  aiFab: 'Zapytaj PanFrikandela', aiName: 'PanFrikandel', aiSub: 'Twój holenderski doradca 🍟',
  aiWelcome: 'Cześć! Tu PanFrikandel. Powiedz, na co masz ochotę — impreza ze znajomymi, szybki obiad, coś wege, coś bardzo ostrego? Doradzę jak stary znajomy z frytkowni. 🧡',
  aiPlaceholder: 'np. coś ostrego na imprezę dla 8 osób…',

  // sukces
  successTitle: 'Dziękujemy! — PanFrikandel', successStickerHtml: 'Dank<br>je!', successH1: 'Zamówienie przyjęte! 🍟',
  successMailHtml: 'Potwierdzenie wysłaliśmy na <strong>{email}</strong>. ',
  successHtml: '🛵 <strong>Dowozimy sami!</strong> Zadzwonimy lub napiszemy, żeby umówić dostawę — {eta}. Przekąski jadą prosto z mroźni, więc od razu do zamrażarki.',
  backToShop: '← Wróć do sklepu',
  termsTitle: 'Regulamin — PanFrikandel', privacyTitle: 'Polityka prywatności — PanFrikandel',

  // server-side (API, Stripe, e-mail)
  errZone: 'Podaj kod pocztowy w formacie 09-400.',
  errOutsideZone: 'Na razie dowozimy tylko w promieniu {radius} km od Płocka — sprawdź kod pocztowy w koszyku.',
  errStripe: 'Płatności nie są jeszcze skonfigurowane (STRIPE_SECRET_KEY).',
  errEmptyCart: 'Koszyk jest pusty.',
  errCheckout: 'Nie udało się rozpocząć płatności. Spróbuj ponownie.',
  errAiConfig: 'Asystent nie jest jeszcze skonfigurowany (ANTHROPIC_API_KEY).',
  errAiEmpty: 'Brak wiadomości.', errAiDown: 'Asystent chwilowo niedostępny. Spróbuj za moment.', aiFallback: 'Hmm, spróbuj zapytać inaczej 🍟',
  shipLocal: 'Dowozimy sami — {place}, {km} km', shipLocalFree: 'Dowozimy sami — {place}, {km} km — GRATIS',
  mailSubject: 'Lekker! Twoje zamówienie w PanFrikandel 🍟',
  mailThanks: 'Dziękujemy, {name}!', mailGuest: 'smakoszu', mailPacking: 'Twoje holenderskie przekąski już się pakują.', mailTotal: 'Razem',
  mailDeliveryHtml: '🛵 <strong>Dowozimy sami!</strong> Zadzwonimy lub napiszemy, żeby umówić dostawę — {eta}. Produkty przywozimy prosto z mroźni, więc od razu włóż je do zamrażarki.',
  mailAddress: '📍 Adres dostawy: ',
  mailFooterHtml: 'PanFrikandel · panfrikandel.pl<br>Pytania? Odpowiedz na tego maila.',

  client: {
    cartEmptyHtml: 'Koszyk jest pusty…<br>a frikandele same się nie zjedzą 🍟',
    less: 'Mniej', more: 'Więcej',
    needZone: '📍 Najpierw sprawdź kod pocztowy — dowozimy w promieniu {radius} km od Płocka.',
    outsideZone: '🚫 {place} ({km} km) jest poza naszą strefą {radius} km — na razie nie dowozimy. Zapisaliśmy Twoje zainteresowanie!',
    unknownZone: '🚫 Kodu {code} nie ma w naszej strefie ({radius} km od Płocka). Zapisaliśmy sprawdzenie — mieszkasz blisko? Napisz do nas.',
    shipFree: '🎉 Dostawa gratis — dowozimy sami do {place}!',
    shipLine: '🛵 Dostawa ({place}, {km} km): {price} · do darmowej brakuje {missing}',
    added: 'Dodano do koszyka! Lekker 👌',
    wait: 'Chwileczkę…', checkout: 'Przejdź do płatności →',
    errGeneric: 'Coś poszło nie tak.', errConn: 'Błąd połączenia. Spróbuj ponownie.',
    zoneOkHtml: '✅ <b>{place}</b> ({km} km od Płocka) — dowozimy! {price}, gratis od {free}, {eta}.',
    zoneFarHtml: '🚫 <b>{place}</b> to {km} km od Płocka — poza strefą {radius} km. Na razie tam nie dowozimy, ale zapisaliśmy Twoje sprawdzenie: im więcej pytań z okolicy, tym szybciej rozszerzymy zasięg.',
    zoneUnknownHtml: '🚫 Kodu {code} nie ma w naszej strefie ({radius} km od Płocka). Zapisaliśmy sprawdzenie — jeśli mieszkasz blisko, <a href="mailto:hallo@panfrikandel.pl">napisz do nas</a>.',
    zoneInvalid: 'Wpisz pełny kod pocztowy, np. 09-400.', zoneErr: 'Nie udało się sprawdzić kodu — spróbuj ponownie.',
    zoneToast: '🛵 Dowozimy do Ciebie!',
    showAllHtml: 'Pokaż wszystkie <span class="more-count">{n}</span> produktów ▾', showLess: 'Pokaż mniej ▴',
    aiThinking: 'PanFrikandel myśli…', aiErr: 'Coś poszło nie tak — spróbuj ponownie.', aiConn: 'Błąd połączenia — spróbuj ponownie.'
  }
};

UI.en = {
  langName: 'English',
  title: 'PanFrikandel — Dutch snacks delivered in and around Płock',
  metaDesc: 'PanFrikandel — authentic Dutch snacks: frikandel, bitterballen, kroket. We deliver ourselves in Płock and within 50 km. Pay with BLIK, P24 or card.',
  marquee: ['FRIKANDEL', 'BITTERBALLEN', 'KROKET', 'KAASSOUFFLÉ', 'PŁOCK +{radius} KM: WE DELIVER OURSELVES', 'LEKKER!'],
  navShop: 'Shop', navDelivery: 'Delivery', navFaq: 'FAQ', navCart: 'Cart', langLabel: 'Language',

  heroKicker: '🇳🇱 Straight from Holland → 🇵🇱 Płock and surroundings',
  heroH1Html: 'Missing your <em>frikandel</em>?<br>We bring it to you.',
  heroSubHtml: 'Authentic snacks from the Dutch snack bar — frozen, delivered by us straight from the freezer. <strong>Płock and up to {radius} km around it, {eta}.</strong> <a href="#strefa">Check your postcode.</a>',
  heroCta: 'Order now', heroCta2: 'How does delivery work?',
  badgeFrozen: '❄️ Always frozen', badgePay: '💳 BLIK · P24 · card',
  badgeDelivery: '🛵 Delivery {price} · free from {free}', badgeZone: '📍 Płock +{radius} km',
  stickerHtml: '100%<br>lekker',

  shopH2Html: 'The snack bar, <em>online</em>',
  shopSub: 'Everything frozen, ready in 10 minutes in the oven or air fryer.',
  cats: { klasyki: 'Frikandels & classics', bitterballen: 'Bitterballen & croquettes — the biggest range in Poland', sosy: 'Sauces — half the magic', boxy: 'Boxes — best value', sprzet: 'Oil & equipment — a snack bar at home' },
  showAllHtml: 'Show all <span class="more-count">{n}</span> products ▾',
  cardSpecs: 'Specifications', cardIngredients: 'Ingredients & preparation', addToCart: '+ Add to cart', productDetails: 'Product details',
  pdPrep: 'Preparation', pdSpecs: 'Specifications', pdIngredients: 'Ingredients', pdAllergens: 'Allergens', pdNutrition: 'Nutrition (per 100 g)', pdStorage: 'Storage',

  deliveryH2Html: 'A frikandel at your door?<br><em>We deliver ourselves.</em>',
  steps: [
    { t: 'Check your postcode', p: 'Within {radius} km of Płock? Enter your postcode in the cart — you\'ll know straight away whether we deliver.' },
    { t: 'You order', p: 'Pick your snacks and pay with BLIK, Przelewy24 or card through secure Stripe checkout.' },
    { t: 'We deliver ourselves', p: 'We call to agree a time and bring it straight from the freezer — {eta}. Delivery {price}, <strong>free from {free}</strong>.' },
    { t: 'Freezer → air fryer', p: '10 minutes and you have a real Dutch snack bar at home. Eet smakelijk!' }
  ],
  zoneKicker: '🛵 Delivery zone · {city} +{radius} km',
  zoneH3Html: 'Do we deliver to you?<br><em>Check your postcode.</em>',
  zonePHtml: 'For now we deliver within {radius} km of Płock — Gostynin, Sierpc, Płońsk, Kutno, Włocławek and everything in between. Not in the zone? We log every check and expand wherever there\'s interest.',
  zoneLabel: 'Check whether we deliver to you', zonePlaceholder: 'e.g. 09-400', zoneCheck: 'Check', zoneAria: 'Postcode',

  faqH2Html: 'Questions? <em>We have answers</em>',
  faq: [
    { q: 'What exactly is a frikandel?', a: 'The most popular snack in the Netherlands: a long, deep-fried sausage of minced meats with a smooth texture and a lightly spiced flavour. The Dutch eat over 600 million of them a year. "Frikandel speciaal" = with curry ketchup, fritessaus and raw onion.' },
    { q: 'Will the products really arrive frozen?', a: 'Yes. We bring them straight from the freezer (-18°C) in a thermal bag and hand them over in person. Put them in your freezer right away.' },
    { q: 'How do I prepare the snacks?', a: 'Best in an air fryer (approx. 8–10 min, 180°C) or oven (approx. 12–15 min, 200°C). Or the classic way in a deep fryer — 3–4 minutes at 180°C. Always straight from the freezer, no thawing.' },
    { q: 'Which payment methods do you accept?', a: 'BLIK, Przelewy24 and payment cards — all handled by Stripe, no account needed.' },
    { q: 'I live more than {radius} km from Płock — what now?', a: 'For now we only deliver within {radius} km of Płock. Check your postcode anyway — we log every check, and if there\'s interest in your area we\'ll extend the zone. You can also e-mail hallo@panfrikandel.pl.' },
    { q: 'What if I\'m not at home?', a: 'We call before delivery to agree a time. If your plans change, let us know — we\'ll move the delivery to another day.' }
  ],

  footerTaglineHtml: 'Dutch snacks delivered<br>in and around Płock. Echt lekker.',
  footerShop: 'Shop', footerAll: 'All products', footerInfo: 'Information', footerTerms: 'Terms & conditions', footerPrivacy: 'Privacy policy',
  footerPayAria: 'Available payment methods', footerPayLabel: 'Secure payments via Stripe:', footerNote: 'Echt lekker.',

  cartTitle: 'Your cart', close: 'Close',
  cartZoneLabel: '📍 Enter your postcode — we deliver within {radius} km of Płock', cartZonePlaceholder: '09-400',
  cartTotal: 'Total', checkout: 'Go to checkout →', cartPay: '💳 BLIK · Przelewy24 · card — via Stripe',

  aiFab: 'Ask PanFrikandel', aiName: 'PanFrikandel', aiSub: 'Your Dutch snack advisor 🍟',
  aiWelcome: 'Hi! PanFrikandel here. Tell me what you fancy — a party with friends, a quick dinner, something veggie, something really spicy? I\'ll advise you like an old friend from the snack bar. 🧡',
  aiPlaceholder: 'e.g. something spicy for a party of 8…',

  successTitle: 'Thank you! — PanFrikandel', successStickerHtml: 'Dank<br>je!', successH1: 'Order received! 🍟',
  successMailHtml: 'We\'ve sent a confirmation to <strong>{email}</strong>. ',
  successHtml: '🛵 <strong>We deliver ourselves!</strong> We\'ll call or message you to arrange delivery — {eta}. The snacks come straight from our freezer, so put them in yours right away.',
  backToShop: '← Back to the shop',
  termsTitle: 'Terms & conditions — PanFrikandel', privacyTitle: 'Privacy policy — PanFrikandel',

  errZone: 'Enter a postcode in the format 09-400.',
  errOutsideZone: 'For now we only deliver within {radius} km of Płock — check your postcode in the cart.',
  errStripe: 'Payments are not configured yet (STRIPE_SECRET_KEY).',
  errEmptyCart: 'Your cart is empty.',
  errCheckout: 'Could not start the payment. Please try again.',
  errAiConfig: 'The assistant is not configured yet (ANTHROPIC_API_KEY).',
  errAiEmpty: 'No message.', errAiDown: 'The assistant is temporarily unavailable. Try again in a moment.', aiFallback: 'Hmm, try asking differently 🍟',
  shipLocal: 'We deliver ourselves — {place}, {km} km', shipLocalFree: 'We deliver ourselves — {place}, {km} km — FREE',
  mailSubject: 'Lekker! Your PanFrikandel order 🍟',
  mailThanks: 'Thank you, {name}!', mailGuest: 'snack lover', mailPacking: 'Your Dutch snacks are being packed.', mailTotal: 'Total',
  mailDeliveryHtml: '🛵 <strong>We deliver ourselves!</strong> We\'ll call or message you to arrange delivery — {eta}. The products come straight from our freezer, so put them in yours right away.',
  mailAddress: '📍 Delivery address: ',
  mailFooterHtml: 'PanFrikandel · panfrikandel.pl<br>Questions? Just reply to this e-mail.',

  client: {
    cartEmptyHtml: 'Your cart is empty…<br>and the frikandels won\'t eat themselves 🍟',
    less: 'Less', more: 'More',
    needZone: '📍 Check your postcode first — we deliver within {radius} km of Płock.',
    outsideZone: '🚫 {place} ({km} km) is outside our {radius} km zone — we don\'t deliver there yet. We\'ve noted your interest!',
    unknownZone: '🚫 Postcode {code} isn\'t in our zone ({radius} km from Płock). We\'ve logged the check — live nearby? Drop us a line.',
    shipFree: '🎉 Free delivery — we bring it to {place} ourselves!',
    shipLine: '🛵 Delivery ({place}, {km} km): {price} · {missing} more for free delivery',
    added: 'Added to cart! Lekker 👌',
    wait: 'One moment…', checkout: 'Go to checkout →',
    errGeneric: 'Something went wrong.', errConn: 'Connection error. Please try again.',
    zoneOkHtml: '✅ <b>{place}</b> ({km} km from Płock) — we deliver! {price}, free from {free}, {eta}.',
    zoneFarHtml: '🚫 <b>{place}</b> is {km} km from Płock — outside our {radius} km zone. We don\'t deliver there yet, but we\'ve logged your check: the more requests from an area, the sooner we expand.',
    zoneUnknownHtml: '🚫 Postcode {code} isn\'t in our zone ({radius} km from Płock). We\'ve logged the check — live nearby? <a href="mailto:hallo@panfrikandel.pl">Drop us a line</a>.',
    zoneInvalid: 'Enter a full postcode, e.g. 09-400.', zoneErr: 'Could not check the postcode — please try again.',
    zoneToast: '🛵 We deliver to you!',
    showAllHtml: 'Show all <span class="more-count">{n}</span> products ▾', showLess: 'Show less ▴',
    aiThinking: 'PanFrikandel is thinking…', aiErr: 'Something went wrong — please try again.', aiConn: 'Connection error — please try again.'
  }
};

const LANGS = ['pl', 'en'];

// t(key, vars): tekst in gevraagde taal, valt terug op PL en daarna op de key zelf.
// Niet-string waarden (arrays/objecten) komen ongewijzigd terug; {vars} in strings worden ingevuld.
function makeT(lang) {
  const d = UI[lang] || UI.pl;
  return (key, vars) => {
    let s = d[key] != null ? d[key] : UI.pl[key];
    if (s == null) return key;
    if (typeof s !== 'string') return s;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split('{' + k + '}').join(v);
    return s;
  };
}

// Geldbedrag: PL "12,90 zł" · EN "12.90 zł"
const money = (gr, lang) => (gr / 100).toFixed(2).replace('.', lang === 'en' ? '.' : ',') + ' zł';

module.exports = { UI, LANGS, makeT, money };
