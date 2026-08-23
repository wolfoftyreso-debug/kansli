# Pixdrift Consolidation (Vercel-first)

WAVE 0 discovery output for consolidating all Pixdrift repositories into one
coherent, Vercel-first platform (target repo: **kansli**). No blind rewrite —
product truth is preserved; historical infrastructure is not.

| Deliverable | Document |
| --- | --- |
| Repository map · Capability matrix · Infra map · Data/Auth/Upload comparison · Duplication report | [`DISCOVERY.md`](./DISCOVERY.md) |
| Target Vercel-first architecture + canonical choices | [`TARGET-ARCHITECTURE.md`](./TARGET-ARCHITECTURE.md) |
| Migration ledger (KEEP/MERGE/REWRITE/REMOVE per component) | [`../migrations/MIGRATION_LEDGER.md`](../migrations/MIGRATION_LEDGER.md) |
| Ordered waves + verification gate + risk register | [`EXECUTION-PLAN.md`](./EXECUTION-PLAN.md) |

## The one-paragraph truth

Six repos, six stacks. **No AWS anywhere.** kansli is already the Vercel-first
core (Next + Neon Postgres + Pixdrift Identity, live). The consolidation is:
unify persistence on **Neon Postgres** (`pg` + raw SQL), auth on **Pixdrift
Identity** (OIDC adapters already written), storage on **Vercel Blob**, framework
on **Next.js App Router**, scheduled work on **Vercel Cron** — porting BRITT
(SQLite→PG) and IRMA (Cloudflare/D1/R2→Vercel/PG/Blob) as the two biggest jobs,
with **no silent feature loss**.

## Locked decisions

1. **RITA and TORA stay separate products.** Shared "opportunity" vocabulary is
   coincidental. RITA verifies financial records against a rule set; TORA
   decides whether a company may bid on a public procurement, on what legal
   basis, and what to do next. They do not merge.
2. **ALVA is deferred** until the owner provides the finished repo.
3. **RITA analysis engine: keep the real Rust binary, reach it over HTTP.**
   A serious system for businesses cannot ship `FakeAnalysisEngine`. Vercel Node
   Functions cannot execute `skattjakt`; the product stays on Vercel and talks
   to the engine through `HttpAnalysisEngine` (`@pixdrift/rita-engine`). WASM
   or a TypeScript rewrite remain possible later as another class behind the
   same interface — they are not the first production path.
4. **Port order** — TORA first (engine is already TypeScript), then RITA
   (HTTP host + Next), then BRITT (SQLite→PG), then IRMA (Cloudflare→Vercel).
