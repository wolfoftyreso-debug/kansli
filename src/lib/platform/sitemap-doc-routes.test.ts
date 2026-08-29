import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SYSTEM_MODULES } from "@pixdrift/systems";
import sitemap from "../../app/sitemap.ts";
import { MCP_DOC_LINKS } from "../mcp/catalog.ts";
import { systems } from "../pixdrift/systems.ts";

describe("leftover sitemap documentation-route lock", () => {
  it("keeps every MCP doc link and catalog slug in the sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const item of MCP_DOC_LINKS) {
      expect(urls, item.href).toContain(`https://pixdrift.com${item.href}`);
    }
    for (const system of systems) {
      expect(urls, system.slug).toContain(`https://pixdrift.com/systems/${system.slug}`);
    }
    expect(urls).toContain("https://pixdrift.com/documentation");
    expect(urls).toContain("https://pixdrift.com/why");
    expect(readFileSync("src/app/sitemap.ts", "utf8")).toContain("MCP_DOC_LINKS");
  });

  it("leaves leftover app rooms out of the sitemap", () => {
    const urls = new Set(sitemap().map((entry) => entry.url));
    for (const system of SYSTEM_MODULES) {
      expect(urls.has(`https://pixdrift.com${system.basePath}`), system.basePath).toBe(false);
    }
    expect(urls.has("https://pixdrift.com/platform")).toBe(false);
    expect(urls.has("https://pixdrift.com/upphandling")).toBe(false);
  });
});
