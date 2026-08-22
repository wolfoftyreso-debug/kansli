# IRMA ← Pixdrift-inkoppling

IRMA har **två auth-ytor** — bara den ena går via Pixdrift:

- **Personal/tenant-inloggning** → Pixdrift OIDC (denna adapter). IRMA behåller
  sin egen tenant-scopade session; identiteten bevisas av Pixdrift.
- **Magic Links (externa mottagare/signerare)** → **stannar internt i IRMA**.
  Motparter som signerar ett avtal är inte Pixdrift-användare.

## Vad som landar i IRMA-repot

- `src/pixdrift-oidc.ts` → t.ex. `app/server/pixdrift-oidc.ts`. ESM + `jose`,
  ramverksneutral (`beginLogin`/`completeLogin`).
- Två server-rutter (Vinext): `/auth/pixdrift/login` (sätt signerad temp-cookie
  med `{state,nonce,codeVerifier}`, redirect) och `/auth/pixdrift/callback`
  (verifiera state, `completeLogin`, matcha personal på e-post — **ingen
  auto-provisionering** — skapa IRMA:s tenant-scopade session).
- Registrera `irma-web` (konfidentiell) + audience `irma-api` i IdP:n
  (dev-default finns i `packages/identity/src/main.ts`).

## Miljövariabler

```
PIXDRIFT_ISSUER=https://id.pixdrift.com
PIXDRIFT_CLIENT_ID=irma-web
PIXDRIFT_CLIENT_SECRET=<hemlighet>
# redirect = ${APP_ORIGIN}/auth/pixdrift/callback
```

Verifieras av `test/adapter.test.ts`: hela PKCE-flödet mot en riktig IdP;
`completeLogin` returnerar verifierad identitet (`tier=enterprise`, två
medlemskap); fel `state` avvisas. Magic Link-flödet berörs inte.
