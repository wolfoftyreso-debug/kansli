import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createOidcClient } from "@pixdrift/auth-client";

const discovery = {
  issuer: "http://idp.test",
  authorization_endpoint: "http://idp.test/authorize",
  token_endpoint: "http://idp.test/token",
  userinfo_endpoint: "http://idp.test/userinfo",
  jwks_uri: "http://idp.test/jwks",
};

describe("OIDC userinfo language", () => {
  it("uses English-canonical leftover userinfo throws like discovery", () => {
    const client = readFileSync("packages/auth-client/src/index.ts", "utf8");
    expect(client).toContain("Userinfo failed:");
    expect(client).toContain("Discovery failed:");
    expect(client).not.toContain("userinfo misslyckades");
  });

  it("throws the English-canonical sentence before reading the body", async () => {
    const oidc = createOidcClient({
      issuer: "http://idp.test",
      clientId: "kansli-web",
      clientSecret: "secret",
      redirectUri: "http://app.test/callback",
      fetchImpl: async (input) => {
        const url = String(input);
        if (url.includes("openid-configuration")) {
          return new Response(JSON.stringify(discovery), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }
        if (url.includes("/userinfo")) {
          return new Response("nope", { status: 401 });
        }
        return new Response("unexpected", { status: 500 });
      },
    });
    await expect(oidc.fetchUserinfo("not-a-token")).rejects.toThrow(/Userinfo failed: 401/);
  });

  it("leaves leftover invoice-book throws as written", () => {
    expect(readFileSync("src/lib/ekonomi/invoices.ts", "utf8")).toContain(
      "bara utkast kan utfärdas.",
    );
  });
});
