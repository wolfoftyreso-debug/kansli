import Fastify, { type FastifyInstance, type FastifyReply } from "fastify";
import cookie from "@fastify/cookie";
import formbody from "@fastify/formbody";
import { createLocalJWKSet, jwtVerify } from "jose";
import { createHash, timingSafeEqual } from "node:crypto";
import { parseRef } from "@pixdrift/contracts";
import { verifyPassword, isCurrentScheme, hashPassword, newOpaqueId } from "@pixdrift/auth-core";
import { DEFAULTS, type IdentityConfig, type OidcClient } from "./config.ts";
import { jwks } from "./keys.ts";
import { defaultOrgId, membershipsFor, orgContext, userSubject } from "./authz.ts";
import { signAccessToken, signIdToken } from "./tokens.ts";

function sha256Base64(value: string): string {
  return createHash("sha256").update(value).digest("base64");
}

function pkceMatches(verifier: string, challenge: string): boolean {
  const computed = createHash("sha256").update(verifier).digest("base64url");
  const a = Buffer.from(computed);
  const b = Buffer.from(challenge);
  return a.length === b.length && timingSafeEqual(a, b);
}

function secretMatches(secret: string, storedHashB64: string): boolean {
  const a = Buffer.from(sha256Base64(secret));
  const b = Buffer.from(storedHashB64);
  return a.length === b.length && timingSafeEqual(a, b);
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface AuthorizeParams {
  response_type?: string;
  client_id?: string;
  redirect_uri?: string;
  scope?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  nonce?: string;
  prompt?: string;
  org?: string;
}

const OIDC_FIELDS: (keyof AuthorizeParams)[] = [
  "response_type",
  "client_id",
  "redirect_uri",
  "scope",
  "state",
  "code_challenge",
  "code_challenge_method",
  "nonce",
  "prompt",
  "org",
];

function loginPage(
  params: AuthorizeParams,
  action: string,
  error?: string,
  demo?: { email: string; password: string },
): string {
  const hidden = OIDC_FIELDS.map((f) =>
    params[f] ? `<input type="hidden" name="${f}" value="${esc(String(params[f]))}">` : "",
  ).join("\n      ");
  const emailValue = demo ? ` value="${esc(demo.email)}"` : "";
  const passwordValue = demo ? ` value="${esc(demo.password)}"` : "";
  const hint = demo ? `<p class="hint">Demo: ${esc(demo.email)} / ${esc(demo.password)}</p>` : "";
  return `<!doctype html>
<html lang="sv"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Logga in · Pixdrift</title>
<style>
  body{font-family:Geist,ui-sans-serif,system-ui,sans-serif;margin:0;min-height:100vh;display:grid;place-items:center;background:#fbfbf9;color:#101317}
  .card{background:#ffffff;padding:2rem;border-radius:0;border:1px solid #e6e5e0;width:min(92vw,360px)}
  .brand{display:flex;align-items:center;gap:.6rem;margin-bottom:1.25rem}
  .wordmark{font-size:.72rem;font-weight:600;letter-spacing:.18em}
  h1{font-size:1.15rem;margin:0}
  label{display:block;font-size:.8rem;color:#363b42;margin:.75rem 0 .25rem}
  input[type=email],input[type=password]{width:100%;box-sizing:border-box;padding:.6rem .7rem;border:1px solid #e6e5e0;border-radius:0;font-size:1rem;background:#fbfbf9}
  input:focus-visible{outline:1px solid #1f4b8f;outline-offset:1px;box-shadow:0 0 0 1px #1f4b8f}
  button{margin-top:1.25rem;width:100%;padding:.65rem;border:0;border-radius:0;background:#101317;color:#fbfbf9;font-weight:600;font-size:1rem;cursor:pointer}
  button:hover{background:#363b42}
  .err{margin-top:.75rem;color:#8a2a33;font-size:.85rem;border-left:2px solid #8a2a33;padding-left:.5rem}
  .hint{margin-top:1rem;font-size:.75rem;color:#6a7078}
  .hint a{color:#101317}
</style></head>
<body>
  <form class="card" method="post" action="${esc(action)}">
    <div class="brand"><span class="wordmark">PIXDRIFT</span><h1>Inloggning</h1></div>
    ${hidden}
    <label for="email">E-post</label>
    <input id="email" name="email" type="email" autocomplete="username" required autofocus${emailValue}>
    <label for="password">Lösenord</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required${passwordValue}>
    ${error ? `<p class="err">${esc(error)}</p>` : ""}
    <button type="submit">Logga in</button>
    ${hint}
    <p class="hint">Inget konto? <a href="/upphandling">Begär åtkomst via koncernupphandling</a>.</p>
  </form>
</body></html>`;
}

function errorPage(message: string): string {
  return `<!doctype html><html lang="sv"><head><meta charset="utf-8"><title>Fel</title></head>
<body style="font-family:system-ui;margin:3rem"><h1>Begäran kan inte behandlas</h1><p>${esc(message)}</p></body></html>`;
}

export async function createIdentityServer(config: IdentityConfig): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(cookie, { secret: config.sessionSecret });
  await app.register(formbody);

  const sessionCookieName = config.sessionCookieName ?? DEFAULTS.sessionCookieName;
  const cookieSecure = config.cookieSecure ?? DEFAULTS.cookieSecure;
  // The login form must post back to the authorize endpoint relative to the
  // issuer path, so the IdP works both at an origin root (issuer
  // `https://id.example`) and mounted under a path prefix (issuer
  // `https://app.example/idp`, e.g. co-located inside the kansli Next app).
  const authorizeAction = `${new URL(config.issuer).pathname.replace(/\/+$/, "")}/authorize`;
  const authCodeTtl = config.authCodeTtl ?? DEFAULTS.authCodeTtl;
  // Verify against ALL published keys (active + any rotated-in), so tokens
  // signed just before a key rotation still validate at /userinfo.
  const verifyJwks = createLocalJWKSet({
    keys: [config.signingKey.publicJwk, ...(config.additionalPublicJwks ?? [])],
  });

  const clientById = new Map<string, OidcClient>();
  for (const client of config.clients) clientById.set(client.clientId, client);

  // Simple per-instance brute-force throttle: count FAILED logins per ip+email,
  // reset on success. Multi-instance deployments should back this with Redis.
  const MAX_LOGIN_FAILURES = 10;
  const LOGIN_WINDOW_MS = 15 * 60_000;
  const loginFailures = new Map<string, { count: number; resetAt: number }>();

  function currentUserId(request: import("fastify").FastifyRequest): string | null {
    const raw = request.cookies[sessionCookieName];
    if (!raw) return null;
    const unsigned = app.unsignCookie(raw);
    return unsigned.valid ? unsigned.value : null;
  }

  function setSession(reply: FastifyReply, userId: string): void {
    reply.setCookie(sessionCookieName, userId, {
      signed: true,
      httpOnly: true,
      sameSite: "lax",
      secure: cookieSecure,
      path: "/",
      maxAge: 60 * 60 * 8,
    });
  }

  function validateClientRedirect(
    params: AuthorizeParams,
  ): { client: OidcClient; redirectUri: string } | { error: string } {
    const client = params.client_id ? clientById.get(params.client_id) : undefined;
    if (!client) return { error: "okänd client_id" };
    const redirectUri = params.redirect_uri ?? "";
    if (!client.redirectUris.includes(redirectUri)) return { error: "redirect_uri matchar inte" };
    return { client, redirectUri };
  }

  async function issueCodeAndRedirect(
    reply: FastifyReply,
    client: OidcClient,
    redirectUri: string,
    params: AuthorizeParams,
    userId: string,
  ): Promise<void> {
    const orgId = params.org ?? (await defaultOrgId(config.store, userId));
    const code = newOpaqueId(32);
    await config.store.saveAuthCode({
      code,
      clientId: client.clientId,
      userId,
      orgId,
      redirectUri,
      codeChallenge: params.code_challenge ?? "",
      nonce: params.nonce ?? null,
      scope: params.scope ?? "openid",
      expiresAt: Date.now() + authCodeTtl * 1000,
    });
    const url = new URL(redirectUri);
    url.searchParams.set("code", code);
    if (params.state) url.searchParams.set("state", params.state);
    reply.redirect(url.toString());
  }

  // ---- Discovery + JWKS ----------------------------------------------------
  app.get("/.well-known/openid-configuration", async () => ({
    issuer: config.issuer,
    authorization_endpoint: `${config.issuer}/authorize`,
    token_endpoint: `${config.issuer}/token`,
    userinfo_endpoint: `${config.issuer}/userinfo`,
    jwks_uri: `${config.issuer}/jwks.json`,
    end_session_endpoint: `${config.issuer}/logout`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: [config.signingKey.alg],
    scopes_supported: ["openid", "profile", "email"],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post"],
  }));

  app.get("/jwks.json", async () => {
    const base = jwks(config.signingKey).keys;
    const extra = config.additionalPublicJwks ?? [];
    const seen = new Set(base.map((k) => k.kid));
    return { keys: [...base, ...extra.filter((k) => !seen.has(k.kid))] };
  });

  app.get("/halsa", async () => ({ status: "ok", lage: "drift", issuer: config.issuer }));

  // ---- Authorization endpoint ---------------------------------------------
  app.get<{ Querystring: AuthorizeParams }>("/authorize", async (request, reply) => {
    const params = request.query;
    const validation = validateClientRedirect(params);
    if ("error" in validation) {
      return reply.code(400).type("text/html").send(errorPage(validation.error));
    }
    const { client, redirectUri } = validation;

    if ((params.response_type ?? "") !== "code") {
      const url = new URL(redirectUri);
      url.searchParams.set("error", "unsupported_response_type");
      if (params.state) url.searchParams.set("state", params.state);
      return reply.redirect(url.toString());
    }
    if (!params.code_challenge || params.code_challenge_method !== "S256") {
      const url = new URL(redirectUri);
      url.searchParams.set("error", "invalid_request");
      url.searchParams.set("error_description", "PKCE (S256) krävs");
      if (params.state) url.searchParams.set("state", params.state);
      return reply.redirect(url.toString());
    }

    const userId = currentUserId(request);
    if (userId && params.prompt !== "login") {
      const current = await config.store.findUserById(userId);
      if (current && current.status === "active") {
        await issueCodeAndRedirect(reply, client, redirectUri, params, userId);
        return reply;
      }
    }
    return reply
      .type("text/html")
      .send(loginPage(params, authorizeAction, undefined, config.demoLogin));
  });

  app.post<{ Body: AuthorizeParams & { email?: string; password?: string } }>(
    "/authorize",
    async (request, reply) => {
      const params = request.body;
      const validation = validateClientRedirect(params);
      if ("error" in validation) {
        return reply.code(400).type("text/html").send(errorPage(validation.error));
      }
      const { client, redirectUri } = validation;

      const email = (request.body.email ?? "").trim();
      const password = request.body.password ?? "";

      const throttleKey = `${request.ip}:${email.toLowerCase()}`;
      const now = Date.now();
      const failure = loginFailures.get(throttleKey);
      if (failure && failure.resetAt > now && failure.count >= MAX_LOGIN_FAILURES) {
        return reply
          .code(429)
          .type("text/html")
          .send(
            loginPage(
              params,
              authorizeAction,
              "För många försök. Försök igen om en stund.",
              config.demoLogin,
            ),
          );
      }

      const user = await config.store.findUserByEmail(email);
      const ok =
        user && user.status === "active" && (await verifyPassword(password, user.passwordHash));
      if (!user || !ok) {
        const base =
          failure && failure.resetAt > now ? failure : { count: 0, resetAt: now + LOGIN_WINDOW_MS };
        base.count += 1;
        loginFailures.set(throttleKey, base);
        return reply
          .code(200)
          .type("text/html")
          .send(loginPage(params, authorizeAction, "Fel e-post eller lösenord.", config.demoLogin));
      }
      loginFailures.delete(throttleKey);

      // Opportunistic re-hash if a legacy scheme ever verifies (migration path).
      if (!isCurrentScheme(user.passwordHash)) {
        await config.store.updateUserPassword(user.id, await hashPassword(password));
      }

      setSession(reply, user.id);
      await issueCodeAndRedirect(reply, client, redirectUri, params, user.id);
      return reply;
    },
  );

  // ---- Token endpoint ------------------------------------------------------
  app.post<{ Body: Record<string, string> }>("/token", async (request, reply) => {
    const body = request.body ?? {};
    if (body.grant_type !== "authorization_code") {
      return reply.code(400).send({ error: "unsupported_grant_type" });
    }

    // Client authentication (Basic or POST body).
    let clientId = body.client_id;
    let clientSecret = body.client_secret;
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith("Basic ")) {
      const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf8");
      const idx = decoded.indexOf(":");
      clientId = decoded.slice(0, idx);
      clientSecret = decoded.slice(idx + 1);
    }
    const client = clientId ? clientById.get(clientId) : undefined;
    if (!client) return reply.code(401).send({ error: "invalid_client" });
    if (client.clientSecretHash) {
      if (!clientSecret || !secretMatches(clientSecret, client.clientSecretHash)) {
        return reply.code(401).send({ error: "invalid_client" });
      }
    }

    const record = await config.store.takeAuthCode(body.code ?? "");
    if (!record || record.clientId !== client.clientId) {
      return reply.code(400).send({ error: "invalid_grant" });
    }
    if (record.redirectUri !== (body.redirect_uri ?? "")) {
      return reply.code(400).send({ error: "invalid_grant", error_description: "redirect_uri" });
    }
    if (!body.code_verifier || !pkceMatches(body.code_verifier, record.codeChallenge)) {
      return reply.code(400).send({ error: "invalid_grant", error_description: "PKCE" });
    }

    const user = await config.store.findUserById(record.userId);
    // A user suspended after the code was issued must not receive tokens.
    if (!user || user.status !== "active") return reply.code(400).send({ error: "invalid_grant" });

    const subject = userSubject(user.id);
    const org = record.orgId ? await orgContext(config.store, user.id, record.orgId) : null;
    const memberships = await membershipsFor(config.store, user.id);
    const audience =
      client.audiences && client.audiences.length > 0 ? client.audiences : client.clientId;

    const accessToken = await signAccessToken(config, {
      subject,
      audience,
      org,
    });
    const idToken = await signIdToken(config, {
      subject,
      audience: client.clientId,
      email: user.email,
      emailVerified: true,
      name: user.displayName,
      nonce: record.nonce,
      org,
      memberships,
    });

    return reply.send({
      access_token: accessToken,
      id_token: idToken,
      token_type: "Bearer",
      expires_in: config.accessTokenTtl ?? DEFAULTS.accessTokenTtl,
      scope: record.scope,
    });
  });

  // ---- Userinfo ------------------------------------------------------------
  app.get("/userinfo", async (request, reply) => {
    const auth = request.headers.authorization ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return reply.code(401).send({ error: "invalid_token" });
    let userId: string;
    try {
      const { payload } = await jwtVerify(token, verifyJwks, { issuer: config.issuer });
      userId = parseRef(String(payload.sub)).id;
    } catch {
      return reply.code(401).send({ error: "invalid_token" });
    }
    const user = await config.store.findUserById(userId);
    if (!user) return reply.code(401).send({ error: "invalid_token" });
    return reply.send({
      sub: userSubject(user.id),
      email: user.email,
      email_verified: true,
      name: user.displayName,
      memberships: await membershipsFor(config.store, user.id),
    });
  });

  // ---- Logout (end session) ------------------------------------------------
  // RP-initiated logout may arrive as GET (redirect) or POST (form); both must
  // clear the IdP SSO session so a later /authorize prompts for credentials.
  const endSessionHandler = async (
    request: import("fastify").FastifyRequest<{
      Querystring: { post_logout_redirect_uri?: string; state?: string; client_id?: string };
    }>,
    reply: FastifyReply,
  ) => {
    reply.clearCookie(sessionCookieName, { path: "/" });
    const target = request.query.post_logout_redirect_uri;
    // Open-redirect guard: only redirect to a URI registered for the named
    // client. An unknown/unregistered target is ignored (we just log out).
    if (target) {
      const client = request.query.client_id ? clientById.get(request.query.client_id) : undefined;
      const allowed = client?.postLogoutRedirectUris ?? [];
      if (allowed.includes(target)) {
        const url = new URL(target);
        if (request.query.state) url.searchParams.set("state", request.query.state);
        return reply.redirect(url.toString());
      }
    }
    return reply
      .type("text/html")
      .send(`<!doctype html><meta charset="utf-8"><p>Du är utloggad.</p>`);
  };
  app.route({ method: ["GET", "POST"], url: "/logout", handler: endSessionHandler });

  return app;
}
