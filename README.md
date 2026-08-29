# 🍟 PanFrikandel

Holenderskie przekąski Mora · dowozimy sami w Płocku i okolicach (50 km) · PL/EN.
Node.js/Express/EJS + Stripe Checkout (BLIK · P24 · karta) + Resend.

Twee catalogi:

- **Shop (`/`)** — Mora-consumentenverpakkingen met prijs (`catalog/retail.js`).
  Klein starten, opschalen via een vinkje in `/admin`.
- **Hurt (`/hurt`)** — de horeca-catalogus (kartony, sauzen 900 ml, olie,
  frituurapparatuur) zónder prijs: klant stelt een aanvraag samen, jij mailt
  een offerte (`catalog/wholesale.js`).

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
| `QUOTE_EMAIL_TO` | mailadres waar hurt-offerteaanvragen heen gaan (valt terug op `ORDER_EMAIL_BCC`) |
| `ANTHROPIC_API_KEY` | `sk-ant-...` — voor de AI-assistent "PanFrikandel" |
| `ADMIN_PASSWORD` | wachtwoord voor `/admin` (prijzen, actief-vlaggen, statistieken, aanvragen) |
| `DATABASE_URL` | Railway PostgreSQL — nodig zodat prijzen/vlaggen/statistieken deploys overleven |
| `DELIVERY_RADIUS_KM` | straal van de bezorgzone rond Płock in km (optioneel, standaard 50) |
| `PRICING_EUR_PLN` | koers EUR→PLN voor het prijsmodel (optioneel, standaard 4.35) |
| `PRICING_MARKUP` | opslag op de inkoopprijs (optioneel, standaard 2.2) |
| `SOCIAL_INSTAGRAM` / `SOCIAL_FACEBOOK` / `SOCIAL_TIKTOK` | links naar de socials (optioneel, standaard `…/panfrikandel`) |
| `FOODTRUCK_LAUNCH_PL` / `FOODTRUCK_LAUNCH_EN` | starttekst food truck, bv. `wiosna 2027` / `spring 2027` (optioneel) |
| `GPS_TOKEN` | geheim voor `/kierowca` en `POST /api/gps` (lange willekeurige string) |
| `GPS_STALE_MIN` | minuten zonder signaal waarna de kar "niet live" is (standaard 30) |
| `SUB_SECRET` | geheim voor bevestig-/afmeldlinks (standaard = `ADMIN_PASSWORD`) |
| `SUB_DISCOUNT_PERCENT` / `SUB_DISCOUNT_ONCE` | korting voor abonnees in % (10) en eenmalig (true) |

## Stripe-instellingen

- In het Stripe-dashboard **BLIK** en **Przelewy24** activeren onder
  Settings → Payment methods (vereist PLN-afwikkeling).
- Checkout draait volledig via Stripe-hosted pages; er is geen webhook nodig
  voor v1 — de orderbevestiging wordt verstuurd bij het laden van `/sukces`
  na geverifieerde betaling (`payment_status === 'paid'`).

## Assortiment & prijzen (shop)

`catalog/retail.js` bevat 17 Mora-producten zoals Vomar ze verkoopt
(vomar.nl, inkoopprijzen per 29 aug 2026), met składniki/alergeny/wartości
odżywcze/przygotowanie van mora.nl (`mora`-veld = bronpagina). 10 staan aan,
7 staan klaar met `active: false`:

- **Prijsmodel**: `prijs = buyEur × PRICING.eurPln × PRICING.markup`, afgerond
  op ,90 zł (bv. Frikandellen 5 szt. €2,15 → 20,90 zł bij koers 4,35 en opslag
  ×2,2). De opslag moet transport NL→PL, vriesopslag, bezorging, btw en marge
  dekken — stel hem bij via `PRICING_MARKUP`.
- **Admin** toont per product inkoop €, berekende prijs, huidige prijs en
  marge; een handmatige prijs overschrijft de berekende (tabel
  `price_overrides`). Het vinkje **Actief** zet een product in of uit de shop
  (tabel `product_flags`) — opschalen zonder code.
- **Nieuw product**: regel in `catalog/retail.js` (met `buyEur`), Engelse
  tekst in `locales/products-en-retail.js`, packshot in `public/img/`.
