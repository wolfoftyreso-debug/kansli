/**
 * Documentation Intelligence — content & coverage model.
 *
 * Two machine-readable registries drive everything:
 *
 *  1. Product Capability Inventory — what ALVA / the platform actually is,
 *     derived from repository evidence (routes, components, tests, schemas).
 *  2. Documentation Coverage Matrix — the documentation state of each
 *     capability, so the system can always answer "what is undocumented?".
 *
 * Honesty is enforced structurally: a capability with no coverage record is
 * UNDOCUMENTED, and a capability whose source is not in this repository is
 * recorded as such rather than silently assumed to exist and be documented.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

/** Documentation status for a capability (per the handbook spec). */
export const COVERAGE_STATUSES = [
  "UNDOCUMENTED",
  "DRAFT",
  "PARTIALLY_DOCUMENTED",
  "DOCUMENTED",
  "VERIFICATION_REQUIRED",
  "OUTDATED",
  "ARCHIVED",
] as const;
export const CoverageStatus = z.enum(COVERAGE_STATUSES);
export type CoverageStatus = z.infer<typeof CoverageStatus>;

/**
 * Where a capability's source actually lives, relative to THIS repository.
 * The distinction is what turns the inventory into an honest control point.
 */
export const PRESENCES = [
  /** Source exists in this repository and is verifiable here. */
  "IN_REPO",
  /** Known to live in a separate repository; recorded, not verifiable here. */
  "EXTERNAL_REPO",
  /** Asserted/requested but not found and not verifiable from this repository. */
  "NOT_PRESENT",
] as const;
export const Presence = z.enum(PRESENCES);
export type Presence = z.infer<typeof Presence>;

/** Publication visibility — enforced server-side in the eventual surfaces. */
export const VISIBILITIES = ["PUBLIC", "AUTHENTICATED", "ROLE_RESTRICTED"] as const;
export const Visibility = z.enum(VISIBILITIES);
export type Visibility = z.infer<typeof Visibility>;

/** How confident the inventory is that this capability exists as described. */
export const CONFIDENCES = ["HIGH", "MEDIUM", "LOW", "NONE"] as const;
export const Confidence = z.enum(CONFIDENCES);
export type Confidence = z.infer<typeof Confidence>;

export const TRANSLATION_STATUSES = [
  "NOT_TRANSLATED",
  "MACHINE_TRANSLATED",
  "REVIEW_REQUIRED",
  "REVIEWED",
  "OUTDATED_SOURCE",
] as const;
export const TranslationStatus = z.enum(TRANSLATION_STATUSES);
export type TranslationStatus = z.infer<typeof TranslationStatus>;

export const SCREENSHOT_STATUSES = [
  "NONE",
  "REQUESTED",
  "CAPTURED",
  "VERIFIED",
  "REGENERATE",
] as const;
export const ScreenshotStatus = z.enum(SCREENSHOT_STATUSES);
export type ScreenshotStatus = z.infer<typeof ScreenshotStatus>;

// ---------------------------------------------------------------------------
// Capability inventory
// ---------------------------------------------------------------------------

export const CapabilityRecord = z.object({
  /** Stable id, e.g. "alva.product.diagnosis-sessions" or "platform.idp.token". */
  id: z.string().regex(/^[a-z][a-z0-9.-]*$/, "id must be lowercase dotted-kebab"),
  name: z.string().min(1),
  /** Grouping used for the documentation tree, e.g. "Diagnosis Sessions". */
  area: z.string().min(1),
  presence: Presence,
  /** For EXTERNAL_REPO/NOT_PRESENT, where it is expected to live. */
  sourceRepo: z.string().optional(),
  /** Route references (paths/urls) that evidence this capability. */
  routeRefs: z.array(z.string()).default([]),
  /** Source/component references (files) that evidence this capability. */
  componentRefs: z.array(z.string()).default([]),
  roles: z.array(z.string()).default([]),
  visibility: Visibility.default("AUTHENTICATED"),
  confidence: Confidence,
  knownGaps: z.array(z.string()).default([]),
  lastVerifiedCommit: z.string().optional(),
  notes: z.string().optional(),
});
export type CapabilityRecord = z.infer<typeof CapabilityRecord>;

export const Inventory = z.object({
  generatedAt: z.string(),
  repo: z.string(),
  commit: z.string().optional(),
  note: z.string().optional(),
  capabilities: z.array(CapabilityRecord),
});
export type Inventory = z.infer<typeof Inventory>;

// ---------------------------------------------------------------------------
// Documentation coverage matrix
// ---------------------------------------------------------------------------

export const CoverageRecord = z.object({
  capabilityId: z.string(),
  status: CoverageStatus,
  /** Documentation article ids that cover this capability. */
  articleIds: z.array(z.string()).default([]),
  screenshotStatus: ScreenshotStatus.default("NONE"),
  translationStatus: TranslationStatus.default("NOT_TRANSLATED"),
  /** Whether an in-product contextual-help entry exists for this capability. */
  contextualHelp: z.boolean().default(false),
  lastVerifiedAppVersion: z.string().optional(),
  lastVerifiedCommit: z.string().optional(),
  owner: z.string().optional(),
  notes: z.string().optional(),
});
export type CoverageRecord = z.infer<typeof CoverageRecord>;

export const CoverageMatrix = z.object({
  generatedAt: z.string(),
  records: z.array(CoverageRecord),
});
export type CoverageMatrix = z.infer<typeof CoverageMatrix>;

/** A capability without a coverage record is treated as UNDOCUMENTED. */
export const DEFAULT_STATUS: CoverageStatus = "UNDOCUMENTED";
