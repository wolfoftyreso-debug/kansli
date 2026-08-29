import { createPool } from "../packages/db/src/index.ts";
import { isHouseSession } from "../src/lib/kansli/intakes.ts";
import { lookupOpsDebug } from "../src/lib/platform/ops-debug.ts";

function parseArgs(argv: string[]): { q: string | null; orgRef: string } {
  const args = argv.slice(2).filter((item) => !item.endsWith("ops-lookup.ts"));
  let orgRef = process.env.PIXDRIFT_OPS_ORG ?? "";
  const rest: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--org") {
      orgRef = args[i + 1] ?? "";
      i += 1;
      continue;
    }
    if (args[i] === "--") continue;
    rest.push(args[i] ?? "");
  }
  return { q: rest.at(-1) ?? null, orgRef };
}

async function main(): Promise<void> {
  const { q, orgRef } = parseArgs(process.argv);
  if (!q || q.startsWith("--")) {
    console.error("Usage: pnpm ops:lookup -- <request-id> [--org pixdrift:org:…]");
    process.exit(1);
  }

  const url = process.env.DATABASE_URL ?? process.env.PIXDRIFT_TEST_DATABASE_URL;
  if (!url) {
    console.error("Set DATABASE_URL (the app role, not the owner).");
    process.exit(1);
  }

  const pool = createPool(url, {
    applicationName: "ops-lookup",
    max: 2,
    statementTimeoutMs: 15_000,
  });
  try {
    const scope = orgRef && !isHouseSession(orgRef) ? "org" : "house";
    const result = await lookupOpsDebug(pool, {
      q,
      scope,
      orgRef: orgRef || "pixdrift:org:org-exempelbolaget",
    });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
