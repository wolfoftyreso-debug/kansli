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
src/                     kansli-navet (Next.js) + BFF-auth (api/auth/*)
packages/                delade plattformspaket (@pixdrift/*)
  contracts/  auth-core/  auth-client/  identity/  ai-core/
integrations/            inkopplings-adaptrar per subsystem (alva/rita/britt/irma/tora)
docs/                    styrning, arkitektur, drift, inventering
.github/workflows/       CI (lint/typecheck/test m. Postgres + build)
```

## Kom igång

Kräver Node.js 22+ och [pnpm](https://pnpm.io) 10+.

```bash
pnpm install
pnpm dev:idp     # identitetstjänsten på http://127.0.0.1:4000 (in-memory dev)
pnpm dev         # kansli-navet på http://127.0.0.1:3000
```

Demo-inloggning (dev): `demo@exempelbolaget.se` / `demo-losenord-1234`.

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

## kansli-navets uppgifts-API (exempelyta)

| Metod | Väg | Beskrivning |
| --- | --- | --- |
| `GET` | `/api/tasks` | Lista uppgifter |
| `POST` | `/api/tasks` | Skapa (`{ "title": string, "owner"?: string }`) |
| `PATCH` | `/api/tasks/:id` | Växla klar-status |
| `DELETE` | `/api/tasks/:id` | Ta bort |

Uppgifter lagras i `data/tasks.json` (git-ignorerad, seedas vid första körning).

---

© 2026 Landvex. **Pixdrift** och **pixdrift.com** tillhör Landvex.
