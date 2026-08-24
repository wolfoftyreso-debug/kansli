import { describe, expect, it } from "vitest";
import {
  RevolutError,
  categoryFromStatus,
  isAuthenticationFailure,
  isTransient,
  requiresReauthorization,
  tokenErrorCategory,
} from "./errors.ts";

describe("http status classification", () => {
  it("maps the statuses we must handle", () => {
    expect(categoryFromStatus(401)).toBe("authentication_expired");
    expect(categoryFromStatus(403)).toBe("forbidden");
    expect(categoryFromStatus(429)).toBe("rate_limited");
    expect(categoryFromStatus(500)).toBe("server_error");
    expect(categoryFromStatus(503)).toBe("server_error");
  });
});

describe("token endpoint classification", () => {
  it("treats invalid_grant on refresh as a dead grant", () => {
    expect(tokenErrorCategory(400, "invalid_grant", "refresh_token")).toBe("refresh_rejected");
  });

  it("treats invalid_grant on a code as a rejected code, not a dead grant", () => {
    expect(tokenErrorCategory(400, "invalid_grant", "authorization_code")).toBe("code_rejected");
  });

  it("blames the assertion for invalid_client", () => {
    expect(tokenErrorCategory(401, "invalid_client", "authorization_code")).toBe(
      "assertion_rejected",
    );
  });

  it("keeps rate limits and server errors separate from the grant", () => {
    expect(tokenErrorCategory(429, null, "refresh_token")).toBe("rate_limited");
    expect(tokenErrorCategory(502, null, "refresh_token")).toBe("server_error");
  });
});

describe("who has to do something", () => {
  it("asks a human only when the grant is permanently gone", () => {
    expect(requiresReauthorization(new RevolutError("refresh_rejected", "x"))).toBe(true);
    expect(requiresReauthorization(new RevolutError("authorization_denied", "x"))).toBe(true);
  });

  it("never asks a human about an expired access token", () => {
    const expired = new RevolutError("authentication_expired", "x", { status: 401 });
    expect(requiresReauthorization(expired)).toBe(false);
    expect(isAuthenticationFailure(expired)).toBe(true);
  });

  it("never asks a human about rate limits, timeouts or 5xx", () => {
    for (const category of ["rate_limited", "server_error", "timeout", "network"] as const) {
      const error = new RevolutError(category, "x");
      expect(requiresReauthorization(error)).toBe(false);
      expect(isTransient(error)).toBe(true);
    }
  });

  it("does not classify a plain Error as anything actionable", () => {
    expect(requiresReauthorization(new Error("boom"))).toBe(false);
    expect(isTransient(new Error("boom"))).toBe(false);
  });
});
