/**
 * Standalone runner for the Pixdrift identity provider.
 *
 * Reads configuration from the environment; falls back to a seeded in-memory
 * store and a generated signing key so `pnpm --filter @pixdrift/identity start`
 * brings up a working SSO endpoint for local development and demos. The actual
 * server construction lives in {@link bootIdentityFromEnv} so the same boot is
 * reused by the kansli Next app, which mounts the IdP under `/idp`.
 */

import { bootIdentityFromEnv } from "./boot.ts";

async function main(): Promise<void> {
  const port = Number(process.env.PORT ?? 4000);
  const host = process.env.HOST ?? "127.0.0.1";
  const issuer = process.env.ISSUER ?? `http://${host}:${port}`;

  const app = await bootIdentityFromEnv({ issuer });

  await app.listen({ port, host });
  console.log(`[pixdrift-identity] issuer ${issuer} listening on http://${host}:${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
