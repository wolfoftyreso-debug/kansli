import { describe, expect, it } from "vitest";
import { FLAGSHIP_MODELS } from "@pixdrift/ai-core";
import { GATEWAY_BASE_URL, GATEWAY_PING_MODEL, gatewayAuthKind, gatewaySnapshot } from "./ai.ts";

describe("gatewaySnapshot", () => {
  it("pings a free-tier OpenAI nano slug", () => {
    expect(GATEWAY_PING_MODEL).toBe("openai/gpt-4.1-nano");
  });

  it("is missing without a credential", () => {
    expect(gatewaySnapshot({})).toEqual({
      configured: false,
      auth: "none",
      baseUrl: GATEWAY_BASE_URL,
      model: FLAGSHIP_MODELS.gateway,
    });
    expect(gatewayAuthKind({})).toBe("none");
  });

  it("prefers AI_GATEWAY_API_KEY over OIDC", () => {
    const snap = gatewaySnapshot({
      AI_GATEWAY_API_KEY: "k",
      VERCEL_OIDC_TOKEN: "oidc",
      AI_GATEWAY_MODEL: "openai/gpt-5.4",
    });
    expect(snap.configured).toBe(true);
    expect(snap.auth).toBe("api_key");
    expect(snap.model).toBe("openai/gpt-5.4");
  });

  it("accepts OIDC when no API key is set", () => {
    expect(gatewaySnapshot({ VERCEL_OIDC_TOKEN: "oidc" })).toMatchObject({
      configured: true,
      auth: "oidc",
    });
  });
});
