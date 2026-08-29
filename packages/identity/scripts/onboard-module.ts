/**
 * Self-service module onboarding.
 *
 * Registers (upserts) an OIDC client for a new Pixdrift module in the IdP's
 * DB-backed client registry — the whole "a new module is a row, not a code
 * change" promise. Run with the owner connection.
 *
 *   pnpm onboard -- --id nymodul-web --name "Ny modul" \
 *     --redirect https://nymodul/auth/pixdrift/callback \
 *     --audience nymodul-api
 *
 *   # public SPA client (PKCE, no secret):
 *   pnpm onboard -- --id spa-web --name "SPA" --public \
 *     --redirect https://spa/opportunity --audience spa-api
 *
 * Owner URL from --owner-url or PIXDRIFT_DB_OWNER_URL.
 */

import pg from "pg";
import { randomBytes } from "node:crypto";
import { sha256Base64ForSecret } from "../src/secret.ts";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function has(name: string): boolean {
  return process.argv.includes(`--${name}`);
}
function list(name: string): string[] {
  return (arg(name) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main(): Promise<void> {
  const clientId = arg("id");
  const name = arg("name") ?? clientId;
  const isPublic = has("public");
  const redirects = list("redirect");
  const audiences = list("audience");
  const postLogout = list("post-logout");
  const ownerUrl = arg("owner-url") ?? process.env.PIXDRIFT_DB_OWNER_URL;

  if (!clientId || redirects.length === 0 || !ownerUrl) {
    console.error(
      "Required: --id, at least one --redirect, and --owner-url or PIXDRIFT_DB_OWNER_URL.\n" +
        "Optional: --name, --audience a,b, --post-logout u, --public",
    );
    process.exit(2);
  }

  const secret = isPublic ? null : randomBytes(24).toString("base64url");
  const clientSecretHash = secret ? sha256Base64ForSecret(secret) : null;

  const pool = new pg.Pool({ connectionString: ownerUrl });
  try {
    await pool.query(
      `insert into oauth_clients
         (client_id, name, client_secret_hash, redirect_uris, post_logout_redirect_uris, audiences)
       values ($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb)
       on conflict (client_id) do update set
         name = excluded.name,
         client_secret_hash = excluded.client_secret_hash,
         redirect_uris = excluded.redirect_uris,
         post_logout_redirect_uris = excluded.post_logout_redirect_uris,
         audiences = excluded.audiences`,
      [
        clientId,
        name,
        clientSecretHash,
        JSON.stringify(redirects),
        JSON.stringify(postLogout),
        JSON.stringify(audiences),
      ],
    );
  } finally {
    await pool.end();
  }

  console.log(`\n✓ Registered client: ${clientId} (${isPublic ? "public/PKCE" : "confidential"})`);
  console.log(`  redirect_uris : ${redirects.join(", ")}`);
  console.log(`  audiences     : ${audiences.join(", ") || "(none)"}`);
  console.log("\nModule configuration:");
  console.log(`  PIXDRIFT_ISSUER=<https://id.pixdrift.com>`);
  console.log(`  PIXDRIFT_CLIENT_ID=${clientId}`);
  if (secret)
    console.log(`  PIXDRIFT_CLIENT_SECRET=${secret}   # shown ONCE — store in the secrets store`);
  console.log(`  PIXDRIFT_REDIRECT_URI=${redirects[0]}`);
  console.log(
    "\nNo IdP restart code is needed — restart (or reload) the IdP so it picks up the row.\n",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
