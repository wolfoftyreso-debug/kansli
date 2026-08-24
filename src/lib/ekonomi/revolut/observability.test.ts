import { afterEach, describe, expect, it, vi } from "vitest";
import { RevolutError } from "./errors.ts";
import { logRevolut, logRevolutError, safeFields } from "./observability.ts";

function captured(): { lines: string[]; restore: () => void } {
  const lines: string[] = [];
  const info = vi.spyOn(console, "info").mockImplementation((line) => lines.push(String(line)));
  const error = vi.spyOn(console, "error").mockImplementation((line) => lines.push(String(line)));
  return {
    lines,
    restore: () => {
      info.mockRestore();
      error.mockRestore();
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("revolut logging", () => {
  it("emits structured lines with safe identifiers only", () => {
    const sink = captured();
    logRevolut("token.refreshed", {
      orgRef: "pixdrift:org:acme",
      connectionId: "conn-1",
      environment: "production",
      requestId: "req-9",
      expiresInSeconds: 2400,
      rotatedRefreshToken: true,
    });
    sink.restore();
    const parsed = JSON.parse(sink.lines[0]!);
    expect(parsed.event).toBe("revolut.token.refreshed");
    expect(parsed.orgRef).toBe("pixdrift:org:acme");
    expect(parsed.expiresInSeconds).toBe(2400);
  });

  it("redacts anything that smells like a credential", () => {
    const fields = safeFields({
      providerCode: "access_token=abc123",
      path: "Bearer sk_live_should_never_appear",
      connectionId: "-----BEGIN PRIVATE KEY-----",
    });
    const blob = JSON.stringify(fields);
    expect(blob).not.toContain("abc123");
    expect(blob).not.toContain("sk_live");
    expect(blob).not.toContain("BEGIN PRIVATE KEY");
    expect(fields.providerCode).toBe("[redacted]");
  });

  it("logs an error's category and status, never its cause payload", () => {
    const sink = captured();
    logRevolutError(
      "token.refresh_failed",
      new RevolutError("refresh_rejected", "avvisad", {
        status: 400,
        providerCode: "invalid_grant",
        cause: new Error("refresh_token=rt_secret_value"),
      }),
      { orgRef: "pixdrift:org:acme" },
    );
    sink.restore();
    const line = sink.lines[0]!;
    expect(line).toContain("invalid_grant");
    expect(line).not.toContain("rt_secret_value");
    expect(JSON.parse(line).category).toBe("refresh_rejected");
  });

  it("keeps failures on stderr so they can be alerted on", () => {
    const sink = captured();
    const errorSpy = vi.spyOn(console, "error");
    logRevolut("oauth.failed", { orgRef: "pixdrift:org:acme" });
    sink.restore();
    expect(errorSpy).toHaveBeenCalled();
  });
});
