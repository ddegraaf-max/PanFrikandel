// ============================================================
//  UI-TEKSTEN — PL (standaard) / EN
//  t(key, vars) in de views vervangt {naam} door vars.naam.
//  Keys met suffix "Html" bevatten opmaak en worden met <%- %> geplaatst.
//  `client` gaat als window.T naar shop.js / hurt.js.
//  Bezorgmodel: alleen eigen bezorging, Płock + {radius} km.
//  Shop = Mora-consumentenverpakkingen met prijs; /hurt = horeca-catalogus op aanvraag.
// ============================================================

const UI = {};

UI.pl = {
  langName: 'Polski',
  title: 'PanFrikandel — holenderskie przekąski Mora z dostawą w Płocku i okolicach',
  metaDesc: 'PanFrikandel — oryginalne holenderskie przekąski Mora: frikandel, bitterballen, kroket, kaassoufflé. Dowozimy sami w Płocku i w promieniu 50 km. Płatność BLIK, P24, karta.',
  marquee: ['FRIKANDEL', 'BITTERBALLEN', 'KROKET', 'KAASSOUFFLÉ', 'PŁOCK +{radius} KM: DOWOZIMY SAMI', 'LEKKER!'],
  navShop: 'Sklep', navDelivery: 'Dostawa', navHurt: 'Hurt', navFaq: 'FAQ', navCart: 'Koszyk', langLabel: 'Język',

  heroKicker: '🇳🇱 Prosto z Holandii → 🇵🇱 Płock i okolice',
  heroH1Html: 'Tęsknisz za <em>frikandelem</em>?<br>My go przywozimy.',
  heroSubHtml: 'Oryginalne holenderskie przekąski <strong>Mora</strong> — te same, które Holendrzy kupują w supermarkecie. Mrożone, przywozimy sami prosto z mroźni: <strong>Płock i okolice do {radius} km, {eta}.</strong> <a href="#strefa">Sprawdź swój kod pocztowy.</a>',
  heroCta: 'Zamów teraz', heroCta2: 'Jak działa dostawa?',
  badgeFrozen: '❄️ Zawsze mrożone', badgePay: '💳 BLIK · P24 · karta',
  badgeDelivery: '🛵 Dostawa {price} · gratis od {free}', badgeZone: '📍 Płock +{radius} km',
  stickerHtml: '100%<br>lekker',

  shopH2Html: 'Frytkownia <em>online</em>',
  shopSub: 'Mora — numer 1 wśród holenderskich snacków. Wszystko mrożone, gotowe w kilka minut w piekarniku lub airfryerze.',
  cats: { klasyki: 'Frikandele i klasyki', bitterballen: 'Bitterballen i krokiety', ser: 'Kaassoufflé — dla fanów sera', mix: 'Miksy na imprezę' },
  catsHurt: { klasyki: 'Frikandele i klasyki — kartony horeca', bitterballen: 'Bitterballen i krokiety — kartony', sosy: 'Sosy — duże opakowania', sprzet: 'Olej i sprzęt' },
  showAllHtml: 'Pokaż wszystkie <span class="more-count">{n}</span> produktów ▾',
  cardSpecs: 'Specyfikacja', cardIngredients: 'Składniki i przygotowanie', addToCart: '+ Do koszyka', productDetails: 'Szczegóły produktu',
  pdPrep: 'Przygotowanie', pdSpecs: 'Specyfikacja', pdIngredients: 'Składniki', pdAllergens: 'Alergeny', pdNutrition: 'Wartości odżywcze (na 100 g)', pdStorage: 'Przechowywanie',

  // hurt-banner op de homepage
  hurtBannerKicker: '🏭 Większe ilości',
  hurtBannerH3Html: 'Impreza, firma, gastronomia?<br><em>Kartony horeca na zapytanie.</em>',
  hurtBannerP: 'Frikandele po 40 sztuk, bitterballen w kartonach, sosy 900 ml, olej i frytkownice — pełen katalog hurtowy z ceną na zapytanie.',
  hurtBannerCta: 'Zobacz katalog hurtowy →',

  deliveryH2Html: 'Frikandel pod Twoje drzwi?<br><em>Dowozimy sami.</em>',
  steps: [
    { t: 'Sprawdzasz kod pocztowy', p: 'Mieszkasz do {radius} km od Płocka? Wpisz kod w koszyku — od razu wiesz, czy dowozimy.' },
    { t: 'Zamawiasz', p: 'Wybierasz przekąski, płacisz BLIK-iem, Przelewy24 lub kartą przez bezpieczny Stripe.' },
    { t: 'Dowozimy sami', p: 'Dzwonimy, umawiamy godzinę i przywozimy prosto z mroźni — {eta}. Dostawa {price}, <strong>gratis od {free}</strong>.' },
    { t: 'Do zamrażarki → airfryer', p: 'Kilka minut i masz w domu prawdziwą holenderską frytkownię. Eet smakelijk!' }
  ],
  zoneKicker: '🛵 Strefa dostawy · {city} +{radius} km',
  zoneH3Html: 'Dowozimy do Ciebie?<br><em>Sprawdź kod pocztowy.</em>',
  zonePHtml: 'Na razie dowozimy w promieniu {radius} km od Płocka — Gostynin, Sierpc, Płońsk, Kutno, Włocławek i wszystko pomiędzy. Nie ma Cię w strefie? Zapisujemy każde sprawdzenie i rozszerzamy zasięg tam, gdzie jest zainteresowanie.',
  zoneLabel: 'Sprawdź, czy dowozimy do Ciebie', zonePlaceholder: 'np. 09-400', zoneCheck: 'Sprawdź', zoneAria: 'Kod pocztowy',

  faqH2Html: 'Pytania? <em>Mamy odpowiedzi</em>',
  faq: [
    { q: 'Czym właściwie jest frikandel?', a: 'Najpopularniejsza przekąska w Holandii: podłużny, smażony kotlecik z mieszanki mięs, o gładkiej konsystencji i lekko korzennym smaku. Holendrzy zjadają ich ponad 600 milionów rocznie. „Frikandel speciaal" = z curry ketchupem, fritessaus i surową cebulką.' },
    { q: 'Dlaczego Mora?', a: 'Mora to najbardziej znana marka snacków w Holandii — od 1962 roku. To dokładnie te same opakowania, które Holendrzy wrzucają do koszyka w supermarkecie. Zaczynamy od małego, sprawdzonego wyboru i rozszerzamy asortyment, gdy widzimy, na co jest apetyt.' },
    { q: 'Czy produkty dojadą naprawdę zamrożone?', a: 'Tak. Przywozimy je prosto z mroźni (-18°C) w torbie termicznej i przekazujemy z ręki do ręki. Po odbiorze włóż produkty od razu do zamrażarki.' },
    { q: 'Jak przygotować przekąski?', a: 'Produkty „Oven & Airfryer” są stworzone do piekarnika (220°C) i airfryera (200°C) — bez frytkownicy. Klasyczne (Classics) najlepiej smażyć we frytkownicy w 175°C, część z nich zrobisz też w airfryerze lub na patelni. Dokładne czasy znajdziesz przy każdym produkcie.' },
    { q: 'Jakie są metody płatności?', a: 'BLIK, Przelewy24 i karty płatnicze — wszystko obsługiwane przez Stripe, bez zakładania konta.' },
    { q: 'Potrzebuję większych ilości — na imprezę, do firmy lub lokalu.', a: 'Mamy osobny katalog hurtowy: kartony horeca (np. 40 frikandeli), bitterballen w kartonach, sosy 900 ml, olej i sprzęt. Ceny na zapytanie — zobacz zakładkę „Hurt”.' },
    { q: 'Mieszkam dalej niż {radius} km od Płocka — co teraz?', a: 'Na razie dowozimy tylko w promieniu {radius} km od Płocka. Sprawdź swój kod — każde sprawdzenie zapisujemy i jeśli w Twojej okolicy będzie zainteresowanie, rozszerzymy strefę. Możesz też napisać na hallo@panfrikandel.pl.' },
    { q: 'Co jeśli nie będzie mnie w domu?', a: 'Przed dostawą dzwonimy i umawiamy godzinę. Jeśli plany się zmienią, daj znać — przełożymy dostawę na inny dzień.' }
  ],

  footerTaglineHtml: 'Holenderskie przekąski Mora z dostawą<br>w Płocku i okolicach. Echt lekker.',
  footerShop: 'Sklep', footerAll: 'Wszystkie produkty', footerHurt: 'Hurt — cena na zapytanie', footerInfo: 'Informacje', footerTerms: 'Regulamin', footerPrivacy: 'Polityka prywatności',
  footerPayAria: 'Dostępne metody płatności', footerPayLabel: 'Bezpieczne płatności przez Stripe:', footerNote: 'Echt lekker.',

  cartTitle: 'Twój koszyk', close: 'Zamknij',
  cartZoneLabel: '📍 Podaj kod pocztowy — dowozimy w promieniu {radius} km od Płocka', cartZonePlaceholder: '09-400',
  cartTotal: 'Razem', checkout: 'Przejdź do płatności →', cartPay: '💳 BLIK · Przelewy24 · karta — przez Stripe',

  aiFab: 'Zapytaj PanFrikandela', aiName: 'PanFrikandel', aiSub: 'Twój holenderski doradca 🍟',
  aiWelcome: 'Cześć! Tu PanFrikandel. Powiedz, na co masz ochotę — impreza ze znajomymi, szybki obiad, coś wege, coś bardzo ostrego? Doradzę jak stary znajomy z frytkowni. 🧡',
  aiPlaceholder: 'np. coś na imprezę dla 8 osób…',

  // ---- /hurt: katalog hurtowy, cena na zapytanie ----
  hurtTitle: 'Hurt — większe ilości, cena na zapytanie — PanFrikandel',
  hurtMetaDesc: 'Holenderskie przekąski w kartonach horeca, sosy 900 ml, olej i frytkownice — dla firm, gastronomii i na imprezy. Cena na zapytanie, dostawa po uzgodnieniu.',
  hurtKicker: '🏭 Dla firm, gastronomii i na duże imprezy',
  hurtH1Html: 'Większe ilości?<br><em>Cena na zapytanie.</em>',
  hurtIntro: 'Kartony horeca, sosy w dużych opakowaniach, olej i sprzęt. Wybierz produkty, podaj orientacyjne ilości i kontakt — odezwiemy się z ofertą i terminem dostawy. Dowozimy w Płocku i okolicy; dalej — zapytaj, coś wymyślimy.',
  hurtSteps: [
    { t: 'Wybierasz produkty', p: 'Kliknij „Do zapytania” przy tym, co Cię interesuje, i podaj orientacyjne ilości (kartony lub sztuki).' },
    { t: 'Wysyłasz zapytanie', p: 'Imię i e-mail lub telefon wystarczą — resztę załatwimy w rozmowie.' },
    { t: 'Dostajesz ofertę', p: 'Odpowiadamy zwykle w ciągu 1 dnia roboczego z ceną i terminem dostawy.' }
  ],
  hurtNoPrice: 'cena na zapytanie', hurtAsk: '+ Do zapytania', hurtAsked: '✓ W zapytaniu',
  hurtBtn: 'Zapytanie', hurtDrawerTitle: 'Twoje zapytanie',
  hurtDrawerEmptyHtml: 'Nic tu jeszcze nie ma…<br>dodaj produkty z katalogu 📦',
  hurtQty: 'Ilość', hurtRemove: 'Usuń',
  hurtFormName: 'Imię i nazwisko', hurtFormEmail: 'E-mail', hurtFormPhone: 'Telefon', hurtFormCompany: 'Firma (opcjonalnie)',
  hurtFormPlace: 'Miejscowość / kod pocztowy', hurtFormMessage: 'Wiadomość — ilości, termin, pytania',
  hurtSend: 'Wyślij zapytanie →', hurtBackShop: '← Sklep detaliczny',
  hurtNoteHtml: 'Pełny skład, alergeny i wartości odżywcze znajdziesz w szczegółach każdego produktu. Ceny zależą od ilości i terminu — dlatego pytamy, zamiast zgadywać.',

  // sukces
  successTitle: 'Dziękujemy! — PanFrikandel', successStickerHtml: 'Dank<br>je!', successH1: 'Zamówienie przyjęte! 🍟',
  successMail: 'Potwierdzenie wysłaliśmy na',
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
  errQuoteForm: 'Podaj imię oraz e-mail lub telefon.',
  errQuoteEmpty: 'Dodaj przynajmniej jeden produkt albo napisz wiadomość.',
  errQuoteRate: 'Za dużo zapytań z tego adresu — spróbuj za godzinę.',
  errQuoteSend: 'Nie udało się wysłać zapytania. Napisz do nas na hallo@panfrikandel.pl.',
  shipLocal: 'Dowozimy sami — {place}, {km} km', shipLocalFree: 'Dowozimy sami — {place}, {km} km — GRATIS',
  mailSubject: 'Lekker! Twoje zamówienie w PanFrikandel 🍟',
  mailThanks: 'Dziękujemy, {name}!', mailGuest: 'smakoszu', mailPacking: 'Twoje holenderskie przekąski już się pakują.', mailTotal: 'Razem',
  mailDeliveryHtml: '🛵 <strong>Dowozimy sami!</strong> Zadzwonimy lub napiszemy, żeby umówić dostawę — {eta}. Produkty przywozimy prosto z mroźni, więc od razu włóż je do zamrażarki.',
  mailAddress: '📍 Adres dostawy: ',
  mailFooterHtml: 'PanFrikandel · panfrikandel.pl<br>Pytania? Odpowiedz na tego maila.',
  quoteMailSubject: 'Otrzymaliśmy Twoje zapytanie — PanFrikandel',
  quoteMailBody: 'Otrzymaliśmy Twoje zapytanie o większe ilości. Odezwiemy się z ofertą i terminem dostawy — zwykle w ciągu 1 dnia roboczego.',
  quoteMailItems: 'Produkty w zapytaniu', quoteMailMessage: 'Twoja wiadomość',

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
    aiThinking: 'PanFrikandel myśli…', aiErr: 'Coś poszło nie tak — spróbuj ponownie.', aiConn: 'Błąd połączenia — spróbuj ponownie.',
    // hurt
    hurtAddedToast: 'Dodano do zapytania 📦', hurtAsk: '+ Do zapytania', hurtAsked: '✓ W zapytaniu',
    hurtEmptyHtml: 'Nic tu jeszcze nie ma…<br>dodaj produkty z katalogu 📦', hurtRemove: 'Usuń', hurtQty: 'Ilość',
    hurtSending: 'Wysyłanie…', hurtSend: 'Wyślij zapytanie →',
    hurtSentHtml: '✅ <b>Dziękujemy!</b> Odezwiemy się z ofertą — zwykle w ciągu 1 dnia roboczego.',
    hurtErrForm: 'Podaj imię oraz e-mail lub telefon.', hurtErrEmpty: 'Dodaj przynajmniej jeden produkt albo napisz wiadomość.'
  }
};

