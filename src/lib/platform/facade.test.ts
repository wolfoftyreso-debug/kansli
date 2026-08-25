import { describe, expect, it } from "vitest";
import {
  activeFacadeHref,
  facadeRuntimeMark,
  isFacadeActive,
  loginNextFromPath,
} from "./facade.ts";

describe("facade", () => {
  it("keeps preview out of production", () => {
    expect(facadeRuntimeMark({ VERCEL_ENV: "preview", APP_ENV: "prod" })).toBe("förhandsvisning");
    expect(facadeRuntimeMark({ VERCEL_ENV: "production" })).toBe("produktion");
    expect(facadeRuntimeMark({ NODE_ENV: "production" })).toBe("lokal");
  });

  it("marks the longest matching room, not the parent", () => {
    expect(isFacadeActive("/ekonomi/fakturor", "/ekonomi")).toBe(true);
    expect(activeFacadeHref("/platform/events", ["/platform", "/platform/events"])).toBe(
      "/platform/events",
    );
    expect(activeFacadeHref("/documentation/mcp", ["/documentation"])).toBe("/documentation");
  });

  it("sends login back to the room the user stood in", () => {
    expect(loginNextFromPath("/ekonomi/fakturor")).toBe("/ekonomi");
    expect(loginNextFromPath("/")).toBe("/kansli");
  });
});
