# TORA ← Pixdrift-inkoppling

TORA är **OIDC-native** (publik SPA-klient via PKCE + en Fastify-resursserver som
verifierar tokens med `jose`/JWKS). Inkopplingen är därför **konfiguration, inte
kod** — peka TORA mot Pixdrift-utfärdaren. Det som måste stämma är *token-
kontraktet*, vilket `test/token-contract.test.ts` bevisar mot en riktig IdP.

## 1. Registrera klienten i identitetstjänsten

`tora-web` som **publik klient** (PKCE, ingen hemlighet) med audience
`tora-opportunity` — redan med i `packages/identity/src/main.ts` (dev-default).

## 2. Klientkonfiguration (`.env.local`, läge 1 — inloggning)

```
VITE_OPPORTUNITY_OIDC_ISSUER=https://id.pixdrift.com
VITE_OPPORTUNITY_OIDC_CLIENT_ID=tora-web
VITE_OPPORTUNITY_OIDC_SCOPE=openid profile email
VITE_OPPORTUNITY_OIDC_AUDIENCE=tora-opportunity
VITE_OPPORTUNITY_API_URL=https://<tora-tjänst>/v1
VITE_OPPORTUNITY_COMPANY_ID=<org>
```

Redirect byggs som `${origin}/opportunity` och måste vara registrerad hos
utfärdaren (därför ligger produkten under `/opportunity`).

## 3. Tjänstkonfiguration (`platform/opportunity/service`)

```
OIDC_ISSUER=https://id.pixdrift.com
OIDC_JWKS_URL=https://id.pixdrift.com/jwks.json
OIDC_AUDIENCE=tora-opportunity
```

## Token-kontraktet (varför det fungerar)

TORA:s `auth/verify.ts` + `principal.ts` kräver `sub`, **`tenant`**, **`tier`**
(`free|pro|professional|enterprise`, deny-by-default) och **`scope`/`scp`**
(`opportunity:read`, `profile:*`, `watchlist:*`). Pixdrift-IdP:n emitterar nu:

- `sub` = `pixdrift:user:<id>`
- `tenant` = organisationens `GlobalRef` (`pixdrift:org:<id>`) — opak tenant-id
- `tier` = organisationens abonnemang (ur identitetsmodellen)
- `scope` = beviljade `verb:noun`-behörigheter, mellanslagsseparerade

Testet mintar en riktig token för `tora-opportunity` och kör TORA:s exakta
verifiering + `principalFromClaims` mot den (`tier=enterprise`,
`opportunity:read` m.fl. närvarande).
