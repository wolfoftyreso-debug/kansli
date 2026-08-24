import { SYSTEM_MODULES } from "@pixdrift/systems";
import { gatewaySnapshot } from "@/lib/platform/ai";
import { handleApi, json } from "@/lib/platform/http";

export async function GET() {
  return handleApi(async ({ pool }) => {
    await pool.query("select 1");
    const gateway = gatewaySnapshot();
    return json({
      ok: true,
      database: "up",
      gateway: {
        configured: gateway.configured,
        auth: gateway.auth,
        model: gateway.model,
      },
      systems: SYSTEM_MODULES.map((module) => ({
        id: module.id,
        status: module.status,
        schema: module.schema,
        basePath: module.basePath,
      })),
    });
  });
}
