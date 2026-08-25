import { buildCapabilityGraph } from "@/lib/platform/capability-graph";

export const dynamic = "force-dynamic";

/** Public catalog. Same facts as /documentation/capabilities. No secrets. No database. */
export async function GET() {
  const requestId = crypto.randomUUID();
  return Response.json(buildCapabilityGraph(), {
    headers: { "x-request-id": requestId, "cache-control": "no-store" },
  });
}
