/**
 * @pixdrift/doc-intel — the Documentation Intelligence kernel.
 *
 * The single, machine-readable source of truth for "what capabilities exist"
 * (Product Capability Inventory) and "how well each is documented"
 * (Documentation Coverage Matrix), plus the engine that turns the two into gap
 * and drift reports. This is the reactive control layer the handbook is built
 * on; the human-facing surfaces (web, in-app, AI Q&A, PDF, translations) render
 * from content that links back to these capability ids.
 */

import { readFileSync } from "node:fs";
import { CoverageMatrix, Inventory } from "./model.ts";

export * from "./model.ts";
export * from "./gaps.ts";

/** URL of the packaged `data/` directory (machine-readable registries). */
export const dataDir = new URL("../data/", import.meta.url);

/** Load + validate the Product Capability Inventory shipped with the package. */
export function loadInventory(dir: URL = dataDir): Inventory {
  const raw = readFileSync(new URL("capability-inventory.json", dir), "utf8");
  return Inventory.parse(JSON.parse(raw));
}

/** Load + validate the Documentation Coverage Matrix shipped with the package. */
export function loadCoverageMatrix(dir: URL = dataDir): CoverageMatrix {
  const raw = readFileSync(new URL("coverage-matrix.json", dir), "utf8");
  return CoverageMatrix.parse(JSON.parse(raw));
}
