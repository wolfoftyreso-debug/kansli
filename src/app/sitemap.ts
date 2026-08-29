import type { MetadataRoute } from "next";
import { MCP_DOC_LINKS } from "@/lib/mcp/catalog";
import { systems } from "@/lib/pixdrift/systems";

const base = "https://pixdrift.com";

export const PUBLIC_SITEMAP_PATHS = [
  "",
  "/systems",
  "/how-it-works",
  "/applications",
  "/documentation",
  ...MCP_DOC_LINKS.map((item) => item.href),
  "/llms.txt",
  "/why",
  "/company",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = [...new Set(PUBLIC_SITEMAP_PATHS)];
  return [
    ...paths.map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
    ...systems.map((system) => ({
      url: `${base}/systems/${system.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
