import { beforeEach, describe, expect, it } from "vitest";
import type { Actor } from "@pixdrift/api-core";
import {
  handleMcp,
  MCP_PROTOCOL_VERSION,
  metricsSnapshot,
  resetIdempotency,
  resetMetrics,
  resetRateLimits,
} from "@pixdrift/mcp-core";
import { buildPixdriftRegistry } from "./tools";
import { registerMcpResources } from "./resources";

const actor: Actor = {
  sub: "user:demo",
  email: "demo@exempelbolaget.se",
  name: "Demo",
  orgRef: "pixdrift:org:demo",
  orgName: "Exempelbolaget",
  tier: "enterprise",
  permissions: ["task:write"],
};

const other: Actor = {
  ...actor,
  sub: "user:other",
  orgRef: "pixdrift:org:other",
  orgName: "Other",
  permissions: [],
};

function registry() {
  const current = buildPixdriftRegistry();
  registerMcpResources(current);
  return current;
}

async function rpc(
  method: string,
  params: unknown,
  who: Actor | null,
  extraHeaders: Record<string, string> = {},
) {
  const name =
    method === "tools/call" && params && typeof params === "object" && "name" in params
      ? String((params as { name: string }).name)
      : method;
  return handleMcp({
    headers: new Headers({
      "MCP-Protocol-Version": MCP_PROTOCOL_VERSION,
      "Mcp-Method": method,
      "Mcp-Name": name,
      ...extraHeaders,
    }),
    body: {
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
      _meta: { "io.modelcontextprotocol/protocolVersion": MCP_PROTOCOL_VERSION },
    },
    authorization: null,
    registry: registry(),
    runtime: {
      requestId: "e2e-1",
      actor: who,
      pool: null,
      events: null,
      locale: "en",
      clientId: "e2e",
      source: who ? "session" : "none",
    },
  });
}

describe("MCP e2e client (in-process)", () => {
  beforeEach(() => {
    resetMetrics();
    resetRateLimits();
    resetIdempotency();
  });

  it("initializes, discovers, lists, and executes a safe tool", async () => {
    const discover = await rpc("server/discover", {}, actor);
    expect(discover.status).toBe(200);
    const listed = await rpc("tools/list", {}, actor);
    expect(listed.status).toBe(200);
    const listedBody = listed.body as { result: { tools: { name: string }[] } };
    expect(listedBody.result.tools.some((item) => item.name === "get_who_am_i")).toBe(true);

    const called = await rpc("tools/call", { name: "get_who_am_i", arguments: {} }, actor);
    expect(called.status).toBe(200);
    const body = called.body as {
      result: { structuredContent: { orgRef: string; authenticated: boolean } };
    };
    expect(body.result.structuredContent.authenticated).toBe(true);
    expect(body.result.structuredContent.orgRef).toBe("pixdrift:org:demo");
    expect(metricsSnapshot().mcp_tool_calls_total).toBe(1);
  });

  it("denies an unauthorized write and leaks no tenant B data", async () => {
    const denied = await rpc(
      "tools/call",
      { name: "create_office_task", arguments: { title: "hemligt" } },
      other,
    );
    expect(denied.status).toBe(403);
    expect(JSON.stringify(denied.body)).not.toContain("hemligt");
    expect(metricsSnapshot().mcp_authorization_denials_total).toBe(1);
  });

  it("rejects a cross-tenant argument", async () => {
    const res = await rpc(
      "tools/call",
      { name: "get_who_am_i", arguments: { tenant_id: "pixdrift:org:other" } },
      actor,
    );
    expect(res.status).toBe(403);
    const body = res.body as { error: { data: { name: string } } };
    expect(body.error.data.name).toBe("TENANT_SCOPE_VIOLATION");
  });

  it("rejects a malformed JSON-RPC body", async () => {
    const res = await handleMcp({
      headers: new Headers({ "MCP-Protocol-Version": MCP_PROTOCOL_VERSION }),
      body: { foo: true },
      authorization: null,
      registry: registry(),
      runtime: {
        requestId: "bad",
        actor,
        pool: null,
        events: null,
        locale: "en",
        clientId: "e2e",
        source: "session",
      },
    });
    expect(res.status).toBe(400);
  });
});
