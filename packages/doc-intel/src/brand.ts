/**
 * Canonical system identity — the single controlled source for brand terms.
 *
 * System name: **Pixdrift** (pixdrift.com). Created by **Landvex**.
 *
 * Reactive documentation placeholders resolve from here (and other controlled
 * maps), e.g. `{{product.name}}` → "Pixdrift", `{{company.name}}` → "Landvex".
 * Resolution is deterministic and allow-list based: only keys that exist in the
 * provided maps are substituted. There is no expression language and no code
 * execution — an unknown placeholder is left untouched and reported, so
 * terminology changes and localisation propagate safely.
 */

import { readFileSync } from "node:fs";
import { z } from "zod";

export const Brand = z.object({
  product: z.object({
    name: z.string().min(1),
    domain: z.string().min(1),
    url: z.string().url(),
  }),
  company: z.object({
    name: z.string().min(1),
    role: z.string().min(1),
  }),
  attribution: z.string().min(1),
  legal: z.string().min(1),
});
export type Brand = z.infer<typeof Brand>;

/** Load + validate the canonical brand identity shipped with the package. */
export function loadBrand(dir: URL = new URL("../data/", import.meta.url)): Brand {
  const raw = readFileSync(new URL("brand.json", dir), "utf8");
  return Brand.parse(JSON.parse(raw));
}

/** Flatten a nested object into dotted keys with string leaves (allow-list). */
export function flatten(obj: unknown, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  if (obj === null || typeof obj !== "object") return out;
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) {
      // Arrays are not part of the placeholder allow-list; skip them.
      continue;
    } else if (value !== null && typeof value === "object") {
      Object.assign(out, flatten(value, path));
    } else if (typeof value === "string" || typeof value === "number") {
      out[path] = String(value);
    }
  }
  return out;
}

/** The default placeholder map derived from the canonical brand identity. */
export function brandValues(brand: Brand = loadBrand()): Record<string, string> {
  return flatten(brand);
}

const PLACEHOLDER = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

export interface ResolveResult {
  text: string;
  /** Placeholders with no controlled value — left in place and surfaced. */
  unresolved: string[];
}

/**
 * Resolve `{{dotted.key}}` placeholders from the provided controlled maps.
 * Deterministic, allow-list only: unknown keys are left untouched and returned
 * in `unresolved` (never guessed, never executed).
 */
export function resolvePlaceholders(
  text: string,
  ...maps: Record<string, string>[]
): ResolveResult {
  const values = Object.assign({}, ...maps) as Record<string, string>;
  const unresolved = new Set<string>();
  const out = text.replace(PLACEHOLDER, (whole, key: string) => {
    if (Object.prototype.hasOwnProperty.call(values, key)) return values[key];
    unresolved.add(key);
    return whole;
  });
  return { text: out, unresolved: [...unresolved] };
}
