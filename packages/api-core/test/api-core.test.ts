import { describe, expect, it } from "vitest";
import { ApiError, problemBody, requireOrg, requirePermission } from "../src/index.ts";

const actor = {
  sub: "pixdrift:user:demo",
  email: "demo@exempelbolaget.se",
  name: "Demo",
  orgRef: "pixdrift:org:org-exempelbolaget",
  orgName: "Exempelbolaget AB",
  tier: "enterprise",
  permissions: ["scan:read"],
};

describe("ApiError", () => {
  it("maps codes to HTTP status", () => {
    expect(new ApiError("unauthenticated", "x").status).toBe(401);
    expect(new ApiError("forbidden", "x").status).toBe(403);
    expect(new ApiError("not_ready", "x").status).toBe(503);
  });

  it("never leaks an unknown error as a stack", () => {
    const body = problemBody(new Error("secret internals"), "req-1");
    expect(body.status).toBe(500);
    expect(body.title).not.toMatch(/secret/);
    expect(body.requestId).toBe("req-1");
  });
});

describe("authz", () => {
  it("requires an organisation", () => {
    expect(() => requireOrg({ ...actor, orgRef: null })).toThrow(ApiError);
    expect(requireOrg(actor).orgRef).toBe(actor.orgRef);
  });

  it("checks permissions including wildcards", () => {
    expect(() => requirePermission(actor, "scan:run")).toThrow(/Saknar/);
    expect(requirePermission(actor, "scan:read").sub).toBe(actor.sub);
    expect(requirePermission({ ...actor, permissions: ["scan:*"] }, "scan:run").sub).toBe(actor.sub);
  });
});
