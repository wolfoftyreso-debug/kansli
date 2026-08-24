import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@pixdrift/contracts",
    "@pixdrift/auth-client",
    "@pixdrift/auth-core",
    // The IdP is mounted under /idp (see src/app/idp/[[...slug]]/route.ts); its
    // TypeScript source must be transpiled by the app build.
    "@pixdrift/identity",
    "@pixdrift/db",
    "@pixdrift/tora",
    "@pixdrift/rita-engine",
    "@pixdrift/api-core",
    "@pixdrift/events",
    "@pixdrift/systems",
    "@pixdrift/ai-core",
  ],
  // Keep the IdP's Node runtime dependencies external (loaded from node_modules
  // at runtime) rather than bundling them into the server output.
  serverExternalPackages: ["fastify", "@fastify/cookie", "@fastify/formbody", "pg"],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
