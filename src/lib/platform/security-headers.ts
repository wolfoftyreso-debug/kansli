/**
 * Browser-facing headers applied to every Next response.
 * No HSTS here: localhost must stay HTTP. Vercel sets HSTS on the live host.
 * CSP is Report-Only in preview/dev. Hardened runtime enforces it.
 */
import { isHardenedRuntime, type AuthEnv } from "../auth/secrets.ts";

const CSP =
  "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";

const STATIC_HEADERS: ReadonlyArray<{ key: string; value: string }> = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
];

export function securityHeaders(
  env: AuthEnv = process.env,
): ReadonlyArray<{ key: string; value: string }> {
  const cspKey = isHardenedRuntime(env)
    ? "Content-Security-Policy"
    : "Content-Security-Policy-Report-Only";
  return [...STATIC_HEADERS, { key: cspKey, value: CSP }];
}

export const SECURITY_HEADERS: ReadonlyArray<{ key: string; value: string }> = securityHeaders();
