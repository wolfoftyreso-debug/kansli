/**
 * Pixdrift OIDC login for RITA.
 *
 * RITA keeps its own server-side session and PostgreSQL row-level security
 * ("tenanten kommer från sessionen, aldrig från begäran"). This plugin only
 * changes *who proves the user is*: it runs the Authorization Code + PKCE flow
 * against the Pixdrift identity provider and hands RITA a verified identity via
 * `onLogin`, where RITA creates its session and resolves the tenant.
 *
 * Wiring in `apps/api` (Fastify):
 *
 *   await app.register(cookie, { secret: process.env.SESSION_SECRET });
 *   await registerPixdriftOidc(app, {
 *     issuer: process.env.PIXDRIFT_ISSUER!,
 *     clientId: process.env.PIXDRIFT_CLIENT_ID!,
 *     clientSecret: process.env.PIXDRIFT_CLIENT_SECRET!,
 *     redirectUri: `${process.env.WEB_ORIGIN}/auth/pixdrift/callback`,
 *     async onLogin(identity, reply) {
 *       const session = await createSession(identity);   // RITA's own session store
 *       reply.setCookie("rita_session", session.token, { httpOnly: true, sameSite: "lax", secure: true, path: "/" });
 *       return "/";                                       // withTenant(identity.tenantId) governs data access
 *     },
 *   });
 */

import type { FastifyInstance, FastifyReply } from "fastify";
import { createOidcClient, generateCodeVerifier, randomValue } from "@pixdrift/auth-client";
import { parseRef } from "@pixdrift/contracts";

export interface PixdriftIdentity {
  /** `pixdrift:user:<id>` */
  sub: string;
  email: string;
  name: string;
  org: { ref: string; name: string; roles: string[]; permissions: string[] } | null;
  memberships: { ref: string; name: string; roles: string[] }[];
  /** RITA tenant id derived from the active organisation ref, or null. */
  tenantId: string | null;
}

export interface PixdriftOidcOptions {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  cookieSecure?: boolean;
  loginPath?: string;
  callbackPath?: string;
  /** RITA wires its session store + tenant resolution here; returns where to redirect. */
  onLogin: (identity: PixdriftIdentity, reply: FastifyReply) => Promise<string> | string;
  /** Optional injectable fetch for tests. */
  fetchImpl?: typeof fetch;
}

const TMP_COOKIE = "rita_pd_oidc";

export async function registerPixdriftOidc(
  app: FastifyInstance,
  opts: PixdriftOidcOptions,
): Promise<void> {
  const client = createOidcClient({
    issuer: opts.issuer,
    clientId: opts.clientId,
    clientSecret: opts.clientSecret,
    redirectUri: opts.redirectUri,
    fetchImpl: opts.fetchImpl,
  });
  const loginPath = opts.loginPath ?? "/auth/pixdrift/login";
  const callbackPath = opts.callbackPath ?? "/auth/pixdrift/callback";
  const secure = opts.cookieSecure ?? true;

  app.get(loginPath, async (_request, reply) => {
    const state = randomValue();
    const nonce = randomValue();
    const codeVerifier = generateCodeVerifier();
    const url = await client.authorizationUrl({ state, nonce, codeVerifier });
    reply.setCookie(TMP_COOKIE, JSON.stringify({ state, nonce, codeVerifier }), {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 600,
      signed: true,
    });
    return reply.redirect(url);
  });

  app.get<{ Querystring: { code?: string; state?: string; error?: string } }>(
    callbackPath,
    async (request, reply) => {
      const { code, state, error } = request.query;
      if (error) return reply.code(400).send({ error });

      const raw = request.cookies[TMP_COOKIE];
      const unsigned = raw ? app.unsignCookie(raw) : { valid: false as const, value: null };
      if (!unsigned.valid || !unsigned.value) {
        return reply.code(400).send({ error: "state" });
      }
      const saved = JSON.parse(unsigned.value) as {
        state: string;
        nonce: string;
        codeVerifier: string;
      };
      if (!code || state !== saved.state) {
        return reply.code(400).send({ error: "state" });
      }

      const tokens = await client.exchangeCode({
        code,
        codeVerifier: saved.codeVerifier,
        nonce: saved.nonce,
      });
      const claims = tokens.claims;
      const identity: PixdriftIdentity = {
        sub: claims.sub,
        email: claims.email,
        name: claims.name,
        org: claims.org,
        memberships: claims.memberships,
        tenantId: claims.org ? parseRef(claims.org.ref).id : null,
      };

      reply.clearCookie(TMP_COOKIE, { path: "/" });
      const redirectTo = await opts.onLogin(identity, reply);
      return reply.redirect(redirectTo);
    },
  );
}
