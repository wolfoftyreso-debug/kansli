import { describe, expect, it } from "vitest";
import {
  MCP_PROTOCOL_VERSION,
  headerMismatch,
  parseJsonRpc,
  requestedProtocol,
} from "../src/protocol.ts";

describe("MCP protocol 2026-07-28", () => {
  it("parses a self-contained JSON-RPC call", () => {
    const req = parseJsonRpc({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "search", arguments: { q: "otters" } },
    });
    expect(req.method).toBe("tools/call");
    expect(req.id).toBe(1);
  });

  it("rejects bodies that are not JSON-RPC 2.0", () => {
    expect(() => parseJsonRpc("nope")).toThrow();
    expect(() => parseJsonRpc({ jsonrpc: "1.0", method: "ping" })).toThrow();
  });

  it("reads protocol version from header or _meta", () => {
    const headers = new Headers({ "MCP-Protocol-Version": MCP_PROTOCOL_VERSION });
    expect(requestedProtocol(headers, {})).toBe(MCP_PROTOCOL_VERSION);
    expect(
      requestedProtocol(new Headers(), {
        _meta: { "io.modelcontextprotocol/protocolVersion": MCP_PROTOCOL_VERSION },
      }),
    ).toBe(MCP_PROTOCOL_VERSION);
  });

  it("uses the spec header-mismatch code", () => {
    expect(headerMismatch("x").code).toBe(-32020);
  });
});
