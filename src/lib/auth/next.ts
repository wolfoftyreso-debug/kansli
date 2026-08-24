import { productModules } from "@pixdrift/systems";

/**
 * After OIDC the BFF may send the user back to the product they came from.
 * Only same-origin app routes are allowed — never an open redirect.
 */
export const APP_NEXT_PATHS = [
  ...productModules().map((module) => module.basePath),
  "/tora/calendar",
  "/tyra/integrations",
  "/tyra/kunder",
  "/kansli/beredskap",
  "/kansli/upphandling",
  "/upphandling",
  "/ekonomi/fakturor",
  "/ekonomi/verifikat",
  "/ekonomi/rapporter",
  "/ekonomi/anslutningar",
  "/platform",
  "/platform/events",
] as const;

export type AppNextPath = (typeof APP_NEXT_PATHS)[number];

export function safeNextPath(value: string | null | undefined): AppNextPath | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.includes("://") || value.includes("\\") || value.includes("@")) return null;
  const path = value.split("?")[0]?.split("#")[0];
  if (!path) return null;
  return (APP_NEXT_PATHS as readonly string[]).includes(path) ? (path as AppNextPath) : null;
}
