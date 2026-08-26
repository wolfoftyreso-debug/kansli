import type { MetadataRoute } from "next";
import { systems } from "@/lib/pixdrift/systems";

const base = "https://pixdrift.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/systems",
    "/how-it-works",
    "/applications",
    "/documentation",
    "/documentation/mcp",
    "/documentation/mcp/authentication",
    "/documentation/mcp/clients",
    "/documentation/mcp/tools",
    "/documentation/mcp/systems",
    "/documentation/mcp/errors",
    "/documentation/capabilities",
    "/llms.txt",
    "/why",
    "/company",
  ];
  const now = new Date();
  return [
    ...staticRoutes.map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
    ...systems.map((s) => ({
      url: `${base}/systems/${s.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
