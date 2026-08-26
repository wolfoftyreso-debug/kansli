import type { MetadataRoute } from "next";
import { indexedRoutes, site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return indexedRoutes.map(({ path, changeFrequency, priority }) => ({
    url: `${site.url}${path}`,
    changeFrequency,
    priority,
  }));
}
