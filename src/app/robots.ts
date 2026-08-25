import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/kansli", "/api/", "/idp/"] }],
    sitemap: "https://pixdrift.com/sitemap.xml",
  };
}
