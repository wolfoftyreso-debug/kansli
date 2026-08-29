import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { signClientAssertion } from "../ekonomi/revolut/assertion.ts";
import {
  assertProductionRevolutConfig,
  normalisePem,
  revolutKeyMatch,
  revolutRedirect,
  revolutRedirectUri,
} from "../ekonomi/revolut/config.ts";

describe("Revolut config language", () => {
  it("uses English-canonical config throws and reasons like the API layer", () => {
    const config = readFileSync("src/lib/ekonomi/revolut/config.ts", "utf8");
    const assertion = readFileSync("src/lib/ekonomi/revolut/assertion.ts", "utf8");
    const tokens = readFileSync("src/lib/ekonomi/revolut/tokens.ts", "utf8");
    expect(config).toContain(
      "The PEM is missing a -----BEGIN line. The key or certificate is broken.",
    );
    expect(config).toContain("REVOLUT_REDIRECT_URI must be an absolute URL.");
    expect(config).toContain(
      "REVOLUT_ENVIRONMENT=production requires an explicit REVOLUT_REDIRECT_URI.",
    );
    expect(config).toContain("REVOLUT_REDIRECT_URI must be public https.");
    expect(config).toContain("does not belong to the certificate registered with Revolut.");
    expect(assertion).toContain("The client assertion is missing iss (the redirect URI host).");
    expect(assertion).toContain("The client assertion is missing sub (REVOLUT_CLIENT_ID).");
    expect(assertion).toContain(
      "REVOLUT_CLIENT_ID is missing. Revolut issues it after the certificate.",
    );
    expect(tokens).toContain("REVOLUT_CLIENT_ID is missing.");
    expect(tokens).toContain("The Revolut configuration is invalid.");
    expect(config).not.toContain("måste vara en absolut URL.");
    expect(assertion).not.toContain("saknar iss");
    expect(tokens).not.toContain("REVOLUT_CLIENT_ID saknas.");
  });

  it("throws the English-canonical config sentences", () => {
    expect(() => normalisePem("not-a-key")).toThrow(/missing a -----BEGIN line/);
    expect(() => revolutRedirectUri({ REVOLUT_REDIRECT_URI: "/callback" })).toThrow(
      /must be an absolute URL/,
    );
    expect(() =>
      assertProductionRevolutConfig({
        REVOLUT_ENVIRONMENT: "production",
        APP_BASE_URL: "https://kansli-abc123.vercel.app",
      }),
    ).toThrow(/requires an explicit REVOLUT_REDIRECT_URI/);
    expect(revolutRedirect({ REVOLUT_REDIRECT_URI: "http://kansli.vercel.app" }).reason).toMatch(
      /public https URI/,
    );
    expect(revolutKeyMatch({}).reason).toMatch(/REVOLUT_CERTIFICATE_PUBLIC_KEY_SHA256 is not set/);
  });

  it("refuses a client assertion without iss or sub in English", async () => {
    await expect(
      signClientAssertion({
        issuer: "",
        clientId: "client-abc",
        privateKeyPem: "-----BEGIN PRIVATE KEY-----\nnope\n-----END PRIVATE KEY-----\n",
      }),
    ).rejects.toThrow(/missing iss/);
    await expect(
      signClientAssertion({
        issuer: "kansli.vercel.app",
        clientId: "",
        privateKeyPem: "-----BEGIN PRIVATE KEY-----\nnope\n-----END PRIVATE KEY-----\n",
      }),
    ).rejects.toThrow(/missing sub/);
  });

  it("leaves vendor fail reasons as written", () => {
    const errors = readFileSync("src/lib/ekonomi/revolut/errors.ts", "utf8");
    expect(errors).toContain("Revolut-konfigurationen är inte klar.");
  });
});
