import { SYSTEM_MODULES, type SystemId } from "@pixdrift/systems";
import { mcpCatalog } from "./handle";

export const MCP_DOC_LINKS = [
  { href: "/documentation/mcp", label: "Overview" },
  { href: "/documentation/capabilities", label: "Capability Graph" },
  { href: "/documentation/rest", label: "REST" },
  { href: "/documentation/mcp/authentication", label: "Authentication" },
  { href: "/documentation/mcp/clients", label: "Connecting a client" },
  { href: "/documentation/mcp/tools", label: "Tools" },
  { href: "/documentation/mcp/systems", label: "Systems" },
  { href: "/documentation/mcp/errors", label: "Errors" },
] as const;

export function toolsForSystem(id: string) {
  return mcpCatalog().tools.filter((tool) => tool.system === id);
}

export function mcpSystemMatrix() {
  const catalog = mcpCatalog();
  return SYSTEM_MODULES.map((system) => {
    const tools = catalog.tools.filter((tool) => tool.system === system.id);
    return {
      id: system.id as SystemId,
      name: system.name,
      status: system.status,
      mcp: tools.length > 0 || system.id === "identity" || system.id === "kansli",
      tools: tools.length,
      docs: "/documentation/mcp/systems",
    };
  });
}
