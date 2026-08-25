import type { JWK } from "jose";
import type { IdentityStore } from "./store.ts";
import type { SigningKey } from "./keys.ts";

export interface OidcClient {
  clientId: string;
  /** sha256(base64) of the client secret for confidential clients; omit for public. */
  clientSecretHash?: string;
  redirectUris: string[];
  postLogoutRedirectUris?: string[];
  /** Resource audiences this client may request access tokens for. */
  audiences?: string[];
  name: string;
}

export interface IdentityConfig {
  issuer: string;
  store: IdentityStore;
  signingKey: SigningKey;
  /** Extra public keys to publish in JWKS (e.g. previous keys during rotation). */
  additionalPublicJwks?: JWK[];
  clients: OidcClient[];
  /** Access token lifetime in seconds. Default 600 (10 min). */
  accessTokenTtl?: number;
  /** ID token lifetime in seconds. Default 600. */
  idTokenTtl?: number;
  /** Authorization code lifetime in seconds. Default 60. */
  authCodeTtl?: number;
  /** Cookie name for the IdP SSO session. Default `pixdrift_idp`. */
  sessionCookieName?: string;
  /** Secret used to sign the IdP SSO session cookie. */
  sessionSecret: string;
  /** When set (demo deployments), the login form is prefilled with these. */
  demoLogin?: { email: string; password: string };
  /** Set false in tests over http; true in production behind TLS. Default true. */
  cookieSecure?: boolean;
}

export const DEFAULTS = {
  accessTokenTtl: 600,
  idTokenTtl: 600,
  authCodeTtl: 60,
  sessionCookieName: "pixdrift_idp",
  cookieSecure: true,
} as const;
