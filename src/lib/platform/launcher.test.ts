import { describe, expect, it } from "vitest";
import { SYSTEM_IDS } from "@pixdrift/systems";
import { launcherForbiddenIds, launcherTiles } from "./launcher.ts";

describe("launcher", () => {
  it("only launches rooms that exist in the catalog", () => {
    const tiles = launcherTiles();
    const ids = tiles.map((tile) => tile.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(SYSTEM_IDS.filter((id) => id !== "identity"));
    for (const tile of tiles) {
      expect(tile.href.startsWith("/")).toBe(true);
      expect(tile.category.length).toBeGreaterThan(2);
    }
  });

  it("does not invent NORA, MOVA, SAGA or the other registry names", () => {
    const blob = JSON.stringify(launcherTiles()).toLowerCase();
    for (const id of launcherForbiddenIds()) {
      expect(blob).not.toContain(id);
    }
  });
});
