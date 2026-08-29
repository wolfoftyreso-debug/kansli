import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { t } from "../i18n/index.ts";

describe("leftover capability-label language", () => {
  it("uses English-canonical leftover graph labels like leftover MCP headings", () => {
    expect(t("en", "site.doc.graph.event")).toBe("Event");
    expect(t("sv", "site.doc.graph.event")).toBe("Händelse");
    expect(t("en", "site.doc.graph.permission")).toBe("Permission");
    expect(t("sv", "site.doc.graph.permission")).toBe("Behörighet");
    expect(t("en", "site.doc.graph.notRegistered")).toBe("not registered");
    expect(t("sv", "site.doc.graph.notRegistered")).toBe("inte registrerat");
    expect(t("en", "site.doc.mcp.deprecated", { name: "list_tasks" })).toBe(
      "Deprecated. Use list_tasks.",
    );
    expect(t("sv", "site.doc.mcp.deprecated", { name: "list_tasks" })).toBe(
      "Utfasad. Använd list_tasks.",
    );
    expect(t("de", "site.doc.graph.sdk")).toBe("SDK / webhook / ChatGPT");

    const graph = readFileSync("src/app/(site)/documentation/capabilities/page.tsx", "utf8");
    expect(graph).toContain('t(locale, "site.doc.graph.notRegistered")');
    expect(graph).not.toContain(">not registered<");
    expect(readFileSync("src/app/(site)/documentation/mcp/tools/page.tsx", "utf8")).toContain(
      "site.doc.mcp.deprecated",
    );
    expect(readFileSync("src/app/(site)/documentation/rest/page.tsx", "utf8")).toContain(
      "site.doc.rest.event",
    );
  });

  it("leaves leftover capability titles and org-read as written", () => {
    expect(readFileSync("src/app/(site)/documentation/capabilities/page.tsx", "utf8")).toContain(
      '"org read"',
    );
    expect(readFileSync("src/app/(site)/documentation/capabilities/page.tsx", "utf8")).toContain(
      "risk {capability.risk}",
    );
    expect(readFileSync("src/app/(site)/documentation/mcp/errors/page.tsx", "utf8")).toContain(
      "Missing or invalid token.",
    );
  });
});
