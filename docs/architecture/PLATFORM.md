# Pixdrift platform (this repo)

Small infrastructure. One Next.js process. PostgreSQL. Nothing else is assumed
to exist.

```
Browser → Next.js (kansli)
            ├─ /idp                 Identity (OIDC)
            ├─ /api/platform/*      Shared APIs (health, me, systems, events)
            ├─ /api/{system}/*      Product APIs (same envelope, same auth)
            └─ Postgres
                 public     identity (users, orgs, clients, keys)
                 platform   events (sync + audit, append-only)
                 kansli     tasks
                 tora       market snapshots
                 rita       analyses
                 britt      observations
                 irma       agreements
                 alva       diagnosis cases
```

## Rules

- One identity. Session is a BFF cookie issued after OIDC.
- One error model (`@pixdrift/api-core`).
- One event log (`@pixdrift/events`). Products sync by publishing and
  listening — they never write another product's tables.
- Each product owns one schema. Migrations live in `db/migrations/<schema>/`.
- Apply with `pnpm db:migrate` (owner role). Runtime uses `DATABASE_URL` (app role).
- RITA's real engine is still the Rust binary, reached by `HttpAnalysisEngine`.
  Without `RITA_ENGINE_URL` an analysis is stored as `blocked`, not faked.
- ALVA stores cases. The diagnosis engine waits for the ALVA repo.

## Shared APIs

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/platform/health` | no |
| GET | `/api/platform/systems` | no |
| GET | `/api/platform/me` | yes |
| GET | `/api/platform/events` | yes (scoped to active org) |
| GET | `/api/tora/market` | no (demo) / yes (tier). Evaluate only — does not persist or publish. |
| POST | `/api/tora/market` | yes. Persist a snapshot and publish `tora.market.evaluated`. |
| GET/POST | `/api/rita/analyses` | yes |
| GET/POST | `/api/britt/observations` | yes |
| GET/POST | `/api/irma/agreements` | yes |
| GET | `/api/irma/l/:token` | no (hashed magic link). First open → `viewed`. |
| GET/POST | `/api/alva/cases` | yes |
| GET/POST | `/api/tasks` | yes |

## Product UI

| Path | Product |
| --- | --- |
| `/kansli` | Hub, session, tasks |
| `/tora` | Market evaluation + explicit publish |
| `/rita` | Analysis requests (blocked without engine host) |
| `/britt` | Observations inbox (including synced events) |
| `/irma` | Agreements + one-time magic link |
| `/irma/l/:token` | Counterparty view (no account). First open marks `viewed`. |
| `/alva` | Case registration (engine deferred) |
| `/platform` | Module catalog |
| `/platform/events` | Org-scoped event log |

Login accepts `?next=` for those paths only (`pd_next` cookie). Anything else falls back to `/kansli`.

The operating map — what each system does now, and how they connect — is
`docs/FAMILY.md` and `/platform`.
