/**
 * Environment-driven boot for the Pixdrift identity provider.
 *
 * Builds a ready {@link FastifyInstance} from process env, choosing a Postgres
 * store when `DATABASE_URL` is set and otherwise falling back to a seeded
 * in-memory store with a freshly generated signing key. This is shared by the
 * standalone runner (`main.ts`, which then calls `listen`) and by the kansli
 * Next app, which mounts the IdP under `/idp` and drives it via `app.inject`.
 */

import type { FastifyInstance } from "fastify";
import { createIdentityServer } from "./server.ts";
import { generateSigningKey } from "./keys.ts";
import { seededStore } from "./store.ts";
import { sha256Base64ForSecret } from "./secret.ts";
import type { OidcClient } from "./config.ts";

const DEV_SESSION_SECRET = "dev-idp-session-secret-min-32-chars-0001";

/** Vercel preview builds set NODE_ENV=production. That is not production. */
export function isHardenedIdentityRuntime(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.VERCEL_ENV === "preview" || env.VERCEL_ENV === "development") return false;
  return env.APP_ENV === "prod" || env.APP_ENV === "production" || env.VERCEL_ENV === "production";
}

const MIN_HARDENED_SECRET_LENGTH = 32;

/** Fail closed at Identity boot. Preview and local memory store stay available. */
export function assertHardenedIdentityBoot(env: NodeJS.ProcessEnv = process.env): void {
  if (!isHardenedIdentityRuntime(env)) return;
  if (!env.DATABASE_URL?.trim()) {
    throw new Error("Identity vägrar starta i produktion utan DATABASE_URL.");
  }
  if (env.PIXDRIFT_SEED_DEMO === "true") {
    throw new Error("Identity vägrar starta i produktion med PIXDRIFT_SEED_DEMO=true.");
  }
  if (env.COOKIE_SECURE === "false") {
    throw new Error("Identity vägrar starta i produktion med COOKIE_SECURE=false.");
  }
}

