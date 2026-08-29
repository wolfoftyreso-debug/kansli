import { describe, expect, it } from "vitest";
import { SYSTEM_MODULES } from "@pixdrift/systems";
import robots, { APP_ROBOTS_DISALLOW } from "../../app/robots.ts";
import sitemap from "../../app/sitemap.ts";

describe("leftover robots app-room lock", () => {
  it("blocks every catalog room and keeps the public site open", () => {
    const rules = robots().rules;
    const rule = Array.isArray(rules) ? rules[0] : rules;
    const disallow = [...(rule?.disallow ?? [])];
    expect(disallow).toEqual([...APP_ROBOTS_DISALLOW]);
    for (const module of SYSTEM_MODULES) {
      expect(disallow, module.basePath).toContain(module.basePath);
    }
    expect(disallow).toContain("/kansli");
    expect(disallow).toContain("/idp");
    expect(disallow).toContain("/platform");
    expect(disallow).toContain("/api/");
    expect(disallow).not.toContain("/documentation");
    expect(disallow).not.toContain("/systems");
    expect(disallow).not.toContain("/upphandling");
    expect(disallow).not.toContain("/why");
    expect(disallow).not.toContain("/company");
  });

  it("leaves leftover public sitemap routes as written", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain("https://pixdrift.com/documentation/mcp");
    expect(urls).toContain("https://pixdrift.com/documentation/rest");
    expect(urls).toContain("https://pixdrift.com/why");
    expect(urls).toContain("https://pixdrift.com/systems/tora");
    expect(urls).toContain("https://pixdrift.com/systems/ekonomi");
    expect(urls).not.toContain("https://pixdrift.com/ekonomi");
  });
});
