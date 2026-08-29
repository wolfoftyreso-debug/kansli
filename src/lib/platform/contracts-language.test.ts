import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Role, assertPlatformRoleIsSafe, majorOf, parseRef } from "@pixdrift/contracts";

describe("contracts leftover-throw language", () => {
  it("uses English-canonical leftover throws like EventLog unknown keys", () => {
    const source = readFileSync("packages/contracts/src/index.ts", "utf8");
    expect(source).toContain("is not a global reference (system:kind:id)");
    expect(source).toContain("cannot hold customer-data permissions:");
    expect(source).toContain("is not a semver");
    expect(source).not.toContain("är inte en global referens");
    expect(source).not.toContain("får inte ha behörighet till kunddata:");
    expect(source).not.toContain("är inte en semver");
  });

  it("throws the English-canonical sentences before accepting the value", () => {
    expect(() => parseRef("abc123")).toThrow(/abc123 is not a global reference \(system:kind:id\)/);
    expect(() =>
      assertPlatformRoleIsSafe(
        Role.parse({
          key: "support",
          label: "Support",
          scope: "platform",
          permissions: ["scan:read"],
        }),
      ),
    ).toThrow(/The platform role support cannot hold customer-data permissions: scan:read/);
    expect(() => majorOf("not-a-version")).toThrow(/not-a-version is not a semver/);
  });

  it("leaves leftover invoice-book throws as written", () => {
    expect(readFileSync("src/lib/ekonomi/invoices.ts", "utf8")).toContain(
      "bara utkast kan utfärdas.",
    );
  });
});
