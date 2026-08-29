# 🍟 PanFrikandel

Holenderskie przekąski · dowozimy sami w Płocku i okolicach (50 km) · PL/EN.
Node.js/Express/EJS + Stripe Checkout (BLIK · P24 · karta) + Resend.

## Deploy op Railway (bekende workflow)

1. ZIP uitpakken → nieuwe repo in GitHub Desktop → push
2. Railway: New Project → Deploy from GitHub repo
3. Environment variables instellen:

| Variabele | Waarde |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` (of `sk_test_...` om te testen) |
| `RESEND_API_KEY` | `re_...` |
| `BASE_URL` | `https://panfrikandel.pl` (of de Railway-URL) |
| `ORDER_EMAIL_FROM` | `PanFrikandel <zamowienia@panfrikandel.pl>` (domein eerst verifiëren in Resend) |
| `ORDER_EMAIL_BCC` | eigen mailadres — kopie van elke bestelling (optioneel) |
| `ANTHROPIC_API_KEY` | `sk-ant-...` — voor de AI-assistent "PanFrikandel" |
| `ADMIN_PASSWORD` | wachtwoord voor `/admin` (prijzen + bezorgstatistieken) |
| `DATABASE_URL` | Railway PostgreSQL — nodig zodat prijswijzigingen en statistieken deploys overleven |
| `DELIVERY_RADIUS_KM` | straal van de bezorgzone rond Płock in km (optioneel, standaard 50) |

## Stripe-instellingen

- In het Stripe-dashboard **BLIK** en **Przelewy24** activeren onder
  Settings → Payment methods (vereist PLN-afwikkeling).
- Checkout draait volledig via Stripe-hosted pages; er is geen webhook nodig
  voor v1 — de orderbevestiging wordt verstuurd bij het laden van `/sukces`
  na geverifieerde betaling (`payment_status === 'paid'`).

## Bezorging: alleen eigen bezorging, Płock + 50 km

Er is geen kurier. De klant moet eerst een postcode invullen (sectie
"Dostawa" of winkelmand); alleen binnen de zone kan er afgerekend worden.

- **Zonecheck op postcode** — geen externe API. `ZONE_POSTCODES` in
  `server.js` koppelt postcodes/gminy rond Płock aan coördinaten; de
  afstand tot het centrum van Płock (hemelsbreed) bepaalt of een code binnen
  `DELIVERY.radiusKm` valt. Onbekende codes vallen terug op de prefix-tabel
  `ZONE_PREFIXES` (hoofdplaats van de subregio) en anders op "buiten de
  zone". Ontbrekende codes zie je in `/admin` als "onbekend" — voeg ze toe.
- **Checkout** — `POST /api/checkout` weigert (400) zonder postcode in de
  zone. Stripe Checkout krijgt één verzendoptie "Dowozimy sami — Słupno,
  8 km" (gratis boven de drempel); postcode, plaats, afstand en taal staan in
  de sessie-`metadata`.
- **Prijs / drempel / levertekst** — `DELIVERY` in `server.js`
  (nu 19 zł, gratis vanaf 150 zł, "zwykle następnego dnia" / "usually the
  next day").
- **Meten** — elke postcodecheck (ook buiten de zone!) en elke betaalde
  bestelling wordt gelogd (PostgreSQL-tabellen `local_zone_checks` /
  `local_orders`, of `data/local-stats.json` zonder `DATABASE_URL`).
  `/admin` toont de laatste 30 dagen: checks binnen/buiten de zone,
  top-postcodes, **vraag buiten de zone** (om te beslissen of de straal
  omhoog kan), bestellingen en omzet.
- **Endpoint** — `POST /api/strefa` `{ kod: "09-400", zrodlo: "koszyk"|"sekcja" }`
  → `{ code, known, place, km, inZone, radiusKm, city, priceGr, freeAboveGr, eta }`.

## Talen (PL/EN)

- Taalkeuze via de knop PL | EN in de navigatie (`?lang=en` → cookie
  `pf_lang`, daarna redirect naar de schone URL). Zonder cookie: browser met
  Engels vóór Pools in `Accept-Language` krijgt EN, anders PL.
- **UI-teksten**: `locales/ui.js` (`UI.pl` / `UI.en`). In de views: `t('key', vars)`,
  `dict` (arrays zoals `faq`, `steps`), `zl()` (geldformaat per taal), `delivery`.
  Het blok `client` gaat als `window.T` naar `public/shop.js`.
- **Productteksten**: `locales/products-en.js` — per product `name`, `unit`,
  `badge`, `desc`, `details`; wordt bij `lang=en` over `PRODUCTS` gelegd.
  Ontbreekt een product of veld, dan blijft het Pools. Nieuw product? Voeg
  het toe in `server.js` én in `products-en.js`.
- Stripe Checkout (`locale`), productnamen in Stripe, de bevestigingsmail en
  de AI-assistent volgen de taal van de klant.
- Regulamin en privacybeleid hebben eigen EN-views (`views/regulamin-en.ejs`,
  `views/prywatnosc-en.ejs`).

## Aanpassen

- **Producten & prijzen**: bovenin `server.js` (`PRODUCTS`, prijzen in grosze);
  Engelse teksten in `locales/products-en.js`.
- **Bezorging (prijs, gratis-drempel, levertekst, straal)**: `DELIVERY` in `server.js`;
  postcodetabel `ZONE_POSTCODES` / `ZONE_PREFIXES` eronder.
- **Bedrijfsgegevens**: `views/regulamin.ejs`, `views/prywatnosc.ejs` en de EN-versies.

## Lokaal draaien

```bash
npm install
STRIPE_SECRET_KEY=sk_test_... node server.js
```

## AI-assistent

De chatknop linksonder ("Zapytaj PanFrikandela" / "Ask PanFrikandel") praat via
`/api/assistent` met de Anthropic API (model `claude-haiku-4-5`, aan te passen
in `server.js`). De catalogus (in de taal van de klant) zit in de system
prompt; de assistent antwoordt in die taal en kan producten aanbevelen als
klikbare chips met een +knop. Zonder `ANTHROPIC_API_KEY` geeft de assistent
een nette foutmelding.

## Homepage-structuur

Per categorie tonen we alleen producten met `top: true` (in `server.js`);
de rest zit achter "Pokaż wszystkie X produktów". Wijzig de toppers door
de `top`-vlag te verplaatsen.

## Admin

`/admin` → inloggen met `ADMIN_PASSWORD` (sessie 8 uur, HttpOnly-cookie,
max. 8 pogingen per 15 min). Bovenaan de bezorgstatistieken, daaronder
prijzen inline aanpassen, zoeken en met één klik opslaan — wijzigingen zijn
direct live voor de shop, Stripe én de AI-assistent.

Persistentie: met `DATABASE_URL` (Railway → PostgreSQL toevoegen aan het
project) gaan overrides naar de tabel `price_overrides` en overleven ze
elke deploy. Zonder database valt de app terug op `data/prices.json` —
prima lokaal, maar op Railway gaat dat bestand bij een redeploy verloren,
dus koppel daar altijd PostgreSQL.
