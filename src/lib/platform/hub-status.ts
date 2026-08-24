import { gatewaySnapshot, type GatewaySnapshot } from "./ai.ts";
import { tryRuntime } from "./page.ts";
import { ritaEngineSnapshot, type RitaEngineSnapshot } from "../rita/resolve-engine.ts";

export interface HubStatus {
  database: "up" | "down";
  gateway: GatewaySnapshot;
  rita: RitaEngineSnapshot;
}

export function hubStatus(): HubStatus {
  return {
    database: tryRuntime() ? "up" : "down",
    gateway: gatewaySnapshot(),
    rita: ritaEngineSnapshot(),
  };
}

export function ritaStatusLine(rita: RitaEngineSnapshot): string {
  if (!rita.available) return "RITA-motorn saknas. Analyser blir blocked.";
  const model = rita.modelReady
    ? rita.modelId
      ? `regelverk + ${rita.modelId}`
      : "regelverk + språkmodell"
    : "bara regelverket";
  return `RITA ${rita.kind} · ${model}`;
}
