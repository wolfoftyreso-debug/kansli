<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Pixdrift-plattformen — läs detta först

Detta repo är navet för Pixdrift-familjens **gemensamma plattform** (identitet,
kontrakt, IdP) under självständiga produkter (ALVA, RITA, TORA, BRITT, IRMA …).

Innan du ändrar något i familjen, läs och följ:

- `docs/ARCHITECTURE-CONSTITUTION.md` — styrande, nästan juridiska artiklar.
- `docs/PLATFORM-1.0.md` — fryst plattformsmålbild (en plattform, flera produkter).
- `docs/PLATFORM-1.0-GAP.md` — PASS/PARTIAL/MISSING mot den målbilden. Läs innan du bygger.
- `docs/PIXDRIFT-ARKITEKTUR.md` — målarkitektur, sammanflätning, synk, sekvens.
- `docs/REPO-INTAKE.md` — pipeline och klassificering (KEEP/MOVE/MERGE/REWRITE/
  DEPRECATE/DELETE/UNKNOWN; `UNKNOWN` utreds, gissas aldrig).
- `docs/INVENTORY.md` — exakt kodinventering (paket, adaptrar, endpoints, tester).
- `docs/INFRASTRUCTURE-AUDIT.md` — vad som finns, hur det hänger, mognad, luckor.
- `docs/CRITICAL-REVISION.md` — hårdaste genomgången av luckor och vad som medvetet inte byggts.

Kärnregler i korthet: explicit dataägande; ingen modul skriver i en annans data;
kontrakt/events, inte delade tabeller; testad restore; audit på allt viktigt;
AI är aldrig source of truth; automation har uttrycklig nivå (L0–L4).

## Cursor Cloud specific instructions

- `docs/PLATFORM-1.0-GAP.md` is the build gate. Do not start ChatGPT Apps, SDK
  generators, SEO engines or a second DevPortal until that matrix says the
  underlying cell is ready.
- Products are only the ids in `@pixdrift/systems`. NORA, MOVA and SAGA are not
  in this repository. Do not invent them.
- Capability Graph is generated from `src/lib/mcp/tools.ts`. Do not add a second
  handwritten catalog.
- Standard commands: `pnpm format:check`, `pnpm lint`, `pnpm test`, `pnpm dev`.
  Demo login (when seeded): `demo@exempelbolaget.se` / `demo-losenord-1234`.
- Ekonomi sales SMS goes through `src/lib/platform/sms.ts` (46elks). Products
  must not call 46elks themselves. A missed SMS must not roll back a booked
  sale. Mark SENT only if the vendor accepted the message.
- Production path is `/kansli/beredskap` and `docs/FIRST_CUSTOMER.md`. Do not
  invent Visma, Fortnox, Stripe Checkout or Swish Handel. The book is enough
  for a first customer who signs what the product is not.
- Hardened runtime is `APP_ENV=prod|production` or `VERCEL_ENV=production`.
  Preview and `VERCEL_ENV=development` are never hardened. `NODE_ENV=production`
  is not production. Boot fails closed without `DATABASE_URL`, without secrets
  of at least 32 characters, with `PIXDRIFT_SEED_DEMO=true`, or with
  `COOKIE_SECURE=false`. Identity does not fall back to an in-memory store
  when hardened. CSP is enforced only when hardened.
