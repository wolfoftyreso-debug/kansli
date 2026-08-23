# @pixdrift/doc-intel

The **Documentation Intelligence kernel** for ALVA / the Pixdrift platform: a
machine-readable **Product Capability Inventory** + **Documentation Coverage
Matrix**, and the engine that turns them into gap and drift reports.

It exists to answer one question honestly, at any time:

> **What parts of ALVA are currently undocumented?**

A capability with no coverage record is `UNDOCUMENTED`. A capability whose source
is not in this repository is `NOT_PRESENT` (unverifiable here). Unknown coverage
is never allowed to masquerade as complete. See `docs/DOCUMENTATION-INTELLIGENCE.md`.

## Use

```ts
import { loadInventory, loadCoverageMatrix, computeGaps, whatIsUndocumented } from "@pixdrift/doc-intel";

const inv = loadInventory();
const matrix = loadCoverageMatrix();

const undocumented = whatIsUndocumented(inv, matrix); // CapabilityCoverage[]
const gaps = computeGaps(inv, matrix);                // totals + categorised gaps
```

Generate the human-readable report (writes `docs/ALVA-DOCUMENTATION-GAP-REPORT.md`):

```bash
pnpm --filter @pixdrift/doc-intel gap-report
```

## Data (single source of truth)

- `data/capability-inventory.json` — what exists (routes/components, roles,
  visibility, presence, confidence, known gaps).
- `data/coverage-matrix.json` — documentation state per capability (status,
  articles, screenshot/translation status, contextual help).

Both are validated by the Zod schemas in `src/model.ts` on load. Edit the JSON to
record new findings; the gap report and tests reflect the change immediately.

## Scope

This package is the **grounded control layer**. The human-facing surfaces (web
handbook, in-app help, AI Q&A, snapshot pipeline, PDF, translations) render from
content that links back to these capability ids and are built once the ALVA
product repository and a runnable instance are available (see the architecture
doc for the blocker and the first-vertical-slice plan).
