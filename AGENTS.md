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
- `docs/PIXDRIFT-ARKITEKTUR.md` — målarkitektur, sammanflätning, synk, sekvens.
- `docs/REPO-INTAKE.md` — pipeline och klassificering (KEEP/MOVE/MERGE/REWRITE/
  DEPRECATE/DELETE/UNKNOWN; `UNKNOWN` utreds, gissas aldrig).
- `docs/INVENTORY.md` — exakt kodinventering (paket, adaptrar, endpoints, tester).
- `docs/INFRASTRUCTURE-AUDIT.md` — vad som finns, hur det hänger, mognad, luckor.
- `docs/CRITICAL-REVISION.md` — hårdaste genomgången av luckor och vad som medvetet inte byggts.

Kärnregler i korthet: explicit dataägande; ingen modul skriver i en annans data;
kontrakt/events, inte delade tabeller; testad restore; audit på allt viktigt;
AI är aldrig source of truth; automation har uttrycklig nivå (L0–L4).
