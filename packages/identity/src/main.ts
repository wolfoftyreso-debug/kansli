/**
 * Standalone runner for the Pixdrift identity provider.
 *
 * Reads configuration from the environment; falls back to a seeded in-memory
 * store and a generated signing key so `pnpm --filter @pixdrift/identity start`
 * brings up a working SSO endpoint for local development and demos.
 */

import { createIdentityServer } from "./server.ts";
import { generateSigningKey } from "./keys.ts";
import { seededStore } from "./store.ts";
import { sha256Base64ForSecret } from "./secret.ts";
import type { OidcClient } from "./config.ts";

function envList(name: string, fallback: string[]): string[] {
  const raw = process.env[name];
  if (!raw) return fallback;
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

async function main(): Promise<void> {
  const port = Number(process.env.PORT ?? 4000);
  const host = process.env.HOST ?? "127.0.0.1";
  const issuer = process.env.ISSUER ?? `http://${host}:${port}`;
  const sessionSecret = process.env.SESSION_SECRET ?? "dev-idp-session-secret-min-32-chars-0001";

  // Registered subsystems of the Pixdrift family. Each interactive client runs
  // the Authorization Code + PKCE BFF flow; `audiences` are the resource
  // servers its access tokens are meant for (verified via JWKS by that server).
  const clients: OidcClient[] = [
    {
      clientId: process.env.CLIENT_ID ?? "kansli-web",
      clientSecretHash: sha256Base64ForSecret(process.env.CLIENT_SECRET ?? "kansli-dev-secret"),
      redirectUris: envList("REDIRECT_URIS", ["http://127.0.0.1:3000/api/auth/callback"]),
      postLogoutRedirectUris: envList("POST_LOGOUT_URIS", ["http://127.0.0.1:3000/"]),
      audiences: envList("AUDIENCES", ["kansli-web"]),
      name: "Kansli (nav)",
    },
    {
      clientId: process.env.ALVA_CLIENT_ID ?? "alva-web",
      clientSecretHash: sha256Base64ForSecret(process.env.ALVA_CLIENT_SECRET ?? "alva-dev-secret"),
      redirectUris: envList("ALVA_REDIRECT_URIS", ["http://127.0.0.1:8080/auth/callback"]),
      postLogoutRedirectUris: envList("ALVA_POST_LOGOUT_URIS", ["http://127.0.0.1:8080/"]),
      audiences: envList("ALVA_AUDIENCES", ["alva-plattform", "alva-ai-orkester"]),
      name: "ALVA",
    },
    {
      clientId: process.env.RITA_CLIENT_ID ?? "rita-web",
      clientSecretHash: sha256Base64ForSecret(process.env.RITA_CLIENT_SECRET ?? "rita-dev-secret"),
      redirectUris: envList("RITA_REDIRECT_URIS", ["http://127.0.0.1:3000/auth/pixdrift/callback"]),
      postLogoutRedirectUris: envList("RITA_POST_LOGOUT_URIS", ["http://127.0.0.1:3000/"]),
      audiences: envList("RITA_AUDIENCES", ["rita-api"]),
      name: "RITA",
    },
    {
      // Public SPA client: PKCE only, no client secret (clientSecretHash omitted).
      clientId: process.env.TORA_CLIENT_ID ?? "tora-web",
      redirectUris: envList("TORA_REDIRECT_URIS", ["http://127.0.0.1:8080/opportunity"]),
      postLogoutRedirectUris: envList("TORA_POST_LOGOUT_URIS", ["http://127.0.0.1:8080/opportunity"]),
      audiences: envList("TORA_AUDIENCES", ["tora-opportunity"]),
      name: "TORA",
    },
    {
      clientId: process.env.BRITT_CLIENT_ID ?? "britt-web",
      clientSecretHash: sha256Base64ForSecret(process.env.BRITT_CLIENT_SECRET ?? "britt-dev-secret"),
      redirectUris: envList("BRITT_REDIRECT_URIS", ["http://127.0.0.1:3000/auth/pixdrift/callback"]),
      postLogoutRedirectUris: envList("BRITT_POST_LOGOUT_URIS", ["http://127.0.0.1:3000/"]),
      audiences: envList("BRITT_AUDIENCES", ["britt-api"]),
      name: "BRITT",
    },
    {
      clientId: process.env.IRMA_CLIENT_ID ?? "irma-web",
      clientSecretHash: sha256Base64ForSecret(process.env.IRMA_CLIENT_SECRET ?? "irma-dev-secret"),
      redirectUris: envList("IRMA_REDIRECT_URIS", ["http://127.0.0.1:5173/auth/pixdrift/callback"]),
      postLogoutRedirectUris: envList("IRMA_POST_LOGOUT_URIS", ["http://127.0.0.1:5173/"]),
      audiences: envList("IRMA_AUDIENCES", ["irma-api"]),
      name: "IRMA",
    },
  ];

  const app = process.env.DATABASE_URL
    ? await bootPostgres()
    : await bootInMemory();

  async function bootInMemory() {
    const { store } = await seededStore();
    const signingKey = await generateSigningKey();
    return createIdentityServer({
      issuer,
      store,
      signingKey,
      clients,
      sessionSecret,
      cookieSecure: process.env.COOKIE_SECURE === "true",
    });
  }

  async function bootPostgres() {
    const { PgStore } = await import("./pg/store.ts");
    const { pgBootstrap } = await import("./pg/bootstrap.ts");
    // Owner-side bootstrap (schema/grants/seed/key/clients) is opt-in; in prod
    // migrations run separately as the owner. When an owner URL is given we
    // ensure the registry reflects the configured clients.
    if (process.env.PIXDRIFT_DB_OWNER_URL) {
      await pgBootstrap({
        ownerUrl: process.env.PIXDRIFT_DB_OWNER_URL,
        appRole: process.env.PIXDRIFT_DB_APP_ROLE ?? "pixdrift_app",
        clients,
        seedDemo: process.env.PIXDRIFT_SEED_DEMO !== "false",
      });
    }
    const store = new PgStore(process.env.DATABASE_URL as string);
    const registered = await store.loadClients();
    const signingKey = await store.loadActiveSigningKey();
    const additionalPublicJwks = await store.otherPublicJwks(signingKey.kid);
    return createIdentityServer({
      issuer,
      store,
      signingKey,
      additionalPublicJwks,
      clients: registered.length > 0 ? registered : clients,
      sessionSecret,
      cookieSecure: process.env.COOKIE_SECURE === "true",
    });
  }

  await app.listen({ port, host });
  console.log(`[pixdrift-identity] issuer ${issuer} lyssnar på http://${host}:${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
