import { handleMcp, MCP_PROTOCOL_VERSION } from "@pixdrift/mcp-core";
import { tryRuntime } from "@/lib/platform/page";
import { resolveMcpActor } from "./actor";
import { attachRuntime } from "./runtime";
import { registerMcpResources } from "./resources";
import { pixdriftRegistry } from "./tools";

let wired = false;

function registry() {
  const current = pixdriftRegistry();
  if (!wired) {
    registerMcpResources(current);
    wired = true;
  }
  return current;
}

export async function handlePixdriftMcp(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const authorization = request.headers.get("authorization");
  let resolved;
  try {
    resolved = await resolveMcpActor(authorization);
  } catch {
    resolved = { actor: null, source: "none" as const, clientId: null };
  }

  let body: unknown = {};
  if (request.method !== "GET") {
    body = await request.json().catch(() => null);
  } else {
    body = {
      jsonrpc: "2.0",
      id: "discover",
      method: "server/discover",
    };
  }

  const result = await handleMcp({
    headers: request.headers,
    body,
    authorization,
    registry: registry(),
    runtime: attachRuntime({
      requestId,
      actor: resolved.actor,
      locale: request.headers.get("accept-language") ?? "sv",
      clientId: resolved.clientId,
      source: resolved.source,
    }),
  });

  await auditMcp(
    requestId,
    resolved.actor?.orgRef ?? null,
    resolved.actor?.sub ?? null,
    body,
    result.status,
  );

  return Response.json(result.body, {
    status: result.status,
    headers: {
      ...corsHeaders(),
      ...result.headers,
      "mcp-protocol-version": MCP_PROTOCOL_VERSION,
    },
  });
}

async function auditMcp(
  requestId: string,
  orgRef: string | null,
  actorRef: string | null,
  body: unknown,
  status: number,
): Promise<void> {
  const runtime = tryRuntime();
  if (!runtime || !orgRef) return;
  const method =
    body && typeof body === "object" && "method" in body
      ? String((body as { method?: string }).method)
      : "";
  const tool =
    body &&
    typeof body === "object" &&
    "params" in body &&
    body.params &&
    typeof body.params === "object" &&
    "name" in (body.params as { name?: string })
      ? String((body.params as { name?: string }).name)
      : method;
  if (method !== "tools/call") return;
  const denied = status === 401 || status === 403;
  try {
    await runtime.events.publish({
      system: "kansli",
      kind: denied ? "kansli.mcp.denied" : "kansli.mcp.invoked",
      orgRef,
      actorKind: "integration",
      actorRef,
      subjectRef: `mcp:tool:${tool}`,
      requestId,
      payload: { tool, status, method },
    });
  } catch {
    // Audit must not hide the MCP response.
  }
}

function corsHeaders(): Record<string, string> {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers":
      "Authorization, Content-Type, MCP-Protocol-Version, Mcp-Method, Mcp-Name, Idempotency-Key, X-Request-Id",
  };
}

export function mcpCatalog() {
  return registry().catalog();
}
