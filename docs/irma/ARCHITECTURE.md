# IRMA — arkitektur

## Beslut som står kvar

IRMA är en modul i kansli-processen, inte en egen app. Den äger `irma.*` och publicerar events. Den läser inte `rita.*` eller `tora.*`.

Signering *idag* är hashed acknowledgement. Det är medvetet. Att byta till BankID utan ny produktbeslut och ny infrastruktur vore teater.

Originalfil och extraherad modell finns inte. Det finns därför ingen pipeline att separera. När (om) Blob kommer ska originalet aldrig skrivas över — det kravet är redan doktrin, inte kod.

## Flöde

```
Org-användare                Motpart                 Postgres              Events
     │                           │                       │                    │
     │ createAgreement           │                       │                    │
     │──────────────────────────▶│ insert draft          │                    │
     │ token → cookie 120s       │ token_hash only       │──created──────────▶│
     │                           │                       │                    │
     │                           │ GET /irma/l/token     │                    │
     │                           │──────update viewed───▶│──viewed───────────▶│
     │                           │ POST ack (nivå 1)     │                    │
     │                           │──────update signed───▶│──signed───────────▶│
     │ revoke (osignerat)        │                       │──cancelled────────▶│
```

## Varför cookie istället för query

`?link=` lägger bearer-token i historik och i delade URL:er från org-sidan. Cookie med `httpOnly` + 120 s `maxAge` visar länken på `?issued=1`. Sidan får inte radera cookien (Next tillåter inte cookie-write i Server Components). Motparten får token i den URL org-användaren kopierar.

## Varför ingen AI här

Det finns inget dokument att tolka. En chat som “förklarar avtalet” mot tre demoklausuler vore AI-teater. Gateway finns i `@pixdrift/ai-core` för andra produkter.

## Avvikelse från specen som är avsiktlig

Specen vill ha ett Document OS. Den här kodbasen har en fungerande handshake. Att ersätta handshake med en halvfärdig motor vore sämre. Handshake behålls. Gap dokumenteras.

## Utbyggnad när det finns skäl

1. Vercel Blob för originalfiler (privat bucket, signed URL, ingen publik ACL).
2. Deterministisk PDF från redan strukturerade fält — inte från fri LLM-text.
3. Signeringsprovider bakom samma `verification_level` (fortfarande 0–1 tills providern finns).
4. Påminnelser mot `token_expires_at` / framtida `notice_at` via jobb, inte via cron i Next-requesten.

Bygg inte 2–4 innan 1 och en ärlig nivåetikett finns kvar.
