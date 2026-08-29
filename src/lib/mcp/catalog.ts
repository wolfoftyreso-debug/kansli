import { SYSTEM_MODULES, type SystemId } from "@pixdrift/systems";
import type { MessageKey } from "../i18n/en.ts";
import { mcpCatalog } from "./handle";

export const MCP_DOC_LINKS: readonly { href: string; key: MessageKey }[] = [
  { href: "/documentation/mcp", key: "site.doc.area.overview" },
  { href: "/documentation/capabilities", key: "site.doc.capabilityGraph" },
  { href: "/documentation/rest", key: "site.doc.rest" },
  { href: "/documentation/mcp/authentication", key: "site.doc.nav.auth" },
  { href: "/documentation/mcp/clients", key: "site.doc.nav.clients" },
  { href: "/documentation/mcp/tools", key: "site.doc.nav.tools" },
  { href: "/documentation/mcp/systems", key: "site.doc.systems" },
  { href: "/documentation/mcp/errors", key: "site.doc.nav.errors" },
];

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
