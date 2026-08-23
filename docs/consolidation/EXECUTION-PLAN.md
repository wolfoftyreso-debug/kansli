# Pixdrift Consolidation — Execution Plan & Risk Register

Controlled migration waves (no blind rewrite). Each wave is verifiable before the
next. Difficulty is described technically, not in calendar time.

## Ordered waves

- **WAVE 0 — Discovery (this).** Repo/capability/infra/dep/data/auth/upload maps,
  duplication report, target architecture, ledger, plan. Non-destructive. ✅
- **WAVE 1 — Foundation.** Confirm workspace + TS standards + Vercel deploy + env
  registry; add thin `packages/db` (shared `pg` pool + SQL migration runner);
  Neon Postgres already live for kansli. Establish one migration dir + CI gates. ✅
  (`@pixdrift/db` + identity now uses it.)
- **WAVE 2 — Identity.** Wire each product to Pixdrift Identity (adapters exist);
  remove product-owned login/identity; keep local BFF sessions where needed.
- **WAVE 3 — Domain.** Reconcile org/user/tenant/audit to `@pixdrift/contracts`;
  bring each product's canonical business logic into `packages/domain`/modules.
- **WAVE 4 — Files.** Introduce Vercel Blob (direct client upload + PG metadata);
  migrate IRMA R2, BRITT exports, alva evidence.
- **WAVE 5 — Application modules.** Port products into `apps/web` one at a time:
  1. **TORA** (SPA already deployed; port to Next, keep PG). Lowest risk. ✅ engine in `@pixdrift/tora`; `/tora` + `/api/tora/market` serve redacted market. SPA still live separately.
  2. **RITA** (Next+api+worker → Next + Route Handlers + Vercel Cron; `pg`).
  3. **BRITT** (Express → Route Handlers; **SQLite→Neon PG** = biggest data port).
  4. **IRMA** (**Cloudflare→Next**, **D1→PG**, **R2→Blob**) = biggest infra port.
  5. **alva** (owner: finish first; then port).
- **WAVE 6 — Integrations.** Re-establish third-party integrations (Fortnox/
  Revolut for BRITT, etc.) as Route Handlers/webhooks + Vercel Cron.
- **WAVE 7 — AWS removal.** N/A (no AWS). Instead: remove Cloudflare (IRMA),
  Dockerfiles/infra dirs, standalone servers, `postgres.js`, sqlite.
- **WAVE 8 — Cleanup.** Delete obsolete shells, duplicated code, dead assets;
  dependency reduction.
- **WAVE 9 — Verification.** Feature parity, security, performance, deploy gate.

## Verification gate (per the master prompt)

Platform (prod+preview deploy, env controlled, no hidden infra) · DB (clean
migrate, indexes, relations) · Auth (login/logout/session/authorization fail
closed) · Uploads (small/large/progress/recovery/authz/metadata) · Product (no
silent feature loss; every capability has a disposition in the ledger) · Repo
(dead code/deps/infra removed, docs match, typecheck/lint/tests/build pass).

## Risk register

| Risk | Impact | Likelihood | Mitigation |
| --- | --- | --- | --- |
| **BRITT SQLite→Postgres port** (426 sync call-sites → async) | Feature loss / broken product | High effort | Introduce async `pg` data layer behind BRITT's `get/all/run` shape; convert call-sites in slices with tests; keep BRITT's schema semantics |
| **IRMA Cloudflare→Vercel port** (vinext/D1/R2) | Largest infra rewrite | High | Re-home to Next incrementally; D1 schema→pg (drizzle pg dialect); R2→Blob; preserve magic-link + e-sign flows |
| **Auth consolidation regressions** | Users locked out / authz holes | Med | Move to Identity per product behind a flag; fail-closed; keep server-side authz; E2E per product |
| **Schema reconciliation** (6 org/user/audit models) | Data mismatch / migration failure | Med | Map each to contracts; migrations from clean state; no blind concatenation |
| **RITA vs TORA overlap** | Wasted merge or wrong split | Closed | Owner: separate products. Do not merge engines. |
| **Silent feature loss** | Product regression | Absolute rule | Ledger disposition for every capability; parity checks in WAVE 9 |
| **Stateful-on-serverless** (BRITT/RITA/alva assume persistent FS/process) | Runtime breakage on Vercel | Proven (BRITT demo) | Postgres for state; Vercel Cron for loops; no local FS/sqlite |
| **Data loss during migration** | Critical | Low (demo data now) | Migrations reversible; back up before any prod data move; audit destructive ops |

## Immediate next step

TORA detail/calendar, IRMA hashed acknowledgement, RITA findings parser, and
BRITT demo intel are in. Still blocked outside this repo: RITA engine host
(or a built `skattjakt` binary), ALVA diagnosis engine, qualified e-sign/Blob,
Fortnox/Revolut.
