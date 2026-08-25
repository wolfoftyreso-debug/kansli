# Pixdrift-integrationer

Varje subsystem kopplas till den gemensamma identitetstjänsten
(`packages/identity`) via ett av två återanvändbara mönster. Adaptrarna här är
byggda och **testade mot en riktig IdP in-process**, redo att droppas in i
respektive repo.

## Modulmatris

| Modul | Roll mot IdP | Klienttyp | Referensmönster | Status |
| --- | --- | --- | --- | --- |
| `kansli` (rot) | BFF-klient | konfidentiell | Next.js route handlers + `@pixdrift/auth-client` | Byggt + E2E |
| `rita` | BFF-klient + resurs | konfidentiell | **jose-OIDC (ESM)** — Fastify-plugin | Patch + test |
| `alva` | resursserver | — | **WebCrypto-verifierare (nolldependency)** | Adapter + test (parkerad) |
| `britt` | BFF-klient | konfidentiell | **WebCrypto BFF (nolldependency, CJS)** | Adapter + test |
| `tora` | BFF-klient + resurs | **publik (PKCE)** | OIDC-native — bara konfiguration | Kontraktstest |
| `irma` | BFF-klient (personal) | konfidentiell | **jose-OIDC (ESM)** | Adapter + test |

`irma` har dessutom Magic Links för externa mottagare som **inte** går via
Pixdrift — se `irma/README.md`.

## Två referensmönster

1. **jose-OIDC (ESM)** — moduler som kör ESM/Node och kan använda `jose`
   (`rita`, `irma`). Full OIDC-klient + JWKS-verifiering med ett litet, granskat
   beroende.
2. **WebCrypto, nolldependency** — moduler med hårt beroendekrav eller CommonJS
   (`alva` = rå `node:http`, `britt` = CJS + `node:sqlite`). ES256/JWKS via
   inbyggda `node:crypto`/WebCrypto, inga externa paket.

Publika SPA:er (`tora`) behöver ingen adapter alls — de talar OIDC/PKCE direkt
och verifierar via JWKS; inkoppling = konfiguration.

## Gemensamma regler för alla adaptrar

- Authorization Code + **PKCE (S256)**; id-token verifieras mot IdP:ns JWKS
  (`issuer` + `audience`), aldrig en delad hemlighet.
- Ingen **auto-provisionering**: identiteten matchas mot en befintlig
  användare; medlemskap/tenant styr åtkomst.
- Modulen behåller **sin egen session** och tenant-mekanism (RLS/`org_id`/…).
- **Tenant kommer ur token/session**, aldrig ur en request.

Token-claims (frysta): `sub` (`pixdrift:user:<id>`), `tenant`
(`pixdrift:org:<id>`), `tier`, `scope` (beviljade `verb:noun`), `org`, `roles`,
`permissions`.
