/**
 * Unified model types.
 *
 * Constitution art. 9: a model result is ALWAYS an inference, never a fact. The
 * `kind: "inference"` field is a structural reminder — there is no code path in
 * this package that returns anything else. Provenance (provider, model, prompt
 * version, usage, latency) rides along so a downstream product can audit and,
 * per art. 10, decide an automation level before acting on it.
 */

export type Role = "system" | "user" | "assistant";

export interface Message {
  role: Role;
  content: string;
}

export interface ModelRequest {
  /**
   * Model id, optionally provider-prefixed for the router, e.g.
   * "anthropic:claude-fable-5". Omit (or pass "auto"/"flagship") to let the
   * router use each provider's heaviest model as it fails over.
   */
  model?: string;
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
  /** Free-text purpose for tracing/audit (e.g. "rita.finding.summary"). */
  purpose?: string;
  /** Prompt version must travel with the output (RITA/ALVA provenance rule). */
  promptVersion?: string;
}

export interface ModelUsage {
  inputTokens: number | null;
  outputTokens: number | null;
}

export interface ModelResult {
  /** Structural reminder: model output is inference, never authoritative fact. */
  readonly kind: "inference";
  text: string;
  provider: string;
  model: string;
  promptVersion: string | null;
  usage: ModelUsage;
  finishReason: string | null;
  latencyMs: number;
}

export interface Provider {
  readonly name: string;
  /**
   * The provider's heaviest / most capable model. The router uses this when a
   * request does not name a model, so cross-provider failover always lands on
   * each provider's flagship rather than a foreign model id.
   */
  readonly flagshipModel?: string;
  complete(request: ModelRequest): Promise<ModelResult>;
}

/** Automation permission levels (constitution art. 10). Default stays low. */
export const AUTOMATION_LEVELS = ["L0", "L1", "L2", "L3", "L4"] as const;
export type AutomationLevel = (typeof AUTOMATION_LEVELS)[number];

/** Optional reasoning contract a product may attach to a model answer. */
export interface ReasoningContract {
  confidence: "HIGH" | "MODERATE" | "LOW";
  missing: string[];
}

export class ProviderError extends Error {
  constructor(
    readonly provider: string,
    readonly status: number,
    readonly detail: string,
  ) {
    super(`${provider} ${status}: ${detail.slice(0, 200)}`);
    this.name = "ProviderError";
  }
}
