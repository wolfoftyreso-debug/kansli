import type { Metadata } from "next";

/** Signed-in rooms, leftover guest links, leftover confirmation. Not the public site. */
export const APP_ROOM_ROBOTS = { index: false, follow: false } as const;
export const APP_ROOM_ROBOTS_CONTENT = "noindex, nofollow" as const;
export const APP_ROOM_VIEWPORT_META =
  '<meta name="viewport" content="width=device-width, initial-scale=1">' as const;

/** HTML noindex already. Not in robots.txt — leftover intake form stays crawlable. */
export const APP_ROOM_X_ROBOTS_EXTRA = ["/upphandling/bekraftelse"] as const;

/**
 * Leftover HTTP noindex sources. Listed here so `next.config.ts` does not load
 * `@pixdrift/systems`. Tests lock this to `APP_ROBOTS_DISALLOW` plus extra.
 */
export const APP_ROOM_X_ROBOTS_PATHS = [
  "/idp",
  "/kansli",
  "/ekonomi",
  "/tora",
  "/rita",
  "/britt",
  "/irma",
  "/tyra",
  "/alva",
  "/creditae",
  "/maj",
  "/platform",
  "/api/",
  ...APP_ROOM_X_ROBOTS_EXTRA,
] as const;

export function leftoverXRobotsSource(path: string): string {
  const trimmed = path.endsWith("/") ? path.slice(0, -1) : path;
  return `${trimmed}/:path*`;
}

export function appRoomXRobotsHeaders(): Array<{
  source: string;
  headers: Array<{ key: string; value: string }>;
}> {
  return APP_ROOM_X_ROBOTS_PATHS.map((path) => ({
    source: leftoverXRobotsSource(path),
    headers: [{ key: "X-Robots-Tag", value: APP_ROOM_ROBOTS_CONTENT }],
  }));
}

export function appRoomRobots(): Pick<Metadata, "robots"> {
  return { robots: APP_ROOM_ROBOTS };
}

export function appRoomRobotsMeta(): string {
  return `<meta name="robots" content="${APP_ROOM_ROBOTS_CONTENT}">`;
}
