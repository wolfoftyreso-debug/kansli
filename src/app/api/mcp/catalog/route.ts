import { requireActor } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { mcpCatalog } from "@/lib/mcp/handle";

export const dynamic = "force-dynamic";

export async function GET() {
  return handleApi(async ({ actor }) => {
    requireActor(actor);
    return json(mcpCatalog());
  });
}
