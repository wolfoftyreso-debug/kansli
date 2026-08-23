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
| RITA | Opportunity/verification/findings engine, web+api+worker, PG schema | KEEP (product) / REWRITE (infra) | Next module + Route Handlers; worker→Vercel Cron; `postgres.js`→`pg`; auth→Identity | DISCOVERED |
| BRITT | Connectors, findings, dashboards, 7 reports, alerts, RSS, exec comms, 17 demo profiles, exports | KEEP (product) / REWRITE (infra) | Next module; Express→Route Handlers; **SQLite→Neon PG (426 sync sites → async)**; sessions→Identity; exports→Blob | DISCOVERED (deployed as stateful stopgap) |
| TORA | Procurement outcome engine (RÄTTIGHET+LegalBasis), SPA + PG platform | KEEP (product) / REWRITE (infra) | Next module (port SPA) + Route Handlers; keep PG (already `pg`); auth→Identity | DISCOVERED (SPA live) |
| IRMA | Agreement lifecycle, magic links, e-sign, artifacts | KEEP (product) / REWRITE (infra) | Next; **Cloudflare vinext→Next**, **D1/drizzle→Neon PG**, **R2→Vercel Blob**; magic links kept | DISCOVERED |
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

## Data / duplication reconciliation

| Item | Decision |
| --- | --- |
| org/user/tenant/audit tables (all products) | MERGE to `@pixdrift/contracts` shapes |
| Two Postgres drivers | REMOVE `postgres.js`; standardize `pg` |
| Findings (BRITT + RITA) | KEEP both; share contract shape (inference≠fact) |
| RITA vs TORA "opportunity" overlap | UNDER_REVIEW — confirm distinct vs merge (owner input) |
| Per-product auth/sessions | MERGE to Pixdrift Identity |
