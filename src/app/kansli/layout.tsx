import type { ReactNode } from "react";
import { appRoomRobots } from "@/lib/platform/app-robots";

export const metadata = appRoomRobots();

export default function AppRoomLayout({ children }: { children: ReactNode }) {
  return children;
}
