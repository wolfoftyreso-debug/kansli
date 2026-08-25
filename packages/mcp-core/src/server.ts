import { requireActor, requireOrg, requirePermission } from "@pixdrift/api-core";
import {
  failure,
  headerMismatch,
  invalidParams,
  isCompatProtocol,
  isCurrentProtocol,
  isObject,
  MCP_PRODUCT,
  MCP_PROTOCOL_VERSION,
  methodNotFound,
  parseJsonRpc,
  requestedProtocol,
  success,
  unsupportedProtocol,
  type JsonRpcResponse,
} from "./protocol.ts";
import { McpError, normalizeError } from "./errors.ts";
import {
  mcpToolListItem,
  page,
  readToolArguments,
  validateInput,
  type McpRuntime,
  type ToolRegistry,
} from "./registry.ts";
import { requiresApproval } from "./risk.ts";
import { takeRateToken } from "./rate-limit.ts";
import { idempotencyKeyOf, recallIdempotent, rememberIdempotent } from "./idempotency.ts";
import {
  mcpLog,
  noteApprovalRequired,
  noteAuthFailure,
  noteAuthzDenial,
  noteRateLimit,
  noteRequest,
  noteSchemaFailure,
  noteTenantViolation,
  noteTool,
} from "./telemetry.ts";

export interface HandleMcpInput {
  headers: Headers;
  body: unknown;
  authorization: string | null;
  registry: ToolRegistry;
  runtime: Omit<McpRuntime, "actor" | "source"> & {
    actor: McpRuntime["actor"];
    source: McpRuntime["source"];
  };
}

export interface HandleMcpResult {
  status: number;
  body: JsonRpcResponse | { error: string };
  headers: Record<string, string>;
}

function header(headers: Headers, name: string): string {
  return headers.get(name) ?? headers.get(name.toLowerCase()) ?? "";
}

function validateHeaders(headers: Headers, method: string, toolName: string | null): void {
  const mcpMethod = header(headers, "Mcp-Method");
  const mcpName = header(headers, "Mcp-Name");
  if (!mcpMethod) throw headerMismatch("Mcp-Method is required.");
  if (mcpMethod !== method) {
    throw headerMismatch(`Mcp-Method ${mcpMethod} does not match ${method}.`);
  }
  if (method === "tools/call" || method === "resources/read") {
    if (!mcpName) throw headerMismatch("Mcp-Name is required for this method.");
    if (toolName && mcpName !== toolName) {
      throw headerMismatch(`Mcp-Name ${mcpName} does not match ${toolName}.`);
    }
  }
}

function discoverResult(registry: ToolRegistry) {
  return {
    protocolVersion: MCP_PROTOCOL_VERSION,
    serverInfo: MCP_PRODUCT,
    capabilities: {
      tools: { listChanged: false },
      resources: { listChanged: false, subscribe: false },
      prompts: { listChanged: false },
    },
    tools: registry.listTools().map(mcpToolListItem),
    resources: registry.listResources().map((item) => ({
      uri: item.uri,
      name: item.name,
      title: item.title,
      description: item.description,
      mimeType: item.mimeType,
    })),
    prompts: registry.listPrompts(),
  };
}

export async function handleMcp(input: HandleMcpInput): Promise<HandleMcpResult> {
  const requestId = input.runtime.requestId;
  const headersOut = {
    "content-type": "application/json",
    "x-request-id": requestId,
    "mcp-protocol-version": MCP_PROTOCOL_VERSION,
  };
  noteRequest();

  let parsed;
  try {
    parsed = parseJsonRpc(input.body);
  } catch (error) {
    const rpc =
      isObject(error) && typeof error.code === "number" ? error : invalidParams("Bad JSON-RPC.");
    return {
      status: 400,
      body: failure(null, rpc as { code: number; message: string }),
      headers: headersOut,
    };
  }

  const version = requestedProtocol(input.headers, input.body);
  const current = !version || isCurrentProtocol(version);
  const compat = isCompatProtocol(version);

  if (version && !current && !compat) {
    return {
      status: 400,
      body: failure(parsed.id, unsupportedProtocol(version)),
      headers: headersOut,
    };
  }

  if (current && version) {
    const headerVersion = header(input.headers, "MCP-Protocol-Version");
    const meta = isObject(input.body) && isObject(input.body._meta) ? input.body._meta : {};
    const metaVersion =
      typeof meta["io.modelcontextprotocol/protocolVersion"] === "string"
        ? meta["io.modelcontextprotocol/protocolVersion"]
        : "";
    if (headerVersion && metaVersion && headerVersion !== metaVersion) {
      return {
        status: 400,
        body: failure(parsed.id, headerMismatch("MCP-Protocol-Version does not match _meta.")),
        headers: headersOut,
      };
    }
  }

  try {
    if (current && version) {
      const toolName =
        parsed.method === "tools/call"
          ? readToolArguments(parsed.params).name
          : parsed.method === "resources/read" &&
              isObject(parsed.params) &&
              typeof parsed.params.uri === "string"
            ? parsed.params.uri
            : null;
      validateHeaders(input.headers, parsed.method, toolName);
    }

    const result = await dispatch(parsed.method, parsed.params, input);
    mcpLog({
      request_id: requestId,
      method: parsed.method,
      status: "ok",
      source: input.runtime.source,
      tenant: input.runtime.actor?.orgRef ?? null,
    });
    return { status: 200, body: success(parsed.id, result), headers: headersOut };
  } catch (error) {
    if (isObject(error) && typeof error.code === "number" && typeof error.message === "string") {
      return {
        status: 400,
        body: failure(parsed.id, error as { code: number; message: string }),
        headers: headersOut,
      };
    }
    const normalized = normalizeError(error, requestId);
    if (normalized.nameCode === "AUTHENTICATION_REQUIRED") noteAuthFailure();
    if (normalized.nameCode === "PERMISSION_DENIED") noteAuthzDenial();
    if (normalized.nameCode === "RATE_LIMITED") noteRateLimit();
    if (normalized.nameCode === "VALIDATION_ERROR") noteSchemaFailure();
    if (normalized.nameCode === "APPROVAL_REQUIRED") noteApprovalRequired();
    // Tenant violations are counted at the guard.
    mcpLog({
      request_id: requestId,
      method: parsed.method,
      status: normalized.nameCode,
      source: input.runtime.source,
      tenant: input.runtime.actor?.orgRef ?? null,
    });
    return {
      status: normalized.httpStatus,
      body: failure(parsed.id, normalized.toRpc()),
      headers: headersOut,
    };
  }
}

