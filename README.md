# 🍟 Pan Frikandel

Holenderskie przekąski · dostawa w całej Polsce.
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
| `ORDER_EMAIL_FROM` | `Pan Frikandel <zamowienia@panfrikandel.pl>` (domein eerst verifiëren in Resend) |
| `ORDER_EMAIL_BCC` | eigen mailadres — kopie van elke bestelling (optioneel) |
| `ANTHROPIC_API_KEY` | `sk-ant-...` — voor de AI-assistent "Pan Frikandel" |
| `ADMIN_PASSWORD` | wachtwoord voor het prijzenbeheer op `/admin` |
| `DATABASE_URL` | Railway PostgreSQL — nodig zodat prijswijzigingen deploys overleven |
| `LOCAL_DELIVERY` | `off` om de pilot "dowozimy sami" (Płock +50 km) uit te zetten (optioneel, standaard aan) |
| `LOCAL_RADIUS_KM` | straal van de lokale bezorgzone in km (optioneel, standaard 50) |

## Stripe-instellingen

- In het Stripe-dashboard **BLIK** en **Przelewy24** activeren onder
  Settings → Payment methods (vereist PLN-afwikkeling).
- Checkout draait volledig via Stripe-hosted pages; er is geen webhook nodig
  voor v1 — de orderbevestiging wordt verstuurd bij het laden van `/sukces`
  na geverifieerde betaling (`payment_status === 'paid'`).

## Aanpassen

- **Producten & prijzen**: bovenin `server.js` (`PRODUCTS`, prijzen in grosze).
- **Verzendkosten / gratis-drempel**: `SHIPPING` in `server.js`.
- **Lokale bezorging (prijs, gratis-drempel, levertekst)**: `LOCAL_DELIVERY` in `server.js`;
  postcodetabel `LOCAL_POSTCODES` / `LOCAL_PREFIXES` eronder.
- **Bedrijfsgegevens invullen**: `views/regulamin.ejs` en `views/prywatnosc.ejs`
  → placeholder `[NAZWA FIRMY, adres, NIP/KvK]`.

## Lokaal draaien

```bash
npm install
STRIPE_SECRET_KEY=sk_test_... node server.js
```

## AI-assistent

De chatknop linksonder ("Zapytaj Pana Frikandela") praat via `/api/assistent`
met de Anthropic API (model `claude-haiku-4-5`, aan te passen in `server.js`).
De volledige catalogus zit in de system prompt; de assistent kan producten
aanbevelen als klikbare chips met een +knop die direct in de koszyk belandt.
Zonder `ANTHROPIC_API_KEY` geeft de assistent een nette foutmelding.

## Homepage-structuur

Per categorie tonen we alleen producten met `top: true` (in `server.js`);
de rest zit achter "Pokaż wszystkie X produktów". Wijzig de toppers door
de `top`-vlag te verplaatsen.

## Admin (prijzenbeheer)

`/admin` → inloggen met `ADMIN_PASSWORD` (sessie 8 uur, HttpOnly-cookie,
max. 8 pogingen per 15 min). Prijzen inline aanpassen, zoeken, en met één
klik opslaan — wijzigingen zijn direct live voor de shop, Stripe én de
AI-assistent.

Persistentie: met `DATABASE_URL` (Railway → PostgreSQL toevoegen aan het
project) gaan overrides naar de tabel `price_overrides` en overleven ze
elke deploy. Zonder database valt de app terug op `data/prices.json` —
prima lokaal, maar op Railway gaat dat bestand bij een redeploy verloren,
dus koppel daar altijd PostgreSQL.

## Pilot: bezorging Płock + 50 km ("Dowozimy sami")

Naast de kurier door heel Polen kan een klant in een straal van 50 km rond
Płock kiezen voor eigen bezorging. Zo werkt het:

- **Zonecheck op postcode** — geen externe API. `LOCAL_POSTCODES` in
  `server.js` koppelt postcodes/gminy rond Płock aan coördinaten; de
  afstand tot het centrum van Płock (hemelsbreed) bepaalt of een code binnen
  `LOCAL_DELIVERY.radiusKm` valt. Onbekende codes vallen terug op de
  prefix-tabel `LOCAL_PREFIXES` (hoofdplaats van de subregio) en anders op
  "buiten de zone" (kurier). Ontbrekende codes zie je in `/admin` onder
  "onbekend" — voeg ze toe aan de tabel.
- **Shop** — postcodechecker in de sectie "Dostawa" (`#lokalnie`) en in de
  winkelmand. Zit de klant in de zone, dan rekent de winkelmand met de lokale
  prijs en krijgt Stripe Checkout de extra verzendoptie "Dowozimy sami"
  (bovenaan; de kurier blijft kiesbaar). De gekozen optie staat in de
  Stripe-sessie als `shipping_rate.metadata.typ` (`lokalna` / `kurier`),
  plus `metadata.kod_pocztowy` en `odleglosc_km` op de sessie zelf.
- **Bevestiging** — `/sukces` en de Resend-mail tonen bij een lokale
  bestelling "Dowozimy sami — zadzwonimy" met het afleveradres; ligt het
  Stripe-adres tóch buiten de zone, dan komt er een ⚠️ in de serverlog en in
  `/admin`.
- **Meten of het aanslaat** — elke postcodecheck (`local_zone_checks`) en
  elke betaalde lokale bestelling (`local_orders`) wordt gelogd in PostgreSQL
  (of `data/local-stats.json` zonder `DATABASE_URL`). `/admin` toont de
  laatste 30 dagen: checks, aandeel in de zone, top-postcodes, lokale
  bestellingen en omzet.
- **Aan/uit** — `LOCAL_DELIVERY=off` verbergt alles (banner, checker,
  Stripe-optie); `LOCAL_RADIUS_KM` verandert de straal zonder code-wijziging.
- **Endpoint** — `POST /api/strefa` `{ kod: "09-400", zrodlo: "koszyk"|"sekcja" }`
  → `{ code, known, place, km, inZone, priceGr, freeAboveGr, eta, radiusKm }`.
