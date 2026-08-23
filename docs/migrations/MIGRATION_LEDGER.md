# Pixdrift Migration Ledger

Every substantial imported component and its consolidation disposition. Nothing
substantial disappears without a trace. Statuses: DISCOVERED · UNDER_REVIEW ·
KEEP · REWRITE · MERGE · REMOVE · MIGRATED · VERIFIED.

## Platform (kansli — the target)

| Source | Capability | Decision | Target | Status |
| --- | --- | --- | --- | --- |
| kansli | Next.js hub + BFF | KEEP | apps/web base | VERIFIED (live) |
| @pixdrift/db | Shared `pg` pool + SQL migration runner | KEEP | packages/db | MIGRATED |
| identity | OIDC IdP (Postgres, ES256) | KEEP | Canonical auth | VERIFIED (live SSO) |
| ai-core | Model router | KEEP | packages/ai-core | VERIFIED |
| contracts/auth-core/auth-client | Shared shapes/primitives | KEEP | packages/* | VERIFIED |
| doc-intel | Capability/coverage/gap engine | KEEP | packages/doc-intel | VERIFIED |
| integrations/* | OIDC adapters per product | KEEP | Wire each product to Identity | KEEP |

## Products

| Source | Capability | Decision | Target | Status |
| --- | --- | --- | --- | --- |
| RITA | Opportunity/verification/findings engine, web+api+worker, PG schema | KEEP (product) / REWRITE (infra) | Next module + Route Handlers; worker→Vercel Cron; `postgres.js`→`pg`; auth→Identity; **engine via `HttpAnalysisEngine`** | DISCOVERED — engine-host decision locked (HTTP, real Rust). Adapter lives in `@pixdrift/rita-engine`. Engine host itself not yet deployed. |
| BRITT | Connectors, findings, dashboards, 7 reports, alerts, RSS, exec comms, 17 demo profiles, exports | KEEP (product) / REWRITE (infra) | Next module; Express→Route Handlers; **SQLite→Neon PG (426 sync sites → async)**; sessions→Identity; exports→Blob | DEPLOYED (stateful stopgap) — API verified live on Vercel (`/api/v1/demo/catalog` 200, auth 401 on bad creds). Data in ephemeral `/tmp` SQLite: reads seeded per-instance work; cross-instance writes not durable until PG port. |
| TORA | Procurement outcome engine (RÄTTIGHET+LegalBasis), SPA + PG platform | KEEP (product) / REWRITE (infra) | `@pixdrift/tora` + `/tora` + `/api/tora/market`; keep PG; auth→Identity | MIGRATED (engine) — TypeScript engine in-tree; Next surface serves redacted market from the real engine. Standalone SPA still live at `tora-hypbit.vercel.app`. |
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
| RITA | — | NOT DEPLOYED | Engine host decision locked (HTTP); host not yet provisioned |
| IRMA | — | NOT DEPLOYED | Cloudflare→Vercel port pending |
| ALVA | — | DEFERRED | Awaiting repo from owner |

## Locked — RITA analysis engine

**Decision: `HttpAnalysisEngine` against the real Rust binary.** A serious system
for businesses cannot ship a fake. Vercel Node cannot run `skattjakt` (document
workdir, Anthropic, ~180s). The product stays on Vercel; only the engine process
is extra infrastructure (constitution art. 4). WASM / TypeScript rewrite remain
valid later replacements behind the same interface.

Implemented: `@pixdrift/rita-engine` (`HttpAnalysisEngine` + contract +
subprocess/fake for local/test). Remaining: provision the engine host and point
`ENGINE_URL` / `ENGINE_TOKEN` at it.

## Data / duplication reconciliation

| Item | Decision |
| --- | --- |
| org/user/tenant/audit tables (all products) | MERGE to `@pixdrift/contracts` shapes |
| Two Postgres drivers | REMOVE `postgres.js`; standardize `pg` |
| Findings (BRITT + RITA) | KEEP both; share contract shape (inference≠fact) |
| RITA vs TORA "opportunity" overlap | KEEP both — owner: separate products, do not merge |
| Per-product auth/sessions | MERGE to Pixdrift Identity |
