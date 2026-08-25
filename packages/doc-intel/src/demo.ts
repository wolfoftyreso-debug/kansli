/**
 * Product Demo & Visual Storytelling — the truthful capture/asset layer.
 *
 * The public ALVA homepage is a product-demonstration engine, not a screenshot
 * gallery. Its non-negotiable rule: the ALVA UI shown in any scene must come
 * from a VERIFIED snapshot of the real application — never fabricated by an
 * image model. This module models the shot list, the asset manifest and the
 * QA gate, and computes a demo gap report so a scene is never published on top
 * of an unverified (or non-existent) UI state.
 *
 * In this repository the ALVA product/sandbox is not present, so every hero
 * scene resolves to BLOCKED_NO_APP: it cannot be captured or composited here.
 * That is reported honestly rather than filled with invented UI.
 */

import { readFileSync } from "node:fs";
import { z } from "zod";
import type { Inventory } from "./model.ts";

export const VIEWPORTS = ["DESKTOP", "TABLET", "MOBILE"] as const;
export const Viewport = z.enum(VIEWPORTS);
export type Viewport = z.infer<typeof Viewport>;

/** Capture lifecycle for a demo asset / scene. */
export const CAPTURE_STATUSES = [
  "PLANNED",
  /** Underlying ALVA app/sandbox (or the capability itself) is not present. */
  "BLOCKED_NO_APP",
  "CAPTURED",
  "QA_REJECTED",
  "VERIFIED",
] as const;
export const CaptureStatus = z.enum(CAPTURE_STATUSES);
export type CaptureStatus = z.infer<typeof CaptureStatus>;

/** Reasons the snapshot QA gate rejects a candidate (spec section 6). */
export const REJECT_REASONS = [
  "LOADING",
  "SKELETON",
  "TOAST",
  "DEBUG_UI",
  "BROKEN_IMAGE",
  "PLACEHOLDER",
  "PII",
  "POOR_WRAP",
  "CLIPPED",
  "SCROLLBAR",
  "WRONG_FIXTURE",
  "INCONSISTENT_STATE",
  "UNFINISHED_UI",
  "BROKEN_RESPONSIVE",
] as const;
export const RejectReason = z.enum(REJECT_REASONS);
export type RejectReason = z.infer<typeof RejectReason>;

/** A homepage scene = one visitor question, one message, one real ALVA state. */
export const DemoScene = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  order: z.number().int().nonnegative(),
  /** The single question this scene answers for a new visitor. */
  question: z.string().min(1),
  /** One-sentence message (restrained copy). */
  message: z.string().min(1),
  /** Link to the capability in the Product Capability Inventory. */
  capabilityId: z.string(),
  route: z.string().optional(),
  requiredState: z.string().min(1),
  viewportTargets: z.array(Viewport).nonempty(),
  fixtureRef: z.string().min(1),
  uiRegion: z.string().optional(),
  humanContext: z.string().optional(),
  device: z.string().optional(),
  focusPoint: z.string().optional(),
  scrollTransition: z.string().optional(),
  followingSceneId: z.string().optional(),
  desktopTreatment: z.string().optional(),
  mobileTreatment: z.string().optional(),
  reducedMotionTreatment: z.string().optional(),
  expectedUnderstanding: z.string().optional(),
});
export type DemoScene = z.infer<typeof DemoScene>;

export const Shotlist = z.object({
  generatedAt: z.string(),
  note: z.string().optional(),
  scenes: z.array(DemoScene),
});
export type Shotlist = z.infer<typeof Shotlist>;

/** A captured visual asset and its provenance back to the real ALVA state. */
export const DemoAsset = z.object({
  assetId: z.string(),
  sceneId: z.string(),
  appVersion: z.string(),
  commit: z.string(),
  route: z.string(),
  fixture: z.string(),
  viewport: Viewport,
  capturedAt: z.string(),
  workflowStep: z.string(),
  deviceTarget: z.string(),
  crop: z.string().optional(),
  safeArea: z.string().optional(),
  focalPoint: z.string().optional(),
  status: CaptureStatus,
  qaRejections: z.array(RejectReason).default([]),
  marketingUsage: z.array(z.string()).default([]),
});
export type DemoAsset = z.infer<typeof DemoAsset>;

export const AssetManifest = z.object({
  generatedAt: z.string(),
  note: z.string().optional(),
  assets: z.array(DemoAsset),
});
export type AssetManifest = z.infer<typeof AssetManifest>;

// ---------------------------------------------------------------------------
// Loaders
// ---------------------------------------------------------------------------

const defaultDir = new URL("../data/", import.meta.url);

export function loadShotlist(dir: URL = defaultDir): Shotlist {
  return Shotlist.parse(JSON.parse(readFileSync(new URL("demo-shotlist.json", dir), "utf8")));
}

export function loadAssetManifest(dir: URL = defaultDir): AssetManifest {
  return AssetManifest.parse(
    JSON.parse(readFileSync(new URL("demo-asset-manifest.json", dir), "utf8")),
  );
}

