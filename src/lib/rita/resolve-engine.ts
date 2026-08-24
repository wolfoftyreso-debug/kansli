import { existsSync } from "node:fs";
import { FLAGSHIP_MODELS } from "@pixdrift/ai-core";
import {
  HttpAnalysisEngine,
  SubprocessAnalysisEngine,
  ritaModelReady,
  subprocessEngineEnv,
  type AnalysisEngine,
} from "@pixdrift/rita-engine";
import { ritaEngineConfig } from "../platform/env.ts";

export type RitaEngineKind = "http" | "subprocess";

/** Two model passes (up to 180s each) plus the rule engine. */
export const RITA_SUBPROCESS_TIMEOUT_MS = 420_000;

export interface ResolvedRitaEngine {
  kind: RitaEngineKind;
  engine: AnalysisEngine;
}

export interface RitaEngineSnapshot {
  available: boolean;
  kind: RitaEngineKind | "none";
  modelReady: boolean;
  modelId: string | null;
}

/**
 * Production may use HTTP (Vercel → engine host) or a local real binary.
 * FakeAnalysisEngine is never returned here.
 */
export function resolveRitaEngine(): ResolvedRitaEngine | null {
  const http = ritaEngineConfig();
  if (http) return { kind: "http", engine: new HttpAnalysisEngine(http) };

  const binary = process.env.RITA_ENGINE_BINARY?.trim();
  if (binary && existsSync(binary)) {
    return {
      kind: "subprocess",
      engine: new SubprocessAnalysisEngine({
        binaryPath: binary,
        timeoutMs: RITA_SUBPROCESS_TIMEOUT_MS,
        env: subprocessEngineEnv(process.env, { modelId: FLAGSHIP_MODELS.anthropic }),
      }),
    };
  }

  return null;
}

export function ritaEngineSnapshot(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): RitaEngineSnapshot {
  const http = Boolean(env.RITA_ENGINE_URL?.trim() && env.RITA_ENGINE_TOKEN?.trim());
  const binary = env.RITA_ENGINE_BINARY?.trim();
  const subprocess = Boolean(binary && existsSync(binary));
  const kind: RitaEngineKind | "none" = http ? "http" : subprocess ? "subprocess" : "none";
  const child = subprocessEngineEnv(env, { modelId: FLAGSHIP_MODELS.anthropic });
  return {
    available: kind !== "none",
    kind,
    modelReady: kind === "http" ? true : ritaModelReady(env),
    modelId: kind === "none" ? null : child.SKATTJAKT_MODEL_ID || null,
  };
}

export function ritaEngineUnavailableReason(): string {
  if (process.env.RITA_ENGINE_BINARY?.trim()) {
    return "RITA_ENGINE_BINARY pekar inte på en körbar skattjakt-binär.";
  }
  return "RITA_ENGINE_URL och RITA_ENGINE_TOKEN saknas. Lokal binär sätts med RITA_ENGINE_BINARY.";
}
