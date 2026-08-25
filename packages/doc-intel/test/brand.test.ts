import { describe, expect, it } from "vitest";
import { brandValues, flatten, loadBrand, resolvePlaceholders } from "../src/index.ts";

describe("canonical brand identity", () => {
  it("is Pixdrift (pixdrift.com), created by Landvex", () => {
    const b = loadBrand();
    expect(b.product.name).toBe("Pixdrift");
    expect(b.product.domain).toBe("pixdrift.com");
    expect(b.company.name).toBe("Landvex");
    expect(b.company.role).toBe("creator");
    expect(b.attribution).toContain("Landvex");
  });

  it("flattens to dotted allow-list keys", () => {
    const v = brandValues();
    expect(v["product.name"]).toBe("Pixdrift");
    expect(v["product.domain"]).toBe("pixdrift.com");
    expect(v["company.name"]).toBe("Landvex");
  });
});

describe("reactive placeholder resolution", () => {
  it("resolves known placeholders from the controlled brand map", () => {
    const { text, unresolved } = resolvePlaceholders(
      "{{product.name}} ({{product.domain}}) — skapad av {{company.name}}.",
      brandValues(),
    );
    expect(text).toBe("Pixdrift (pixdrift.com) — skapad av Landvex.");
    expect(unresolved).toEqual([]);
  });

  it("leaves unknown placeholders untouched and reports them (no guessing)", () => {
    const { text, unresolved } = resolvePlaceholders(
      "{{product.name}} {{ui.button.startDiagnosis}}",
      brandValues(),
    );
    expect(text).toBe("Pixdrift {{ui.button.startDiagnosis}}");
    expect(unresolved).toEqual(["ui.button.startDiagnosis"]);
  });

  it("merges additional controlled maps (later wins) without executing anything", () => {
    const extra = { "ui.button.startDiagnosis": "Starta diagnos" };
    const { text, unresolved } = resolvePlaceholders(
      "{{ui.button.startDiagnosis}} i {{product.name}}",
      brandValues(),
      extra,
    );
    expect(text).toBe("Starta diagnos i Pixdrift");
    expect(unresolved).toEqual([]);
  });

  it("tolerates surrounding whitespace in the token", () => {
    const { text } = resolvePlaceholders("{{  product.name  }}", brandValues());
    expect(text).toBe("Pixdrift");
  });

  it("flatten ignores non-scalar leaves safely", () => {
    expect(flatten({ a: { b: "x" }, c: [1, 2], d: null })).toEqual({ "a.b": "x" });
  });
});
