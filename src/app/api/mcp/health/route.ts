import { MCP_PROTOCOL_VERSION, metricsSnapshot } from "@pixdrift/mcp-core";
import { tryRuntime } from "@/lib/platform/page";
import { mcpCatalog } from "@/lib/mcp/handle";

export const dynamic = "force-dynamic";

export async function GET() {
  const runtime = tryRuntime();
  let database = "down";
  if (runtime) {
    try {
      await runtime.pool.query("select 1");
      database = "up";
    } catch {
      database = "down";
    }
  }
  const catalog = mcpCatalog();
  return Response.json({
    ok: database === "up",
    protocol: MCP_PROTOCOL_VERSION,
    endpoint: "/mcp",
    tools: catalog.tools.length,
    resources: catalog.resources.length,
    database,
    metrics: metricsSnapshot(),
  });
}
