import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { t } from "../i18n/index.ts";

const PAGES: readonly [string, string][] = [
  ["src/app/(site)/documentation/mcp/tools/page.tsx", "site.doc.mcp.tools.intro"],
  ["src/app/(site)/documentation/mcp/authentication/page.tsx", "site.doc.mcp.authPage.intro"],
  ["src/app/(site)/documentation/mcp/clients/page.tsx", "site.doc.mcp.clients.intro"],
  ["src/app/(site)/documentation/mcp/errors/page.tsx", "site.doc.mcp.errors.intro"],
  ["src/app/(site)/documentation/mcp/systems/page.tsx", "site.doc.mcp.systems.intro"],
];

describe("leftover MCP documentation meta language", () => {
  it("uses leftover MCP intro keys as page descriptions like leftover MCP headings", () => {
    for (const [file, key] of PAGES) {
      expect(readFileSync(file, "utf8"), file).toContain(`description: t(locale, "${key}")`);
    }
    expect(t("en", "site.doc.mcp.tools.intro")).toBe(
      "This page is not hand-copied. If a tool is missing here, it is not registered.",
    );
    expect(t("sv", "site.doc.mcp.clients.intro")).not.toBe(t("en", "home.metaDescription"));
  });

  it("leaves leftover MCP error texts and client JSON as written", () => {
    const errors = readFileSync("src/app/(site)/documentation/mcp/errors/page.tsx", "utf8");
    expect(errors).toContain("Missing or invalid token.");
    expect(errors).toContain("A tenant_id or orgRef was sent in the tool arguments.");
    const clients = readFileSync("src/app/(site)/documentation/mcp/clients/page.tsx", "utf8");
    expect(clients).toContain("PIXDRIFT_MCP_TOKEN");
  });
});
