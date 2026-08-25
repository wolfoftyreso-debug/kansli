# ALVA ← Pixdrift-inkoppling

Ersätter ALVA:s delade `JWT_SECRET` (HS256) med asymmetrisk verifiering mot den
centrala identitetstjänstens JWKS. **Noll externa beroenden** — bara
`node:crypto` — i linje med ALVA:s självhostade, beroendeminimala design.

## Vad som landar i ALVA-repot

Kopiera `src/pixdrift-auth.mjs` till `services/gemensam/pixdrift-auth.mjs`
(delas av `plattform` och `ai-orkester` via samma symlänkmönster som övrig
gemensam kod).

## Inkoppling i `services/plattform/server.mjs`

Där `verifieraJwt(token, JWT_SECRET)` används idag:

```js
import { skapaPixdriftVerifierare, harBehorighet, bearerUr } from "./pixdrift-auth.mjs";

const pixdrift = skapaPixdriftVerifierare({
  issuer: process.env.PIXDRIFT_ISSUER,
  jwksUri: `${process.env.PIXDRIFT_ISSUER}/jwks.json`,
  audience: "alva-plattform", // ai-orkestern: "alva-ai-orkester"
});

// i request-hanteringen:
const anspr = await pixdrift.verifiera(bearerUr(req.headers.authorization)); // kastar vid ogiltig
if (!harBehorighet(anspr, "arende:write")) return svara(403);
const anvandare = anspr.sub;          // "pixdrift:user:<id>"
const organisation = anspr.org;       // "pixdrift:org:<id>" — mappa mot organisation_id
```

## Miljövariabler

- `PIXDRIFT_ISSUER` — t.ex. `https://id.pixdrift.com`
- (utfasas) `JWT_SECRET` — kan tas bort när alla vägar går via Pixdrift

## Migrering av lösenord

Befintliga användare i `anvandare` (pgcrypto/bcrypt) importeras till
identitetstjänsten; `@pixdrift/auth-core` verifierar en gammal hash och
omhashilar till scrypt vid nästa lyckade inloggning.

Verifieras av `test/verifier.test.ts` (kör mot en riktig identitetstjänst
in-process): giltig ES256-token accepteras, permissions upprätthålls, fel
audience/manipulerad/utgången token avvisas.
