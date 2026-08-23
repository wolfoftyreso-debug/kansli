import { SYSTEM_MODULES } from "@pixdrift/systems";
import { handleApi, json } from "@/lib/platform/http";

export async function GET() {
  return handleApi(async ({ pool }) => {
    await pool.query("select 1");
    return json({
      ok: true,
      database: "up",
      systems: SYSTEM_MODULES.map((module) => ({
        id: module.id,
        status: module.status,
        schema: module.schema,
        basePath: module.basePath,
      })),
    });
  });
}
