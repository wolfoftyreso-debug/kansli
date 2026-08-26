# Externa integrationer — kommunikation & geo

Utöver AI-providers (se `AI-PROVIDERS.md`) använder familjen externa tjänster för
**notifieringar** (SMS/mejl) och **geo** (kartor/geokodning). De hör till
Notifications-/Integration Core-lagret och konsumeras av produkterna, inte av
IdP:n. Nycklarna hanteras precis som andra hemligheter.

## Kanoniska hemlighetsnamn

| Tjänst | Env-variabler | Auth | Lager / användning |
| --- | --- | --- | --- |
| **46elks** (SMS/röst) | `ELKS_API_USERNAME`, `ELKS_API_PASSWORD` | HTTP Basic (två delar) | Notifications — SMS-kanal |
| **ElevenLabs** (uppläsning) | `ELEVENLABS_API_KEY`, valfri `ELEVENLABS_VOICE_ID` | Header `xi-api-key` | Notifications — talkanal `src/lib/platform/tts.ts` |
| **Resend** (mejl) | `RESEND_API_KEY` | Bearer (`re_…`) | Notifications — e-postkanal |
| **Mapbox** (kartor/geokodning) | `MAPBOX_ACCESS_TOKEN` | Access token (`pk.*` klient / `sk.*` server) | Geo — kartor, geokodning, adresser |
| **Apollo.io** (B2B-/kontaktdata) | `APOLLO_API_KEY` | Header `X-Api-Key` | Integration — datakälla (CRM/audience); BRITT `apollo`-connector. *Framtida bruk.* |

## Hantering — samma regler som alla hemligheter

- **Aldrig i git, Terraform, loggar eller image-lager.** Bara i managed secrets
  store / Cloud Agent-Secrets / respektive tjänsts deploy-miljö. `.env.example`
  har endast namn.
- Mapbox: exponera **endast** en publik `pk.*`-token i klientbundles; håll
  eventuell `sk.*` serverside.

## Guardrails (konstitutionen)

- **Art. 8 — integrationer bakom connectors:** produkterna anropar inte 46elks/
  Resend/Mapbox/ElevenLabs direkt. De går via en connector/kanal-abstraktion
  (Notifications respektive geo) så att leverantören kan bytas utan
  produktändring, och så att tokens aldrig läcker till produktkoden.
- **Art. 10 — automation har uttrycklig nivå:** att faktiskt *skicka* ett SMS/
  mejl är en L3/L4-handling (kräver godkännande/policy). RITA/IRMA-regeln
  "systemet skickar aldrig något själv" gäller: en `Notification` skapas som
  artefakt; leverans är ett separat, behörighetsstyrt steg.
- **Art. 9:** en modell får föreslå ett meddelande, men innehåll som skickas ska
  vara deterministiskt granskat — inte rå modellutdata.

## Status

Nycklarna registreras som Secrets nu. En gemensam **Notifications-/Integration
Core** (kanaler: `sms`/`email`/`webhook`, samt geo-tjänst) som wrappar dessa —
i samma anda som `@pixdrift/ai-core` — byggs som ett eget steg när vi tar
Integration-kärnan. Tills dess är namnen frysta så produkter kan bygga mot dem.