- Categorieën van de shop staan in `locales/ui.js` (`cats`); lege categorieën
  worden niet getoond.

## Hurt (`/hurt`) — cena na zapytanie

- `catalog/wholesale.js` is de oude volledige catalogus (72 producten); de
  categorie `boxy` wordt niet getoond, prijzen nooit.
- Klant klikt „Do zapytania” bij producten, vult ilość + contact in →
  `POST /api/zapytanie` → mail naar `QUOTE_EMAIL_TO` (reply-to = klant) +
  bevestiging aan de klant in zijn taal + log (tabel `quote_requests` /
  `data/local-stats.json`). Max. 5 aanvragen per IP per uur. Zonder Resend
  wordt de aanvraag in de serverlog geprint.
- Aanvragen van de laatste 30 dagen staan onderaan de statistieken in `/admin`.

## Versienummer

De footer van elke pagina, de admin en `GET /api/version` tonen
`v<versie> · <commit>` — de versie uit `package.json` plus de eerste 7 tekens
van de deploy-commit (Railway zet `RAILWAY_GIT_COMMIT_SHA`). Na een push zie
je zo direct of de nieuwe versie live staat. Verhoog `version` in
`package.json` bij elke release.

## Omgevingsvariabelen

Alle variabelen staan met uitleg in **`.env.example`**. Lokaal: kopieer naar
`.env` (wordt automatisch geladen, staat in `.gitignore`). Op Railway: zet ze
onder *Variables*.

## Food truck LIVE — GPS, abonnees, kortingscode, menukaart

- **GPS**: de telefoon in de kar opent `/kierowca?t=GPS_TOKEN` (link staat in
  `/admin`; HTTPS vereist voor browser-GPS). "▶ Nadawaj pozycję" stuurt elke
  ~15 s (of bij >25 m verplaatsing, plus een hartslag per minuut) de positie
  naar `POST /api/gps`. Een losse tracker of app (OwnTracks, Traccar, Tasker…)
  kan hetzelfde endpoint aanroepen met header `x-gps-token` en body
  `{ lat, lon, accuracy }`. Na `GPS_STALE_MIN` minuten zonder signaal is de kar
  "niet live".
- **Live op de site**: `/foodtruck` toont "🟢 Jesteśmy teraz: …" en een 🚚 op de
  kaart (`GET /api/gps`, ververst elke 30 s). Admin toont dezelfde status.
- **Abonnees (powiadomienia)**: formulier op `/foodtruck` → `POST /api/subskrypcja`
  → bevestigingsmail (double opt-in, HMAC-token met `SUB_SECRET`) →
  `/subskrypcja/potwierdz` → welkomstmail met persoonlijke **kortingscode
  `PF-XXXXXX`**. Afmeldlink (`/subskrypcja/rezygnacja`) in elke mail. Tabel
  `subscribers` (e-mail, taal, plaats, bevestigd, code, code gebruikt).
- **Locatie-mail**: de chauffeur drukt "📣 Ogłoś lokalizację" (of jij in admin
  "Locatie-mail sturen"): plaatsnaam = geplande standplaats van vandaag, anders
  reverse-geocoding via OSM Nominatim, anders coördinaten; alle bevestigde
  abonnees krijgen een mail in hun taal met plaats, uren, kaartlink en (zolang
  ongebruikt) hun code. Verzending in batches van 50 via Resend.
- **Kortingscode**: `SUB_DISCOUNT_PERCENT` (10) en `SUB_DISCOUNT_ONCE` (true =
  eenmalig). In de webshop: veld in de winkelmand → `POST /api/kod` → bij
  afrekenen een Stripe-coupon `PF_SUB_<percent>` (wordt automatisch
  aangemaakt); na betaling wordt de code als gebruikt gemarkeerd (`/sukces`).
  Aan het loket: de chauffeurspagina heeft "Kod rabatowy klienta" → Sprawdź →
  Oznacz jako użyty (`POST /api/gps/kod`).
- **Menukaart**: `catalog/foodtruck-menu.js` (PL/EN, prijzen in grosze —
  startwaarden zijn aannames), categorieën in `locales/ui.js` → `menuCats`.

