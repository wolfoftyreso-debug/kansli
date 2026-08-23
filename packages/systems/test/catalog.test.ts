import { describe, expect, it } from "vitest";
import { SYSTEM_MODULES, getModule } from "../src/index.ts";

describe("system catalog", () => {
  it("registers every product once, with explicit data ownership", () => {
    const ids = SYSTEM_MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(["identity", "kansli", "tora", "rita", "britt", "irma", "alva"]);
    for (const module of SYSTEM_MODULES) {
      if (module.id === "identity") expect(module.schema).toBeNull();
      else expect(module.schema).toBe(module.id === "kansli" ? "kansli" : module.id);
    }
  });

  it("keeps RITA and TORA as separate modules", () => {
    expect(getModule("rita")?.purpose).not.toEqual(getModule("tora")?.purpose);
    expect(getModule("rita")?.schema).toBe("rita");
    expect(getModule("tora")?.schema).toBe("tora");
  });
});
