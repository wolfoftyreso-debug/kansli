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

  it("points each product at its UI route, not its JSON API", () => {
    expect(getModule("identity")?.basePath).toBe("/idp");
    expect(getModule("kansli")?.basePath).toBe("/kansli");
    expect(getModule("tora")?.basePath).toBe("/tora");
    expect(getModule("rita")?.basePath).toBe("/rita");
    expect(getModule("britt")?.basePath).toBe("/britt");
    expect(getModule("irma")?.basePath).toBe("/irma");
    expect(getModule("alva")?.basePath).toBe("/alva");
    for (const module of SYSTEM_MODULES) {
      if (module.id === "identity") continue;
      expect(module.basePath.startsWith("/api")).toBe(false);
    }
  });
});
