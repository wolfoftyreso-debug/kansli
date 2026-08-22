import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@pixdrift/contracts", "@pixdrift/auth-client", "@pixdrift/auth-core"],
};

export default nextConfig;
