import { describe, expect, it } from "vitest";
import {
  effectiveStatus,
  parseVerificationLevel,
  statusLabel,
  verificationLabel,
} from "./status.ts";

describe("parseVerificationLevel", () => {
  it("accepts only 0 and 1", () => {
    expect(parseVerificationLevel(0)).toBe(0);
    expect(parseVerificationLevel("0")).toBe(0);
    expect(parseVerificationLevel(1)).toBe(1);
    expect(parseVerificationLevel(undefined)).toBe(1);
    expect(parseVerificationLevel(5)).toBe(1);
  });
});

describe("effectiveStatus", () => {
  it("keeps signed and cancelled", () => {
    expect(
      effectiveStatus({
        status: "signed",
        tokenExpiresAt: "2000-01-01T00:00:00.000Z",
        tokenRevokedAt: "2000-01-01T00:00:00.000Z",
      }),
    ).toBe("signed");
    expect(effectiveStatus({ status: "cancelled" })).toBe("cancelled");
  });

  it("surfaces revoke and expiry without rewriting signed rows", () => {
    expect(
      effectiveStatus({
        status: "draft",
        tokenRevokedAt: "2026-01-01T00:00:00.000Z",
      }),
    ).toBe("cancelled");
    expect(
      effectiveStatus({
        status: "viewed",
        tokenExpiresAt: "2000-01-01T00:00:00.000Z",
      }),
    ).toBe("expired");
    expect(effectiveStatus({ status: "viewed" })).toBe("viewed");
  });
});

describe("labels", () => {
  it("uses product language, not raw enums", () => {
    expect(statusLabel("signed")).toBe("Bekräftat");
    expect(verificationLabel(0)).toContain("informationsunderlag");
    expect(verificationLabel(1)).toContain("nivå 1");
  });
});
