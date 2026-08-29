import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SYSTEM_MODULES } from "@pixdrift/systems";
import { MCP_DOC_LINKS } from "../mcp/catalog.ts";
import { systems } from "../pixdrift/systems.ts";
import { PUBLIC_CANONICAL_PATHS, publicCanonical } from "./canonical.ts";

const PAGE_CANONICALS: readonly [string, string][] = [
  ["src/app/(site)/page.tsx", 'publicCanonical("/")'],
  ["src/app/(site)/systems/page.tsx", 'publicCanonical("/systems")'],
  ["src/app/(site)/systems/[slug]/page.tsx", "publicCanonical(`/systems/${slug}`)"],
  ["src/app/(site)/how-it-works/page.tsx", 'publicCanonical("/how-it-works")'],
  ["src/app/(site)/applications/page.tsx", 'publicCanonical("/applications")'],
  ["src/app/(site)/documentation/page.tsx", 'publicCanonical("/documentation")'],
  ["src/app/(site)/why/page.tsx", 'publicCanonical("/why")'],
  ["src/app/(site)/company/page.tsx", 'publicCanonical("/company")'],
  ...MCP_DOC_LINKS.map(
    (item) => [`src/app/(site)${item.href}/page.tsx`, `publicCanonical("${item.href}")`] as const,
  ),
];

describe("leftover public canonical lock", () => {
  it("keeps every leftover public HTML path on a canonical helper", () => {
    expect(publicCanonical("/")).toBe("https://pixdrift.com");
    expect(publicCanonical("/documentation")).toBe("https://pixdrift.com/documentation");
    for (const item of MCP_DOC_LINKS) {
      expect(PUBLIC_CANONICAL_PATHS.has(item.href), item.href).toBe(true);
      expect(publicCanonical(item.href)).toBe(`https://pixdrift.com${item.href}`);
    }
    for (const system of systems) {
      expect(publicCanonical(`/systems/${system.slug}`)).toBe(
        `https://pixdrift.com/systems/${system.slug}`,
      );
    }
    for (const [file, snippet] of PAGE_CANONICALS) {
      expect(readFileSync(file, "utf8"), file).toContain(snippet);
    }
  });

  it("leaves leftover app rooms, intake and locale URLs out of canonical", () => {
    for (const system of SYSTEM_MODULES) {
      expect(() => publicCanonical(system.basePath)).toThrow(/leftover canonical/);
    }
    expect(() => publicCanonical("/upphandling")).toThrow(/leftover canonical/);
    expect(() => publicCanonical("/platform")).toThrow(/leftover canonical/);
    expect(() => publicCanonical("/en/why")).toThrow(/leftover canonical/);
    expect(() => publicCanonical("/sv/systems")).toThrow(/leftover canonical/);
    expect(PUBLIC_CANONICAL_PATHS.has("/upphandling")).toBe(false);
  });
});
