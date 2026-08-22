# Pixdrift-plattformen — kodinventering

Exakt vad som är byggt, var det ligger, och hur det hänger ihop. Detta repo
(`kansli`) är **navet** och hem för den gemensamma plattformen; produkterna
(ALVA, RITA, TORA, BRITT, IRMA) bor i egna repon och kopplas in via kontrakt.

Status: **56 automatiska tester / 11 sviter** gröna (inkl. Postgres). `typecheck`
(web + alla paket + adaptrar), `lint` och `build` rena. 21 commits på grenen.

## Arbetsträdets form

```
kansli/  (Next.js-nav + pnpm-workspace + plattformspaket)
├─ src/                         Next.js-appen (nav) + BFF-auth
│  ├─ app/                      page.tsx, TaskBoard.tsx, api/{tasks,auth/*}
│  └─ lib/auth/                 config.ts, session.ts
├─ packages/                    delade plattformspaket (@pixdrift/*)
│  ├─ contracts/                @pixdrift/contracts
│  ├─ auth-core/                @pixdrift/auth-core
│  ├─ auth-client/              @pixdrift/auth-client
│  ├─ identity/                 @pixdrift/identity  (IdP)
│  └─ ai-core/                  @pixdrift/ai-core
├─ integrations/                inkopplings-adaptrar per subsystem
│  ├─ alva/ rita/ britt/ irma/ tora/
│  └─ README.md                 modulmatris + två referensmönster
├─ docs/                        styrning + arkitektur + drift
├─ scripts/ + packages/identity/scripts/onboard-module.ts
└─ .github/workflows/ci.yml     CI (lint/typecheck/test m. Postgres + build)
```

## Plattformspaket (`packages/*`)

| Paket | Syfte | Nyckelfiler | Tester |
| --- | --- | --- | --- |
| `@pixdrift/contracts` | Delade plattformsentiteter (User, Organization, Role, Permission, Membership, Connector, DataSource, Automation, Notification, Artifact, AuditEvent) + OIDC-claims (`tenant`/`tier`/`scope`). Zod. | `src/index.ts` | 9 |
| `@pixdrift/auth-core` | Lösenords- (scrypt) och sessions-/token-primitiver; bcrypt→scrypt-migrering. Endast `node:crypto`. | `src/index.ts` | 4 |
| `@pixdrift/auth-client` | OIDC-klient (Auth Code + PKCE, BFF) + JWKS access-token-verifierare. `jose`. | `src/index.ts`, `src/pkce.ts` | — (täcks av identity-flödet) |
| `@pixdrift/identity` | **Självhostad OIDC-IdP.** Discovery, JWKS, authorize/login, token (PKCE), userinfo, logout. In-memory (dev) + **PostgreSQL** (owner/app, DB-klientregister, persisterad roterbar ES256-nyckel). | `src/server.ts`, `src/tokens.ts`, `src/keys.ts`, `src/pg/*`, `scripts/onboard-module.ts` | 15 |
| `@pixdrift/ai-core` | Enhetligt modell-API över Claude/ChatGPT/Gemini/Kimi (+ gateway), failover, provenance, guardrails (`inference`, aldrig fakta). | `src/router.ts`, `src/providers.ts`, `src/env.ts` | 15 |

### IdP-endpoints (`@pixdrift/identity`)
`GET /.well-known/openid-configuration` · `GET /jwks.json` · `GET /halsa` ·
`GET|POST /authorize` · `POST /token` · `GET /userinfo` · `GET|POST /logout`

### AI Core-providers
`anthropic` (Claude) · `openai` (ChatGPT) · `gemini` · `kimi` (Moonshot) ·
`gateway` (OpenAI-kompatibel) · `fake` (dev/test).

## Inkopplings-adaptrar (`integrations/*`)

| Modul | Mönster | Roll mot IdP | Tester |
| --- | --- | --- | --- |
| `rita` | jose-OIDC (ESM) Fastify-plugin | BFF-klient → RITA-session + tenant | 2 |
| `irma` | jose-OIDC (ESM) | BFF-klient (personal); Magic Links interna | 2 |
| `alva` | WebCrypto, nolldependency | resursserver-verifierare (ersätter HS256) | 4 |
| `britt` | WebCrypto, nolldependency (CJS) | BFF-klient (Express + node:sqlite) | 3 |
| `tora` | OIDC-native (bara konfig) | publik PKCE-klient + resurs | 2 (token-kontrakt) |

Fristående in-repo-patchar (levereras till respektive repo): RITA (klar), BRITT/
IRMA/ALVA (adaptrar klara). ALVA är parkerad på användarens begäran.

## Registrerade OIDC-klienter (IdP-klientregister)

`kansli-web`, `alva-web`, `rita-web`, `tora-web` (publik/PKCE), `britt-web`,
`irma-web`. Ny modul = **en rad**: `pnpm onboard -- --id … --redirect … --audience …`.

## Styrning & drift (`docs/`)

| Dokument | Innehåll |
| --- | --- |
| `ARCHITECTURE-CONSTITUTION.md` | 12 styrande artiklar + tre-profil-separation |
| `PIXDRIFT-ARKITEKTUR.md` | Målarkitektur, sammanflätning, synk, sekvens, avstämning |
| `REPO-INTAKE.md` | Intake-pipeline + klassificering (KEEP/MOVE/…/UNKNOWN) |
| `AI-PROVIDERS.md` | Kanoniska nyckelnamn, hantering, AI Core-användning |
| `DEPLOYMENT.md` | Runbook (Vercel/AWS), live-URL, verifieringschecklista |
| `INVENTORY.md` | Detta dokument |

## Infrastruktur

- **CI:** `.github/workflows/ci.yml` — lint/typecheck/test (Postgres-service) + build på varje push.
- **Onboarding-CLI:** `pnpm onboard` (självbetjäning, en rad i klientregistret).
- **Deploy:** `vercel.json` (nav). **Live:** kansli-navet på Vercel (auto-deploy per push).

## Hemligheter (aldrig i git)

`APP_SESSION_SECRET`, `SESSION_SECRET`, per-klient `*_CLIENT_SECRET`; AI-nycklar
`ANTHROPIC_API_KEY` (✓), `GEMINI_API_KEY` (✓), `MOONSHOT_API_KEY` (✓, Kimi),
`OPENAI_API_KEY` (giltig, saknar credits). Postgres: `DATABASE_URL` (app) +
`PIXDRIFT_DB_OWNER_URL` (owner, endast bootstrap).

## Kör och verifiera

```bash
pnpm install
pnpm test            # 56 tester (Postgres-sviten hoppas över utan test-DB)
pnpm typecheck && pnpm typecheck:packages
pnpm lint && pnpm build
pnpm dev             # nav på :3000
pnpm dev:idp         # IdP på :4000 (in-memory; sätt DATABASE_URL för Postgres)
```

## Säkerhetsstatus

Red-team-granskning genomförd; åtgärdat: logout open-redirect (allowlist),
demo-seed opt-in, `active`-statuskontroll på SSO/token, brute-force-throttle,
obligatoriska prod-hemligheter. Kärnan (PKCE, redirect-allowlist, engångskoder,
asymmetriska tokens, klientautentisering) bedömd sund. Kvar som drifthärdning:
KMS för signeringsnyckel, rate limiting bakad av Redis vid multi-instans.
