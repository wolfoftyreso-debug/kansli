import { SYSTEM_MODULES } from "@pixdrift/systems";
import { MCP_PROTOCOL_VERSION, type ToolRegistry } from "@pixdrift/mcp-core";

export function registerMcpResources(registry: ToolRegistry): void {
  registry.registerResource({
    uri: "pixdrift://catalog/systems",
    name: "systems",
    title: "Pixdrift systems",
    description: "Machine-readable catalog of systems that exist in this repository.",
    mimeType: "application/json",
    system: "kansli",
    permission: null,
    tenantScope: "none",
    read: async () =>
      JSON.stringify(
        SYSTEM_MODULES.map((item) => ({
          id: item.id,
          name: item.name,
          purpose: item.purpose,
          status: item.status,
        })),
        null,
        2,
      ),
  });

  registry.registerResource({
    uri: "pixdrift://catalog/tools",
    name: "tools",
    title: "MCP tools",
    description: "Authoritative MCP tool catalog generated from the registry.",
    mimeType: "application/json",
    system: "kansli",
    permission: null,
    tenantScope: "none",
    read: async () => JSON.stringify(registry.catalog(), null, 2),
  });

  registry.registerResource({
    uri: "pixdrift://docs/mcp",
    name: "mcp-overview",
    title: "MCP overview",
    description: "How REST and MCP share the same domain services.",
    mimeType: "text/markdown",
    system: "kansli",
    permission: null,
    tenantScope: "none",
    read: async () =>
      [
        "# PIXDRIFT MCP",
        "",
        `Protocol: ${MCP_PROTOCOL_VERSION} (Streamable HTTP, stateless).`,
        "",
        "REST and MCP call the same application services.",
        "Tenant comes from the login, never from a tool argument.",
        "",
        "Endpoint: POST /mcp",
        "Docs: /documentation/mcp",
      ].join("\n"),
  });

  registry.registerPrompt({
    name: "office-status-review",
    title: "Office status review",
    description:
      "A review prompt only. Authoritative task state still comes from list_office_tasks.",
    arguments: [],
  });
}
