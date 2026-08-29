import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { skapaPixdriftVerifierare } from "../../../integrations/alva/src/pixdrift-auth.mjs";

function fakeJwt(header: Record<string, unknown>, payload: Record<string, unknown> = {}): string {
  const head = Buffer.from(JSON.stringify(header)).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${head}.${body}.e30`;
}

describe("OIDC verify leftover-throw language", () => {
  it("uses English-canonical leftover verify throws like token exchange", () => {
    const britt = readFileSync("integrations/britt/pixdrift-oidc.js", "utf8");
    const alva = readFileSync("integrations/alva/src/pixdrift-auth.mjs", "utf8");
    expect(britt).toContain("invalid id_token");
    expect(britt).toContain("unexpected alg:");
    expect(britt).toContain("no matching key");
    expect(britt).toContain("invalid signature");
    expect(britt).toContain("expired id_token");
    expect(britt).toContain("wrong issuer");
    expect(britt).toContain("wrong audience");
    expect(alva).toContain("could not fetch JWKS:");
    expect(alva).toContain("invalid token: wrong format");
    expect(alva).toContain("unexpected alg:");
    expect(alva).toContain("no matching signing key");
    expect(alva).toContain("invalid signature");
    expect(alva).toContain("expired token");
    expect(alva).toContain("wrong issuer");
    expect(alva).toContain("wrong audience");
    expect(britt).not.toContain('throw new Error("ogiltig id_token")');
    expect(britt).not.toContain('throw new Error("oväntad alg:');
    expect(britt).not.toContain('throw new Error("ingen matchande nyckel")');
    expect(britt).not.toContain('throw new Error("ogiltig signatur")');
    expect(britt).not.toContain('throw new Error("utgången id_token")');
    expect(britt).not.toContain('throw new Error("fel utfärdare")');
    expect(alva).not.toContain("kunde inte hämta JWKS:");
    expect(alva).not.toContain('throw new Error("ogiltig token: fel format")');
    expect(alva).not.toContain("oväntad alg:");
    expect(alva).not.toContain("ingen matchande signeringsnyckel");
    expect(alva).not.toContain('throw new Error("ogiltig signatur")');
    expect(alva).not.toContain('throw new Error("utgången token")');
    expect(alva).not.toContain('throw new Error("fel utfärdare")');
  });

  it("throws the English-canonical sentences before verifying a signature", async () => {
    const verifier = skapaPixdriftVerifierare({
      issuer: "http://idp.test",
      jwksUri: "http://idp.test/jwks",
      audience: "alva-plattform",
      fetchImpl: async () => new Response("nope", { status: 503 }),
    });
    await expect(verifier.verifiera("not-a-jwt")).rejects.toThrow(/invalid token: wrong format/);
    await expect(verifier.verifiera(fakeJwt({ alg: "HS256", typ: "JWT" }))).rejects.toThrow(
      /unexpected alg: HS256/,
    );
    await expect(verifier.verifiera(fakeJwt({ alg: "ES256", typ: "JWT" }))).rejects.toThrow(
      /could not fetch JWKS: 503/,
    );
  });

  it("leaves leftover invoice-book throws as written", () => {
    expect(readFileSync("src/lib/ekonomi/invoices.ts", "utf8")).toContain(
      "bara utkast kan utfärdas.",
    );
  });
});
