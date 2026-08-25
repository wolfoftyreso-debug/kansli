import { describe, expect, it } from "vitest";
import {
  Permission,
  Role,
  assertPlatformRoleIsSafe,
  formatRef,
  hasPermission,
  parseRef,
  platformRef,
  isCompatible,
  CONTRACTS_VERSION,
} from "../src/index.ts";

describe("GlobalRef", () => {
  it("round-trips system:kind:id", () => {
    const ref = platformRef("user", "abc123");
    expect(formatRef(ref)).toBe("pixdrift:user:abc123");
    expect(parseRef("pixdrift:user:abc123")).toEqual(ref);
  });

  it("rejects a bare id", () => {
    expect(() => parseRef("abc123")).toThrow();
  });
});

describe("Permission grammar", () => {
  it("accepts verb:noun", () => {
    expect(Permission.parse("scan:read")).toBe("scan:read");
    expect(Permission.parse("invoice:approve")).toBe("invoice:approve");
  });

  it("rejects a bare verb", () => {
    expect(Permission.safeParse("deleteEverything").success).toBe(false);
  });
});

describe("hasPermission", () => {
  it("matches exact and wildcard grants", () => {
    expect(hasPermission(["scan:read"], "scan:read")).toBe(true);
    expect(hasPermission(["scan:*"], "scan:read")).toBe(true);
    expect(hasPermission(["*:*"], "invoice:approve")).toBe(true);
    expect(hasPermission(["scan:read"], "scan:run")).toBe(false);
  });
});

describe("assertPlatformRoleIsSafe", () => {
  it("permits a platform role without customer-data permissions", () => {
    const role = Role.parse({
      key: "support",
      label: "Support",
      scope: "platform",
      permissions: ["member:read"],
    });
    expect(() => assertPlatformRoleIsSafe(role)).not.toThrow();
  });

  it("rejects a platform role that can read customer data", () => {
    const role = Role.parse({
      key: "support",
      label: "Support",
      scope: "platform",
      permissions: ["scan:read"],
    });
    expect(() => assertPlatformRoleIsSafe(role)).toThrow(/kunddata/);
  });

  it("ignores org-scoped roles", () => {
    const role = Role.parse({
      key: "owner",
      label: "Ägare",
      scope: "organization",
      permissions: ["scan:read", "invoice:approve"],
    });
    expect(() => assertPlatformRoleIsSafe(role)).not.toThrow();
  });
});

describe("version negotiation", () => {
  it("is compatible within the same major", () => {
    expect(isCompatible(CONTRACTS_VERSION)).toBe(true);
    expect(isCompatible("1.7.2")).toBe(true);
    expect(isCompatible("2.0.0")).toBe(false);
  });
});
