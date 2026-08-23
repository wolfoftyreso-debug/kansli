# Pixdrift Migration Ledger

Every substantial imported component and its consolidation disposition. Nothing
substantial disappears without a trace. Statuses: DISCOVERED · UNDER_REVIEW ·
KEEP · REWRITE · MERGE · REMOVE · MIGRATED · VERIFIED.

## Platform (kansli — the target)

| Source | Capability | Decision | Target | Status |
| --- | --- | --- | --- | --- |
| kansli | Next.js hub + BFF | KEEP | apps/web base | VERIFIED (live) |
| identity | OIDC IdP (Postgres, ES256) | KEEP | Canonical auth | VERIFIED (live SSO) |
| ai-core | Model router | KEEP | packages/ai-core | VERIFIED |
| contracts/auth-core/auth-client | Shared shapes/primitives | KEEP | packages/* | VERIFIED |
| doc-intel | Capability/coverage/gap engine | KEEP | packages/doc-intel | VERIFIED |
| integrations/* | OIDC adapters per product | KEEP | Wire each product to Identity | KEEP |

## Products

| Source | Capability | Decision | Target | Status |
| --- | --- | --- | --- | --- |
| RITA | Opportunity/verification/findings engine, web+api+worker, PG schema | KEEP (product) / REWRITE (infra) | Next module + Route Handlers; worker→Vercel Cron; `postgres.js`→`pg`; auth→Identity | DISCOVERED — **blocker: Rust analysis engine (`engines/skattjakt`, Cargo) invoked via `child_process`; cannot run on Vercel Node runtime. Faithful port needs an engine-host decision (see below), not the `FakeAnalysisEngine` (app refuses it outside local/test → silent feature loss).** |
| BRITT | Connectors, findings, dashboards, 7 reports, alerts, RSS, exec comms, 17 demo profiles, exports | KEEP (product) / REWRITE (infra) | Next module; Express→Route Handlers; **SQLite→Neon PG (426 sync sites → async)**; sessions→Identity; exports→Blob | DEPLOYED (stateful stopgap) — API verified live on Vercel (`/api/v1/demo/catalog` 200, auth 401 on bad creds). Data in ephemeral `/tmp` SQLite: reads seeded per-instance work; cross-instance writes not durable until PG port. |
| TORA | Procurement outcome engine (RÄTTIGHET+LegalBasis), SPA + PG platform | KEEP (product) / REWRITE (infra) | Next module (port SPA) + Route Handlers; keep PG (already `pg`); auth→Identity | LIVE (public) — SPA verified rendering at `tora-hypbit.vercel.app`; SSO deployment protection disabled. |
| IRMA | Agreement lifecycle, magic links, e-sign, artifacts | KEEP (product) / REWRITE (infra) | Next; **Cloudflare vinext→Next**, **D1/drizzle→Neon PG**, **R2→Vercel Blob**; magic links kept | DISCOVERED — large infra port (Cloudflare Workers/D1/R2 → Vercel/Neon/Blob). |
| alva | Vehicle diagnosis entity model, evidence, protocol | UNDER_REVIEW (owner: not finished) | Next module + Neon PG + Blob; auth→Identity | DISCOVERED |

## Infrastructure to remove (after capability re-homed)

| Source | Item | Decision | Replacement |
| --- | --- | --- | --- |
| IRMA | Cloudflare Workers/Pages, D1, R2, wrangler, @cloudflare/vite-plugin | REMOVE | Vercel + Neon + Blob |
| BRITT/alva | Dockerfile, infra/, deploy/ | REMOVE | Vercel deploy |
| RITA | Fastify api server + worker process | REWRITE→REMOVE | Route Handlers + Vercel Cron |
| BRITT | better-sqlite3 / node:sqlite | REMOVE | Neon Postgres |
| RITA | postgres.js | REMOVE | `pg` (shared `@pixdrift/db`) |
| (all) | AWS SDK | N/A | none present |

## Live deployment status (team `hypbit`, verified this wave)

| System | URL | State | Notes |
| --- | --- | --- | --- |
| kansli (Pixdrift core + IdP + site) | `kansli.vercel.app` | LIVE | Neon-backed OIDC SSO, verified end-to-end |
| TORA | `tora-hypbit.vercel.app` | LIVE (public) | SPA; SSO protection disabled this wave |
| BRITT | `britt-hypbit.vercel.app` | LIVE (demo-grade) | Express-on-Vercel; API serving; SQLite in ephemeral `/tmp` |
| RITA | — | NOT DEPLOYED | Blocked on engine-host decision (Rust `skattjakt`) |
| IRMA | — | NOT DEPLOYED | Cloudflare→Vercel port pending |
| ALVA | — | DEFERRED | Awaiting repo from owner |

## Open architectural decision — RITA analysis engine

RITA's core value (the tax/opportunity analysis) is a **Rust binary** (`engines/skattjakt`,
Cargo workspace) called over `child_process` with a stdin JSON request / stdout JSON
envelope contract (`packages/engine-adapter`). Vercel Node Functions cannot execute an
arbitrary native binary, so a faithful Vercel-first port needs one of:

1. **Engine as a separate service** — deploy `skattjakt` behind HTTP (e.g. a small
   container/host) and add an `HttpAnalysisEngine` implementing the same `AnalysisEngine`
   interface (the adapter is explicitly designed for this: "Replacing the engine with an
   HTTP service … is a new class here and nothing else").
2. **Rust→WASM** — compile `skattjakt` to WebAssembly and call it in-process from a Vercel
   Function (fits Vercel-first; needs a WASM build target + memory/timeout validation).
3. **Reimplement rules in TypeScript** — largest effort; removes the Rust toolchain but
   duplicates the rule set.

Not acceptable: shipping `FakeAnalysisEngine` to production (the app refuses it outside
`local`/`test`, and it would be a silent feature loss). This decision gates the RITA port.

## Data / duplication reconciliation

| Item | Decision |
| --- | --- |
| org/user/tenant/audit tables (all products) | MERGE to `@pixdrift/contracts` shapes |
| Two Postgres drivers | REMOVE `postgres.js`; standardize `pg` |
| Findings (BRITT + RITA) | KEEP both; share contract shape (inference≠fact) |
| RITA vs TORA "opportunity" overlap | UNDER_REVIEW — confirm distinct vs merge (owner input) |
| Per-product auth/sessions | MERGE to Pixdrift Identity |
