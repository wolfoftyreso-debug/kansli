import { existsSync } from "node:fs";
import {
  HttpAnalysisEngine,
  SubprocessAnalysisEngine,
  type AnalysisEngine,
} from "@pixdrift/rita-engine";
import { ritaEngineConfig } from "../platform/env.ts";

export type RitaEngineKind = "http" | "subprocess";

export interface ResolvedRitaEngine {
  kind: RitaEngineKind;
  engine: AnalysisEngine;
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
        timeoutMs: 120_000,
      }),
    };
  }

  return null;
}

export function ritaEngineUnavailableReason(): string {
  if (process.env.RITA_ENGINE_BINARY?.trim()) {
    return "RITA_ENGINE_BINARY pekar inte på en körbar skattjakt-binär.";
  }
  return "RITA_ENGINE_URL och RITA_ENGINE_TOKEN saknas. Lokal binär sätts med RITA_ENGINE_BINARY.";
}
