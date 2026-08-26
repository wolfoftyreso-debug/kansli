import { describe, expect, it } from "vitest";
import {
  assertHardenedBoot,
  isHardenedRuntime,
  resolveClientSecret,
  resolveSessionSecret,
} from "./secrets.ts";

const STRONG_SESSION = "session-prod-secret-min-32-chars-0001";
const STRONG_CLIENT = "client-prod-secret-min-32-chars-0001";

describe("auth secrets", () => {
  it("allows the development fallback outside prod", () => {
    const env = { APP_ENV: "dev" };
    expect(isHardenedRuntime(env)).toBe(false);
    expect(resolveSessionSecret(env)).toMatch(/kansli-dev/);
    expect(resolveClientSecret(env)).toBe("kansli-dev-secret");
  });

  it("does not treat NODE_ENV=production as production", () => {
    expect(isHardenedRuntime({ NODE_ENV: "production" })).toBe(false);
    expect(
      isHardenedRuntime({
        NODE_ENV: "production",
        VERCEL_ENV: "preview",
        APP_ENV: "prod",
      }),
    ).toBe(false);
    expect(isHardenedRuntime({ VERCEL_ENV: "production" })).toBe(true);
    expect(isHardenedRuntime({ APP_ENV: "prod" })).toBe(true);
  });

  it("fails closed in prod without secrets", () => {
    const env = { APP_ENV: "prod" };
    expect(isHardenedRuntime(env)).toBe(true);
    expect(() => resolveSessionSecret(env)).toThrow(/APP_SESSION_SECRET/);
    expect(() => resolveClientSecret(env)).toThrow(/PIXDRIFT_CLIENT_SECRET/);
  });

  it("rejects short or development secrets in prod", () => {
    expect(() =>
      resolveSessionSecret({ APP_ENV: "prod", APP_SESSION_SECRET: "session-prod" }),
    ).toThrow(/at least 32/);
    expect(() =>
      resolveSessionSecret({
        VERCEL_ENV: "production",
        APP_SESSION_SECRET: "kansli-dev-app-session-secret-byt-ut-i-drift-0001",
      }),
    ).toThrow(/development fallback/);
    expect(() =>
      resolveClientSecret({ APP_ENV: "prod", PIXDRIFT_CLIENT_SECRET: "kansli-dev-secret" }),
    ).toThrow(/development fallback/);
  });

  it("uses configured secrets in prod", () => {
    const env = {
      APP_ENV: "production",
      APP_SESSION_SECRET: STRONG_SESSION,
      PIXDRIFT_CLIENT_SECRET: STRONG_CLIENT,
    };
    expect(resolveSessionSecret(env)).toBe(STRONG_SESSION);
    expect(resolveClientSecret(env)).toBe(STRONG_CLIENT);
  });

  it("refuses to boot hardened without a database, with demo seed, or with insecure cookies", () => {
    const secrets = {
      APP_SESSION_SECRET: STRONG_SESSION,
      PIXDRIFT_CLIENT_SECRET: STRONG_CLIENT,
    };
    expect(() => assertHardenedBoot({ APP_ENV: "prod", ...secrets })).toThrow(/DATABASE_URL/);
    expect(() =>
      assertHardenedBoot({
        APP_ENV: "prod",
        DATABASE_URL: "postgres://prod",
        PIXDRIFT_SEED_DEMO: "true",
        ...secrets,
      }),
    ).toThrow(/PIXDRIFT_SEED_DEMO/);
    expect(() =>
      assertHardenedBoot({
        VERCEL_ENV: "production",
        DATABASE_URL: "postgres://prod",
        COOKIE_SECURE: "false",
        ...secrets,
      }),
    ).toThrow(/COOKIE_SECURE/);
    expect(() =>
      assertHardenedBoot({
        APP_ENV: "prod",
        DATABASE_URL: "postgres://prod",
        ...secrets,
      }),
    ).not.toThrow();
    expect(() =>
      assertHardenedBoot({
        APP_ENV: "prod",
        VERCEL_ENV: "preview",
        PIXDRIFT_SEED_DEMO: "true",
      }),
    ).not.toThrow();
  });
});
