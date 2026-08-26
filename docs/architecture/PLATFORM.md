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
                 britt      observations, findings, metric_snapshots, analysis_runs
                 irma       agreements
                 tyra       tire cases + hub
                 alva       diagnosis cases
```

## Rules

- One identity. Session is a BFF cookie issued after OIDC.
- One error model (`@pixdrift/api-core`).
- One event log (`@pixdrift/events`). Products sync by publishing and
  listening — they never write another product's tables.
- Each product owns one schema. Migrations live in `db/migrations/<schema>/`.
- Apply with `pnpm db:migrate` (owner role). Runtime uses `DATABASE_URL` (app role).
- RITA's real engine is still the Rust binary, reached by `HttpAnalysisEngine`
  or `SubprocessAnalysisEngine`. Without a host or `RITA_ENGINE_BINARY` an
  analysis is stored as `blocked`, not faked.
- ALVA stores cases. The diagnosis engine waits for the ALVA repo.

## Shared APIs

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/platform/health` | no |
| GET | `/api/platform/systems` | yes |
| GET | `/api/platform/me` | yes |
| GET | `/api/platform/events` | yes (scoped to active org) |
| GET | `/api/tora/market` | no (demo) / yes (tier). Evaluate only — does not persist or publish. |
| POST | `/api/tora/market` | yes. Persist a snapshot and publish `tora.market.evaluated`. |
| GET | `/api/tora/opportunities/:id` | no (demo) / yes (tier). Detail from the same engine. |
| GET | `/api/tora/calendar` | no (demo) / yes (tier). Forward calendar. |
| GET/POST | `/api/rita/analyses` | yes. Completed events carry `findingCount` and `modelConfigured`. |
| GET/POST | `/api/britt/observations` | yes |
| GET/POST | `/api/britt/findings` | yes. Demo metrics analysis; high findings become observations. |
| GET/POST | `/api/irma/agreements` | yes. GET accepts `?q=` (title/counterparty). POST may set `verificationLevel` 0\|1. |
| GET/POST | `/api/irma/agreements/:id` | yes (org-scoped). GET returns integrity recompute. POST `{action:revoke}` cancels an unsigned link. |
| GET | `/api/irma/l/:token` | no (hashed magic link, 14-day TTL, `Cache-Control: no-store`). First open → `viewed`. Expired/revoked → 404. |
| POST | `/api/irma/l/:token` | no. Level 1 hashed acknowledgement → `signed` + artifact SHA-256. Level 0 rejected. |
| GET/POST | `/api/tyra/cases` | yes |
| GET | `/api/tyra/cases/:id` | yes |
| POST | `/api/tyra/hub/link` | yes. Returns plaintext token once. |
| GET | `/api/tyra/reminders` | yes. Outbox rows. |
| POST | `/api/tyra/suppliers/search` | yes. Returns `NOT_CONFIGURED` until an adapter exists. |
| GET | `/api/tyra/cron/reminders` | `CRON_SECRET`. Marks pending outbox `BLOCKED`. |
| GET/POST | `/api/alva/cases` | yes |
| GET/POST | `/api/kansli/tasks` | yes |
| GET/POST/PATCH/DELETE | `/api/tasks` | yes (alias till `/api/kansli/tasks`) |

## Product UI

| Path | Product |
| --- | --- |
| `/kansli` | Hub, session, tasks |
| `/tora` | Market, upcoming, watch, history + explicit publish |
| `/tora/[id]` | Opportunity detail, legal basis, process, remedies |
| `/tora/calendar` | Forward calendar from the same engine |
| `/rita` | Analysis requests (blocked without engine host or binary) |
| `/rita/[id]` | Findings from `result.opportunities` |
| `/britt` | Demo findings + observations inbox |
| `/irma` | Agreements, search, create. Issued link is a 120s httpOnly cookie (`?issued=1`), not `?link=`. |
| `/irma/:id` | Org-scoped detail, integrity, revoke. |
| `/irma/l/:token` | Guest view. First open marks `viewed`. Level 1 acknowledge marks `signed`. |
| `/tyra` | Tire cases, create + list |
| `/tyra/cases/:id` | Work card + hub link |
| `/tyra/hub/:token` | Guest hub (hashed token, no account) |
| `/tyra/integrations` | Supplier accounts + reminder outbox |
| `/alva` | Case registration (engine deferred) |
| `/creditae` | Counterpart credit inquiry (Creditsafe via platform channel; no invented score) |
| `/platform` | Module catalog |
| `/platform/events` | Org-scoped event log |

Login accepts `?next=` for those paths only (`pd_next` cookie). Anything else falls back to `/kansli`.

The operating map — what each system does now, and how they connect — is
`docs/FAMILY.md` and `/platform`. The machine contract (ids, schemas, API
bases, event ownership) is `@pixdrift/systems`. A workspace-contract test
fails the build if a product is missing UI, API, domain folder, migration or
domain test.
