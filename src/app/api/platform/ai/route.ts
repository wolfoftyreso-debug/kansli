import { ApiError, requireActor, requireOrg } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { gatewaySnapshot, listGatewayModels, pingGateway } from "@/lib/platform/ai";

export async function GET() {
  return handleApi(async () => {
    const snapshot = gatewaySnapshot();
    if (!snapshot.configured) {
      return json({ gateway: { ...snapshot, modelCount: null, models: [] } });
    }
    try {
      const models = await listGatewayModels();
      return json({
        gateway: {
          ...snapshot,
          modelCount: models.length,
          models: models.slice(0, 24),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "gateway_failed";
      return json({ gateway: { ...snapshot, modelCount: null, models: [], error: message } }, 502);
    }
  });
}

export async function POST() {
  return handleApi(async ({ actor }) => {
    requireActor(actor);
    requireOrg(actor);
    if (!gatewaySnapshot().configured) {
      throw new ApiError("invalid_request", "AI_GATEWAY_API_KEY eller VERCEL_OIDC_TOKEN saknas.");
    }
    try {
      return json({ ping: await pingGateway() });
    } catch (error) {
      const message = error instanceof Error ? error.message : "gateway_failed";
      throw new ApiError("upstream_unavailable", message);
    }
  });
}
