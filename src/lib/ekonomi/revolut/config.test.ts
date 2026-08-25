import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  REVOLUT_CALLBACK_PATH,
  assertProductionRevolutConfig,
  normalisePem,
  revolutApiBase,
  revolutConfigState,
  revolutConsentEndpoint,
  revolutEnvironment,
  revolutJwtIssuer,
  revolutKeyMatch,
  revolutRedirect,
  revolutRedirectUri,
  revolutTokenEndpoint,
  spkiSha256,
} from "./config.ts";

const PROD = "https://kansli.vercel.app/api/integrations/revolut/callback";

function pair() {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  return {
    privatePem: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    publicPem: publicKey.export({ type: "spki", format: "pem" }).toString(),
  };
}

describe("revolut environment", () => {
  it("takes the declared environment, never the hostname", () => {
    expect(revolutEnvironment({ REVOLUT_ENVIRONMENT: "sandbox" })).toBe("sandbox");
    expect(revolutEnvironment({ REVOLUT_ENVIRONMENT: "production" })).toBe("production");
    expect(
      revolutEnvironment({ REVOLUT_ENVIRONMENT: "sandbox", VERCEL_URL: "kansli.vercel.app" }),
    ).toBe("sandbox");
  });

  it("keeps the legacy sandbox flag working", () => {
    expect(revolutEnvironment({ REVOLUT_BUSINESS_SANDBOX: "true" })).toBe("sandbox");
    expect(revolutEnvironment({})).toBe("production");
  });

  it("points sandbox and production at different hosts", () => {
    expect(revolutApiBase({ REVOLUT_ENVIRONMENT: "sandbox" })).toContain("sandbox-b2b");
    expect(revolutApiBase({ REVOLUT_ENVIRONMENT: "production" })).toBe(
      "https://b2b.revolut.com/api/1.0",
    );
    expect(revolutTokenEndpoint({ REVOLUT_ENVIRONMENT: "production" })).toBe(
      "https://b2b.revolut.com/api/1.0/auth/token",
    );
    expect(revolutConsentEndpoint({ REVOLUT_ENVIRONMENT: "sandbox" })).toContain(
      "sandbox-business.revolut.com",
    );
  });
});

describe("redirect uri", () => {
  it("uses the configured value verbatim", () => {
    expect(revolutRedirectUri({ REVOLUT_REDIRECT_URI: PROD })).toBe(PROD);
    expect(revolutJwtIssuer({ REVOLUT_REDIRECT_URI: PROD })).toBe("kansli.vercel.app");
  });

  it("accepts a bare origin and appends the registered path", () => {
    expect(revolutRedirectUri({ REVOLUT_REDIRECT_URI: "https://kansli.vercel.app" })).toBe(
      `https://kansli.vercel.app${REVOLUT_CALLBACK_PATH}`,
    );
  });

  it("never derives the registered uri from a request or VERCEL_URL", () => {
    const uri = revolutRedirectUri({
      REVOLUT_REDIRECT_URI: PROD,
      VERCEL_URL: "kansli-git-branch-user.vercel.app",
      APP_BASE_URL: "https://kansli-abc123.vercel.app",
    });
    expect(uri).toBe(PROD);
    expect(uri).not.toContain("git-branch");
    expect(uri).not.toContain("abc123");
  });

  it("refuses localhost and http as a Revolut-registerable uri", () => {
    const local = revolutRedirect({ APP_BASE_URL: "http://127.0.0.1:3000" });
    expect(local.usableInRevolutPortal).toBe(false);
    expect(local.source).toBe("development-default");
    const plain = revolutRedirect({ REVOLUT_REDIRECT_URI: "http://kansli.vercel.app" });
    expect(plain.usableInRevolutPortal).toBe(false);
  });

  it("rejects a non-absolute value loudly", () => {
    expect(() => revolutRedirectUri({ REVOLUT_REDIRECT_URI: "/callback" })).toThrow(/absolut/);
  });
});

describe("private key handling", () => {
  it("normalises escaped newlines once", () => {
    const escaped = "-----BEGIN PRIVATE KEY-----\\nAAAA\\n-----END PRIVATE KEY-----";
    expect(normalisePem(escaped)).toBe(
      "-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----\n",
    );
  });

  it("fails loudly on something that is not a PEM", () => {
    expect(() => normalisePem("not-a-key")).toThrow(/BEGIN/);
  });
});

