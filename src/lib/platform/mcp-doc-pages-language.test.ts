import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { t } from "../i18n/index.ts";

describe("leftover MCP documentation page-heading language", () => {
  it("uses English-canonical leftover MCP page headings like leftover MCP overview", () => {
    expect(t("en", "site.doc.mcp.tools.title")).toBe("Generated from the registry");
    expect(t("sv", "site.doc.mcp.tools.title")).toBe("Genererad från registret");
    expect(t("en", "site.doc.mcp.systems.title")).toBe("What is actually registered");
    expect(t("sv", "site.doc.mcp.systems.title")).toBe("Vad som faktiskt är registrerat");
    expect(t("en", "site.doc.mcp.authPage.title")).toBe("One identity. No second login system.");
    expect(t("sv", "site.doc.mcp.authPage.title")).toBe(
      "En identitet. Inget annat inloggningssystem.",
    );
    expect(t("en", "site.doc.rest.title")).toBe("One graph. Two interfaces.");
    expect(t("sv", "site.doc.rest.title")).toBe("En graf. Två gränssnitt.");
    expect(t("en", "site.doc.graph.title")).toBe("One list. Several interfaces.");
    expect(t("sv", "site.doc.graph.title")).toBe("En lista. Flera gränssnitt.");
    expect(t("de", "site.doc.mcp.tools.title")).toBe("Generated from the registry");

    const tools = readFileSync("src/app/(site)/documentation/mcp/tools/page.tsx", "utf8");
    expect(tools).toContain('t(locale, "site.doc.mcp.tools.title")');
    expect(tools).not.toContain("Generated from the registry");
    expect(readFileSync("src/app/(site)/documentation/rest/page.tsx", "utf8")).toContain(
      't(locale, "site.doc.rest.title")',
    );
    expect(readFileSync("src/app/(site)/documentation/capabilities/page.tsx", "utf8")).toContain(
      't(locale, "site.doc.graph.title")',
    );
  });

  it("leaves leftover MCP error texts, auth steps and client JSON as written", () => {
    expect(readFileSync("src/app/(site)/documentation/mcp/errors/page.tsx", "utf8")).toContain(
      "Missing or invalid token.",
    );
    expect(
      readFileSync("src/app/(site)/documentation/mcp/authentication/page.tsx", "utf8"),
    ).toContain("Get an access token from PIXDRIFT Identity");
    expect(readFileSync("src/app/(site)/documentation/mcp/clients/page.tsx", "utf8")).toContain(
      "Local development uses the same path on this host",
    );
    expect(readFileSync("src/app/(site)/documentation/mcp/clients/page.tsx", "utf8")).toContain(
      "PIXDRIFT_MCP_TOKEN",
    );
  });
});
