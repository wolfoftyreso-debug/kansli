"use client";

import { useState } from "react";

const SAFE = ["get_who_am_i", "list_platform_systems"] as const;

export function McpExplorer() {
  const [tool, setTool] = useState<(typeof SAFE)[number]>("get_who_am_i");
  const [result, setResult] = useState<string>("");
  const [requestId, setRequestId] = useState<string>("");

  async function run() {
    const response = await fetch("/mcp", {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        "MCP-Protocol-Version": "2026-07-28",
        "Mcp-Method": "tools/call",
        "Mcp-Name": tool,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: tool, arguments: {} },
        _meta: { "io.modelcontextprotocol/protocolVersion": "2026-07-28" },
      }),
    });
    setRequestId(response.headers.get("x-request-id") ?? "");
    setResult(JSON.stringify(await response.json(), null, 2));
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm">
        Safe tool
        <select
          className="max-w-md border border-line bg-surface px-3 py-2"
          value={tool}
          onChange={(event) => setTool(event.target.value as (typeof SAFE)[number])}
        >
          {SAFE.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={() => void run()}
        className="w-fit bg-ink px-4 py-2 text-sm text-paper"
      >
        Run
      </button>
      {requestId ? <p className="font-mono text-xs text-muted">request {requestId}</p> : null}
      {result ? (
        <pre className="overflow-x-auto border border-line bg-surface p-4 text-xs">{result}</pre>
      ) : null}
    </div>
  );
}
