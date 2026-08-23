/**
 * The engine's JSON contract, validated on the way in.
 *
 * The engine is a separate process in a different language. Everything it
 * sends is untrusted here — not because it is hostile, but because a version
 * mismatch between the deployed binary and this code is a real and quiet
 * failure, and the place to catch it is at the boundary rather than three
 * layers up as `undefined is not an object`.
 *
 * The schemas are deliberately lenient about *extra* fields and strict about
 * the ones we read. The engine adds fields without bumping `contract_version`;
 * a schema that rejected unknown keys would break on every additive change,
 * which teaches everyone to widen the schema rather than read it.
 */

import { z } from "zod";

/** Integer öre, as the engine writes them. */
const Ore = z.number().int();

const MoneyRange = z.object({ low: Ore, high: Ore });

const Citation = z.object({
  reference: z.string(),
  url: z.string().optional(),
  claim: z.string(),
  state: z.enum(["unretrieved", "unreachable", "mismatch", "verified"]),
  retrieved_at: z.string().optional(),
});

const CalculationInput = z.object({
  name: z.string(),
  value: Ore,
  fact_id: z.string().optional(),
});

/**
 * One link in the evidence chain.
 *
 * Discriminated on `type`, matching the engine's `#[serde(tag = "type")]`. The
 * union is what the publication gate reads: `document_value` and `rule`
 * together are the dual traceability the brief requires, `calculation` is what
 * makes a figure reproducible, and `model_judgement` is the one that may never
 * stand alone.
 */
export const EvidenceItem = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("document_value"),
    document_id: z.string(),
    document_version_id: z.string(),
    fact_id: z.string(),
    kind: z.string(),
    value: Ore,
    page: z.number().int().nullable().optional(),
    excerpt: z.string().nullable().optional(),
  }),
  z.object({
    type: z.literal("rule"),
    rule_id: z.string(),
    rule_version: z.string(),
    title: z.string(),
    source: z.string(),
    citations: z.array(Citation).default([]),
  }),
  z.object({
    type: z.literal("calculation"),
    calculation_id: z.string(),
    method: z.string(),
    inputs: z.array(CalculationInput),
    result_low: Ore,
    result_high: Ore,
  }),
  z.object({
    type: z.literal("model_judgement"),
    model_run_id: z.string(),
    task: z.string(),
    rationale_summary: z.string(),
  }),
  z.object({
    type: z.literal("assumption"),
    statement: z.string(),
  }),
]);

export type EvidenceItem = z.infer<typeof EvidenceItem>;

export const EngineOpportunity = z.object({
  id: z.string(),
  analysis_id: z.string(),
  category: z.string(),
  status: z.enum(["identified", "investigate", "verify", "warning", "rejected"]),
  title: z.string(),
  rationale: z.string(),
  impact: MoneyRange,
  evidence: z.array(EvidenceItem),
  missing_information: z.array(z.string()).default([]),
  recommended_action: z.string(),
  confidence: z.object({ score: z.number().int().min(0).max(100) }).loose(),
  risk: z.enum(["low", "medium", "high"]),
  effort: z.enum(["low", "medium", "high"]),
  urgency: z.string(),
  priority: z.object({ score: z.number(), band: z.string() }),
  rule_ids: z.array(z.string()).default([]),
  rejection_reason: z.string().optional(),
  created_at: z.string(),
});

export type EngineOpportunity = z.infer<typeof EngineOpportunity>;

const Warning = z.object({
  code: z.string(),
  message: z.string(),
  detail: z.string().optional(),
});

const MissingInformation = z.object({
  code: z.string(),
  description: z.string(),
  unlocks: z.string(),
});

const CoveredArea = z.object({
  category: z.string(),
  rules_evaluated: z.number().int(),
  findings: z.number().int(),
});

const ClearedCheck = z.object({
  rule_id: z.string(),
  title: z.string(),
  category: z.string(),
  reason: z.string(),
});

export const AnalysisResult = z
  .object({
    analysis_id: z.string(),
    company_id: z.string(),
    summary: z
      .object({
        identified_opportunities: z.number().int(),
        high_priority_count: z.number().int(),
        needs_investigation_count: z.number().int(),
        missing_information_count: z.number().int(),
        warnings_count: z.number().int(),
        estimated_total: MoneyRange,
        found_nothing: z.boolean(),
      })
      .loose(),
    opportunities: z.array(EngineOpportunity),
    warnings: z.array(Warning).default([]),
    missing_information: z.array(MissingInformation).default([]),
    covered_areas: z.array(CoveredArea).default([]),
    cleared: z.array(ClearedCheck).default([]),
    recommended_actions: z.array(z.string()).default([]),
    limitations: z.array(z.object({ statement: z.string() })).default([]),
    rejected: z.array(EngineOpportunity).default([]),
    disclaimer: z.string(),
    generated_at: z.string(),
  })
  .loose();

