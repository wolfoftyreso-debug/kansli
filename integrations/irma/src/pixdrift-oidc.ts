/**
 * Pixdrift OIDC for IRMA — staff/tenant login only.
 *
 * IRMA has two auth surfaces. This adapter covers the first; the second stays
 * internal to IRMA and must NOT go through Pixdrift:
 *
 *   1. Staff / tenant users  → Pixdrift OIDC (this module). IRMA keeps its own
 *      session and tenant scoping; identity is proven by Pixdrift.
 *   2. External recipients    → IRMA Magic Links (passwordless, time-limited,
 *      revocable). Counterparties signing an agreement are not Pixdrift users.
 *
 * ESM + `jose` (IRMA runs on Node 22 / Vinext). Framework-neutral: `beginLogin`
 * and `completeLogin` do the OIDC work; IRMA's route handlers are thin wrappers
 * that store the temp values in a signed cookie and, on success, create IRMA's
 * own tenant-scoped session for the matched staff user (no auto-provisioning).
 */

import { createRemoteJWKSet, jwtVerify } from "jose";
import { createHash, randomBytes } from "node:crypto";

export interface PixdriftClientConfig {
  issuer: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scope?: string;
  fetchImpl?: typeof fetch;
}

export interface PixdriftIdentity {
  sub: string;
  email: string;
  name: string;
  org: { ref: string; name: string; roles: string[]; permissions: string[]; tier: string } | null;
  tier: string;
  memberships: { ref: string; name: string; roles: string[] }[];
}

export interface LoginStart {
  authorizationUrl: string;
  state: string;
  nonce: string;
  codeVerifier: string;
}

interface Discovery {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
}

export interface PixdriftOidc {
  beginLogin(): Promise<LoginStart>;
  completeLogin(
    params: { code?: string; state?: string; error?: string },
    expected: { state: string; nonce: string; codeVerifier: string },
  ): Promise<PixdriftIdentity>;
}

export function createPixdriftOidc(config: PixdriftClientConfig): PixdriftOidc {
  const doFetch = config.fetchImpl ?? fetch;
  const scope = config.scope ?? "openid profile email";
  let discovery: Discovery | null = null;
  let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

  async function discover(): Promise<Discovery> {
    if (discovery) return discovery;
    const res = await doFetch(`${config.issuer.replace(/\/$/, "")}/.well-known/openid-configuration`);
    if (!res.ok) throw new Error(`pixdrift discovery ${res.status}`);
    discovery = (await res.json()) as Discovery;
    jwks = createRemoteJWKSet(new URL(discovery.jwks_uri));
    return discovery;
  }

  return {
    async beginLogin() {
      const doc = await discover();
      const state = randomBytes(16).toString("base64url");
      const nonce = randomBytes(16).toString("base64url");
      const codeVerifier = randomBytes(32).toString("base64url");
      const challenge = createHash("sha256").update(codeVerifier).digest("base64url");
      const url = new URL(doc.authorization_endpoint);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("client_id", config.clientId);
      url.searchParams.set("redirect_uri", config.redirectUri);
      url.searchParams.set("scope", scope);
      url.searchParams.set("state", state);
      url.searchParams.set("nonce", nonce);
      url.searchParams.set("code_challenge", challenge);
      url.searchParams.set("code_challenge_method", "S256");
      return { authorizationUrl: url.toString(), state, nonce, codeVerifier };
    },

    async completeLogin(params, expected) {
      if (params.error) throw new Error(`pixdrift error: ${params.error}`);
      if (!params.code || !expected || params.state !== expected.state) throw new Error("state");
      const doc = await discover();
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        code: params.code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        code_verifier: expected.codeVerifier,
      });
      if (config.clientSecret) body.set("client_secret", config.clientSecret);
      const res = await doFetch(doc.token_endpoint, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      });
      if (!res.ok) throw new Error(`pixdrift token-utbyte ${res.status}`);
      const json = (await res.json()) as { id_token: string };
      if (!jwks) throw new Error("JWKS ej initierad");
      const { payload } = await jwtVerify(json.id_token, jwks, {
        issuer: doc.issuer,
        audience: config.clientId,
      });
      if (expected.nonce && payload.nonce !== expected.nonce) throw new Error("nonce matchar inte");
      const org = (payload.org ?? null) as PixdriftIdentity["org"];
      return {
        sub: String(payload.sub),
        email: String(payload.email),
        name: String(payload.name ?? payload.email),
        org,
        tier: org?.tier ?? "free",
        memberships: (payload.memberships ?? []) as PixdriftIdentity["memberships"],
      };
    },
  };
}