function vercelHttpsOrigins(env: NodeJS.ProcessEnv): string[] {
  const hosts = [env.VERCEL_BRANCH_URL, env.VERCEL_URL]
    .map((raw) =>
      raw
        ?.trim()
        .replace(/^https?:\/\//, "")
        .replace(/\/+$/, ""),
    )
    .filter((host): host is string => Boolean(host));
  return [...new Set(hosts)].map((host) => `https://${host}`);
}

/** Preview hostnames are not in the production client registry. Allow this deploy's callback. */
export function withDeploymentRedirects(
  clients: OidcClient[],
  env: NodeJS.ProcessEnv = process.env,
): OidcClient[] {
  const origins = vercelHttpsOrigins(env);
  if (origins.length === 0) return clients;
  const kansliId = env.CLIENT_ID ?? "kansli-web";
  return clients.map((client) => {
    if (client.clientId !== kansliId) return client;
    let redirectUris = client.redirectUris;
    let postLogoutRedirectUris = client.postLogoutRedirectUris ?? [];
    for (const origin of origins) {
      const callback = `${origin}/api/auth/callback`;
      const home = `${origin}/`;
      if (!redirectUris.includes(callback)) redirectUris = [...redirectUris, callback];
      if (!postLogoutRedirectUris.includes(home)) {
        postLogoutRedirectUris = [...postLogoutRedirectUris, home];
      }
    }
    return { ...client, redirectUris, postLogoutRedirectUris };
  });
}

/** Preview BFF often lacks production PIXDRIFT_CLIENT_SECRET. Match this instance to the fallback. */
export function withPreviewClientSecret(
  clients: OidcClient[],
  env: NodeJS.ProcessEnv = process.env,
): OidcClient[] {
  if (env.VERCEL_ENV !== "preview" && env.VERCEL_ENV !== "development") return clients;
  const kansliId = env.CLIENT_ID ?? "kansli-web";
  const secret = env.PIXDRIFT_CLIENT_SECRET ?? env.CLIENT_SECRET ?? "kansli-dev-secret";
  const clientSecretHash = sha256Base64ForSecret(secret);
  return clients.map((client) =>
    client.clientId === kansliId ? { ...client, clientSecretHash } : client,
  );
}

export interface BootOptions {
  /** OIDC issuer. Defaults to `ISSUER` env, then `http://${HOST}:${PORT}`. */
  issuer?: string;
  /** Env source (injectable for tests). Defaults to `process.env`. */
  env?: NodeJS.ProcessEnv;
}

function envList(env: NodeJS.ProcessEnv, name: string, fallback: string[]): string[] {
  const raw = env[name];
  if (!raw) return fallback;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** The registered subsystems of the Pixdrift family, derived from env. */
export function clientsFromEnv(env: NodeJS.ProcessEnv = process.env): OidcClient[] {
  return [
    {
      clientId: env.CLIENT_ID ?? "kansli-web",
      clientSecretHash: sha256Base64ForSecret(env.CLIENT_SECRET ?? "kansli-dev-secret"),
      redirectUris: envList(env, "REDIRECT_URIS", ["http://127.0.0.1:3000/api/auth/callback"]),
      postLogoutRedirectUris: envList(env, "POST_LOGOUT_URIS", ["http://127.0.0.1:3000/"]),
      audiences: envList(env, "AUDIENCES", ["kansli-web"]),
      name: "Kansli (nav)",
    },
    {
      clientId: env.ALVA_CLIENT_ID ?? "alva-web",
      clientSecretHash: sha256Base64ForSecret(env.ALVA_CLIENT_SECRET ?? "alva-dev-secret"),
      redirectUris: envList(env, "ALVA_REDIRECT_URIS", ["http://127.0.0.1:8080/auth/callback"]),
      postLogoutRedirectUris: envList(env, "ALVA_POST_LOGOUT_URIS", ["http://127.0.0.1:8080/"]),
      audiences: envList(env, "ALVA_AUDIENCES", ["alva-plattform", "alva-ai-orkester"]),
      name: "ALVA",
    },
    {
      clientId: env.RITA_CLIENT_ID ?? "rita-web",
      clientSecretHash: sha256Base64ForSecret(env.RITA_CLIENT_SECRET ?? "rita-dev-secret"),
      redirectUris: envList(env, "RITA_REDIRECT_URIS", [
        "http://127.0.0.1:3000/auth/pixdrift/callback",
      ]),
      postLogoutRedirectUris: envList(env, "RITA_POST_LOGOUT_URIS", ["http://127.0.0.1:3000/"]),
      audiences: envList(env, "RITA_AUDIENCES", ["rita-api"]),
      name: "RITA",
    },
    {
      // Public SPA client: PKCE only, no client secret (clientSecretHash omitted).
      clientId: env.TORA_CLIENT_ID ?? "tora-web",
      redirectUris: envList(env, "TORA_REDIRECT_URIS", ["http://127.0.0.1:8080/opportunity"]),
      postLogoutRedirectUris: envList(env, "TORA_POST_LOGOUT_URIS", [
        "http://127.0.0.1:8080/opportunity",
      ]),
      audiences: envList(env, "TORA_AUDIENCES", ["tora-opportunity"]),
      name: "TORA",
    },
    {
      clientId: env.BRITT_CLIENT_ID ?? "britt-web",
      clientSecretHash: sha256Base64ForSecret(env.BRITT_CLIENT_SECRET ?? "britt-dev-secret"),
      redirectUris: envList(env, "BRITT_REDIRECT_URIS", [
        "http://127.0.0.1:3000/auth/pixdrift/callback",
      ]),
      postLogoutRedirectUris: envList(env, "BRITT_POST_LOGOUT_URIS", ["http://127.0.0.1:3000/"]),
      audiences: envList(env, "BRITT_AUDIENCES", ["britt-api"]),
      name: "BRITT",
    },
    {
      clientId: env.IRMA_CLIENT_ID ?? "irma-web",
      clientSecretHash: sha256Base64ForSecret(env.IRMA_CLIENT_SECRET ?? "irma-dev-secret"),
      redirectUris: envList(env, "IRMA_REDIRECT_URIS", [
        "http://127.0.0.1:5173/auth/pixdrift/callback",
      ]),
      postLogoutRedirectUris: envList(env, "IRMA_POST_LOGOUT_URIS", ["http://127.0.0.1:5173/"]),
      audiences: envList(env, "IRMA_AUDIENCES", ["irma-api"]),
      name: "IRMA",
    },
  ];
}

/**
 * Build a ready identity server from the environment. The caller decides how to
 * serve it (`listen` for the standalone runner, `inject` for the co-located
 * Next mount).
 */
export async function bootIdentityFromEnv(opts: BootOptions = {}): Promise<FastifyInstance> {
  const env = opts.env ?? process.env;
  const port = Number(env.PORT ?? 4000);
  const host = env.HOST ?? "127.0.0.1";
  const issuer = opts.issuer ?? env.ISSUER ?? `http://${host}:${port}`;
  const isProd = isHardenedIdentityRuntime(env);
  assertHardenedIdentityBoot(env);

  // Fail closed in production: no weak/default signing secret for IdP sessions.
  const sessionSecret = env.SESSION_SECRET ?? env.APP_SESSION_SECRET ?? DEV_SESSION_SECRET;
  if (
    isProd &&
    (!sessionSecret ||
      sessionSecret === DEV_SESSION_SECRET ||
      sessionSecret.length < MIN_HARDENED_SECRET_LENGTH)
  ) {
    throw new Error("SESSION_SECRET måste sättas till ett starkt, unikt värde i produktion");
  }
  // Secure cookies by default over HTTPS; overridable with COOKIE_SECURE.
  // Hardened runtime always sets the Secure flag.
  const cookieSecure = isProd
    ? true
    : env.COOKIE_SECURE !== undefined
      ? env.COOKIE_SECURE === "true"
      : issuer.startsWith("https://");

  const clients = withPreviewClientSecret(withDeploymentRedirects(clientsFromEnv(env), env), env);
  // Demo prefill is local/preview only. Production refuses PIXDRIFT_SEED_DEMO.
  const demoLogin =
    !isProd && env.PIXDRIFT_SEED_DEMO === "true"
      ? { email: "demo@exempelbolaget.se", password: "demo-losenord-1234" }
      : undefined;

  if (env.DATABASE_URL) {
    const { PgStore } = await import("./pg/store.ts");
    const { pgBootstrap } = await import("./pg/bootstrap.ts");
    // Owner-side bootstrap (schema/grants/seed/key/clients) is opt-in; in prod
    // migrations run separately as the owner. When an owner URL is given we
    // ensure the registry reflects the configured clients.
    if (env.PIXDRIFT_DB_OWNER_URL) {
      await pgBootstrap({
        ownerUrl: env.PIXDRIFT_DB_OWNER_URL,
        appRole: env.PIXDRIFT_DB_APP_ROLE ?? "pixdrift_app",
        clients,
        // Opt-in only: never seed the known-credential demo tenant by default.
        seedDemo: env.PIXDRIFT_SEED_DEMO === "true",
      });
    }
    const store = new PgStore(env.DATABASE_URL);
    const registered = await store.loadClients();
    const signingKey = await store.loadActiveSigningKey();
    const additionalPublicJwks = await store.otherPublicJwks(signingKey.kid);
    return createIdentityServer({
      issuer,
      store,
      signingKey,
      additionalPublicJwks,
      clients: withPreviewClientSecret(
        withDeploymentRedirects(registered.length > 0 ? registered : clients, env),
        env,
      ),
      sessionSecret,
      cookieSecure,
      demoLogin,
    });
  }

  if (isProd) {
    throw new Error("Identity vägrar starta i produktion utan DATABASE_URL.");
  }

  const { store } = await seededStore();
  const signingKey = await generateSigningKey();
  return createIdentityServer({
    issuer,
    store,
    signingKey,
    clients,
    sessionSecret,
    cookieSecure,
    demoLogin,
  });
}
