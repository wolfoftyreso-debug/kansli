import { describe, expect, it } from "vitest";
import { SECURITY_HEADERS } from "./security-headers.ts";

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
});
