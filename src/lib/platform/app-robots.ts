import type { Metadata } from "next";

/** Signed-in rooms, leftover guest links, leftover confirmation. Not the public site. */
export const APP_ROOM_ROBOTS = { index: false, follow: false } as const;

export function appRoomRobots(): Pick<Metadata, "robots"> {
  return { robots: APP_ROOM_ROBOTS };
}
