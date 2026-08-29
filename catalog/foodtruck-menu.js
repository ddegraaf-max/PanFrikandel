// ============================================================
//  MENUKAART FOOD TRUCK — getoond op /foodtruck (sectie "Menu z okienka")
//  Prijzen in grosze (1000 = 10,00 zł). Dit zijn AANNAMES als startpunt —
//  pas aan naar je eigen kostprijs. Teksten PL/EN inline.
//  Categorieën (volgorde + titels) staan in locales/ui.js → menuCats.
// ============================================================

module.exports = [
  // ---- Frytki i sosy ----
  { cat: 'frytki', name: { pl: 'Frytki holenderskie w rożku', en: 'Dutch fries in a cone' },
    desc: { pl: 'Grube, dwukrotnie smażone — jak w Holandii.', en: 'Thick-cut, double-fried — the Dutch way.' },
    variants: [{ label: { pl: 'małe', en: 'small' }, price: 1000 }, { label: { pl: 'duże', en: 'large' }, price: 1400 }] },
  { cat: 'frytki', name: { pl: 'Sos do frytek', en: 'Sauce for your fries' },
    desc: { pl: 'Fritessaus · curry ketchup · joppiesaus · satay · majonez', en: 'Fritessaus · curry ketchup · joppiesaus · satay · mayo' }, price: 250 },
  { cat: 'frytki', name: { pl: 'Patatje oorlog', en: 'Patatje oorlog' },
    desc: { pl: 'Frytki z sosem satay, majonezem i surową cebulką — „frytki wojenne”.', en: 'Fries with satay sauce, mayo and raw onion — "war fries".' }, price: 1700 },
  { cat: 'frytki', name: { pl: 'Patatje speciaal', en: 'Patatje speciaal' },
    desc: { pl: 'Frytki z curry ketchupem, majonezem i cebulką.', en: 'Fries with curry ketchup, mayo and onion.' }, price: 1600 },

  // ---- Snacki z frytkownicy ----
  { cat: 'snacki', name: { pl: 'Frikandel', en: 'Frikandel' }, price: 900 },
  { cat: 'snacki', name: { pl: 'Frikandel speciaal', en: 'Frikandel speciaal' },
    desc: { pl: 'Z curry ketchupem, majonezem i cebulką.', en: 'With curry ketchup, mayo and onion.' }, price: 1200 },
  { cat: 'snacki', name: { pl: 'Broodje frikandel speciaal', en: 'Broodje frikandel speciaal' },
    desc: { pl: 'Frikandel w miękkiej bułce z curry ketchupem, majonezem i surową cebulką — kanapka nr 1 w Holandii.', en: 'Frikandel in a soft roll with curry ketchup, mayo and raw onion — the number one sandwich in the Netherlands.' }, price: 1400 },
  { cat: 'snacki', name: { pl: 'Kroket wołowy', en: 'Beef kroket' }, price: 1000 },
  { cat: 'snacki', name: { pl: 'Broodje kroket', en: 'Broodje kroket' },
    desc: { pl: 'Kroket na miękkiej bułce z musztardą.', en: 'Kroket on a soft roll with mustard.' }, price: 1400 },
  { cat: 'snacki', name: { pl: 'Bitterballen', en: 'Bitterballen' },
    desc: { pl: 'Z musztardą — do piwa idealne.', en: 'With mustard — perfect with a beer.' },
    variants: [{ label: { pl: '6 szt.', en: '6 pcs' }, price: 1600 }, { label: { pl: '9 szt.', en: '9 pcs' }, price: 2200 }] },
  { cat: 'snacki', name: { pl: 'Kaassoufflé', en: 'Kaassoufflé' },
    desc: { pl: 'Wege — ciągnący się ser Gouda w chrupiącym cieście.', en: 'Veggie — melting Gouda in a crispy crust.' }, price: 900 },
  { cat: 'snacki', name: { pl: 'Bamischijf', en: 'Bamischijf' },
    desc: { pl: 'Makaron bami z warzywami w panierce.', en: 'Bami noodles with vegetables in a crispy coating.' }, price: 1100 },
  { cat: 'snacki', name: { pl: 'Kipkorn', en: 'Kipkorn' },
    desc: { pl: 'Kurczak w panierce z płatków kukurydzianych.', en: 'Chicken in a cornflake coating.' }, price: 1100 },

  // ---- Zestawy ----
  { cat: 'zestawy', name: { pl: 'Zestaw Frikandel speciaal', en: 'Frikandel speciaal combo' },
    desc: { pl: 'Frikandel speciaal + małe frytki z sosem.', en: 'Frikandel speciaal + small fries with sauce.' }, price: 2200 },
  { cat: 'zestawy', name: { pl: 'Zestaw Kroket', en: 'Kroket combo' },
    desc: { pl: 'Broodje kroket + małe frytki z sosem.', en: 'Broodje kroket + small fries with sauce.' }, price: 2400 },
  { cat: 'zestawy', name: { pl: 'Talerz imprezowy', en: 'Party platter' },
    desc: { pl: 'Duże frytki, 6 bitterballen, 2 mini frikandelle, 2 sosy — dla 2–3 osób.', en: 'Large fries, 6 bitterballen, 2 mini frikandels, 2 sauces — for 2–3 people.' }, price: 3900 },

  // ---- Napoje ----
  { cat: 'napoje', name: { pl: 'Napoje gazowane 0,33 l', en: 'Soft drinks 0.33 l' }, price: 700 },
  { cat: 'napoje', name: { pl: 'Woda 0,5 l', en: 'Water 0.5 l' }, price: 500 },
  { cat: 'napoje', name: { pl: 'Chocomel / Fristi 0,25 l', en: 'Chocomel / Fristi 0.25 l' },
    desc: { pl: 'Holenderskie klasyki z lodówki.', en: 'Dutch classics from the fridge.' }, price: 800 }
];
