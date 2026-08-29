import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { t } from "../i18n/index.ts";
import { MCP_DOC_LINKS } from "../mcp/catalog.ts";

describe("leftover MCP documentation language", () => {
  it("uses English-canonical leftover MCP doc chrome like leftover documentation index", () => {
    expect(t("en", "site.doc.mcp.title")).toBe(
      "REST is the machine interface. MCP is the agent interface.",
    );
    expect(t("sv", "site.doc.mcp.title")).toBe(
      "REST är maskingränssnittet. MCP är agentgränssnittet.",
    );
    expect(t("en", "site.doc.nav.clients")).toBe("Connecting a client");
    expect(t("sv", "site.doc.nav.clients")).toBe("Anslut en klient");
    expect(t("en", "site.doc.mcp.toolCatalog")).toBe("Tool catalog");
    expect(t("sv", "site.doc.mcp.toolCatalog")).toBe("Verktygskatalog");
    expect(t("de", "site.doc.mcp.title")).toBe(
      "REST is the machine interface. MCP is the agent interface.",
    );
    expect(MCP_DOC_LINKS.map((item) => item.key)).toEqual([
      "site.doc.area.overview",
      "site.doc.capabilityGraph",
      "site.doc.rest",
      "site.doc.nav.auth",
      "site.doc.nav.clients",
      "site.doc.nav.tools",
      "site.doc.systems",
      "site.doc.nav.errors",
    ]);

    const nav = readFileSync("src/components/site/McpDocNav.tsx", "utf8");
    expect(nav).toContain("t(locale, item.key)");
    expect(nav).not.toContain("item.label");

    const page = readFileSync("src/app/(site)/documentation/mcp/page.tsx", "utf8");
    expect(page).toContain('t(locale, "site.doc.mcp.title")');
    expect(page).not.toContain("REST is the machine interface.");
    expect(page).not.toContain("Tool catalog");
  });

  it("leaves leftover MCP error names and tool descriptions as written", () => {
    expect(readFileSync("src/app/(site)/documentation/mcp/errors/page.tsx", "utf8")).toContain(
      "Missing or invalid token.",
    );
    expect(readFileSync("src/lib/mcp/catalog.ts", "utf8")).not.toContain('label: "Översikt"');
  });
});
