import { describe, expect, it } from "vitest";
import {
  activeFacadeHref,
  facadeRuntimeMark,
  isFacadeActive,
  loginNextFromPath,
  orgIdFromRef,
} from "./facade.ts";

describe("facade", () => {
  it("keeps preview out of production", () => {
    expect(facadeRuntimeMark({ VERCEL_ENV: "preview", APP_ENV: "prod" })).toBe("preview");
    expect(facadeRuntimeMark({ VERCEL_ENV: "production" })).toBe("production");
    expect(facadeRuntimeMark({ NODE_ENV: "production" })).toBe("local");
  });

  it("marks the longest matching room, not the parent", () => {
    expect(isFacadeActive("/ekonomi/fakturor", "/ekonomi")).toBe(true);
    expect(activeFacadeHref("/platform/events", ["/platform", "/platform/events"])).toBe(
      "/platform/events",
    );
    expect(activeFacadeHref("/documentation/mcp", ["/documentation"])).toBe("/documentation");
  });

  it("strips the org ref down to the id the IdP understands", () => {
    expect(orgIdFromRef("pixdrift:org:org-nordvik")).toBe("org-nordvik");
    expect(orgIdFromRef("org-nordvik")).toBeNull();
  });

  it("sends login back to the room the user stood in", () => {
    expect(loginNextFromPath("/ekonomi/fakturor")).toBe("/ekonomi");
    expect(loginNextFromPath("/platform/drift")).toBe("/platform/drift");
    expect(loginNextFromPath("/")).toBe("/kansli");
  });
});
