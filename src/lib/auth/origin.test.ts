import { describe, expect, it } from "vitest";
import { authPublicUrls, originFromRequest, publicOrigin } from "./origin.ts";

describe("auth public origin", () => {
  it("keeps local defaults off Vercel", () => {
    expect(publicOrigin({})).toBe("http://127.0.0.1:3000");
    expect(authPublicUrls({}).issuer).toBe("http://127.0.0.1:3000/idp");
  });

  it("uses APP_BASE_URL in production", () => {
    const env = {
      VERCEL_ENV: "production",
      APP_BASE_URL: "https://kansli.vercel.app",
      PIXDRIFT_ISSUER: "https://kansli.vercel.app/idp",
      PIXDRIFT_REDIRECT_URI: "https://kansli.vercel.app/api/auth/callback",
    };
    expect(authPublicUrls(env)).toEqual({
      origin: "https://kansli.vercel.app",
      issuer: "https://kansli.vercel.app/idp",
      redirectUri: "https://kansli.vercel.app/api/auth/callback",
    });
  });

  it("does not send a preview login to production", () => {
    const env = {
      VERCEL_ENV: "preview",
      VERCEL_URL: "kansli-q3vxtqmwx-hypbit.vercel.app",
      VERCEL_BRANCH_URL: "kansli-git-branch-hypbit.vercel.app",
      APP_BASE_URL: "https://kansli.vercel.app",
      PIXDRIFT_ISSUER: "https://kansli.vercel.app/idp",
      PIXDRIFT_REDIRECT_URI: "https://kansli.vercel.app/api/auth/callback",
    };
    expect(authPublicUrls(env)).toEqual({
      origin: "https://kansli-git-branch-hypbit.vercel.app",
      issuer: "https://kansli-git-branch-hypbit.vercel.app/idp",
      redirectUri: "https://kansli-git-branch-hypbit.vercel.app/api/auth/callback",
    });
  });

  it("follows the host the browser actually opened", () => {
    expect(
      originFromRequest({
        proto: "https",
        host: "kansli-git-cursor-pixdrift-shared-auth-39a5-hypbit.vercel.app",
      }),
    ).toBe("https://kansli-git-cursor-pixdrift-shared-auth-39a5-hypbit.vercel.app");
  });
});
