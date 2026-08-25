import { describe, expect, it } from "vitest";
import {
  bootIdentityFromEnv,
  isHardenedIdentityRuntime,
  withDeploymentRedirects,
  withPreviewClientSecret,
} from "../src/boot.ts";
import { sha256Base64ForSecret } from "../src/secret.ts";

describe("identity boot on Vercel", () => {
  it("does not treat NODE_ENV=production as production", () => {
    expect(isHardenedIdentityRuntime({ NODE_ENV: "production" })).toBe(false);
    expect(
      isHardenedIdentityRuntime({
        NODE_ENV: "production",
        VERCEL_ENV: "preview",
        APP_ENV: "prod",
      }),
    ).toBe(false);
    expect(isHardenedIdentityRuntime({ VERCEL_ENV: "production" })).toBe(true);
    expect(isHardenedIdentityRuntime({ APP_ENV: "prod" })).toBe(true);
  });

  it("boots a preview even when NODE_ENV is production and SESSION_SECRET is unset", async () => {
    const app = await bootIdentityFromEnv({
      issuer: "https://kansli-git-branch-hypbit.vercel.app/idp",
      env: {
        NODE_ENV: "production",
        VERCEL_ENV: "preview",
        VERCEL_URL: "kansli-git-branch-hypbit.vercel.app",
        APP_ENV: "prod",
      },
    });
    const res = await app.inject({ method: "GET", url: "/.well-known/openid-configuration" });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { issuer: string };
    expect(body.issuer).toBe("https://kansli-git-branch-hypbit.vercel.app/idp");
    await app.close();
  });

  it("still fails closed on the production deployment without SESSION_SECRET", async () => {
    await expect(
      bootIdentityFromEnv({
        issuer: "https://kansli.vercel.app/idp",
        env: { VERCEL_ENV: "production", APP_ENV: "prod" },
      }),
    ).rejects.toThrow(/SESSION_SECRET/);
  });

  it("adds this deployment's callback to kansli-web", () => {
    const merged = withDeploymentRedirects(
      [
        {
          clientId: "kansli-web",
          redirectUris: ["https://kansli.vercel.app/api/auth/callback"],
          postLogoutRedirectUris: ["https://kansli.vercel.app/"],
          audiences: ["kansli-web"],
          name: "Kansli",
        },
      ],
      {
        VERCEL_URL: "kansli-q3vxtqmwx-hypbit.vercel.app",
        VERCEL_BRANCH_URL: "kansli-git-branch-hypbit.vercel.app",
      },
    );
    expect(merged[0]?.redirectUris).toContain(
      "https://kansli-git-branch-hypbit.vercel.app/api/auth/callback",
    );
    expect(merged[0]?.redirectUris).toContain(
      "https://kansli-q3vxtqmwx-hypbit.vercel.app/api/auth/callback",
    );
    expect(merged[0]?.redirectUris).toContain("https://kansli.vercel.app/api/auth/callback");
  });

  it("lets the preview BFF use the local client secret", () => {
    const overlaid = withPreviewClientSecret(
      [
        {
          clientId: "kansli-web",
          clientSecretHash: sha256Base64ForSecret("production-secret"),
          redirectUris: ["https://kansli.vercel.app/api/auth/callback"],
          name: "Kansli",
        },
      ],
      { VERCEL_ENV: "preview" },
    );
    expect(overlaid[0]?.clientSecretHash).toBe(sha256Base64ForSecret("kansli-dev-secret"));
    const prod = withPreviewClientSecret(
      [
        {
          clientId: "kansli-web",
          clientSecretHash: sha256Base64ForSecret("production-secret"),
          redirectUris: ["https://kansli.vercel.app/api/auth/callback"],
          name: "Kansli",
        },
      ],
      { VERCEL_ENV: "production" },
    );
    expect(prod[0]?.clientSecretHash).toBe(sha256Base64ForSecret("production-secret"));
  });
});
