import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("OIDC token-exchange language", () => {
  it("uses English-canonical leftover discovery and token-exchange throws", () => {
    const client = readFileSync("packages/auth-client/src/index.ts", "utf8");
    const irma = readFileSync("integrations/irma/src/pixdrift-oidc.ts", "utf8");
    const britt = readFileSync("integrations/britt/pixdrift-oidc.js", "utf8");
    expect(client).toContain("Discovery failed:");
    expect(client).toContain("JWKS is not initialised");
    expect(client).toContain("Token exchange failed:");
    expect(client).toContain("Userinfo failed:");
    expect(client).toContain("nonce does not match");
    expect(irma).toContain("pixdrift token exchange");
    expect(irma).toContain("JWKS is not initialised");
    expect(irma).toContain("nonce does not match");
    expect(britt).toContain("pixdrift token exchange");
    expect(britt).toContain("nonce does not match");
    expect(client).not.toContain("token-utbyte misslyckades");
    expect(client).not.toContain("discovery misslyckades");
    expect(client).not.toContain("userinfo misslyckades");
    expect(irma).not.toContain("token-utbyte");
    expect(britt).not.toContain("token-utbyte");
  });

  it("leaves leftover invoice-book throws as written", () => {
    expect(readFileSync("src/lib/ekonomi/invoices.ts", "utf8")).toContain(
      "bara utkast kan utfärdas.",
    );
  });
});
