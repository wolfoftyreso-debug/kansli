import { migrateWorkspace } from "../packages/db/src/index.ts";

async function main(): Promise<void> {
  const ownerUrl = process.env.PIXDRIFT_DB_OWNER_URL ?? process.env.PIXDRIFT_TEST_OWNER_URL;
  if (!ownerUrl) {
    console.error("Set PIXDRIFT_DB_OWNER_URL (or PIXDRIFT_TEST_OWNER_URL in test).");
    process.exit(1);
  }

  const results = await migrateWorkspace({
    ownerUrl,
    root: process.cwd(),
    appRole: process.env.PIXDRIFT_DB_APP_ROLE ?? "pixdrift_app",
  });

  for (const [schema, result] of Object.entries(results)) {
    console.log(
      `${schema}: applied ${result.applied.length} · already ${result.already.length}` +
        (result.applied.length ? ` (${result.applied.join(", ")})` : ""),
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
