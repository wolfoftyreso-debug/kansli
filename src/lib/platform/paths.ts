import { SYSTEM_MODULES } from "@pixdrift/systems";

/** Start page inside the product shell. */
export const APP_HOME = "/kansli";

const EXTRA: Record<string, string> = {
  pixdrift: APP_HOME,
  platform: "/platform",
  events: "/platform/events",
  revolut: "/ekonomi/anslutningar/revolut",
};

/**
 * Where a named product or place lives. Unknown names return null —
 * do not invent a page.
 */
export function appPath(id: string): string | null {
  if (id in EXTRA) return EXTRA[id] ?? null;
  const system = SYSTEM_MODULES.find((item) => item.id === id);
  if (!system) return null;
  if (system.id === "identity") return APP_HOME;
  return system.basePath;
}
