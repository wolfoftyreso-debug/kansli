import { buildOpenApiDocument } from "@/lib/platform/openapi";

export const dynamic = "force-dynamic";

/** Public OpenAPI 3.1 document. Same facts as the Capability Graph. No secrets. No database. */
export async function GET() {
  const requestId = crypto.randomUUID();
  return Response.json(buildOpenApiDocument(), {
    headers: {
      "x-request-id": requestId,
      "cache-control": "no-store",
    },
  });
}
