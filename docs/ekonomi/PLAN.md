# Ekonomi — plan före produktionssteget

Det här är grunden. Produktionsklart + 100 simulerade transaktioner
väntar på uttryckligt OK.

## Vad som delas — och vad som inte gör det

Ekonomi är **ett system** med eget schema. TYRA, IRMA, ALVA, TORA, RITA och
BRITT skriver aldrig i `ekonomi.*`. De skapar en fordran via

- `POST /api/ekonomi/invoices` med `sourceSystem` + `sourceRef`, eller
- en framtida händelse som Ekonomi lyssnar på (inte byggt än).

BRITT ser bara lapparna i `platform.events`.

## Rust-grundrepo

Valt: **Galoy Cala** (`vendor/cala`, Apache-2.0, commit i `UPSTREAM_SHA`).

Cala är ett inbäddat double-entry-bibliotek mot Postgres, använt i produktion.
Det körs **inte** som sidecar i den här grunden. Vi tog postningsdoktrinen
(journal, konto, entry, balans, mallar). `crates/ekonomi-ledger` speglar
samma regler. Efter OK kan Cala validera samma JSON.

Avvisade: rustledger (GPL-3 + plaintext), tackler (git-filer), Ledger-SDK:er
(hårdplånbok).

## Hur pengar ska röra sig

Köparen är **verkstaden** (Bilia-anläggning / org), inte Pixdrift som
marknadsplats. Därför **inte Stripe Connect**. Standard Checkout Sessions
för kort/wallet. Ingen `payment_method_types` i koden — Stripe Dashboard
styr vilka metoder som visas.

```
Källa (TYRA-offert …)
    → Ekonomi bokar sälj             utkast + utfärda i ett steg
    → eller sparar utkast            (ingen bokföring)
    → Utfärda, 10 dagar              Dr 1510 / Cr 3xxx+261x
    → Kunden betalar
         Faktura 10d  → manuell bokning eller Revolut-match
         Stripe       → Checkout när nyckel finns, sedan webhook (efter OK)
         Swish        → Handel-certifikat saknas; manuell bokning tillåten
         Revolut      → Merchant Order om merchant-secret; annars bara match
    → RECORD_PAYMENT                 Dr 193x / Cr 1510
```

Matchning: exakt belopp + valuta. Om två fakturor passar krävs
fakturanummer i referensen. Annars `ambiguous` — vi gissar inte.

## Moms, rapporter, dokument

- Momssatser 25 / 12 / 6 / 0, belopp i öre.
- `/ekonomi/rapporter` + CSV för moms och verifikat.
- Enskild faktura som text/JSON på fakturasidan.
- SIE/BAS-export och Skatteverket-fil är **inte** grunden.

## Revolut-API (granskat)

Två produkter, två slottar:

1. **Business API** `Authorization: Bearer`  
   `GET /transactions?from&to&count` — inbetalningar, state `completed`.  
   Live: `https://b2b.revolut.com/api/1.0`  
   Sandbox: `https://sandbox-b2b.revolut.com/api/1.0` (`REVOLUT_BUSINESS_SANDBOX=true`)  
   Scope READ. PAY behövs inte för matchning.

2. **Merchant API** secret key  
   Orders + Checkout Widget — kundens kort/wallet.  
   Inte samma token som Business.

Payment drafts i Business är **utbetalningar** (leverantör), inte kundinbetalning.

## Stripe

Slot: `STRIPE_SECRET_KEY` eller `STRIPE_RESTRICTED_KEY` (rekommenderat `rk_`).
Checkout Sessions efter OK. Ingen charge utan nyckel.

## Swish

Swish Handel kräver bankcertifikat + payee-alias. Alias-slot finns.
QR/låtsas-betalning byggs inte.

## Mobbin (UI-doktrin)

Flöden som styrde ytan, i Pixdrift-papper — inte Deel-bredd:

- [Deel Paying invoices](https://mobbin.com/flows/7933692f-c7e6-4aaa-8004-992628c5a3d5) — öppet / förfallet / historik
- [HoneyBook Invoice preview](https://mobbin.com/flows/47602473-b190-4974-a2bc-4ce3da008632) — belopp, förfall, metodval
- [HoneyBook Marking as paid](https://mobbin.com/flows/b4088482-543d-45bc-a1ef-bdd6f9639b84) — manuell bokning
- [PayPal Recording a payment](https://mobbin.com/flows/25eb9c68-65b3-4af0-b4ea-8afd4ec0f9e7) — datum, metod, intern not
- [Wave Recording a payment](https://mobbin.com/flows/478b1d04-7ef4-4a8c-90ea-87638c2651ab) — konto + kvitto

Vi tog strukturen (status, dokument, manuell bokning, moms). Inte deras
checkout-kortfält (PCI) och inte tipping.

## Efter ditt OK

1. Stripe Checkout Session + webhook `checkout.session.completed`
2. Revolut Merchant Order om ni ska ta betalt där
3. Swish Handel när certifikatet finns
4. 100 simulerade transaktioner mot testnycklar — aldrig mot live
5. TYRA-offert → fordran automatiskt via event
6. SIE-export om Bilia kräver det
