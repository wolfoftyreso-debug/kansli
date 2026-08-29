/**
 * One place that defines the Revolut Business API surface.
 *
 * Two rules this module exists to enforce:
 *  1. The OAuth redirect URI is a registered credential. It is never derived
 *     from a request Host/Origin header or from VERCEL_URL, because a preview
 *     hostname would silently invalidate the certificate registered at Revolut.
 *  2. Sandbox and production endpoints are chosen by REVOLUT_ENVIRONMENT only,
 *     never inferred from the hostname the process happens to run on.
 *
 * This is not Pixdrift Identity. Identity's callback is /api/auth/callback and
 * has nothing to do with Revolut.
 */

import { createHash, createPublicKey } from "node:crypto";

export type RevolutEnvironment = "sandbox" | "production";

/** Registered with Revolut as the OAuth redirect URI. Changing it breaks the credential. */
export const REVOLUT_CALLBACK_PATH = "/api/integrations/revolut/callback";

/** Where the browser is sent to start and to inspect the connection. */
export const REVOLUT_CONNECT_PATH = "/api/integrations/revolut/connect";
export const REVOLUT_STATUS_PATH = "/ekonomi/anslutningar/revolut";

const API_BASE: Record<RevolutEnvironment, string> = {
  sandbox: "https://sandbox-b2b.revolut.com/api/1.0",
  production: "https://b2b.revolut.com/api/1.0",
};

/** Consent screen. Revolut calls it /app-confirm, on the business app host. */
const CONSENT_BASE: Record<RevolutEnvironment, string> = {
  sandbox: "https://sandbox-business.revolut.com/app-confirm",
  production: "https://business.revolut.com/app-confirm",
};

/** Revolut signs client assertions with PS256 only. */
export const ASSERTION_ALG = "PS256";

/** aud of the client-assertion JWT, per Revolut's Business API guide. */
export const ASSERTION_AUDIENCE = "https://revolut.com";

export type Env = Record<string, string | undefined>;

function raw(env: Env, key: string): string | null {
  const value = env[key]?.trim();
  return value ? value : null;
}

/** True only when the owner declared the environment. OAuth refuses to run otherwise. */
export function revolutEnvironmentIsExplicit(env: Env = process.env): boolean {
  const value = raw(env, "REVOLUT_ENVIRONMENT")?.toLowerCase();
  return value === "sandbox" || value === "production";
}

export function revolutEnvironment(env: Env = process.env): RevolutEnvironment {
  const explicit = raw(env, "REVOLUT_ENVIRONMENT")?.toLowerCase();
  if (explicit === "production") return "production";
  if (explicit === "sandbox") return "sandbox";
  // Legacy flag from the manual-token era, kept so an existing deployment that
  // only ever set REVOLUT_BUSINESS_SANDBOX keeps hitting the same host.
  return raw(env, "REVOLUT_BUSINESS_SANDBOX") === "true" ? "sandbox" : "production";
}

export function revolutApiBase(env: Env = process.env): string {
  return API_BASE[revolutEnvironment(env)];
}

export function revolutTokenEndpoint(env: Env = process.env): string {
  return `${revolutApiBase(env)}/auth/token`;
}

export function revolutConsentEndpoint(env: Env = process.env): string {
  return CONSENT_BASE[revolutEnvironment(env)];
}

export function revolutClientId(env: Env = process.env): string | null {
  return raw(env, "REVOLUT_CLIENT_ID");
}

/**
 * PEM values arrive from secret managers with escaped newlines. Normalise once,
 * here, and fail loudly rather than handing a broken key to the signer.
 */
export function normalisePem(value: string): string {
  const text = value.includes("\\n") ? value.replace(/\\n/g, "\n") : value;
  const trimmed = text.trim();
  if (!trimmed.startsWith("-----BEGIN")) {
    throw new Error("The PEM is missing a -----BEGIN line. The key or certificate is broken.");
  }
  return `${trimmed}\n`;
}

/** Server-side only. Never returned by an API, never logged, never rendered. */
export function revolutPrivateKeyPem(env: Env = process.env): string | null {
  const value = raw(env, "REVOLUT_PRIVATE_KEY");
  if (!value) return null;
  return normalisePem(value);
}

export interface RevolutRedirect {
  uri: string;
  host: string;
  /** Revolut's consent page rejects localhost and plain http. */
  usableInRevolutPortal: boolean;
  reason: string;
  source: "configured" | "development-default";
}

