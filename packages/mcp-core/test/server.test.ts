import { describe, expect, it, beforeEach } from "vitest";
import type { Actor } from "@pixdrift/api-core";
import { handleMcp } from "../src/server.ts";
import { ToolRegistry, type ToolDefinition } from "../src/registry.ts";
import { MCP_PROTOCOL_VERSION } from "../src/protocol.ts";
import { resetMetrics, metricsSnapshot } from "../src/telemetry.ts";
import { resetRateLimits } from "../src/rate-limit.ts";
import { resetIdempotency } from "../src/idempotency.ts";

const actor: Actor = {
  sub: "user:a",
  email: "a@example.com",
  name: "Ada",
  orgRef: "pixdrift:org:a",
  orgName: "A",
  tier: "enterprise",
  permissions: ["task:write"],
};

function tool(over: Partial<ToolDefinition> = {}): ToolDefinition {
  return {
    name: "list_demo",
    title: "List demo",
    description: "Returns a constant.",
    system: "kansli",
    domain: "office",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    outputSchema: { type: "object" },
    permission: null,
    tenantScope: "org",
    sideEffects: "none",
    risk: 1,
    approvalRequired: false,
    idempotent: true,
    rateClass: "read",
    timeoutMs: 5_000,
    version: "1.0.0",
    deprecated: false,
    examples: [{}],
    flags: {
      readOnly: true,
      destructive: false,
      financial: false,
      pii: false,
      customerCommunication: false,
      adminOnly: false,
    },
    whenToUse: "Need the constant.",
    whenNotToUse: "Need a write.",
    handler: async () => ({ ok: true }),
    ...over,
  };
}

function registry(tools: ToolDefinition[] = [tool()]) {
  const reg = new ToolRegistry();
  for (const item of tools) reg.registerTool(item);
  return reg;
}

async function call(input: {
  method: string;
  params?: unknown;
  actor?: Actor | null;
  headers?: Record<string, string>;
  protocol?: string;
  tools?: ToolDefinition[];
}) {
  const method = input.method;
  const name =
    method === "tools/call" && input.params && typeof input.params === "object" && input.params
      ? String((input.params as { name?: string }).name ?? "")
      : (method.split("/").pop() ?? method);
  const protocol = input.protocol ?? MCP_PROTOCOL_VERSION;
  const headers = new Headers({
    "MCP-Protocol-Version": protocol,
    "Mcp-Method": method,
    "Mcp-Name": name,
    ...input.headers,
  });
  return handleMcp({
    headers,
    body: {
      jsonrpc: "2.0",
      id: 1,
      method,
      params: input.params,
      _meta: { "io.modelcontextprotocol/protocolVersion": protocol },
    },
    authorization: null,
    registry: registry(input.tools),
    runtime: {
      requestId: "req-1",
      actor: input.actor === undefined ? actor : input.actor,
      pool: null,
      events: null,
      locale: "en",
      clientId: "test",
      source: input.actor === null ? "none" : "session",
    },
  });
}

describe("MCP gateway", () => {
  beforeEach(() => {
    resetMetrics();
    resetRateLimits();
    resetIdempotency();
  });

  it("discovers tools without a session handshake", async () => {
    const res = await call({ method: "server/discover", actor: actor });
    expect(res.status).toBe(200);
    const body = res.body as { result: { protocolVersion: string; tools: { name: string }[] } };
    expect(body.result.protocolVersion).toBe(MCP_PROTOCOL_VERSION);
    expect(body.result.tools.map((item) => item.name)).toContain("list_demo");
  });

  it("lists and calls a registered tool", async () => {
    const listed = await call({ method: "tools/list" });
    expect(listed.status).toBe(200);
    const invoked = await call({
      method: "tools/call",
      params: { name: "list_demo", arguments: {} },
    });
    expect(invoked.status).toBe(200);
    const body = invoked.body as { result: { structuredContent: { ok: boolean } } };
    expect(body.result.structuredContent.ok).toBe(true);
    expect(metricsSnapshot().mcp_tool_calls_total).toBe(1);
  });

  it("rejects header mismatch", async () => {
    const res = await call({
      method: "tools/call",
      params: { name: "list_demo", arguments: {} },
      headers: { "Mcp-Name": "other" },
    });
    expect(res.status).toBe(400);
    const body = res.body as { error: { code: number } };
    expect(body.error.code).toBe(-32020);
  });

  it("denies missing login", async () => {
    const res = await call({
      method: "tools/call",
      params: { name: "list_demo", arguments: {} },
      actor: null,
    });
    expect(res.status).toBe(401);
    expect(metricsSnapshot().mcp_auth_failures_total).toBe(1);
  });

  it("denies missing permission", async () => {
    const res = await call({
      method: "tools/call",
      params: { name: "write_demo", arguments: {} },
      actor: { ...actor, permissions: [] },
      tools: [tool({ name: "write_demo", permission: "task:write", risk: 2, rateClass: "write" })],
    });
    expect(res.status).toBe(403);
    expect(metricsSnapshot().mcp_authorization_denials_total).toBe(1);
  });

  it("rejects tenant_id in arguments", async () => {
    const res = await call({
      method: "tools/call",
      params: { name: "list_demo", arguments: { tenant_id: "pixdrift:org:b" } },
      tools: [
        tool({
          inputSchema: {
            type: "object",
            properties: { tenant_id: { type: "string" } },
            additionalProperties: false,
          },
        }),
      ],
    });
    expect(res.status).toBe(403);
    const body = res.body as { error: { data: { name: string } } };
    expect(body.error.data.name).toBe("TENANT_SCOPE_VIOLATION");
    expect(metricsSnapshot().mcp_tenant_violations_total).toBe(1);
  });

  it("blocks high-risk tools pending a person", async () => {
    const res = await call({
      method: "tools/call",
      params: { name: "refund_demo", arguments: {} },
      tools: [
        tool({
          name: "refund_demo",
          risk: 4,
          approvalRequired: true,
          permission: null,
          rateClass: "heavy",
        }),
      ],
    });
    expect(res.status).toBe(403);
    const body = res.body as { error: { data: { name: string } } };
    expect(body.error.data.name).toBe("APPROVAL_REQUIRED");
  });

  it("still answers initialize for older clients", async () => {
    const res = await call({ method: "initialize", protocol: "2025-11-25" });
    expect(res.status).toBe(200);
    const body = res.body as { result: { protocolVersion: string } };
    expect(body.result.protocolVersion).toBe(MCP_PROTOCOL_VERSION);
  });

  it("replays an idempotent write", async () => {
    let calls = 0;
    const write = tool({
      name: "create_demo",
      permission: "task:write",
      risk: 2,
      rateClass: "write",
      idempotent: true,
      flags: {
        readOnly: false,
        destructive: false,
        financial: false,
        pii: false,
        customerCommunication: false,
        adminOnly: false,
      },
      inputSchema: {
        type: "object",
        properties: { idempotency_key: { type: "string" } },
        additionalProperties: false,
      },
      handler: async () => {
        calls += 1;
        return { n: calls };
      },
    });
    const first = await call({
      method: "tools/call",
      params: { name: "create_demo", arguments: { idempotency_key: "k1" } },
      tools: [write],
    });
    const second = await call({
      method: "tools/call",
      params: { name: "create_demo", arguments: { idempotency_key: "k1" } },
      tools: [write],
    });
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(calls).toBe(1);
  });
});
