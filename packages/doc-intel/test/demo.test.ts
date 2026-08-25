import { describe, expect, it } from "vitest";
import {
  AssetManifest,
  Shotlist,
  computeDemoGaps,
  loadAssetManifest,
  loadInventory,
  loadShotlist,
  renderDemoGapReport,
  type AssetManifest as AssetManifestT,
} from "../src/index.ts";

describe("shipped demo registries", () => {
  it("validate against the schema", () => {
    expect(() => loadShotlist()).not.toThrow();
    expect(() => loadAssetManifest()).not.toThrow();
  });

  it("ship no fabricated assets (manifest is empty until real capture)", () => {
    expect(loadAssetManifest().assets).toEqual([]);
  });

  it("every scene links to a known capability and enforces the entity model", () => {
    const shotlist = loadShotlist();
    const inv = loadInventory();
    const ids = new Set(inv.capabilities.map((c) => c.id));
    for (const scene of shotlist.scenes) expect(ids.has(scene.capabilityId)).toBe(true);
    // The "one work order = one diagnosis" myth must be countered explicitly.
    const multi = shotlist.scenes.find((s) => s.id === "multiple-complaints");
    expect(multi?.message).toContain("Flera anmärkningar");
  });
});

describe("demo gap engine", () => {
  it("blocks every hero scene here (ALVA app/sandbox not present)", () => {
    const gaps = computeDemoGaps(loadShotlist(), loadAssetManifest(), loadInventory());
    expect(gaps.totals.scenes).toBeGreaterThan(0);
    expect(gaps.totals.blocked).toBe(gaps.totals.scenes);
    expect(gaps.totals.verified).toBe(0);
    expect(gaps.cannotDemonstrate.length).toBe(gaps.totals.scenes);
    expect(gaps.cannotDemonstrate[0].blockedReason).toMatch(/finns inte i detta repo/);
  });

  it("promotes a scene to VERIFIED once a verified asset exists", () => {
    const shotlist = loadShotlist();
    const inv = loadInventory();
    const scene = shotlist.scenes[0];
    const manifest: AssetManifestT = AssetManifest.parse({
      generatedAt: "t",
      assets: [
        {
          assetId: "a1",
          sceneId: scene.id,
          appVersion: "1.0.0",
          commit: "abc",
          route: "/x",
          fixture: scene.fixtureRef,
          viewport: "MOBILE",
          capturedAt: "t",
          workflowStep: "step",
          deviceTarget: "phone",
          status: "VERIFIED",
        },
      ],
    });
    const gaps = computeDemoGaps(shotlist, manifest, inv);
    const s = gaps.scenes.find((x) => x.scene.id === scene.id);
    expect(s?.status).toBe("VERIFIED");
    expect(gaps.totals.verified).toBe(1);
  });

  it("never reports a scene as capturable without an inventory capability", () => {
    const shotlist = Shotlist.parse({
      generatedAt: "t",
      scenes: [
        {
          id: "ghost",
          order: 1,
          question: "q",
          message: "m",
          capabilityId: "does.not.exist",
          requiredState: "x",
          viewportTargets: ["MOBILE"],
          fixtureRef: "f",
        },
      ],
    });
    const gaps = computeDemoGaps(shotlist, AssetManifest.parse({ generatedAt: "t", assets: [] }));
    expect(gaps.scenes[0].status).toBe("BLOCKED_NO_APP");
  });

  it("renders a markdown report with the truthfulness rule", () => {
    const md = renderDemoGapReport(loadShotlist(), loadAssetManifest(), loadInventory());
    expect(md).toContain("# ALVA Product Demo — Gap Report");
    expect(md).toContain("Bild-AI får aldrig hitta på");
    expect(md).toContain("Kan inte demonstreras");
  });
});
