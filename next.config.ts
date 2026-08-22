import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@pixdrift/contracts", "@pixdrift/auth-client", "@pixdrift/auth-core"],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