function developmentDefault(env: Env): string {
  const base = (raw(env, "APP_BASE_URL") ?? "http://127.0.0.1:3000").replace(/\/+$/, "");
  return `${base}${REVOLUT_CALLBACK_PATH}`;
}

/**
 * The registered redirect URI. In production this must be an explicit value:
 * a deployment must not be able to change its own OAuth identity.
 */
export function revolutRedirectUri(env: Env = process.env): string {
  const configured = raw(env, "REVOLUT_REDIRECT_URI");
  if (configured) {
    let url: URL;
    try {
      url = new URL(configured);
    } catch {
      throw new Error("REVOLUT_REDIRECT_URI must be an absolute URL.");
    }
    // An origin is accepted as shorthand; anything else is taken literally so a
    // legacy registered path keeps working.
    if (url.pathname === "/" || url.pathname === "") {
      return `${url.origin}${REVOLUT_CALLBACK_PATH}`;
    }
    return `${url.origin}${url.pathname}`;
  }
  return developmentDefault(env);
}

export function revolutRedirect(env: Env = process.env): RevolutRedirect {
  const uri = revolutRedirectUri(env);
  const parsed = new URL(uri);
  const local =
    parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "::1";
  const https = parsed.protocol === "https:";
  const source = raw(env, "REVOLUT_REDIRECT_URI") ? "configured" : "development-default";
  if (local || !https) {
    return {
      uri,
      host: parsed.host,
      usableInRevolutPortal: false,
      reason:
        "Revolut's certificate dialog requires a public https URI. Localhost and http are rejected. Set REVOLUT_REDIRECT_URI.",
      source,
    };
  }
  return {
    uri,
    host: parsed.host,
    usableInRevolutPortal: true,
    reason: `Registered with Revolut. JWT iss must be ${parsed.host}.`,
    source,
  };
}

/** JWT `iss` is the host of the redirect URI, without scheme. */
export function revolutJwtIssuer(env: Env = process.env): string {
  return new URL(revolutRedirectUri(env)).host;
}

export interface CertificateMetadata {
  fingerprint: string | null;
  createdAt: string | null;
  expiresAt: string | null;
  /** SPKI pin of the certificate handed to Revolut, so the pair can be checked. */
  publicKeySha256: string | null;
  /** Days before expiry that health turns into a warning. */
  warnDays: number;
}

export function revolutCertificate(env: Env = process.env): CertificateMetadata {
  const warn = Number(raw(env, "REVOLUT_CERTIFICATE_WARN_DAYS") ?? "30");
  return {
    fingerprint: raw(env, "REVOLUT_CERTIFICATE_FINGERPRINT"),
    createdAt: raw(env, "REVOLUT_CERTIFICATE_CREATED_AT"),
    expiresAt: raw(env, "REVOLUT_CERTIFICATE_EXPIRES_AT"),
    publicKeySha256: normaliseSpki(raw(env, "REVOLUT_CERTIFICATE_PUBLIC_KEY_SHA256")),
    warnDays: Number.isFinite(warn) && warn > 0 ? warn : 30,
  };
}

/**
 * SHA-256 over the SubjectPublicKeyInfo, base64. This identifies a key pair
 * without revealing the private half, and it is derivable from either half, so
 * the same function fingerprints the certificate the owner pasted into Revolut
 * and the key the deployment is holding.
 */
export function spkiSha256(pem: string): string {
  const der = createPublicKey(normalisePem(pem)).export({ type: "spki", format: "der" });
  return createHash("sha256").update(der).digest("base64");
}

function normaliseSpki(value: string | null): string | null {
  if (!value) return null;
  return value.replace(/^sha256[:/]/i, "").replace(/\s+/g, "");
}

export type KeyMatchState = "match" | "mismatch" | "unknown";

export interface KeyMatch {
  state: KeyMatchState;
  reason: string;
}

/**
 * Answers the question Revolut cannot answer for us until the first token call:
 * is the private key in this deployment the other half of the certificate the
 * owner registered? A mismatched pair can never authenticate, so catching it
 * here turns an opaque provider rejection into one readable sentence.
 */
