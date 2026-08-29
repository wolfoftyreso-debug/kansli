/**
 * List the models exposed by the Vercel AI Gateway.
 *
 *   pnpm --filter @pixdrift/ai-core models
 *
 * Requires AI_GATEWAY_API_KEY (or VERCEL_OIDC_TOKEN) in the environment.
 * Prints the total count and the full list of `provider/model` slugs so a
 * specific slug can be pinned via AI_GATEWAY_MODEL.
 */

import { gatewayFromEnv } from "../src/index.ts";

async function main(): Promise<void> {
  const gateway = gatewayFromEnv();
  if (!gateway || !gateway.listModels) {
    console.error(
      "No gateway credential found. Set AI_GATEWAY_API_KEY (or VERCEL_OIDC_TOKEN) in the environment/Secrets.",
    );
    process.exit(1);
  }
  const models = await gateway.listModels();
  console.log(`Vercel AI Gateway: ${models.length} models available\n`);
  for (const id of models) console.log(`  ${id}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
