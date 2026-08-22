/**
 * @pixdrift/ai-core — the shared model API for the Pixdrift family.
 *
 * One interface over Claude/ChatGPT/Gemini (and an optional AI gateway), with
 * failover and provenance. Output is always an inference (constitution art. 9);
 * products decide an automation level (art. 10) before acting on it.
 *
 *   import { createDefaultRouter } from "@pixdrift/ai-core";
 *   // Every configured provider on its heaviest model, Claude first, falling
 *   // down to the others. Omit `model` (or pass "auto") to run each flagship.
 *   const ai = createDefaultRouter();
 *   const answer = await ai.complete({
 *     purpose: "rita.finding.summary",
 *     promptVersion: "2026-08-22",
 *     messages: [
 *       { role: "system", content: "Sammanfatta ett fynd. Aldrig ett belopp från modellen." },
 *       { role: "user", content: evidencePacket },
 *     ],
 *   });
 *   // answer.kind === "inference" — never treat as fact.
 */

export * from "./types.ts";
export {
  anthropicProvider,
  openAICompatibleProvider,
  geminiProvider,
  moonshotProvider,
  fakeProvider,
  FLAGSHIP_MODELS,
  type AnthropicOptions,
  type OpenAICompatibleOptions,
  type GeminiOptions,
  type MoonshotOptions,
} from "./providers.ts";
export {
  createModelRouter,
  DEFAULT_FAILOVER_ORDER,
  type ModelRouter,
  type RouterOptions,
  type CompleteOptions,
} from "./router.ts";
export { providersFromEnv, createDefaultRouter, type EnvProviderOptions } from "./env.ts";
