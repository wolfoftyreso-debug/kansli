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

## Open decisions (need owner input)

1. **RITA vs TORA overlap** — both use "opportunity" vocabulary. Distinct
   products (keep both) or overlapping engines to merge?
2. **alva** — finish first (owner said not done) or defer its port?
3. **Order** — proposed first port is **TORA** (already Postgres + deployed) as
   the end-to-end proof of the target pattern; confirm or reprioritize.