## Food truck (`/foodtruck`) — frietkar, kaart, socials, evenementen

- Pagina in de huisstijl: aankondiging, **kaart + schema van standplaatsen**
  (Leaflet + OpenStreetMap), socials en een **aanmeldformulier voor
  evenementen**.
- **Standplaatsen** beheer je in `/admin` (sectie "Food truck"): naam, adres,
  van/tot, uren, notitie; klik op de kaart om de plek te prikken (lat/lon).
  Tabel `truck_stops` / `data/truck-stops.json`. Alleen standplaatsen met een
  einddatum ≥ vandaag verschijnen op de site; zonder standplaatsen toont de
  pagina "Pierwsze lokalizacje ogłosimy wkrótce" + socials.
- **Evenement-aanvraag**: `POST /api/wydarzenie` → mail naar `QUOTE_EMAIL_TO`
  (reply-to = aanvrager) + bevestiging in de taal van de klant + log (tabel
  `event_requests`), zichtbaar in `/admin`.
- **Socials** in de footer van alle pagina's en op `/foodtruck`; URL's via env
  `SOCIAL_INSTAGRAM`, `SOCIAL_FACEBOOK`, `SOCIAL_TIKTOK` (standaard
  `…/panfrikandel`). Starttekst via `FOODTRUCK_LAUNCH_PL` / `FOODTRUCK_LAUNCH_EN`
  (bv. "wiosna 2027" / "spring 2027"; leeg = "wkrótce" / "soon").

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
  `dict` (arrays zoals `faq`, `steps`, `cats`), `zl()` (geldformaat per taal),
  `delivery`. Het blok `client` gaat als `window.T` naar `shop.js` / `hurt.js`.
- **Productteksten**: `locales/products-en-retail.js` (shop) en
  `locales/products-en.js` (hurt) — per product `name`, `unit`, `badge`,
  `desc`, `details`; worden bij `lang=en` over de catalogus gelegd. Ontbreekt
  een product of veld, dan blijft het Pools.
- Stripe Checkout (`locale`), productnamen in Stripe, bevestigingsmails en de
  AI-assistent volgen de taal van de klant.
- Regulamin en privacybeleid hebben eigen EN-views (`views/regulamin-en.ejs`,
  `views/prywatnosc-en.ejs`).

- **Bedrijfsgegevens** (Budomatch Daniel de Graaf, CEIDG): env `COMPANY_NAME`,
  `COMPANY_ADDRESS`, `COMPANY_NIP`, `COMPANY_REGON`, `COMPANY_EMAIL`, `COMPANY_PHONE` —
  komen automatisch in regulamin, privacybeleid en de footer; lege velden worden weggelaten.

## Lokaal draaien

```bash
npm install
STRIPE_SECRET_KEY=sk_test_... ADMIN_PASSWORD=geheim node server.js
```

## AI-assistent

De chatknop linksonder ("Zapytaj PanFrikandela" / "Ask PanFrikandel") praat via
`/api/assistent` met de Anthropic API (model `claude-haiku-4-5`, aan te passen
in `server.js`). De actieve shop-catalogus (in de taal van de klant) zit in de
system prompt; de assistent antwoordt in die taal, kan producten aanbevelen als
klikbare chips met een +knop en verwijst grote afnemers naar `/hurt`. Zonder
`ANTHROPIC_API_KEY` geeft de assistent een nette foutmelding.

## Admin

`/admin` → inloggen met `ADMIN_PASSWORD` (sessie 8 uur, HttpOnly-cookie,
max. 8 pogingen per 15 min). Bovenaan de bezorgstatistieken en
offerte-aanvragen, daaronder producten & prijzen (actief-vinkje, inkoop,
berekende prijs, handmatige prijs, marge) — wijzigingen zijn direct live voor
de shop, Stripe én de AI-assistent.

Persistentie: met `DATABASE_URL` (Railway → PostgreSQL toevoegen aan het
project) overleven prijzen, vlaggen, statistieken en aanvragen elke deploy.
Zonder database valt de app terug op JSON-bestanden in `data/` — prima
lokaal, maar op Railway gaat dat bij een redeploy verloren, dus koppel daar
altijd PostgreSQL.
