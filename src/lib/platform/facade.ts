import { SYSTEM_MODULES } from "@pixdrift/systems";

export type FacadeLink = {
  href: string;
  label: string;
  id: string;
};

/** Products in the rail. Identity is the login, not a room. */
export const FACADE_PRODUCTS: readonly FacadeLink[] = SYSTEM_MODULES.filter(
  (module) => module.id !== "identity",
).map((module) => ({
  href: module.basePath,
  label: module.name,
  id: module.id,
}));

export const FACADE_SERVICE: readonly FacadeLink[] = [
  { href: "/platform", label: "service.platform", id: "platform" },
  { href: "/platform/drift", label: "service.ops", id: "drift" },
  { href: "/platform/events", label: "service.events", id: "events" },
  { href: "/kansli/upphandling", label: "service.procurement", id: "upphandling" },
  { href: "/upphandling", label: "service.intake", id: "intake" },
  { href: "/documentation", label: "service.docs", id: "docs" },
];

/** `pixdrift:org:org-exempelbolaget` → `org-exempelbolaget` for the IdP `org` query. */
export function orgIdFromRef(ref: string): string | null {
  const prefix = "pixdrift:org:";
  if (!ref.startsWith(prefix)) return null;
  const id = ref.slice(prefix.length).trim();
  return id || null;
}

export type FacadeRuntime = "production" | "preview" | "local";

export function facadeRuntimeMark(
  env: Record<string, string | undefined> = process.env,
): FacadeRuntime {
  if (env.VERCEL_ENV === "preview") return "preview";
  if (env.VERCEL_ENV === "development") return "local";
  if (env.VERCEL_ENV === "production" || env.APP_ENV === "prod" || env.APP_ENV === "production") {
    return "production";
  }
  return "local";
}

/** Longest matching href wins, so /platform/events is not Plattform. */
export function isFacadeActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (pathname === href) return true;
  if (!pathname.startsWith(`${href}/`)) return false;
  return true;
}

export function activeFacadeHref(pathname: string, hrefs: readonly string[]): string | null {
  const matches = hrefs.filter((href) => isFacadeActive(pathname, href));
  if (matches.length === 0) return null;
  return matches.reduce((best, href) => (href.length > best.length ? href : best));
}

export function loginNextFromPath(pathname: string): string {
  const hrefs = FACADE_PRODUCTS.map((item) => item.href);
  const extra = [
    "/platform/drift",
    "/platform/events",
    "/platform/mcp",
    "/platform",
    "/kansli/upphandling",
    "/upphandling",
  ];
  const match = activeFacadeHref(pathname, [...hrefs, ...extra]);
  return match ?? "/kansli";
}