// ---------------------------------------------------------------------------
// Demo gap engine
// ---------------------------------------------------------------------------

export interface SceneStatus {
  scene: DemoScene;
  status: CaptureStatus;
  assets: DemoAsset[];
  /** Why the scene cannot be captured/verified yet (if applicable). */
  blockedReason?: string;
}

export interface DemoGapReport {
  totals: {
    scenes: number;
    verified: number;
    captured: number;
    planned: number;
    blocked: number;
    qaRejected: number;
  };
  scenes: SceneStatus[];
  /** Hero workflows that cannot be demonstrated (spec deliverable §28). */
  cannotDemonstrate: SceneStatus[];
}

function deriveStatus(
  scene: DemoScene,
  assets: DemoAsset[],
  inv?: Inventory,
): { status: CaptureStatus; blockedReason?: string } {
  if (assets.some((a) => a.status === "VERIFIED")) return { status: "VERIFIED" };
  if (assets.some((a) => a.status === "CAPTURED")) return { status: "CAPTURED" };
  if (assets.some((a) => a.status === "QA_REJECTED")) return { status: "QA_REJECTED" };

  const cap = inv?.capabilities.find((c) => c.id === scene.capabilityId);
  if (!cap) {
    return {
      status: "BLOCKED_NO_APP",
      blockedReason: `Okänd kapabilitet '${scene.capabilityId}' i inventeringen`,
    };
  }
  if (cap.presence === "NOT_PRESENT") {
    return {
      status: "BLOCKED_NO_APP",
      blockedReason:
        "ALVA-produkten/sandboxen finns inte i detta repo — verifierad snapshot kan inte fångas här",
    };
  }
  return { status: "PLANNED" };
}

export function computeDemoGaps(
  shotlist: Shotlist,
  manifest: AssetManifest,
  inv?: Inventory,
): DemoGapReport {
  const byScene = new Map<string, DemoAsset[]>();
  for (const a of manifest.assets) {
    byScene.set(a.sceneId, [...(byScene.get(a.sceneId) ?? []), a]);
  }

  const scenes: SceneStatus[] = shotlist.scenes
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((scene) => {
      const assets = byScene.get(scene.id) ?? [];
      const { status, blockedReason } = deriveStatus(scene, assets, inv);
      return { scene, status, assets, blockedReason };
    });

  const count = (s: CaptureStatus) => scenes.filter((x) => x.status === s).length;

  return {
    totals: {
      scenes: scenes.length,
      verified: count("VERIFIED"),
      captured: count("CAPTURED"),
      planned: count("PLANNED"),
      blocked: count("BLOCKED_NO_APP"),
      qaRejected: count("QA_REJECTED"),
    },
    scenes,
    cannotDemonstrate: scenes.filter((s) => s.status === "BLOCKED_NO_APP"),
  };
}

export function renderDemoGapReport(
  shotlist: Shotlist,
  manifest: AssetManifest,
  inv?: Inventory,
): string {
  const g = computeDemoGaps(shotlist, manifest, inv);
  const row = (s: SceneStatus) =>
    `| ${s.scene.order} | \`${s.scene.id}\` | ${s.scene.message} | ${s.status} | ${s.assets.length} | ${s.blockedReason ?? ""} |`;

  return `# ALVA Product Demo — Gap Report

> Auto-genererad av \`@pixdrift/doc-intel\`. En scen får aldrig publiceras ovanpå
> ett overifierat (eller obefintligt) UI-tillstånd. Bild-AI får aldrig hitta på
> ALVA-gränssnittet — verifierade snapshots från den riktiga appen är källan.

Genererad: ${new Date().toISOString()}
${shotlist.note ? `\n> ${shotlist.note}\n` : ""}
## Sammanfattning

| Mått | Antal |
| --- | ---: |
| Scener | ${g.totals.scenes} |
| VERIFIED | ${g.totals.verified} |
| CAPTURED | ${g.totals.captured} |
| QA_REJECTED | ${g.totals.qaRejected} |
| PLANNED | ${g.totals.planned} |
| BLOCKED_NO_APP | ${g.totals.blocked} |

## Scener

| # | id | Budskap | Status | Assets | Blockering |
| ---: | --- | --- | --- | ---: | --- |
${g.scenes.map(row).join("\n")}

## Kan inte demonstreras (underliggande funktionalitet saknas här)

${
  g.cannotDemonstrate.length === 0
    ? "_Inga — alla scener kan fångas._"
    : g.cannotDemonstrate
        .map((s) => `- \`${s.scene.id}\` — ${s.scene.question} — _${s.blockedReason}_`)
        .join("\n")
}

---

_För att gå vidare krävs åtkomst till ALVA-produktens repo + en körbar
sandbox/demo-instans med deterministiska fixtures (se \`docs/product-demo/\`).
Först då kan verkliga snapshots fångas, QA-granskas och compositas — aldrig
fabriceras._
`;
}