export function revolutKeyMatch(env: Env = process.env): KeyMatch {
  const expected = revolutCertificate(env).publicKeySha256;
  if (!expected) {
    return {
      state: "unknown",
      reason:
        "REVOLUT_CERTIFICATE_PUBLIC_KEY_SHA256 is not set, so we cannot check here that the key and certificate belong together.",
    };
  }
  let actual: string;
  try {
    const pem = revolutPrivateKeyPem(env);
    if (!pem) {
      return { state: "unknown", reason: "REVOLUT_PRIVATE_KEY is missing." };
    }
    actual = spkiSha256(pem);
  } catch {
    return { state: "unknown", reason: "REVOLUT_PRIVATE_KEY cannot be read." };
  }
  if (actual === expected) {
    return { state: "match", reason: "The private key belongs to the certificate at Revolut." };
  }
  return {
    state: "mismatch",
    reason:
      "The private key in the environment does not belong to the certificate registered with Revolut. " +
      "Upload the certificate that belongs to the key, or put in the key that belongs to the certificate.",
  };
}

export interface RevolutConfigState {
  environment: RevolutEnvironment;
  environmentIsExplicit: boolean;
  apiBase: string;
  tokenEndpoint: string;
  consentEndpoint: string;
  redirect: RevolutRedirect;
  jwtIssuer: string;
  hasClientId: boolean;
  hasPrivateKey: boolean;
  privateKeyError: string | null;
  certificate: CertificateMetadata;
  /** Whether the key in this deployment matches the registered certificate. */
  keyMatch: KeyMatch;
  /** True when connect/callback/refresh can run at all. */
  ready: boolean;
  /** What the owner must still supply, in order. */
  missing: string[];
}

export function revolutConfigState(env: Env = process.env): RevolutConfigState {
  const environment = revolutEnvironment(env);
  const redirect = revolutRedirect(env);
  const hasClientId = Boolean(revolutClientId(env));
  let hasPrivateKey = false;
  let privateKeyError: string | null = null;
  try {
    hasPrivateKey = Boolean(revolutPrivateKeyPem(env));
  } catch (error) {
    privateKeyError =
      error instanceof Error ? error.message : "REVOLUT_PRIVATE_KEY cannot be read.";
  }

  const environmentIsExplicit = revolutEnvironmentIsExplicit(env);
  const missing: string[] = [];
  if (!hasPrivateKey) missing.push("REVOLUT_PRIVATE_KEY");
  if (!hasClientId) missing.push("REVOLUT_CLIENT_ID");
  if (!redirect.usableInRevolutPortal) missing.push("REVOLUT_REDIRECT_URI");
  if (!environmentIsExplicit) missing.push("REVOLUT_ENVIRONMENT");

  const keyMatch = revolutKeyMatch(env);

  return {
    environment,
    environmentIsExplicit,
    apiBase: revolutApiBase(env),
    tokenEndpoint: revolutTokenEndpoint(env),
    consentEndpoint: revolutConsentEndpoint(env),
    redirect,
    jwtIssuer: revolutJwtIssuer(env),
    hasClientId,
    hasPrivateKey,
    privateKeyError,
    certificate: revolutCertificate(env),
    keyMatch,
    ready:
      hasPrivateKey &&
      hasClientId &&
      environmentIsExplicit &&
      redirect.usableInRevolutPortal &&
      privateKeyError === null &&
      keyMatch.state !== "mismatch",
    missing,
  };
}

/**
 * Fail-closed guard for production boots. A production deployment that lacks a
 * pinned redirect URI would register a moving OAuth identity, so that is an
 * error. A missing client id is not: Revolut only issues it after the owner
 * uploads the certificate, so the integration reports NOT_CONFIGURED instead.
 */
export function assertProductionRevolutConfig(env: Env = process.env): void {
  if (revolutEnvironment(env) !== "production") return;
  const state = revolutConfigState(env);
  if (state.redirect.source !== "configured") {
    throw new Error(
      "REVOLUT_ENVIRONMENT=production requires an explicit REVOLUT_REDIRECT_URI. Never derive the callback from Host or VERCEL_URL.",
    );
  }
  if (!state.redirect.usableInRevolutPortal) {
    throw new Error(`REVOLUT_REDIRECT_URI must be public https. Got ${state.redirect.uri}.`);
  }
  if (state.privateKeyError) throw new Error(state.privateKeyError);
  if (state.keyMatch.state === "mismatch") throw new Error(state.keyMatch.reason);
}
