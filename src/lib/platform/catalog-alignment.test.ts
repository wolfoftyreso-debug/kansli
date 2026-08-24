import { describe, expect, it } from "vitest";
import { WORKSPACE_SCHEMAS } from "@pixdrift/db";
import { EVENT_KINDS as LOG_KINDS, SYSTEMS } from "@pixdrift/events";
import { EVENT_KINDS, SYSTEM_IDS, SYSTEM_MODULES, productModules } from "@pixdrift/systems";
import { systems as marketing } from "../pixdrift/systems.ts";
import { FAMILY_SYSTEMS } from "./family.ts";

describe("catalog alignment", () => {
  it("keeps family, events, marketing and workspace schemas on the same ids", () => {
    expect(FAMILY_SYSTEMS.map((system) => system.id)).toEqual([...SYSTEM_IDS]);
    expect([...SYSTEMS]).toEqual([...SYSTEM_IDS]);
    expect([...LOG_KINDS]).toEqual([...EVENT_KINDS]);
    const marketed = new Set(marketing.map((system) => system.slug));
    for (const slug of marketed) {
      expect((SYSTEM_IDS as readonly string[]).includes(slug)).toBe(true);
    }
    expect(marketed.has("identity")).toBe(true);
    expect(marketed.has("kansli")).toBe(false);

    for (const family of FAMILY_SYSTEMS) {
      expect(family.status).toBe(SYSTEM_MODULES.find((module) => module.id === family.id)?.status);
    }

    expect(WORKSPACE_SCHEMAS.map((entry) => entry.schema)).toEqual([
      "platform",
      ...productModules().map((module) => module.schema),
    ]);
  });
});
