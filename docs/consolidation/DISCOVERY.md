# Pixdrift Consolidation — WAVE 0 Discovery

Grounded inventory of every repository available for consolidation. No code was
rewritten to produce this; it is derived from scanning each repo's source,
`package.json` files, schemas and docs. Consolidation target: **kansli** (this
repo) as the Vercel-first Pixdrift platform.

**Headline finding:** none of the repos actually depend on the AWS SDK — the
"AWS removal" wave is largely N/A. The real work is unifying **six divergent
persistence + auth + framework stacks** onto one Vercel-first architecture.

## A. Repository map

| Repo | Product | Stack | Package mgr | Deploy target today | Tests |
| --- | --- | --- | --- | --- | --- |
| **kansli** (this) | Pixdrift platform hub + **Identity (OIDC IdP)** + AI Core + doc-intel | Next.js (App Router) + fastify (IdP) + `pg` | pnpm | **Vercel (live, Neon Postgres)** | 14 |
| **RITA** | Opportunity / verification / findings ("opportunity-intelligence") | pnpm monorepo: `apps/{web,api,worker}` + `engines` + `packages/{db,contracts}`; Next + fastify + `postgres` (postgres.js) | pnpm | Node server + Postgres | 13 |
| **BRITT** | Operational intelligence: connect org systems → findings → dashboards/reports | Express + `better-sqlite3`; PDF/Excel/PPTX (pdfkit/exceljs/pptxgenjs) | npm | Container (Dockerfile) + SQLite volume | 35 |
| **TORA** | Tender/procurement analysis (public market, outcome engine) | Vite/React **SPA** + `platform/opportunity` Postgres API (`pg` + fastify + jose) | npm | Static SPA + Node API | 26 |
| **IRMA** | Agreement platform (ingest → schema → workflow → verify → e-sign → artifact) | `vinext` + `@cloudflare/vite-plugin` + **D1 (drizzle sqlite)** + R2; magic links | npm | **Cloudflare Workers/Pages** | 19 |
| **alva** | Vehicle diagnosis (vehicle→work order→complaint→session→protocol) | `app/server/services` + `pg`; Dockerfile + `infra/` | npm | Container + Postgres | 45 |

Already deployed by this consolidation effort (Vercel): **kansli** (live, Neon +
SSO) and **TORA SPA** (https://tora-sigma-two.vercel.app), **BRITT** (deployed but
stateful — see risks).

## B. Capability matrix (product truth per repo)

- **kansli** — nav/hub; **Pixdrift Identity**: OIDC discovery/JWKS/authorize/
  token/userinfo/logout, Postgres store, rotating ES256 key, client registry;
  AI Core (model router); doc-intel (capability/coverage/gap engine);
  product-demo engine; OIDC **adapters** for alva/rita/tora/britt/irma.
- **RITA** — opportunity + verification/"findings" engine; rule sets; web + API
  + background worker; Postgres schema (`packages/db/migrations` 0001–0003:
  foundation, documents/scans, automations/conversations).
- **BRITT** — connectors (Fortnox, Revolut, CSV), ingestion, reasoning/findings
  (FACT/…), dashboards, 7 report types, alerts, RSS, executive communications,
  **industry demo catalog** (17 profiles), exports (PDF/Excel/PPTX).
- **TORA** — public-procurement outcome engine (`RÄTTIGHET` requires a
  `LegalBasis`), opportunity dashboard, watchlists, company profile, tiers; SPA
  + Postgres platform with RLS/least-privilege migrations.
- **IRMA** — agreement ingestion + human review; canonical agreement schemas/
  templates/clauses; recipient completion via secure **Magic Links**;
  verification + signing; immutable artifacts + lifecycle; tenant admin/audit.
- **alva** — structured vehicle diagnosis entity model; evidence/measurements;
  diagnosis protocol. (Owner: not finished.)

## C. Infrastructure map (what each depends on today)

