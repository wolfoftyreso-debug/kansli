import type { MetadataRoute } from "next";
import { SYSTEM_MODULES } from "@pixdrift/systems";

/** Signed-in rooms from the catalog, plus platform and API. Not the public site. */
export const APP_ROBOTS_DISALLOW = [
  ...SYSTEM_MODULES.map((module) => module.basePath),
  "/platform",
  "/api/",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: [...APP_ROBOTS_DISALLOW] }],
    sitemap: "https://pixdrift.com/sitemap.xml",
  };
}
