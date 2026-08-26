import type { ReactNode } from "react";
import type { AppSession } from "@/lib/auth/session";
import { readLocale } from "@/lib/i18n/request";
import { facadeRuntimeMark } from "@/lib/platform/facade";
import { Facade } from "./Facade";

export async function AppShell({
  current,
  session,
  children,
}: {
  current: string;
  session: AppSession | null;
  children: ReactNode;
}) {
  void current;
  const locale = await readLocale();
  return (
    <Facade session={session} runtime={facadeRuntimeMark()} locale={locale}>
      {children}
    </Facade>
  );
}
