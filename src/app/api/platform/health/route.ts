import { SYSTEM_MODULES } from "@pixdrift/systems";
import { gatewaySnapshot } from "@/lib/platform/ai";
import { handleApi, json } from "@/lib/platform/http";
import { ritaEngineSnapshot } from "@/lib/rita/resolve-engine";

export async function GET() {
  return handleApi(async ({ pool }) => {
    await pool.query("select 1");
    const gateway = gatewaySnapshot();
    const rita = ritaEngineSnapshot();
    return json({
      ok: true,
      database: "up",
      gateway: {
        configured: gateway.configured,
        auth: gateway.auth,
        model: gateway.model,
      },
      rita: {
        available: rita.available,
        kind: rita.kind,
        modelReady: rita.modelReady,
        modelId: rita.modelId,
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