UI.en = {
  langName: 'English',
  title: 'PanFrikandel — Dutch Mora snacks delivered in and around Płock',
  metaDesc: 'PanFrikandel — authentic Dutch Mora snacks: frikandel, bitterballen, kroket, kaassoufflé. We deliver ourselves in Płock and within 50 km. Pay with BLIK, P24 or card.',
  marquee: ['FRIKANDEL', 'BITTERBALLEN', 'KROKET', 'KAASSOUFFLÉ', 'PŁOCK +{radius} KM: WE DELIVER OURSELVES', 'LEKKER!'],
  navShop: 'Shop', navDelivery: 'Delivery', navHurt: 'Wholesale', navFaq: 'FAQ', navCart: 'Cart', langLabel: 'Language',

  heroKicker: '🇳🇱 Straight from Holland → 🇵🇱 Płock and surroundings',
  heroH1Html: 'Missing your <em>frikandel</em>?<br>We bring it to you.',
  heroSubHtml: 'Authentic Dutch <strong>Mora</strong> snacks — the very packs the Dutch pick up at the supermarket. Frozen, delivered by us straight from the freezer: <strong>Płock and up to {radius} km around it, {eta}.</strong> <a href="#strefa">Check your postcode.</a>',
  heroCta: 'Order now', heroCta2: 'How does delivery work?',
  badgeFrozen: '❄️ Always frozen', badgePay: '💳 BLIK · P24 · card',
  badgeDelivery: '🛵 Delivery {price} · free from {free}', badgeZone: '📍 Płock +{radius} km',
  stickerHtml: '100%<br>lekker',

  shopH2Html: 'The snack bar, <em>online</em>',
  shopSub: 'Mora — the number one Dutch snack brand. Everything frozen, ready in minutes in the oven or air fryer.',
  cats: { klasyki: 'Frikandels & classics', bitterballen: 'Bitterballen & croquettes', ser: 'Kaassoufflé — for cheese lovers', mix: 'Party mixes' },
  catsHurt: { klasyki: 'Frikandels & classics — catering boxes', bitterballen: 'Bitterballen & croquettes — boxes', sosy: 'Sauces — large packs', sprzet: 'Oil & equipment' },
  showAllHtml: 'Show all <span class="more-count">{n}</span> products ▾',
  cardSpecs: 'Specifications', cardIngredients: 'Ingredients & preparation', addToCart: '+ Add to cart', productDetails: 'Product details',
  pdPrep: 'Preparation', pdSpecs: 'Specifications', pdIngredients: 'Ingredients', pdAllergens: 'Allergens', pdNutrition: 'Nutrition (per 100 g)', pdStorage: 'Storage',

  hurtBannerKicker: '🏭 Larger volumes',
  hurtBannerH3Html: 'Party, company, restaurant?<br><em>Catering boxes on request.</em>',
  hurtBannerP: 'Frikandels by the 40, bitterballen by the box, 900 ml sauces, oil and fryers — the full wholesale catalogue, priced on request.',
  hurtBannerCta: 'See the wholesale catalogue →',

  deliveryH2Html: 'A frikandel at your door?<br><em>We deliver ourselves.</em>',
  steps: [
    { t: 'Check your postcode', p: 'Within {radius} km of Płock? Enter your postcode in the cart — you\'ll know straight away whether we deliver.' },
    { t: 'You order', p: 'Pick your snacks and pay with BLIK, Przelewy24 or card through secure Stripe checkout.' },
    { t: 'We deliver ourselves', p: 'We call to agree a time and bring it straight from the freezer — {eta}. Delivery {price}, <strong>free from {free}</strong>.' },
    { t: 'Freezer → air fryer', p: 'A few minutes and you have a real Dutch snack bar at home. Eet smakelijk!' }
  ],
  zoneKicker: '🛵 Delivery zone · {city} +{radius} km',
  zoneH3Html: 'Do we deliver to you?<br><em>Check your postcode.</em>',
  zonePHtml: 'For now we deliver within {radius} km of Płock — Gostynin, Sierpc, Płońsk, Kutno, Włocławek and everything in between. Not in the zone? We log every check and expand wherever there\'s interest.',
  zoneLabel: 'Check whether we deliver to you', zonePlaceholder: 'e.g. 09-400', zoneCheck: 'Check', zoneAria: 'Postcode',

  faqH2Html: 'Questions? <em>We have answers</em>',
  faq: [
    { q: 'What exactly is a frikandel?', a: 'The most popular snack in the Netherlands: a long, deep-fried sausage of minced meats with a smooth texture and a lightly spiced flavour. The Dutch eat over 600 million of them a year. "Frikandel speciaal" = with curry ketchup, fritessaus and raw onion.' },
    { q: 'Why Mora?', a: 'Mora is the best-known snack brand in the Netherlands — since 1962. These are exactly the packs the Dutch put in their supermarket basket. We start with a small, proven selection and expand the range as we see what people have an appetite for.' },
    { q: 'Will the products really arrive frozen?', a: 'Yes. We bring them straight from the freezer (-18°C) in a thermal bag and hand them over in person. Put them in your freezer right away.' },
    { q: 'How do I prepare the snacks?', a: '"Oven & Airfryer" products are made for the oven (220°C) and air fryer (200°C) — no deep fryer needed. The Classics are best deep-fried at 175°C; some also work in an air fryer or a pan. Exact times are listed with each product.' },
    { q: 'Which payment methods do you accept?', a: 'BLIK, Przelewy24 and payment cards — all handled by Stripe, no account needed.' },
    { q: 'I need larger quantities — for a party, a company or a restaurant.', a: 'We have a separate wholesale catalogue: catering boxes (e.g. 40 frikandels), bitterballen by the box, 900 ml sauces, oil and equipment. Prices on request — see the "Wholesale" tab.' },
    { q: 'I live more than {radius} km from Płock — what now?', a: 'For now we only deliver within {radius} km of Płock. Check your postcode anyway — we log every check, and if there\'s interest in your area we\'ll extend the zone. You can also e-mail hallo@panfrikandel.pl.' },
    { q: 'What if I\'m not at home?', a: 'We call before delivery to agree a time. If your plans change, let us know — we\'ll move the delivery to another day.' }
  ],

  footerTaglineHtml: 'Dutch Mora snacks delivered<br>in and around Płock. Echt lekker.',
  footerShop: 'Shop', footerAll: 'All products', footerHurt: 'Wholesale — price on request', footerInfo: 'Information', footerTerms: 'Terms & conditions', footerPrivacy: 'Privacy policy',
  footerPayAria: 'Available payment methods', footerPayLabel: 'Secure payments via Stripe:', footerNote: 'Echt lekker.',

  cartTitle: 'Your cart', close: 'Close',
  cartZoneLabel: '📍 Enter your postcode — we deliver within {radius} km of Płock', cartZonePlaceholder: '09-400',
  cartTotal: 'Total', checkout: 'Go to checkout →', cartPay: '💳 BLIK · Przelewy24 · card — via Stripe',

  aiFab: 'Ask PanFrikandel', aiName: 'PanFrikandel', aiSub: 'Your Dutch snack advisor 🍟',
  aiWelcome: 'Hi! PanFrikandel here. Tell me what you fancy — a party with friends, a quick dinner, something veggie, something really spicy? I\'ll advise you like an old friend from the snack bar. 🧡',
  aiPlaceholder: 'e.g. something for a party of 8…',

  hurtTitle: 'Wholesale — larger volumes, price on request — PanFrikandel',
  hurtMetaDesc: 'Dutch snacks in catering boxes, 900 ml sauces, oil and fryers — for companies, restaurants and big parties. Price on request, delivery by arrangement.',
  hurtKicker: '🏭 For companies, restaurants and big parties',
  hurtH1Html: 'Larger volumes?<br><em>Price on request.</em>',
  hurtIntro: 'Catering boxes, large-pack sauces, oil and equipment. Pick the products, give us rough quantities and your contact details — we\'ll come back with a quote and a delivery date. We deliver in and around Płock; further away — ask, we\'ll work something out.',
  hurtSteps: [
    { t: 'Pick your products', p: 'Click "Add to request" on whatever interests you and give rough quantities (boxes or pieces).' },
    { t: 'Send the request', p: 'Your name and an e-mail or phone number are enough — we\'ll sort out the rest in a call.' },
    { t: 'Get a quote', p: 'We usually reply within 1 working day with a price and a delivery date.' }
  ],
  hurtNoPrice: 'price on request', hurtAsk: '+ Add to request', hurtAsked: '✓ In request',
  hurtBtn: 'Request', hurtDrawerTitle: 'Your request',
  hurtDrawerEmptyHtml: 'Nothing here yet…<br>add products from the catalogue 📦',
  hurtQty: 'Quantity', hurtRemove: 'Remove',
  hurtFormName: 'Name', hurtFormEmail: 'E-mail', hurtFormPhone: 'Phone', hurtFormCompany: 'Company (optional)',
  hurtFormPlace: 'Town / postcode', hurtFormMessage: 'Message — quantities, timing, questions',
  hurtSend: 'Send request →', hurtBackShop: '← Retail shop',
  hurtNoteHtml: 'Full ingredients, allergens and nutrition are in each product\'s details. Prices depend on quantity and timing — so we ask rather than guess.',

  successTitle: 'Thank you! — PanFrikandel', successStickerHtml: 'Dank<br>je!', successH1: 'Order received! 🍟',
  successMail: 'We\'ve sent a confirmation to',
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
  errQuoteForm: 'Please give your name and an e-mail or phone number.',
  errQuoteEmpty: 'Add at least one product or write a message.',
  errQuoteRate: 'Too many requests from this address — try again in an hour.',
  errQuoteSend: 'Could not send the request. Please e-mail us at hallo@panfrikandel.pl.',
  shipLocal: 'We deliver ourselves — {place}, {km} km', shipLocalFree: 'We deliver ourselves — {place}, {km} km — FREE',
  mailSubject: 'Lekker! Your PanFrikandel order 🍟',
  mailThanks: 'Thank you, {name}!', mailGuest: 'snack lover', mailPacking: 'Your Dutch snacks are being packed.', mailTotal: 'Total',
  mailDeliveryHtml: '🛵 <strong>We deliver ourselves!</strong> We\'ll call or message you to arrange delivery — {eta}. The products come straight from our freezer, so put them in yours right away.',
  mailAddress: '📍 Delivery address: ',
  mailFooterHtml: 'PanFrikandel · panfrikandel.pl<br>Questions? Just reply to this e-mail.',
  quoteMailSubject: 'We\'ve received your request — PanFrikandel',
  quoteMailBody: 'We\'ve received your request for larger volumes. We\'ll get back to you with a quote and a delivery date — usually within 1 working day.',
  quoteMailItems: 'Products in your request', quoteMailMessage: 'Your message',

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
    aiThinking: 'PanFrikandel is thinking…', aiErr: 'Something went wrong — please try again.', aiConn: 'Connection error — please try again.',
    hurtAddedToast: 'Added to your request 📦', hurtAsk: '+ Add to request', hurtAsked: '✓ In request',
    hurtEmptyHtml: 'Nothing here yet…<br>add products from the catalogue 📦', hurtRemove: 'Remove', hurtQty: 'Quantity',
    hurtSending: 'Sending…', hurtSend: 'Send request →',
    hurtSentHtml: '✅ <b>Thank you!</b> We\'ll get back to you with a quote — usually within 1 working day.',
    hurtErrForm: 'Please give your name and an e-mail or phone number.', hurtErrEmpty: 'Add at least one product or write a message.'
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
