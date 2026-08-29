/**
 * Generate the ALVA Documentation Gap Report from the machine-readable
 * capability inventory + coverage matrix.
 *
 *   pnpm --filter @pixdrift/doc-intel gap-report
 *
 * Writes docs/ALVA-DOCUMENTATION-GAP-REPORT.md and prints a summary. This is
 * the PHASE 0 control point: it enumerates what exists, what is documented, and
 * what cannot be verified from this repository.
 */

import { writeFileSync } from "node:fs";
import { computeGaps, loadCoverageMatrix, loadInventory, renderGapReport } from "../src/index.ts";

const inv = loadInventory();
const matrix = loadCoverageMatrix();
const gaps = computeGaps(inv, matrix);
const markdown = renderGapReport(inv, matrix);

const out = new URL("../../../docs/ALVA-DOCUMENTATION-GAP-REPORT.md", import.meta.url);
writeFileSync(out, markdown, "utf8");

const s = gaps.totals.byStatus;
console.log("ALVA Documentation Gap Report written to docs/ALVA-DOCUMENTATION-GAP-REPORT.md");
console.log(
  `Capabilities: ${gaps.totals.capabilities} ` +
    `(IN_REPO ${gaps.totals.inRepo}, EXTERNAL ${gaps.totals.externalRepo}, NOT_PRESENT ${gaps.totals.notPresent})`,
);
console.log(
  `Status: DOCUMENTED ${s.DOCUMENTED}, PARTIALLY ${s.PARTIALLY_DOCUMENTED}, ` +
    `DRAFT ${s.DRAFT}, UNDOCUMENTED ${s.UNDOCUMENTED}, ` +
    `VERIFICATION_REQUIRED ${s.VERIFICATION_REQUIRED}, OUTDATED ${s.OUTDATED}`,
);
console.log(`Undocumented (headline): ${gaps.undocumented.length}`);
console.log(`Not verifiable from here (NOT_PRESENT): ${gaps.notPresent.length}`);
if (gaps.orphanCoverage.length) {
  console.error(`WARNING: ${gaps.orphanCoverage.length} orphan coverage entries`);
}
