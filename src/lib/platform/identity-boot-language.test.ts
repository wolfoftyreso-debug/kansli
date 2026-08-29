import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assertHardenedIdentityBoot } from "@pixdrift/identity";

describe("Identity boot language", () => {
  it("uses English-canonical hardened-boot throws like the app", () => {
    const boot = readFileSync("packages/identity/src/boot.ts", "utf8");
    const app = readFileSync("src/lib/auth/secrets.ts", "utf8");
    expect(boot).toContain("Identity refuses to start in production without DATABASE_URL.");
    expect(boot).toContain("Identity refuses to start in production with PIXDRIFT_SEED_DEMO=true.");
    expect(boot).toContain("Identity refuses to start in production with COOKIE_SECURE=false.");
    expect(boot).toContain("SESSION_SECRET must be set to a strong, unique value in production");
    expect(app).toContain("DATABASE_URL must be set when the runtime is hardened");
    expect(boot).not.toContain("Identity vägrar starta");
    expect(boot).not.toContain("måste sättas till ett starkt");
  });

  it("throws the English-canonical sentences before connecting", () => {
    expect(() =>
      assertHardenedIdentityBoot({ NODE_ENV: "test", VERCEL_ENV: "production" }),
    ).toThrow(/Identity refuses to start in production without DATABASE_URL/);
    expect(() =>
      assertHardenedIdentityBoot({
        NODE_ENV: "test",
        VERCEL_ENV: "production",
        DATABASE_URL: "postgres://prod",
        PIXDRIFT_SEED_DEMO: "true",
      }),
    ).toThrow(/Identity refuses to start in production with PIXDRIFT_SEED_DEMO=true/);
    expect(() =>
      assertHardenedIdentityBoot({
        NODE_ENV: "test",
        APP_ENV: "prod",
        DATABASE_URL: "postgres://prod",
        COOKIE_SECURE: "false",
      }),
    ).toThrow(/Identity refuses to start in production with COOKIE_SECURE=false/);
  });

  it("leaves the demo login and signing-key bootstrap throws as written", () => {
    expect(readFileSync("packages/identity/src/boot.ts", "utf8")).toContain(
      "demo@exempelbolaget.se",
    );
    expect(readFileSync("packages/identity/src/pg/store.ts", "utf8")).toContain(
      "ingen aktiv signeringsnyckel",
    );
  });
});
