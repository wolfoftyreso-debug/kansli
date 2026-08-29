/**
 * Generate the ALVA Product Demo gap report from the shot list + asset manifest,
 * cross-checked against the capability inventory.
 *
 *   pnpm --filter @pixdrift/doc-intel demo-gap-report
 *
 * Reports which hero scenes are VERIFIED / CAPTURED / PLANNED / BLOCKED_NO_APP,
 * so a marketing scene is never published over an unverified or non-existent
 * ALVA UI state.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import {
  computeDemoGaps,
  loadAssetManifest,
  loadInventory,
  loadShotlist,
  renderDemoGapReport,
} from "../src/index.ts";

const shotlist = loadShotlist();
const manifest = loadAssetManifest();
const inv = loadInventory();
const gaps = computeDemoGaps(shotlist, manifest, inv);
const markdown = renderDemoGapReport(shotlist, manifest, inv);

const outDir = new URL("../../../docs/product-demo/", import.meta.url);
mkdirSync(outDir, { recursive: true });
writeFileSync(new URL("ALVA-DEMO-GAP-REPORT.md", outDir), markdown, "utf8");

const t = gaps.totals;
console.log("ALVA Product Demo gap report written to docs/product-demo/ALVA-DEMO-GAP-REPORT.md");
console.log(
  `Scenes: ${t.scenes} (VERIFIED ${t.verified}, CAPTURED ${t.captured}, ` +
    `PLANNED ${t.planned}, BLOCKED_NO_APP ${t.blocked}, QA_REJECTED ${t.qaRejected})`,
);
console.log(`Cannot be demonstrated from here: ${gaps.cannotDemonstrate.length}`);