async function dispatch(method: string, params: unknown, input: HandleMcpInput): Promise<unknown> {
  const { registry, runtime } = input;

  if (method === "initialize") {
    return {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {
        tools: { listChanged: false },
        resources: { listChanged: false },
        prompts: { listChanged: false },
      },
      serverInfo: MCP_PRODUCT,
    };
  }
  if (method === "notifications/initialized" || method === "notifications/cancelled") {
    return {};
  }
  if (method === "ping") return {};
  if (method === "server/discover") return discoverResult(registry);
  if (method === "tools/list") {
    requireActor(runtime.actor);
    const listed = page(registry.listTools().map(mcpToolListItem), isObject(params) ? params : {});
    return { tools: listed.items, nextCursor: listed.next_cursor ?? undefined };
  }
  if (method === "resources/list") {
    requireActor(runtime.actor);
    return {
      resources: registry.listResources().map((item) => ({
        uri: item.uri,
        name: item.name,
        title: item.title,
        description: item.description,
        mimeType: item.mimeType,
      })),
    };
  }
  if (method === "resources/read") {
    requireActor(runtime.actor);
    if (!isObject(params) || typeof params.uri !== "string") {
      throw invalidParams("resources/read requires params.uri.");
    }
    const resource = registry.getResource(params.uri);
    if (!resource) throw new McpError("NOT_FOUND", "Unknown resource.", runtime.requestId);
    if (resource.tenantScope === "org") requireOrg(runtime.actor);
    if (resource.permission) requirePermission(runtime.actor, resource.permission);
    const text = await resource.read(runtime);
    return { contents: [{ uri: resource.uri, mimeType: resource.mimeType, text }] };
  }
  if (method === "prompts/list") {
    requireActor(runtime.actor);
    return { prompts: registry.listPrompts() };
  }
  if (method === "tools/call") {
    return callTool(params, input);
  }
  throw methodNotFound(method);
}

async function callTool(params: unknown, input: HandleMcpInput): Promise<unknown> {
  const { name, arguments: args } = readToolArguments(params);
  const def = input.registry.getTool(name);
  if (!def) throw new McpError("NOT_FOUND", `Unknown tool: ${name}`, input.runtime.requestId);
  if (def.deprecated) {
    mcpLog({ request_id: input.runtime.requestId, tool: name, deprecated: true });
  }

  const actor = requireActor(input.runtime.actor);
  if (def.tenantScope === "org") requireOrg(actor);
  if (typeof args.tenant_id === "string" || typeof args.orgRef === "string") {
    noteTenantViolation();
    throw new McpError(
      "TENANT_SCOPE_VIOLATION",
      "Tenant comes from the login, not from the tool arguments.",
      input.runtime.requestId,
    );
  }
  if (def.permission) requirePermission(actor, def.permission);
  if (requiresApproval(def.risk) || def.approvalRequired) {
    noteApprovalRequired();
    throw new McpError(
      "APPROVAL_REQUIRED",
      "This action needs a person to approve it. The model cannot approve itself.",
      input.runtime.requestId,
    );
  }

  try {
    validateInput(def.inputSchema, args);
  } catch (error) {
    noteSchemaFailure();
    throw error;
  }

  const limitKey = `${actor.orgRef ?? actor.sub}:${def.rateClass}:${def.name}`;
  if (!takeRateToken(limitKey, def.rateClass)) {
    throw new McpError("RATE_LIMITED", "Too many calls. Wait a minute.", input.runtime.requestId);
  }

  const idemKey = def.idempotent
    ? idempotencyKeyOf(
        actor.orgRef ?? actor.sub,
        def.name,
        typeof args.idempotency_key === "string" ? args.idempotency_key : undefined,
      )
    : null;
  if (idemKey) {
    const remembered = recallIdempotent(idemKey);
    if (remembered !== undefined) {
      return {
        content: [{ type: "text", text: JSON.stringify(remembered) }],
        structuredContent: remembered,
        isError: false,
      };
    }
  }

  const started = Date.now();
  try {
    const output = await def.handler(input.runtime, args);
    noteTool(def.name, Date.now() - started, false);
    if (idemKey) rememberIdempotent(idemKey, output);
    return {
      content: [{ type: "text", text: JSON.stringify(output) }],
      structuredContent: output,
      isError: false,
    };
  } catch (error) {
    noteTool(def.name, Date.now() - started, true);
    throw error;
  }
}
