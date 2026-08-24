# Pixdrift-plattformen (kansli-navet)

**Pixdrift** ([pixdrift.com](https://pixdrift.com)) är systemnamnet — skapat av **Landvex**.

Detta repo är **navet** och hemmet för Pixdrift-familjens **gemensamma plattform** —
en liten, hårt kontrollerad kärna under självständiga produkter (ALVA, RITA,
TORA, BRITT, IRMA …). Här bor den självhostade identitetstjänsten, de delade
kontrakten, AI Core och `kansli`-navets webb.

> Kanonisk identitet (namn, domän, upphovsman) bor på **ett** ställe:
> `packages/doc-intel/data/brand.json`, och löses i dokumentationens reaktiva
> platshållare (`{{product.name}}` → Pixdrift, `{{company.name}}` → Landvex).

> Läs styrningen först: [`docs/ARCHITECTURE-CONSTITUTION.md`](docs/ARCHITECTURE-CONSTITUTION.md).
> Full kodkarta: [`docs/INVENTORY.md`](docs/INVENTORY.md).

## Struktur

```
src/app/{kansli,tora,rita,britt,irma,alva,platform,idp}
src/lib/{kansli,tora,rita,britt,irma,alva,platform}
src/app/api/{kansli,tora,rita,britt,irma,alva,platform}
packages/                @pixdrift/* (systems, events, db, identity, …)
db/migrations/{platform,kansli,tora,rita,britt,irma,alva}
integrations/            OIDC-adaptrar till fristående produktrepon
```

Modulkontraktet ligger i `@pixdrift/systems`. Produkter delar inte tabeller.

## Kom igång

Kräver Node.js 22+ och [pnpm](https://pnpm.io) 10+.

```bash
pnpm install
pnpm dev:idp     # identitetstjänsten på http://127.0.0.1:4000 (in-memory dev)
pnpm dev         # kansli-navet på http://127.0.0.1:3000
```

Demo-inloggning (dev): `demo@exempelbolaget.se` / `demo-losenord-1234`.

### Hela miljön mot riktig Postgres (owner/app-split)

```bash
scripts/dev-postgres.sh     # startar lokal Postgres 16 + roller + databaser
BUILD=1 scripts/dev-up.sh   # hela stacken på :3000 (Postgres-backad IdP under /idp)
scripts/verify-env.sh       # hälsokontroller (sajt, kansli, IdP, discovery, JWKS)
```

Kör de gated Postgres-integrationstesterna genom att sätta `PIXDRIFT_TEST_OWNER_URL`
+ `PIXDRIFT_TEST_DATABASE_URL` (se `scripts/dev-postgres.sh`-utskriften) före
`pnpm test`. Hård utvärdering: `docs/SYSTEM-EVALUATION.md`.

## Skript

| Kommando | Beskrivning |
| --- | --- |
| `pnpm dev` / `pnpm dev:idp` | Nav resp. identitetstjänst (dev) |
| `pnpm build` | Produktionsbygge (nav) |
| `pnpm test` | Vitesviten (Postgres-svit hoppas över utan test-DB) |
| `pnpm typecheck` · `pnpm typecheck:packages` | Typkontroll |
| `pnpm lint` | ESLint |
| `pnpm format` · `pnpm format:check` | Prettier (en konsekvent stil) |
| `pnpm onboard -- --id … --redirect … --audience …` | Registrera en ny modul (en rad i klientregistret) |

## Dokumentation

| Fil | Innehåll |
| --- | --- |
| `docs/ARCHITECTURE-CONSTITUTION.md` | Styrande artiklar (läs först) |
| `docs/PIXDRIFT-ARKITEKTUR.md` | Målarkitektur, sammanflätning, synk |
| `docs/REPO-INTAKE.md` | Intake-pipeline + klassificering |
| `docs/INVENTORY.md` | Exakt kodinventering |
| `docs/AI-PROVIDERS.md` · `docs/INTEGRATIONS.md` | AI- resp. externa integrationer |
| `docs/DEPLOYMENT.md` | Drift, runbook, live-länk |

## Kansli-uppgifter

| Metod | Väg | Beskrivning |
| --- | --- | --- |
| `GET` | `/api/kansli/tasks` | Lista uppgifter för aktiv org |
| `POST` | `/api/kansli/tasks` | Skapa (`{ "title": string, "owner"?: string }`) |
| `PATCH` | `/api/kansli/tasks/:id` | Växla klar-status |
| `DELETE` | `/api/kansli/tasks/:id` | Ta bort |

Samma vägar finns som alias under `/api/tasks`. Data ligger i `kansli.tasks`,
inte i en JSON-fil.

---

© 2026 Landvex. **Pixdrift** och **pixdrift.com** tillhör Landvex.
