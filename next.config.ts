import type { NextConfig } from "next";
import { indexedRoutes } from "./lib/site.ts";

const isDev = process.env.NODE_ENV === "development";

// Next gives prerendered pages s-maxage=31536000. A CDN in front of this would
// then serve a year-old page after a deploy unless every release invalidates.
// An hour of shared cache with a day of stale-while-revalidate keeps the site
// fast without making correctness depend on remembering to purge.
const pageCacheControl =
  "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async redirects() {
    return [{ source: "/terms", destination: "/company", permanent: true }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      ...indexedRoutes.map(({ path }) => ({
        source: path,
        headers: [{ key: "Cache-Control", value: pageCacheControl }],
      })),
    ];
  },
};

export default nextConfig;
