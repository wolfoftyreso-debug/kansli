import type { ReactNode } from "react";
import type { AppSession } from "@/lib/auth/session";
import { facadeRuntimeMark } from "@/lib/platform/facade";
import { Facade } from "./Facade";

export function AppShell({
  current,
  session,
  children,
}: {
  current: string;
  session: AppSession | null;
  children: ReactNode;
}) {
  void current;
  return (
    <Facade session={session} runtime={facadeRuntimeMark()}>
      {children}
    </Facade>
  );
}
