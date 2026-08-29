import { PUBLIC_SITEMAP_PATHS } from "../../app/sitemap.ts";
import { brand } from "../pixdrift/brand.ts";
import { systems } from "../pixdrift/systems.ts";

export const PUBLIC_CANONICAL_PATHS = new Set<string>([
  ...PUBLIC_SITEMAP_PATHS,
  ...systems.map((system) => `/systems/${system.slug}`),
]);

export function publicCanonical(path: string): string {
  const normalized = path === "/" ? "" : path;
  if (!PUBLIC_CANONICAL_PATHS.has(normalized)) {
    throw new Error(`leftover canonical refuses unknown public path: ${path}`);
  }
  return `${brand.url}${normalized}`;
}
