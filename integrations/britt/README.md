# BRITT ← Pixdrift-inkoppling

BRITT (Express + `node:sqlite`, CommonJS, "inga native-beroenden") loggar in via
Pixdrift men **behåller sin egen `oi_session`** och `users`/`org_id`-modell.
`pixdrift-oidc.js` är **nolldependency** (bara `node:crypto`/WebCrypto + `fetch`)
och ramverksneutral — Express-rutterna är tunna omslag.

## Vad som landar i BRITT-repot

- `pixdrift-oidc.js` → `src/pixdrift-oidc.js` (eller motsvarande).
- Nya Express-rutter `/auth/pixdrift/login` + `/callback` (se modulens
  filhuvud för exakt kod), som mappar identitet → BRITT-användare (på e-post,
  **ingen auto-provisionering**) → `createSession(userId)` → `oi_session`.
- Registrera `britt-web` (konfidentiell klient, audience `britt-api`) i
  identitetstjänsten — redan med i `packages/identity/src/main.ts` (dev-default).

## Miljövariabler

```
PIXDRIFT_ISSUER=https://id.pixdrift.com
PIXDRIFT_CLIENT_ID=britt-web
PIXDRIFT_CLIENT_SECRET=<hemlighet>
OI_BASE_URL=https://<britt>            # redirect = ${OI_BASE_URL}/auth/pixdrift/callback
```

## Mappning

- `identity.sub` = `pixdrift:user:<id>` (lagra som extern identitet på användaren)
- `identity.org` = `pixdrift:org:<id>` → mappa mot BRITT:s `org_id`
- `identity.tier` = organisationens abonnemang (för framtida nivåstyrning)

Verifieras av `test/adapter.test.ts`: hela PKCE-flödet mot en riktig IdP,
`completeLogin` returnerar verifierad identitet (`tier=enterprise`, två
medlemskap); fel `state` och fel PKCE-verifierare avvisas.
