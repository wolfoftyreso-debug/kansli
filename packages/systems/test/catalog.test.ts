import { describe, expect, it } from "vitest";
import { SYSTEM_MODULES, getModule } from "../src/index.ts";

describe("system catalog", () => {
  it("registers every product once, with explicit data ownership", () => {
    const ids = SYSTEM_MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(["identity", "kansli", "tora", "rita", "britt", "irma", "tyra", "alva"]);
    for (const entry of SYSTEM_MODULES) {
      if (entry.id === "identity") expect(entry.schema).toBeNull();
      else expect(entry.schema).toBe(entry.id === "kansli" ? "kansli" : entry.id);
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
    expect(getModule("tyra")?.basePath).toBe("/tyra");
    expect(getModule("alva")?.basePath).toBe("/alva");
    for (const entry of SYSTEM_MODULES) {
      if (entry.id === "identity") continue;
      expect(entry.basePath.startsWith("/api")).toBe(false);
    }
  });
});
