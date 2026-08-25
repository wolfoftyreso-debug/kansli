# Cala — valt Rust-grundrepo

Hämtat: https://github.com/GaloyMoney/cala  
Commit: se `UPSTREAM_SHA`  
Licens: Apache License 2.0 (`LICENSE`)

## Varför just Cala

Vi sökte GitHub efter Rust double-entry. De populäraste träffarna var fel sak:

| Repo | Varför inte |
| --- | --- |
| `rustledger/rustledger` (375★) | Beancount/CLI, GPL-3 — viral licens, plaintext-fil inte Postgres |
| `tackler-ng/tackler` (158★) | Git-SCM plaintext, inte inbäddad i vårt hus |
| `kellpossible/doublecount` | Litet, annan licens, ingen Postgres-modell |
| Ledger-hardware-SDK:er | Hårdplånbok, inte bokföring |

**Cala** (Galoy / Blink) är det enda vi hittade som samtidigt är:

- Rust-bibliotek, inte en separat server
- Double-entry med journal, konto, entry, transaction templates
- PostgreSQL
- Apache-2.0
- Använt i produktion (bank-ledger)

## Vad vi *inte* gör med det

Cala körs **inte** som en andra process i Pixdrift. Konstitutionen: en Postgres, ett schema per produkt, TypeScript i navet. Att lyfta in `cala-ledger` som sqlx-tjänst vore ett nytt runtime-lager utan godkännande.

Vi tar **postningsdoktrinen**: balanserade verifikat, immutabla rader, konto + journal + entry, mallar för återkommande affärshändelser. Implementationen i det här huset är `ekonomi`-schemat och `src/lib/ekonomi`. Rust-kollen i `crates/ekonomi-ledger` speglar samma regler.

När du ger OK på produktionssteget kan Cala bli en sidecar som validerar samma JSON. Inte före.
