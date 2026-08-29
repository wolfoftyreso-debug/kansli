import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SYSTEM_MODULES } from "@pixdrift/systems";
import { MCP_DOC_LINKS } from "../mcp/catalog.ts";
import { systems } from "../pixdrift/systems.ts";
import { PUBLIC_CANONICAL_PATHS, publicCanonical, publicShareMeta } from "./canonical.ts";

const PAGE_SHARE: [string, string][] = [
  ["src/app/(site)/page.tsx", 'publicShareMeta("/")'],
  ["src/app/(site)/systems/page.tsx", 'publicShareMeta("/systems")'],
  ["src/app/(site)/systems/[slug]/page.tsx", "publicShareMeta(`/systems/${slug}`)"],
  ["src/app/(site)/how-it-works/page.tsx", 'publicShareMeta("/how-it-works")'],
  ["src/app/(site)/applications/page.tsx", 'publicShareMeta("/applications")'],
  ["src/app/(site)/documentation/page.tsx", 'publicShareMeta("/documentation")'],
  ["src/app/(site)/why/page.tsx", 'publicShareMeta("/why")'],
  ["src/app/(site)/company/page.tsx", 'publicShareMeta("/company")'],
  ...MCP_DOC_LINKS.map((item): [string, string] => [
    `src/app/(site)${item.href}/page.tsx`,
    `publicShareMeta("${item.href}")`,
  ]),
];

describe("leftover public canonical lock", () => {
  it("keeps every leftover public HTML path on a share helper", () => {
    expect(publicCanonical("/")).toBe("https://pixdrift.com");
    expect(publicShareMeta("/why").alternates?.canonical).toBe("https://pixdrift.com/why");
    expect(publicShareMeta("/why").openGraph?.url).toBe("https://pixdrift.com/why");
    expect(publicShareMeta("/documentation").openGraph?.url).toBe(
      "https://pixdrift.com/documentation",
    );
    for (const item of MCP_DOC_LINKS) {
      expect(PUBLIC_CANONICAL_PATHS.has(item.href), item.href).toBe(true);
      expect(publicShareMeta(item.href).openGraph?.url).toBe(`https://pixdrift.com${item.href}`);
    }
    for (const system of systems) {
      expect(publicShareMeta(`/systems/${system.slug}`).openGraph?.url).toBe(
        `https://pixdrift.com/systems/${system.slug}`,
      );
    }
    for (const [file, snippet] of PAGE_SHARE) {
      expect(readFileSync(file, "utf8"), file).toContain(snippet);
    }
    expect(readFileSync("src/app/layout.tsx", "utf8")).toContain('siteName: "PIXDRIFT"');
    expect(readFileSync("src/app/layout.tsx", "utf8")).not.toContain('url: "https://pixdrift.com"');
  });

  it("leaves leftover app rooms, intake and locale URLs out of canonical", () => {
    for (const system of SYSTEM_MODULES) {
      expect(() => publicCanonical(system.basePath)).toThrow(/leftover canonical/);
    }
    expect(() => publicShareMeta("/upphandling")).toThrow(/leftover canonical/);
    expect(() => publicCanonical("/platform")).toThrow(/leftover canonical/);
    expect(() => publicCanonical("/en/why")).toThrow(/leftover canonical/);
    expect(() => publicCanonical("/sv/systems")).toThrow(/leftover canonical/);
    expect(PUBLIC_CANONICAL_PATHS.has("/upphandling")).toBe(false);
  });
});
