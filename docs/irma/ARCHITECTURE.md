# IRMA — arkitektur

## Beslut som står kvar

IRMA är en modul i kansli-processen, inte en egen app. Den äger `irma.*` och publicerar events. Den läser inte `rita.*` eller `tora.*`.

Signering *idag* är hashed acknowledgement. Det är medvetet. Inga externa
e-signleverantörer, ingen e-legitimation som inloggning. Mobbin används bara som designreferens för
agenten — produkten anropar den inte. Runtime-anrop ut ur processen är bara
våra API-vendorer (`docs/AI-PROVIDERS.md` / `docs/INTEGRATIONS.md`). IRMA
anropar ingen av dem direkt. Uppläsning går via `src/lib/platform/tts.ts`
när `ELEVENLABS_API_KEY` är satt. Det är uppläsning av samma underlag, inte
en ny handling och inte e-signatur.

Originalfil och extraherad modell finns inte. Det finns därför ingen pipeline att separera. Om filer kommer ska de ligga i detta system. Originalet skrivs inte över.

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

Allt byggs i det här navet. Inga nya leverantörer.

1. Originalfiler i privat storage vi själva äger (inte en publik bucket, inte en
   e-signleverantörs vault).
2. Deterministisk PDF från redan strukturerade fält — inte från fri LLM-text.
3. Starkare verifiering (OTP via 46elks, e-post via Resend) bakom samma
   `verification_level`, om affären kräver det. Inte kvalificerad e-signatur.
   Inte extern e-signleverantör.
4. Påminnelser mot `token_expires_at` via jobb i denna process.

Bygg inte 2–4 innan 1 och en ärlig nivåetikett finns kvar.
