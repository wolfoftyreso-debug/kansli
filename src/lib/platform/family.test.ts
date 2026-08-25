import { describe, expect, it } from "vitest";
import { EVENT_KINDS } from "@pixdrift/events";
import { SYSTEM_IDS } from "@pixdrift/systems";
import { FAMILY_LINKS, FAMILY_STACK, FAMILY_SYSTEMS } from "./family.ts";

describe("family map", () => {
  it("covers every product once and keeps RITA distinct from TORA", () => {
    const ids = FAMILY_SYSTEMS.map((s) => s.id);
    expect(ids).toEqual([...SYSTEM_IDS]);
    const rita = FAMILY_SYSTEMS.find((s) => s.id === "rita")!;
    const tora = FAMILY_SYSTEMS.find((s) => s.id === "tora")!;
    expect(rita.does).not.toEqual(tora.does);
    expect(rita.question).not.toEqual(tora.question);
    for (const system of FAMILY_SYSTEMS) {
      expect(system.mission.length).toBeGreaterThan(8);
    }
    expect(rita.mission.toLowerCase()).toMatch(/skatte/);
    for (const system of FAMILY_SYSTEMS) {
      expect(system.mission).not.toMatch(/hus|fabrik|Receptionen|CRM|legal basis/i);
      expect(system.question).not.toMatch(/hus|fabrik|Receptionen/i);
    }
    expect(tora.mission.toLowerCase()).toMatch(/upphandling/);
    expect(FAMILY_SYSTEMS.find((s) => s.id === "britt")!.mission.toLowerCase()).toMatch(
      /följas upp/,
    );
  });

  it("describes the stack this repo actually runs", () => {
    expect(FAMILY_STACK.map((row) => row.layer)).toEqual([
      "Språk",
      "Webb",
      "Identitet",
      "Data",
      "Analys",
      "AI",
      "Drift och test",
    ]);
    const blob = FAMILY_STACK.map((row) => row.runs).join(" ");
    expect(blob).toMatch(/TypeScript/);
    expect(blob).toMatch(/PostgreSQL 16/);
    expect(blob).toMatch(/Ingen AWS SDK/);
  });

  it("only names event kinds that exist", () => {
    const kinds = new Set<string>(EVENT_KINDS);
    for (const link of FAMILY_LINKS) {
      const named = link.via.split("|").map((part) => part.trim());
      for (const name of named) {
        if (name.includes(".")) expect(kinds.has(name)).toBe(true);
      }
    }
  });
});
