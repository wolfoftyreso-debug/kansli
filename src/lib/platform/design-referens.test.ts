import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { VEHICLE_CLASSES } from "@/lib/tyra/vehicle-classes.ts";
import { launcherForbiddenIds, launcherTiles } from "./launcher.ts";

const ROOT = join(import.meta.dirname, "../../../docs/design/referens");

const PROOFS = [
  "PIXDRIFT Design.html",
  "PIXDRIFT Galleri.html",
  "PIXDRIFT Grafer.html",
  "PIXDRIFT Hem.html",
  "PIXDRIFT Illustrations.html",
  "PIXDRIFT Karta.html",
  "PIXDRIFT Regelverk.html",
  "Objektkatalog.html",
  "Fordonsbibliotek.html",
  "fordon-3d.html",
  "grafer.js",
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
      "maj",
    ]);
    const hem = readFileSync(join(ROOT, "PIXDRIFT Hem.html"), "utf8").toLowerCase();
    expect(hem).toMatch(/saga|nora|mova/);
    for (const id of launcherForbiddenIds()) {
      expect(ids).not.toContain(id);
    }
  });

  it("locks the object catalog, fleet and 3D stage without making them rooms", () => {
    const catalog = readFileSync(join(ROOT, "Objektkatalog.html"), "utf8");
    expect((catalog.match(/<svg/g) ?? []).length).toBeGreaterThanOrEqual(350);
    const fleet = readFileSync(join(ROOT, "Fordonsbibliotek.html"), "utf8");
    const stage = readFileSync(join(ROOT, "fordon-3d.html"), "utf8");
    expect(VEHICLE_CLASSES).toHaveLength(13);
    for (const entry of VEHICLE_CLASSES) {
      expect(fleet).toContain(entry.label);
      expect(stage).toContain(entry.label);
    }
    expect(stage).toContain("three");
    const ids = launcherTiles().map((tile) => tile.id);
    expect(ids).not.toContain("mova");
    const gallery = readFileSync(join(ROOT, "PIXDRIFT Galleri.html"), "utf8");
    expect(gallery).toContain("Objektkatalog.html");
    expect(gallery).not.toContain(".dc.html");
    const charts = readFileSync(join(ROOT, "grafer.js"), "utf8");
    expect(charts.toLowerCase()).not.toContain("#1f4b8f");
  });
});
