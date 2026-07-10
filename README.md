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

## Stripe-instellingen

- In het Stripe-dashboard **BLIK** en **Przelewy24** activeren onder
  Settings → Payment methods (vereist PLN-afwikkeling).
- Checkout draait volledig via Stripe-hosted pages; er is geen webhook nodig
  voor v1 — de orderbevestiging wordt verstuurd bij het laden van `/sukces`
  na geverifieerde betaling (`payment_status === 'paid'`).

## Aanpassen

- **Producten & prijzen**: bovenin `server.js` (`PRODUCTS`, prijzen in grosze).
- **Verzendkosten / gratis-drempel**: `SHIPPING` in `server.js`.
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
