import { FLAGSHIP_MODELS, gatewayFromEnv } from "@pixdrift/ai-core";

export const GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";
/** Cheap model for a connectivity ping. Flagship stays on FLAGSHIP_MODELS.gateway. */
export const GATEWAY_PING_MODEL = "anthropic/claude-haiku-4.5";

export type GatewayAuth = "api_key" | "oidc" | "none";

export interface GatewaySnapshot {
  configured: boolean;
  auth: GatewayAuth;
  baseUrl: string;
  model: string;
}

export function gatewayAuthKind(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): GatewayAuth {
  if (env.AI_GATEWAY_API_KEY?.trim()) return "api_key";
  if (env.VERCEL_OIDC_TOKEN?.trim()) return "oidc";
  return "none";
}

export function gatewaySnapshot(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): GatewaySnapshot {
  return {
    configured: gatewayFromEnv({ env }) !== null,
    auth: gatewayAuthKind(env),
    baseUrl: env.AI_GATEWAY_BASE_URL?.trim() || GATEWAY_BASE_URL,
    model: env.AI_GATEWAY_MODEL?.trim() || FLAGSHIP_MODELS.gateway,
  };
}

export async function listGatewayModels(): Promise<string[]> {
  const provider = gatewayFromEnv();
  if (!provider?.listModels) throw new Error("AI Gateway är inte konfigurerad.");
  return provider.listModels();
}

export async function pingGateway(): Promise<{
  kind: "inference";
  provider: string;
  model: string;
  text: string;
  usage: { inputTokens: number | null; outputTokens: number | null };
  latencyMs: number;
}> {
  const provider = gatewayFromEnv();
  if (!provider) throw new Error("AI Gateway är inte konfigurerad.");
  const result = await provider.complete({
    purpose: "platform.gateway.ping",
    promptVersion: "2026-08-24",
    model: GATEWAY_PING_MODEL,
    maxTokens: 16,
    messages: [
      { role: "system", content: "Svara med ett enda ord: pong. Inget annat." },
      { role: "user", content: "ping" },
    ],
  });
  return {
    kind: result.kind,
    provider: result.provider,
    model: result.model,
    text: result.text.trim(),
    usage: result.usage,
    latencyMs: result.latencyMs,
  };
}
