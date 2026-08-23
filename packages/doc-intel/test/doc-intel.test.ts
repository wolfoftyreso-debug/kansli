import { describe, expect, it } from "vitest";
import {
  computeGaps,
  loadCoverageMatrix,
  loadInventory,
  renderGapReport,
  whatIsUndocumented,
  Inventory,
  CoverageMatrix,
  type CoverageMatrix as CoverageMatrixT,
  type Inventory as InventoryT,
} from "../src/index.ts";

describe("shipped registries", () => {
  it("validate against the schema", () => {
    expect(() => loadInventory()).not.toThrow();
    expect(() => loadCoverageMatrix()).not.toThrow();
  });

  it("record the ALVA product as NOT_PRESENT (not silently assumed to exist)", () => {
    const inv = loadInventory();
    const alvaProduct = inv.capabilities.filter((c) => c.id.startsWith("alva.product."));
    expect(alvaProduct.length).toBeGreaterThan(0);
    expect(alvaProduct.every((c) => c.presence === "NOT_PRESENT")).toBe(true);
    // The only real ALVA code in this repo is the token verifier (IN_REPO).
    const adapter = inv.capabilities.find((c) => c.id === "integration.alva.token-verifier");
    expect(adapter?.presence).toBe("IN_REPO");
  });

  it("has no orphan coverage records", () => {
    const gaps = computeGaps(loadInventory(), loadCoverageMatrix());
    expect(gaps.orphanCoverage).toEqual([]);
  });
});

describe("gap engine", () => {
  const inv: InventoryT = Inventory.parse({
    generatedAt: "t",
    repo: "test",
    capabilities: [
      { id: "a.documented", name: "A", area: "X", presence: "IN_REPO", confidence: "HIGH" },
      { id: "b.norecord", name: "B", area: "X", presence: "IN_REPO", confidence: "HIGH" },
      {
        id: "c.notpresent",
        name: "C",
        area: "Y",
        presence: "NOT_PRESENT",
        confidence: "NONE",
      },
    ],
  });
  const matrix: CoverageMatrixT = CoverageMatrix.parse({
    generatedAt: "t",
    records: [
      {
        capabilityId: "a.documented",
        status: "DOCUMENTED",
        contextualHelp: true,
        translationStatus: "REVIEWED",
      },
    ],
  });

  it("treats a capability with no coverage record as UNDOCUMENTED", () => {
    const undoc = whatIsUndocumented(inv, matrix).map((c) => c.capability.id);
    expect(undoc).toContain("b.norecord");
    expect(undoc).toContain("c.notpresent");
    expect(undoc).not.toContain("a.documented");
  });

  it("separates NOT_PRESENT capabilities (unverifiable here)", () => {
    const gaps = computeGaps(inv, matrix);
    expect(gaps.notPresent.map((c) => c.capability.id)).toEqual(["c.notpresent"]);
    expect(gaps.totals.notPresent).toBe(1);
    expect(gaps.totals.inRepo).toBe(2);
  });

  it("flags in-repo capabilities missing contextual help", () => {
    const gaps = computeGaps(inv, matrix);
    const ids = gaps.missingContextualHelp.map((c) => c.capability.id);
    expect(ids).toContain("b.norecord");
    expect(ids).not.toContain("a.documented");
  });

  it("detects orphan coverage referencing an unknown capability", () => {
    const bad = CoverageMatrix.parse({
      generatedAt: "t",
      records: [{ capabilityId: "ghost", status: "DOCUMENTED" }],
    });
    const gaps = computeGaps(inv, bad);
    expect(gaps.orphanCoverage.map((r) => r.capabilityId)).toEqual(["ghost"]);
  });

  it("never reports 100% documented while capabilities are undocumented", () => {
    const gaps = computeGaps(loadInventory(), loadCoverageMatrix());
    const fullyDocumented = gaps.totals.byStatus.DOCUMENTED === gaps.totals.capabilities;
    expect(fullyDocumented).toBe(false);
    expect(gaps.undocumented.length).toBeGreaterThan(0);
  });
});

describe("gap report rendering", () => {
  it("produces markdown with the headline sections", () => {
    const md = renderGapReport(loadInventory(), loadCoverageMatrix());
    expect(md).toContain("# ALVA Documentation Gap Report");
    expect(md).toContain("Vad i ALVA är odokumenterat just nu?");
    expect(md).toContain("produktkällan saknas i detta repo");
  });
});
