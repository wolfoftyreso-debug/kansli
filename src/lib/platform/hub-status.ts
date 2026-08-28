import { DEFAULT_LOCALE, t, type Locale } from "../i18n/index.ts";
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

/** Customer rooms. Model id stays on `/platform/drift`. */
export function ritaStatusLine(rita: RitaEngineSnapshot, locale: Locale = DEFAULT_LOCALE): string {
  if (!rita.available) return t(locale, "platform.rita.missing");
  return rita.modelReady
    ? t(locale, "platform.rita.rulesModel")
    : t(locale, "platform.rita.rulesOnly");
}
