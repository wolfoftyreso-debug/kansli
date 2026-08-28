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
  if (!rita.available) return "RITA:s analys saknas. Nya analyser stoppas.";
  const model = rita.modelReady
    ? rita.modelId
      ? `regler + ${rita.modelId}`
      : "regler + modell"
    : "bara fasta regler";
  return `RITA · ${model}`;
}
