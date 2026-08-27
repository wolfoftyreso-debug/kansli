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
- `docs/DESIGN-SOURCE.md` — låst mot `docs/design/` (paket 3.1).
  Produkter är bara id:n i `@pixdrift/systems`. Hitta inte på NORA, MOVA,
  SAGA eller ett andra utseende.
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
  in this repository. Do not invent them. CREDITAE is the counterpart-credit
  room: org number + your assessment. Credit reports go through
  `src/lib/platform/credit.ts` (Creditsafe). Products must not call Creditsafe
  themselves. Do not invent a bureau score, UC or TIC.
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
- Design source is locked in `docs/design/` (see `docs/DESIGN-SOURCE.md`).
  Do not start `@pixdrift/design` or a second look. Do not invent NORA,
  MOVA, SAGA, or settings-apps (BEA, LANGUAGE). English is the system
  language. Translations sit in `src/lib/i18n` (sv, pl, de, es, fr, nl,
  it, no, da, fi). Locale is the chrome picker and `pd_locale` cookie,
  not a product. Never the term "AI" in UI. One accent. Status is shape
  plus color.
- ALVA schema is `docs/design/alva/`. Grammar in `/alva` only. PIXDRIFT
  chrome wins. Do not import the diagnosis engine, AWS, or a second
  typeface. Status is mark plus word (`□` / `○` / `✓`).
- Operations live at `/platform/drift`. One Postgres. House sees the fleet.
  Workshops see their own org. The desk composes reskontra (Ekonomi), open
  cases (TYRA/Kansli/BRITT), notices, and SMS routes. Sales SMS stays in
  Ekonomi — platform does not write `ekonomi.*`. Snapshot polling must not
  send SMS. SENT only if the platform SMS channel accepted. Do not invent a
  second database, Grafana, OpenTelemetry export, a support product, or a
  second DevPortal. Measurements are live SQL plus in-process MCP counters.
  Structure lives in `src/lib/platform/structure.ts`. Debug lookup is
  on-demand at `/api/platform/ops/debug` and `pnpm ops:lookup`. Snapshots
  include queues, last errors, and runtime marks. Do not dump secrets.
- Speech goes through `src/lib/platform/tts.ts` (ElevenLabs). Products must
  not call ElevenLabs themselves. IRMA listen is optional: guest
  `/api/irma/l/:token/speech` and org `/api/irma/agreements/:id/speech`.
  Tests mock the vendor. Do not send live speech from tests or page load.
- Credit reports go through `src/lib/platform/credit.ts` (Creditsafe Connect).
  Products must not call Creditsafe. CREDITAE stores pass-through fields only
  when the vendor accepted. Tests mock the vendor. Do not live-call Creditsafe
  from tests or page-load list.
- Web visibility goes through `src/lib/platform/webintel.ts` (Semrush).
  Products must not call Semrush themselves. Fail closed without
  `SEMRUSH_API_KEY`. CREDITAE fetches a counterpart's web presence only on an
  explicit button press — never on page load — and stores vendor numbers
  verbatim (`fetched` only when the vendor accepted). Tests mock the vendor.
  The system never invents traffic, ranks or scores.
- MAJ (`/maj`, schema `maj`) is the Search Intelligence & Execution System:
  Mät, analysera, justera. It shows a short action queue with evidence behind
  every decision — never raw vendor dashboards. Business logic is
  capability-named (`keywordOpportunity`), never vendor-named. Sources without
  credentials fail closed and become connect-source decisions. Usage is booked
  to `maj.usage_ledger` BEFORE any external call. Every completed change is a
  versioned release (`release.v1`, additive contract). Nothing executes or is
  sent without explicit approval; outreach is drafted, never auto-sent. HEDGE
  posture means maximal lawful competitive response — never fake reviews,
  click fraud, negative links, impersonation or misleading pages. UI never
  says "AI". Alpha: internal (house) tenants only.
- CREDITAE lives at `/creditae`. One table `creditae.inquiries`. Credit reports
  go through `src/lib/platform/credit.ts` (Creditsafe). Products must not call
  Creditsafe. Tests mock the vendor. Do not live-call Creditsafe from tests or
  page load. Fetched only if the vendor accepted. Do not auto-map a vendor
  score to Kör/Bevaka/Stanna. Fail closed without `CREDITSAFE_USERNAME` and
  `CREDITSAFE_PASSWORD`. The system never invents a score. Assessment is
  go / watch / stop, written by the user. Do not invent UC or TIC.
