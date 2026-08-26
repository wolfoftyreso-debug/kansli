import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { launcherForbiddenIds, launcherTiles } from "./launcher.ts";

const ROOT = join(import.meta.dirname, "../../../docs/design/referens");

const PROOFS = [
  "PIXDRIFT Grafer.html",
  "PIXDRIFT Hem.html",
  "PIXDRIFT Illustrations.html",
  "PIXDRIFT Karta.html",
  "PIXDRIFT Regelverk.html",
  "support.js",
  "three-d-stage.js",
  "tiguan-3d.html",
] as const;

describe("design referens lock", () => {
  it("keeps the uploaded HTML proofs on disk", () => {
    for (const name of PROOFS) {
      expect(existsSync(join(ROOT, name)), name).toBe(true);
    }
  });

  it("does not launch invented rooms from the Hem wish list", () => {
    const ids = launcherTiles().map((tile) => tile.id);
    expect(ids).toEqual([
      "kansli",
      "ekonomi",
      "tora",
      "rita",
      "britt",
      "irma",
      "tyra",
      "alva",
      "creditae",
    ]);
    const hem = readFileSync(join(ROOT, "PIXDRIFT Hem.html"), "utf8").toLowerCase();
    expect(hem).toMatch(/saga|nora|mova/);
    for (const id of launcherForbiddenIds()) {
      expect(ids).not.toContain(id);
    }
  });
});
