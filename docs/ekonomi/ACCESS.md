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

JSON:

| Anrop | Behörighet |
| --- | --- |
| `GET /api/ekonomi/invoices` | inloggad org |
| `POST /api/ekonomi/invoices` | `invoice:approve` |
| `POST /api/ekonomi/invoices/:id` `{action:"issue"\|"record_payment"}` | `invoice:approve` |
| `GET /api/ekonomi/reports?kind=vat\|journal\|aged` | inloggad org |
| `GET /api/ekonomi/connectors` | inloggad org |
| `POST /api/ekonomi/connectors` | `invoice:approve` |

## Miljöslottar

```
STRIPE_SECRET_KEY=          # eller STRIPE_RESTRICTED_KEY
REVOLUT_BUSINESS_TOKEN=
REVOLUT_MERCHANT_SECRET=
REVOLUT_BUSINESS_SANDBOX=true   # valfritt
SWISH_PAYEE_ALIAS=
EKONOMI_WRAP_KEY=           # annars APP_SESSION_SECRET
```

Samma värden kan klistras i `/ekonomi/anslutningar`. De krypteras och visas
aldrig igen — bara sista fyra tecken.

## Rust-kollen

```
cd crates/ekonomi-ledger
cargo test
echo '{"entries":[{"account":"1510","debit_ore":12500,"credit_ore":0},{"account":"3001","debit_ore":0,"credit_ore":10000},{"account":"2610","debit_ore":0,"credit_ore":2500}]}' | cargo run
```

## Vad som medvetet inte finns än

Live Stripe Checkout, Revolut Merchant-widget, Swish QR, 100 simulerade
rader, SIE-fil. Se `PLAN.md`.