describe("config state", () => {
  it("reports NOT_CONFIGURED style gaps instead of throwing", () => {
    const state = revolutConfigState({
      REVOLUT_ENVIRONMENT: "production",
      REVOLUT_REDIRECT_URI: PROD,
    });
    expect(state.ready).toBe(false);
    expect(state.missing).toContain("REVOLUT_CLIENT_ID");
    expect(state.missing).toContain("REVOLUT_PRIVATE_KEY");
    expect(state.missing).not.toContain("REVOLUT_REDIRECT_URI");
  });

  it("wants an explicitly declared environment before connecting", () => {
    const state = revolutConfigState({ REVOLUT_REDIRECT_URI: PROD });
    expect(state.environmentIsExplicit).toBe(false);
    expect(state.missing).toContain("REVOLUT_ENVIRONMENT");
    expect(state.ready).toBe(false);
  });

  it("never exposes key material", () => {
    const state = revolutConfigState({
      REVOLUT_ENVIRONMENT: "production",
      REVOLUT_REDIRECT_URI: PROD,
      REVOLUT_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nsecret\n-----END PRIVATE KEY-----",
    });
    expect(state.hasPrivateKey).toBe(true);
    expect(JSON.stringify(state)).not.toContain("secret");
    expect(JSON.stringify(state)).not.toContain("BEGIN PRIVATE KEY");
  });
});

describe("certificate and key pairing", () => {
  const base = { REVOLUT_ENVIRONMENT: "production", REVOLUT_REDIRECT_URI: PROD };

  it("derives the same pin from either half of the pair", () => {
    const { privatePem, publicPem } = pair();
    expect(spkiSha256(privatePem)).toBe(spkiSha256(publicPem));
  });

  it("confirms the deployment holds the key the certificate belongs to", () => {
    const { privatePem, publicPem } = pair();
    const match = revolutKeyMatch({
      ...base,
      REVOLUT_PRIVATE_KEY: privatePem,
      REVOLUT_CERTIFICATE_PUBLIC_KEY_SHA256: spkiSha256(publicPem),
    });
    expect(match.state).toBe("match");
  });

  it("catches a key that belongs to a different certificate", () => {
    const mine = pair();
    const stranger = pair();
    const env = {
      ...base,
      REVOLUT_CLIENT_ID: "client-id",
      REVOLUT_PRIVATE_KEY: mine.privatePem,
      REVOLUT_CERTIFICATE_PUBLIC_KEY_SHA256: spkiSha256(stranger.publicPem),
    };
    expect(revolutKeyMatch(env).state).toBe("mismatch");
    // Nothing is absent, so the gap has to be reported as a mismatch rather
    // than as a missing variable.
    const state = revolutConfigState(env);
    expect(state.missing).toEqual([]);
    expect(state.ready).toBe(false);
    expect(() => assertProductionRevolutConfig(env)).toThrow(/hör inte till certifikatet/);
  });

  it("tolerates the prefixed and wrapped forms a secret store hands back", () => {
    const { privatePem, publicPem } = pair();
    const pin = spkiSha256(publicPem);
    for (const stored of [`sha256:${pin}`, `sha256/${pin}`, ` ${pin}\n`]) {
      expect(
        revolutKeyMatch({
          ...base,
          REVOLUT_PRIVATE_KEY: privatePem,
          REVOLUT_CERTIFICATE_PUBLIC_KEY_SHA256: stored,
        }).state,
      ).toBe("match");
    }
  });

  it("stays unknown, not broken, when the pin was never configured", () => {
    const { privatePem } = pair();
    const env = { ...base, REVOLUT_CLIENT_ID: "client-id", REVOLUT_PRIVATE_KEY: privatePem };
    expect(revolutKeyMatch(env).state).toBe("unknown");
    expect(revolutConfigState(env).ready).toBe(true);
    expect(() => assertProductionRevolutConfig(env)).not.toThrow();
  });

  it("keeps the pin free of key material", () => {
    const { privatePem, publicPem } = pair();
    const pin = spkiSha256(privatePem);
    expect(pin).not.toContain("BEGIN");
    expect(privatePem).not.toContain(pin);
    expect(publicPem).not.toContain(pin);
  });
});

describe("production guard", () => {
  it("refuses a production boot without a pinned redirect uri", () => {
    expect(() =>
      assertProductionRevolutConfig({
        REVOLUT_ENVIRONMENT: "production",
        APP_BASE_URL: "https://kansli-abc123.vercel.app",
      }),
    ).toThrow(/REVOLUT_REDIRECT_URI/);
  });

  it("accepts a pinned https redirect uri", () => {
    expect(() =>
      assertProductionRevolutConfig({
        REVOLUT_ENVIRONMENT: "production",
        REVOLUT_REDIRECT_URI: PROD,
      }),
    ).not.toThrow();
  });

  it("leaves sandbox alone", () => {
    expect(() => assertProductionRevolutConfig({ REVOLUT_ENVIRONMENT: "sandbox" })).not.toThrow();
  });
});
