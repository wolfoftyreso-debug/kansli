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

  const webClient: OidcClient = {
    clientId: process.env.CLIENT_ID ?? "kansli-web",
    clientSecretHash: sha256Base64ForSecret(process.env.CLIENT_SECRET ?? "kansli-dev-secret"),
    redirectUris: envList("REDIRECT_URIS", ["http://127.0.0.1:3000/api/auth/callback"]),
    postLogoutRedirectUris: envList("POST_LOGOUT_URIS", ["http://127.0.0.1:3000/"]),
    audiences: envList("AUDIENCES", ["kansli-web", "alva-plattform", "rita-api"]),
    name: "Kansli (nav)",
  };

  const { store } = await seededStore();
  const signingKey = await generateSigningKey();

  const app = await createIdentityServer({
    issuer,
    store,
    signingKey,
    clients: [webClient],
    sessionSecret,
    cookieSecure: process.env.COOKIE_SECURE === "true",
  });

  await app.listen({ port, host });
  console.log(`[pixdrift-identity] issuer ${issuer} lyssnar på http://${host}:${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
