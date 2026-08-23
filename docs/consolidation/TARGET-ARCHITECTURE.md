# Pixdrift Consolidation — Target Vercel-First Architecture

The smallest serious architecture that satisfies Pixdrift's real requirements and
stays easy for another engineer to understand. Derived from `DISCOVERY.md`.

## North star

`Next.js (App Router) → PostgreSQL` on Vercel, one identity, one storage, one
data-access pattern. Add nothing else unless a concrete requirement proves the
Vercel-native primitive insufficient.

## Canonical choices (with rationale)

| Concern | Choice | Why |
| --- | --- | --- |
| Host | **Vercel** | Directive; preview/prod, env, logs, functions, cron, CDN |
| Language | **TypeScript** | Already dominant; one language |
| Framework | **Next.js App Router** | kansli already; RSC/Server Actions/Route Handlers cover UI+API |
| DB | **Neon Postgres** (Vercel Marketplace) | Already live for kansli; majority already Postgres |
| DB access | **`pg` + raw SQL migrations** | Majority pattern; transparent ("where does data come from?"); no ORM lock-in |
| Auth | **Pixdrift Identity (OIDC)** | Exists + live; adapters already written for every product |
| Files | **Vercel Blob** (direct client upload + PG metadata) | Vercel-native; replaces R2 and ad-hoc file output |
| Scheduled | **Vercel Cron** | Replaces RITA worker loop + BRITT setInterval syncs |
| Deferred/durable | Start with functions; escalate only if a concrete durability need appears | No brokers by default |
| Validation | **zod** | Already used across most repos |
| Contracts | **`@pixdrift/contracts`** | Single canonical shape for user/org/finding/audit |

## Removed / not adopted

- **Cloudflare** (IRMA's vinext/D1/R2/wrangler) → Next + Neon + Blob.
- **SQLite** (BRITT better-sqlite3, IRMA D1) → Neon Postgres.
- **`postgres.js`** (RITA) → `pg` (or a thin shared `@pixdrift/db`).
- **Standalone Fastify/Express servers** (RITA api, TORA platform, BRITT) →
  Next Route Handlers / Vercel Functions.
- **Dockerfiles / infra/ / deploy/** (BRITT, alva) → Vercel deploy.
- No AWS/K8s/Terraform/broker/Redis/second DB introduced (none exist to keep).
- **RITA analysis engine exception (art. 4):** the real `skattjakt` Rust binary
  cannot run inside a Vercel Node Function (filesystem work dir, Anthropic
  calls, ~180s analyses). Production uses `HttpAnalysisEngine` against a
  dedicated engine host. The product UI/API/Cron stay on Vercel. Fake engines
  are forbidden outside local/test. This is extra infrastructure with a
  documented reason, not a second platform.

## Target workspace shape (illustrative, not ceremony)

```
src/app                   # Next.js hub + /idp + /api/platform + /api/{system}
packages/
  api-core/               # one error model, one permission check
  events/                 # append-only sync + audit log
  systems/                # product catalog
  db/                     # pg pool + SQL migrations
  contracts/ auth-core/ auth-client/ identity/
  tora/  rita-engine/  ai-core/  doc-intel/
db/migrations/{platform,kansli,tora,rita,britt,irma,alva}/
```

See `docs/architecture/PLATFORM.md` for the running shape.

Products (RITA/BRITT/TORA/IRMA/alva) become **modules/routes within `apps/web`**
(or a small number of apps) sharing identity, db, contracts, ui — not separate
servers.

## Cross-cutting rules (from the master prompt)

- Server-side authorization on every protected op; never trust UI state.
- Large uploads go browser → Blob token → Blob; server authorizes + stores
  metadata in Postgres. Never filename-as-identity.
- One error model, one validation strategy, one env registry, one migration dir.
- Audit persistent records for sensitive/admin/destructive operations.
- No silent feature loss: every product capability gets an equivalent (see ledger).
