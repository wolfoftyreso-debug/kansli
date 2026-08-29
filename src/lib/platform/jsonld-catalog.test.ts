import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { brand } from "../pixdrift/brand.ts";
import { systems } from "../pixdrift/systems.ts";
import { organizationJsonLd, systemJsonLd, websiteJsonLd } from "./jsonld.ts";

describe("leftover jsonld catalog lock", () => {
  it("keeps leftover organization and every catalog slug in JSON-LD", () => {
    const organization = organizationJsonLd();
    expect(organization["@type"]).toBe("Organization");
    expect(organization.name).toBe(brand.name);
    expect(organization.url).toBe(brand.url);
    expect(organization.parentOrganization.name).toBe(brand.company.name);
    expect(websiteJsonLd()["@type"]).toBe("WebSite");
    expect(websiteJsonLd().url).toBe(brand.url);

    for (const system of systems) {
      const node = systemJsonLd(system);
      expect(node["@type"], system.slug).toBe("SoftwareApplication");
      expect(node.name, system.slug).toBe(system.name);
      expect(node.url, system.slug).toBe(`${brand.url}/systems/${system.slug}`);
      expect(node).not.toHaveProperty("aggregateRating");
      expect(node).not.toHaveProperty("offers");
    }

    expect(systems.map((system) => system.slug)).not.toContain("kansli");
    expect(systems.map((system) => system.slug)).not.toContain("maj");
    expect(readFileSync("src/app/(site)/layout.tsx", "utf8")).toContain("organizationJsonLd");
    expect(readFileSync("src/app/(site)/layout.tsx", "utf8")).toContain("websiteJsonLd");
    expect(readFileSync("src/app/(site)/systems/[slug]/page.tsx", "utf8")).toContain(
      "systemJsonLd",
    );
  });

  it("leaves leftover invented products and intake out of JSON-LD", () => {
    const blob = JSON.stringify([
      organizationJsonLd(),
      websiteJsonLd(),
      ...systems.map((system) => systemJsonLd(system)),
    ]);
    expect(blob).not.toContain("NORA");
    expect(blob).not.toContain("MOVA");
    expect(blob).not.toContain("SAGA");
    expect(blob).not.toContain("/upphandling");
    expect(blob).not.toContain("aggregateRating");
    expect(blob).not.toContain("/kansli");
    expect(blob).not.toContain("/maj");
  });
});
