import { describe, expect, it } from "vitest";
import { SECURITY_HEADERS, securityHeaders } from "./security-headers.ts";

describe("SECURITY_HEADERS", () => {
  it("denies framing and sniffing", () => {
    const map = Object.fromEntries(SECURITY_HEADERS.map((header) => [header.key, header.value]));
    expect(map["X-Frame-Options"]).toBe("DENY");
    expect(map["X-Content-Type-Options"]).toBe("nosniff");
    expect(map["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(map["Cross-Origin-Opener-Policy"]).toBe("same-origin");
    expect(map["Cross-Origin-Resource-Policy"]).toBe("same-origin");
    expect(map["Permissions-Policy"]).toContain("camera=()");
    expect(map["Content-Security-Policy-Report-Only"]).toContain("frame-ancestors 'none'");
  });

  it("enforces CSP when the runtime is hardened", () => {
    const map = Object.fromEntries(
      securityHeaders({ APP_ENV: "prod" }).map((header) => [header.key, header.value]),
    );
    expect(map["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(map["Content-Security-Policy-Report-Only"]).toBeUndefined();
  });

  it("keeps CSP report-only on a Vercel preview even if APP_ENV says prod", () => {
    const map = Object.fromEntries(
      securityHeaders({ APP_ENV: "prod", VERCEL_ENV: "preview" }).map((header) => [
        header.key,
        header.value,
      ]),
    );
    expect(map["Content-Security-Policy-Report-Only"]).toContain("default-src 'self'");
    expect(map["Content-Security-Policy"]).toBeUndefined();
  });
});
