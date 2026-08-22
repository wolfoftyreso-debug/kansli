/**
 * @pixdrift/auth-client
 *
 * Two adapters over the central identity provider:
 *
 * 1. `createOidcClient` — the Authorization Code + PKCE flow a BFF web app runs
 *    (kansli, RITA's `apps/web`): build the authorize URL, exchange the code,
 *    verify the id token, read userinfo. The app keeps its own session cookie.
 *
 * 2. `createAccessTokenVerifier` — what a resource server runs (ALVA's
 *    platform/ai-orkester, RITA's API) to verify a Bearer access token against
 *    the provider's JWKS. This is the replacement for ALVA's shared HS256
 *    secret: verification needs only the public keys.
 */

import { createRemoteJWKSet, decodeJwt, jwtVerify } from "jose";
import { codeChallengeS256 } from "./pkce.ts";
import {
  AccessTokenClaims,
  IdTokenClaims,
  hasPermission,
  type AccessTokenClaims as AccessTokenClaimsType,
  type IdTokenClaims as IdTokenClaimsType,
} from "@pixdrift/contracts";

export { generateCodeVerifier, codeChallengeS256, randomValue } from "./pkce.ts";
export { hasPermission };

interface DiscoveryDocument {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
  end_session_endpoint?: string;
}

export interface OidcClientConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string;
  /** Injectable for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

export interface AuthorizationUrlInput {
  state: string;
  nonce: string;
  codeVerifier: string;
  /** Optional organisation to scope the resulting token to. */
  org?: string;
  /** Force a fresh login even if an IdP session exists. */
  prompt?: "login";
}

export interface TokenSet {
  accessToken: string;
  idToken: string;
  tokenType: string;
  expiresIn: number;
  scope: string;
  claims: IdTokenClaimsType;
}

export interface OidcClient {
  discover(): Promise<DiscoveryDocument>;
  authorizationUrl(input: AuthorizationUrlInput): Promise<string>;
  exchangeCode(input: { code: string; codeVerifier: string; nonce: string }): Promise<TokenSet>;
  fetchUserinfo(accessToken: string): Promise<Record<string, unknown>>;
  endSessionUrl(input: { postLogoutRedirectUri: string; state?: string }): Promise<string>;
}

export function createOidcClient(config: OidcClientConfig): OidcClient {
  const doFetch = config.fetchImpl ?? fetch;
  const scope = config.scope ?? "openid profile email";
  let discovery: DiscoveryDocument | null = null;
  let jwkSet: ReturnType<typeof createRemoteJWKSet> | null = null;

  async function discover(): Promise<DiscoveryDocument> {
    if (discovery) return discovery;
    const res = await doFetch(
      `${config.issuer.replace(/\/$/, "")}/.well-known/openid-configuration`,
    );
    if (!res.ok) throw new Error(`discovery misslyckades: ${res.status}`);
    discovery = (await res.json()) as DiscoveryDocument;
    jwkSet = createRemoteJWKSet(new URL(discovery.jwks_uri));
    return discovery;
  }

  async function jwks(): Promise<ReturnType<typeof createRemoteJWKSet>> {
    await discover();
    if (!jwkSet) throw new Error("JWKS ej initierad");
    return jwkSet;
  }

  return {
    discover,

    async authorizationUrl(input) {
      const doc = await discover();
      const url = new URL(doc.authorization_endpoint);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("client_id", config.clientId);
      url.searchParams.set("redirect_uri", config.redirectUri);
      url.searchParams.set("scope", scope);
      url.searchParams.set("state", input.state);
      url.searchParams.set("nonce", input.nonce);
      url.searchParams.set("code_challenge", codeChallengeS256(input.codeVerifier));
      url.searchParams.set("code_challenge_method", "S256");
      if (input.org) url.searchParams.set("org", input.org);
      if (input.prompt) url.searchParams.set("prompt", input.prompt);
      return url.toString();
    },

    async exchangeCode({ code, codeVerifier, nonce }) {
      const doc = await discover();
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code_verifier: codeVerifier,
      });
      const res = await doFetch(doc.token_endpoint, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`token-utbyte misslyckades: ${res.status} ${detail}`);
      }
      const json = (await res.json()) as {
        access_token: string;
        id_token: string;
        token_type: string;
        expires_in: number;
        scope: string;
      };

      const { payload } = await jwtVerify(json.id_token, await jwks(), {
        issuer: doc.issuer,
        audience: config.clientId,
      });
      if (nonce && payload.nonce !== nonce) throw new Error("nonce matchar inte");
      const claims = IdTokenClaims.parse(payload);

      return {
        accessToken: json.access_token,
        idToken: json.id_token,
        tokenType: json.token_type,
        expiresIn: json.expires_in,
        scope: json.scope,
        claims,
      };
    },

    async fetchUserinfo(accessToken) {
      const doc = await discover();
      const res = await doFetch(doc.userinfo_endpoint, {
        headers: { authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`userinfo misslyckades: ${res.status}`);
      return (await res.json()) as Record<string, unknown>;
    },

    async endSessionUrl({ postLogoutRedirectUri, state }) {
      const doc = await discover();
      const endpoint = doc.end_session_endpoint ?? `${doc.issuer}/logout`;
      const url = new URL(endpoint);
      url.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);
      // The IdP allowlists the target against this client's registered URIs.
      url.searchParams.set("client_id", config.clientId);
      if (state) url.searchParams.set("state", state);
      return url.toString();
    },
  };
}

// ---------------------------------------------------------------------------
// Resource-server adapter
// ---------------------------------------------------------------------------

export interface AccessTokenVerifierConfig {
  issuer: string;
  jwksUri: string;
  /** The resource identifier this server accepts tokens for. */
  audience: string;
}

export interface VerifiedAccessToken {
  claims: AccessTokenClaimsType;
  can(permission: string): boolean;
}

export function createAccessTokenVerifier(config: AccessTokenVerifierConfig) {
  const jwkSet = createRemoteJWKSet(new URL(config.jwksUri));
  return {
    async verify(token: string): Promise<VerifiedAccessToken> {
      const { payload } = await jwtVerify(token, jwkSet, {
        issuer: config.issuer,
        audience: config.audience,
      });
      const claims = AccessTokenClaims.parse(payload);
      return {
        claims,
        can: (permission: string) => hasPermission(claims.permissions, permission),
      };
    },
  };
}

/** Decode without verifying — for logging/debugging only, never for authz. */
export function unsafeDecode(token: string): Record<string, unknown> {
  return decodeJwt(token) as Record<string, unknown>;
}
