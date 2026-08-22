import { SignJWT } from "jose";
import type { TokenOrgContext } from "@pixdrift/contracts";
import type { IdentityConfig } from "./config.ts";
import { DEFAULTS } from "./config.ts";
import type { MembershipView } from "./authz.ts";

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export interface AccessTokenInput {
  subject: string;
  audience: string | string[];
  scope: string;
  org: TokenOrgContext | null;
}

export async function signAccessToken(config: IdentityConfig, input: AccessTokenInput): Promise<string> {
  const iat = nowSeconds();
  const ttl = config.accessTokenTtl ?? DEFAULTS.accessTokenTtl;
  return new SignJWT({
    scope: input.scope,
    org: input.org?.ref ?? null,
    roles: input.org?.roles ?? [],
    permissions: input.org?.permissions ?? [],
  })
    .setProtectedHeader({ alg: config.signingKey.alg, kid: config.signingKey.kid, typ: "at+jwt" })
    .setIssuer(config.issuer)
    .setSubject(input.subject)
    .setAudience(input.audience)
    .setIssuedAt(iat)
    .setExpirationTime(iat + ttl)
    .sign(config.signingKey.privateKey);
}

export interface IdTokenInput {
  subject: string;
  audience: string;
  email: string;
  emailVerified: boolean;
  name: string;
  nonce: string | null;
  org: TokenOrgContext | null;
  memberships: MembershipView[];
}

export async function signIdToken(config: IdentityConfig, input: IdTokenInput): Promise<string> {
  const iat = nowSeconds();
  const ttl = config.idTokenTtl ?? DEFAULTS.idTokenTtl;
  const jwt = new SignJWT({
    email: input.email,
    email_verified: input.emailVerified,
    name: input.name,
    org: input.org,
    memberships: input.memberships,
    ...(input.nonce ? { nonce: input.nonce } : {}),
  })
    .setProtectedHeader({ alg: config.signingKey.alg, kid: config.signingKey.kid })
    .setIssuer(config.issuer)
    .setSubject(input.subject)
    .setAudience(input.audience)
    .setIssuedAt(iat)
    .setExpirationTime(iat + ttl);
  return jwt.sign(config.signingKey.privateKey);
}