| Concern | kansli | RITA | BRITT | TORA | IRMA | alva |
| --- | --- | --- | --- | --- | --- | --- |
| Runtime host | Vercel | Node | Container | Static+Node | **Cloudflare** | Container |
| DB | Neon PG (`pg`) | Postgres (`postgres.js`) | **SQLite** (better-sqlite3) | Postgres (`pg`) | **D1 sqlite** (drizzle) | Postgres (`pg`) |
| Migrations | SQL (in code) | SQL files | `schema.sql` | SQL files | drizzle SQL | `postgres-init.sql` |
| API layer | Next routes + Fastify(IdP) | **Fastify** api + worker | **Express** | Fastify | vinext/Worker | server/services |
| Object storage | — | — | (generates files) | — | **R2** | evidence/images |
| Scheduled work | — | **worker** loop | setInterval syncs | — | worker | — |
| AWS SDK | none | none | none | none | none | none |
| Cloudflare | — | — | — | — | **wrangler/D1/R2** | — |

## D. Data-access comparison (collision)

Four competing persistence patterns:
- **Postgres + raw SQL via `pg`**: kansli, TORA, alva (majority).
- **Postgres + `postgres.js`**: RITA.
- **SQLite + `better-sqlite3`** (sync): BRITT.
- **SQLite/D1 + `drizzle-orm`**: IRMA.

→ Canonical: **Neon Postgres, one driver (`pg`), raw SQL migrations** (already
the majority). RITA aligns easily (both Postgres, driver swap or keep behind a
thin layer). BRITT + IRMA require a **sqlite→Postgres port** (BRITT's 426 sync
call-sites make this the biggest data change; IRMA's drizzle schema is a
sqlite→pg dialect change).

## E. Auth comparison (collision)

- **Canonical: Pixdrift Identity** (kansli IdP, OIDC) — already exists and is
  live. OIDC client **adapters already written** for alva/rita/tora/britt/irma
  (`kansli/integrations/*`).
- Each product currently ships its **own** auth (sessions/JWT/magic-links, e.g.
  BRITT email+password sessions, IRMA magic-link recipient sessions). These must
  become OIDC clients of Pixdrift Identity; product-owned session cookies may
  remain as the local BFF session, but identity/login consolidates.

## F. Upload/storage comparison

- IRMA uses **R2**; BRITT **generates** PDF/Excel/PPTX; alva stores evidence/
  images. → Canonical: **Vercel Blob** with direct client uploads + Postgres
  metadata. IRMA's R2 → Blob; generated artifacts → Blob; evidence → Blob.

## G. Duplication / collision report

- **Two Postgres drivers** (`pg` vs `postgres.js`) → standardize on `pg`.
- **Two "opportunity" products**: RITA ("opportunity-intelligence") and TORA
  ("tender opportunity…") — overlapping opportunity/verification vocabulary.
  Confirm they are distinct products (RITA=findings/verification, TORA=public
  procurement outcomes) vs. overlapping engines to merge. **Needs owner input.**
- **Identity/session** duplicated across all products → Pixdrift Identity.
- **Findings/reasoning** appears in BRITT and RITA (both produce findings) —
  compare engines; keep both products but share the `@pixdrift/contracts`
  finding/inference shape (AI Core already enforces "inference, never fact").
- **DB schemas** overlap on org/user/tenant/audit → already modelled in
  `@pixdrift/contracts`; reconcile each product's tables to the shared shape.

## H. Notable
- **No AWS** to remove anywhere. The only non-Vercel platform coupling is
  **IRMA → Cloudflare** (vinext + D1 + R2 + wrangler), which is the largest
  single port.
- BRITT was already migrated off `node:sqlite` → `better-sqlite3` during testing
  (that change is local to the BRITT clone, not yet a Postgres port).

See `TARGET-ARCHITECTURE.md`, `EXECUTION-PLAN.md`, and
`../migrations/MIGRATION_LEDGER.md` for the target and the ordered plan.
