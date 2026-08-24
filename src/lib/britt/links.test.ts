import { describe, expect, it } from "vitest";
import { observationHref, sourceLabel } from "./links.ts";

describe("observationHref", () => {
  it("maps known subject refs to product pages", () => {
    expect(observationHref("tyra:case:abc")).toBe("/tyra/cases/abc");
    expect(observationHref("rita:analysis:1")).toBe("/rita/1");
    expect(observationHref("irma:agreement:2")).toBe("/irma/2");
    expect(observationHref("alva:case:3")).toBe("/alva/3");
    expect(observationHref("tora:snapshot:4")).toBe("/tora/4");
    expect(observationHref("kansli:task:5")).toBe("/kansli");
    expect(observationHref("tyra:outbox:6")).toBe("/tyra/integrations");
  });

  it("returns null for unknown or empty refs", () => {
    expect(observationHref(null)).toBeNull();
    expect(observationHref("unknown:x")).toBeNull();
  });

  it("labels sources by mission", () => {
    expect(sourceLabel("rita")).toMatch(/skattefynd/i);
    expect(sourceLabel("tyra")).toMatch(/däckhotell/i);
  });
});
