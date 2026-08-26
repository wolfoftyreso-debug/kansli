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
- `docs/DESIGN-SOURCE.md` — extraherad design för alla rum. Inte låst än.
  Hitta inte på ett nytt utseende. Lås när Claude Design-filen är införd.
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
- Ekonomi sales forms take kronor. The book stores öre. TYRA tire sales book
  into Ekonomi from the case. A quote draft is the secondary path, not the sale.
- Hardened runtime is `APP_ENV=prod|production` or `VERCEL_ENV=production`.
  Preview and `VERCEL_ENV=development` are never hardened. `NODE_ENV=production`
  is not production. Boot fails closed without `DATABASE_URL`, without secrets
  of at least 32 characters, with `PIXDRIFT_SEED_DEMO=true`, or with
  `COOKIE_SECURE=false`. Identity does not fall back to an in-memory store
  when hardened. CSP is enforced only when hardened.
- One Postgres. Product schemas own their tables. Customer rows carry
  `org_ref`. Request paths pin `app.org_ref` via `tryRuntime(session.org.ref)`
  or `runtimeForOrg`. `DATABASE_URL` is `pixdrift_app`, never the table owner.
  Kansli intakes are house-level (`house_org_ref`), not per workshop. Do not
  invent a second database, Redis as source of record, or sandbox tenants.
- House inbox `/kansli/upphandling` is house-session only. Workshops get 404
  on a house intake id. The demo meeting stays on the house board.
- The workshop one-time password is shown only after form submit, via the
  `pd_intake_reveal` cookie. Anyone with the confirmation UUID must not see
  the password, email, or invoice.
- Do not name e-ID brands on the product surface. Do not build qualified
  e-sign or e-ID login. The handshake stays first-party.
- Organisation numbers use Luhn (`src/lib/platform/org-number.ts`). RITA and
  `/upphandling` fail closed on a bad number. Live RITA demo uses
  `556016-0680` (`DEMO_ORG_NUMBER`).
- BRITT example metrics and “Demonstrationsanalys” run only on the house
  (`canRunDemoIntel` / `isHouseSession`).
- Twenty-workshop proof: `LIVE_FLEET=1 pnpm exec vitest run
  src/lib/platform/live-fleet.test.ts`. Default skip so CI does not create
  twenty orgs. Do not send another real SMS or copy 46elks to production.
- Design source is `docs/DESIGN-SOURCE.md`. Extracted from current UI, not
  invented. Do not start `@pixdrift/design` or a second look until that file
  is locked after the shared Claude Design file is implemented.
- Operations live at `/platform/drift`. One Postgres. House sees the fleet.
  Workshops see their own org. Do not invent a second database, Grafana,
  OpenTelemetry export, or a second DevPortal. Measurements are live SQL
  plus in-process MCP counters. Structure lives in
  `src/lib/platform/structure.ts`.
