# Hur du kommer åt Ekonomi

Inloggad som org, samma IdP som resten av huset.

| Yta | Adress |
| --- | --- |
| Nav | `/ekonomi` |
| Fakturor | `/ekonomi/fakturor` |
| En faktura + dokument | `/ekonomi/fakturor/<id>` |
| Verifikat | `/ekonomi/verifikat` |
| Moms / fordringar | `/ekonomi/rapporter` |
| Nycklar | `/ekonomi/anslutningar` |
| Revolut-kontoutdrag | `/ekonomi/kontoutdrag` |
| Revolut-anslutning (status, Anslut, Koppla bort) | `/ekonomi/anslutningar/revolut` |

Två olika OAuth:

| Flöde | URI | Vart den klistras |
| --- | --- | --- |
| Inloggning i Pixdrift | `{APP_BASE_URL}/api/auth/callback` | Pixdrift Identity. Inte Revolut. |
| Revolut Business-certifikat | `https://kansli.vercel.app/api/integrations/revolut/callback` | Revoluts fält *Omdirigerings-URI för OAuth*. Permanent, läses bara ur `REVOLUT_REDIRECT_URI`. |

Revolut-flödet i detalj: `REVOLUT.md`.

JSON:

| Anrop | Behörighet |
| --- | --- |
| `GET /api/ekonomi/invoices` | inloggad org |
| `POST /api/ekonomi/invoices` | `invoice:approve` |
| `POST /api/ekonomi/invoices/:id` `{action:"issue"\|"record_payment"}` | `invoice:approve` |
| `GET /api/ekonomi/reports?kind=vat\|journal\|aged` | inloggad org |
| `GET /api/ekonomi/connectors` | inloggad org (innehåller Revolut-hälsan) |
| `POST /api/ekonomi/connectors` | `invoice:approve` |
| `GET /api/integrations/revolut/connect` | `invoice:approve` |
| `GET /api/integrations/revolut/callback` | Revoluts omdirigering; skyddas av engångs-`state` |

## Miljöslottar

```
STRIPE_SECRET_KEY=          # eller STRIPE_RESTRICTED_KEY
REVOLUT_MERCHANT_SECRET=
REVOLUT_BUSINESS_TOKEN=     # äldre manuell token; OAuth nedan ersätter den
SWISH_PAYEE_ALIAS=
EKONOMI_WRAP_KEY=           # annars APP_SESSION_SECRET
APP_BASE_URL=

REVOLUT_ENVIRONMENT=production
REVOLUT_CLIENT_ID=
REVOLUT_PRIVATE_KEY=
REVOLUT_REDIRECT_URI=https://kansli.vercel.app/api/integrations/revolut/callback
REVOLUT_CERTIFICATE_FINGERPRINT=
REVOLUT_CERTIFICATE_CREATED_AT=
REVOLUT_CERTIFICATE_EXPIRES_AT=
```

De inklistrade värdena i `/ekonomi/anslutningar` krypteras och visas aldrig
igen — bara sista fyra tecken. Kontoutdraget (`/accounts` + `/transactions`)
använder OAuth-anslutningen först och faller tillbaka på den manuella tokenen.

## Rust-kollen

```
cd crates/ekonomi-ledger
cargo test
echo '{"entries":[{"account":"1510","debit_ore":12500,"credit_ore":0},{"account":"3001","debit_ore":0,"credit_ore":10000},{"account":"2610","debit_ore":0,"credit_ore":2500}]}' | cargo run
```

## Vad som medvetet inte finns än

Live Stripe Checkout, Revolut Merchant-widget, Swish QR, 100 simulerade
rader, SIE-fil. Se `PLAN.md`.
