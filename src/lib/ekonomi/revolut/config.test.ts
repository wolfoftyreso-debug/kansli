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
  revolutRedirect,
  revolutRedirectUri,
  revolutTokenEndpoint,
} from "./config.ts";

const PROD = "https://kansli.vercel.app/api/integrations/revolut/callback";

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
