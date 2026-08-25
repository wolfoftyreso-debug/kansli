/** Latest production MCP protocol this gateway speaks. */
export const MCP_PROTOCOL_VERSION = "2026-07-28";

/** Older Streamable HTTP clients still send initialize. Compatibility only. */
export const MCP_COMPAT_VERSIONS = ["2025-11-25", "2025-03-26"] as const;

export const MCP_PRODUCT = {
  name: "pixdrift-mcp",
  title: "PIXDRIFT MCP",
  version: "1.0.0",
} as const;

export const HEADER_MISMATCH = -32020;
export const UNSUPPORTED_PROTOCOL = -32021;

export type JsonRpcId = string | number;

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: JsonRpcId | null;
  method: string;
  params?: unknown;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface JsonRpcSuccess {
  jsonrpc: "2.0";
  id: JsonRpcId | null;
  result: unknown;
}

export interface JsonRpcFailure {
  jsonrpc: "2.0";
  id: JsonRpcId | null;
  error: JsonRpcError;
}

export type JsonRpcResponse = JsonRpcSuccess | JsonRpcFailure;

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseJsonRpc(body: unknown): JsonRpcRequest {
  if (!isObject(body)) throw invalidRequest("Body must be a JSON object.");
  if (body.jsonrpc !== "2.0") throw invalidRequest('jsonrpc must be "2.0".');
  if (typeof body.method !== "string" || !body.method.trim()) {
    throw invalidRequest("method is required.");
  }
  const id = body.id;
  if (id !== undefined && id !== null && typeof id !== "string" && typeof id !== "number") {
    throw invalidRequest("id must be a string or number.");
  }
  return {
    jsonrpc: "2.0",
    id: id === undefined ? undefined : (id as JsonRpcId | null),
    method: body.method,
    params: body.params,
  };
}

export function invalidRequest(message: string): JsonRpcError {
  return { code: -32600, message };
}

export function methodNotFound(method: string): JsonRpcError {
  return { code: -32601, message: `Unknown method: ${method}` };
}

export function invalidParams(message: string): JsonRpcError {
  return { code: -32602, message };
}

export function internalError(requestId: string): JsonRpcError {
  return { code: -32603, message: "Internal error.", data: { requestId } };
}

export function headerMismatch(message: string): JsonRpcError {
  return { code: HEADER_MISMATCH, message };
}

export function unsupportedProtocol(version: string): JsonRpcError {
  return {
    code: UNSUPPORTED_PROTOCOL,
    message: `Unsupported MCP-Protocol-Version: ${version}`,
    data: { supported: [MCP_PROTOCOL_VERSION, ...MCP_COMPAT_VERSIONS] },
  };
}

export function success(id: JsonRpcId | null | undefined, result: unknown): JsonRpcSuccess {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

export function failure(id: JsonRpcId | null | undefined, error: JsonRpcError): JsonRpcFailure {
  return { jsonrpc: "2.0", id: id ?? null, error };
}

export function metaOf(body: unknown): Record<string, unknown> {
  if (!isObject(body)) return {};
  const meta = body._meta;
  return isObject(meta) ? meta : {};
}

export function requestedProtocol(headers: Headers, body: unknown): string {
  const header = headers.get("mcp-protocol-version") ?? headers.get("MCP-Protocol-Version") ?? "";
  const meta = metaOf(body);
  const fromMeta =
    typeof meta["io.modelcontextprotocol/protocolVersion"] === "string"
      ? meta["io.modelcontextprotocol/protocolVersion"]
      : typeof meta.protocolVersion === "string"
        ? meta.protocolVersion
        : "";
  return header || fromMeta || "";
}

export function isCurrentProtocol(version: string): boolean {
  return version === MCP_PROTOCOL_VERSION;
}

export function isCompatProtocol(version: string): boolean {
  return (MCP_COMPAT_VERSIONS as readonly string[]).includes(version);
}
