# Pixdrift-plattformen — kodinventering

Vad som faktiskt ligger i `kansli` i dag. Målbilden står i
`PIXDRIFT-ARKITEKTUR.md` och den frysta plattformskonstitutionen i
`PLATFORM-1.0.md`. Luckor mot den: `PLATFORM-1.0-GAP.md`.
Driftskartan står i `FAMILY.md`.
Modulkontraktet — id, schema, UI, API, events — är `@pixdrift/systems`.
Capability Graph (härledd ur MCP-registret): `src/lib/platform/capability-graph.ts`.

CI kör format, lint, typecheck (app + paket + adaptrar), test mot Postgres och
build. En svit som saknar test-DB hoppas över, den hoppas inte över fel.

## Arbetsträd

```
kansli/
├─ src/app/
│  ├─ (site)/                 publik sajt
│  ├─ idp/                    OIDC-mount
│  ├─ kansli ekonomi tora rita britt irma tyra alva creditae platform
│  └─ api/{kansli,ekonomi,tora,rita,britt,irma,tyra,alva,creditae,platform,auth}
├─ src/lib/{kansli,ekonomi,tora,rita,britt,irma,tyra,alva,creditae,platform,auth,sync}
├─ packages/                  @pixdrift/*
├─ integrations/              OIDC-adaptrar till fristående produktrepon
├─ db/migrations/{platform,kansli,ekonomi,tora,rita,britt,irma,tyra,alva,creditae}/
└─ .github/workflows/ci.yml
```

Varje produkt (inte identity) har samma fyra ytor: `src/lib/{id}`,
`src/app/{id}`, `src/app/api/{id}`, `db/migrations/{id}`. Kontraktstestet
faller om en yta saknas.

## Plattformspaket

| Paket | Syfte |
| --- | --- |
| `@pixdrift/systems` | Enda id-listan, scheman, API-bas, event-ägande |
| `@pixdrift/events` | Append-only `platform.events`. Importerar id:n från systems |
| `@pixdrift/db` | `pg`-pool + SQL-migreringar. Äger ingen produktdata |
| `@pixdrift/api-core` | Felmodell och `requireActor` / `requireOrg` |
| `@pixdrift/contracts` | User, org, membership, OIDC-claims |
| `@pixdrift/auth-core` | scrypt, session-/token-primitiver |
| `@pixdrift/auth-client` | OIDC-klient (Auth Code + PKCE) + JWKS |
| `@pixdrift/identity` | Självhostad IdP |
| `@pixdrift/ai-core` | Provider-API + Vercel AI Gateway |
| `@pixdrift/tora` | Upphandlingsmotorn (TypeScript) |
| `@pixdrift/rita-engine` | HTTP/subprocess mot `skattjakt`. Ingen fake i drift |
| `@pixdrift/doc-intel` | Dokumentationsanalys |

## Produkter i navet

| System | Schema | UI | API | Status |
| --- | --- | --- | --- | --- |
| Identity | `public` | `/idp` | `/idp` | operational |
| Kansli | `kansli` | `/kansli` | `/api/kansli` | operational |
| Ekonomi | `ekonomi` | `/ekonomi` | `/api/ekonomi` | pilot (ledger foundation; `docs/ekonomi/`) |
| TORA | `tora` | `/tora` | `/api/tora` | pilot |
| RITA | `rita` | `/rita` | `/api/rita` | pilot |
| BRITT | `britt` | `/britt` | `/api/britt` | pilot |
| IRMA | `irma` | `/irma` | `/api/irma` | pilot (handshake; audit in `docs/irma/`) |
| TYRA | `tyra` | `/tyra` | `/api/tyra` | pilot (sync kit; `docs/tyra/`) |
| ALVA | `alva` | `/alva` | `/api/alva` | deferred |
| CREDITAE | `creditae` | `/creditae` | `/api/creditae` | pilot (handshake; no bureau) |

Produkterna synkar via `platform.events`. De skriver inte i varandras tabeller.
RITA och TORA är skilda produkter. ALVA registrerar fall; diagnosmotorn väntar
på ALVA-repot.

`GET|POST /api/tasks` finns kvar som alias till `/api/kansli/tasks`.

## Inkopplings-adaptrar (`integrations/*`)

OIDC-klienter mot IdP för de fristående repona. De ersätter inte
produktmodulerna i `src/`. ALVA-adaptern är vilande.

## Hemligheter (aldrig i git)

`APP_SESSION_SECRET`, `SESSION_SECRET`, per-klient `*_CLIENT_SECRET`.
`AI_GATEWAY_API_KEY` eller `VERCEL_OIDC_TOKEN`. Postgres: `DATABASE_URL` (app)
+ `PIXDRIFT_DB_OWNER_URL` (owner, bara bootstrap). RITA: `RITA_ENGINE_URL` /
`RITA_ENGINE_TOKEN` eller `RITA_ENGINE_BINARY`.

## Kör och verifiera

```bash
pnpm install
pnpm test
pnpm typecheck && pnpm typecheck:packages
pnpm lint && pnpm format:check && pnpm build
pnpm db:restore-drill   # dump → tillfällig databas → släng (art. 3)
pnpm dev          # nav + /idp på :3000
```

Infrastrukturrevision (vad som finns, mognad, luckor):
`docs/INFRASTRUCTURE-AUDIT.md`. Hårdaste genomgången: `docs/CRITICAL-REVISION.md`.
Enkel ritning: `docs/architecture/hur-det-fungerar.html`.
