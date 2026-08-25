import { describe, expect, it } from "vitest";
import { isHardenedRuntime, resolveClientSecret, resolveSessionSecret } from "./secrets.ts";

describe("auth secrets", () => {
  it("allows the development fallback outside prod", () => {
    const env = { APP_ENV: "dev" };
    expect(isHardenedRuntime(env)).toBe(false);
    expect(resolveSessionSecret(env)).toMatch(/kansli-dev/);
    expect(resolveClientSecret(env)).toBe("kansli-dev-secret");
  });

  it("fails closed in prod without secrets", () => {
    const env = { APP_ENV: "prod" };
    expect(isHardenedRuntime(env)).toBe(true);
    expect(() => resolveSessionSecret(env)).toThrow(/APP_SESSION_SECRET/);
    expect(() => resolveClientSecret(env)).toThrow(/PIXDRIFT_CLIENT_SECRET/);
  });

  it("uses configured secrets in prod", () => {
    const env = {
      APP_ENV: "production",
      APP_SESSION_SECRET: "session-prod",
      PIXDRIFT_CLIENT_SECRET: "client-prod",
    };
    expect(resolveSessionSecret(env)).toBe("session-prod");
    expect(resolveClientSecret(env)).toBe("client-prod");
  });
});