export type AnalysisResult = z.infer<typeof AnalysisResult>;

export const ModelRun = z
  .object({
    id: z.string(),
    provider: z.string(),
    model: z.string(),
    task: z.string(),
    prompt_version: z.string(),
    status: z.enum(["succeeded", "refused", "failed"]),
    usage: z.object({ input_tokens: z.number().int(), output_tokens: z.number().int() }).loose(),
    latency_ms: z.number().int(),
    started_at: z.string(),
    finished_at: z.string(),
    error: z.string().optional(),
  })
  .loose();

export type ModelRun = z.infer<typeof ModelRun>;

export const DocumentRecord = z.object({
  document_id: z.string(),
  document_version_id: z.string(),
  filename: z.string().optional(),
  content_type: z.string(),
  byte_length: z.number().int(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  page_count: z.number().int(),
  unreadable_pages: z.array(z.number().int()).default([]),
});

export type DocumentRecord = z.infer<typeof DocumentRecord>;

/**
 * The envelope, top level.
 *
 * `report` is kept as an opaque object rather than typed field by field: the
 * product renders its own cards from `result`, and typing a presentation we do
 * not read would be a second definition of it to keep in step. It is stored so
 * the accountant-audience rendering exists for the adviser package.
 */
export const AnalysisEnvelope = z
  .object({
    contract_version: z.string(),
    engine_version: z.string(),
    rule_set_version: z.string(),
    prompt_version: z.string(),
    model_configured: z.boolean(),
    analysis_id: z.string(),
    company_id: z.string(),
    audience: z.string(),
    documents: z.array(DocumentRecord),
    result: AnalysisResult,
    report: z.unknown(),
    model_runs: z.array(ModelRun).default([]),
  })
  .loose();

export type AnalysisEnvelope = z.infer<typeof AnalysisEnvelope>;

/**
 * The contract version this code was written against.
 *
 * A higher major from the engine is refused rather than parsed hopefully: the
 * engine bumps it only when a field is removed or changes meaning, and both
 * are the kind of change that produces plausible nonsense rather than an
 * error.
 */
export const SUPPORTED_CONTRACT_VERSION = "1";

export class ContractVersionMismatch extends Error {
  constructor(readonly found: string) {
    super(
      `motorn talar kontraktversion ${found}, den här koden läser ${SUPPORTED_CONTRACT_VERSION}. ` +
        `Bygg om motorn eller uppgradera adaptern innan analysen körs.`,
    );
    this.name = "ContractVersionMismatch";
  }
}

// ---------------------------------------------------------------------------
// Request
// ---------------------------------------------------------------------------

export interface EngineDocumentRequest {
  readonly document_id: string;
  readonly document_version_id: string;
  readonly path: string;
  readonly content_type: string;
  readonly filename?: string;
}

export interface EngineCompanyRequest {
  readonly id: string;
  readonly name: string;
  readonly org_number: string;
  readonly fiscal_year_start: string;
  readonly fiscal_year_end: string;
  readonly industry?: string;
  readonly sni_code?: string;
  readonly employee_count?: number;
  readonly owner_count?: number;
  readonly in_group?: boolean;
  readonly operations_outside_sweden?: boolean;
  readonly does_development_work?: boolean;
  readonly owns_premises?: boolean;
  readonly has_vehicles?: boolean;
  readonly owners_active_in_company?: boolean;
}

export interface EngineRequest {
  readonly analysis_id: string;
  readonly company: EngineCompanyRequest;
  readonly documents: readonly EngineDocumentRequest[];
  readonly accounts_state: "preliminary" | "final" | "unknown";
  readonly audience: "private" | "company" | "accountant";
}

/**
 * The profile fields the engine accepts.
 *
 * An allowlist, because the profile is assembled from user answers and the
 * engine refuses unknown fields. A user who answers a question we have since
 * renamed should get their answer ignored, not the whole analysis rejected.
 */
export const ENGINE_PROFILE_FIELDS = [
  "industry",
  "sni_code",
  "employee_count",
  "owner_count",
  "in_group",
  "operations_outside_sweden",
  "does_development_work",
  "owns_premises",
  "has_vehicles",
  "owners_active_in_company",
] as const;

export type EngineProfileField = (typeof ENGINE_PROFILE_FIELDS)[number];

export function isEngineProfileField(value: string): value is EngineProfileField {
  return (ENGINE_PROFILE_FIELDS as readonly string[]).includes(value);
}
