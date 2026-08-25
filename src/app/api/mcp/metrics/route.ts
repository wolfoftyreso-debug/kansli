import { requireActor } from "@pixdrift/api-core";
import { metricsSnapshot } from "@pixdrift/mcp-core";
import { handleApi, json } from "@/lib/platform/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return handleApi(async ({ actor }) => {
    requireActor(actor);
    return json(metricsSnapshot());
  });
}
