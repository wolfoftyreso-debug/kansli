import type { ReactNode } from "react";
import Link from "next/link";
import type { AppSession } from "@/lib/auth/session";
import { readLocale } from "@/lib/i18n/request";
import { isHouseSession } from "@/lib/kansli/intakes";
import { kronor } from "@/lib/kansli/pricing";
import { registrationHold } from "@/lib/kansli/registration-hold";
import { formatSwedishDateTime } from "@/lib/format/datetime";
import { facadeRuntimeMark } from "@/lib/platform/facade";
import { tryRuntime } from "@/lib/platform/page";
import { Facade } from "./Facade";

/** Rooms pause when the registration invoice is overdue. Ekonomi stays open so it can be paid. */
const HOLD_GATED = new Set([
  "kansli",
  "tora",
  "rita",
  "britt",
  "irma",
  "tyra",
  "alva",
  "creditae",
]);

export async function AppShell({
  current,
  session,
  children,
}: {
  current: string;
  session: AppSession | null;
  children: ReactNode;
}) {
  const locale = await readLocale();
  let content = children;

  if (session?.org?.ref && HOLD_GATED.has(current) && !isHouseSession(session.org.ref)) {
    const runtime = tryRuntime(session.org.ref);
    const hold = runtime ? await registrationHold(runtime.pool, session.org.ref) : null;
    if (hold) {
      content = (
        <>
          <p className="pd-label text-faint">Pausat</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Fakturan {hold.invoiceNumber} har förfallit
          </h1>
          <p className="pd-banner-blocked max-w-xl px-3 py-3 text-sm">
            Abonnemangsfakturan på {kronor(hold.grossOre)} inkl. moms förföll{" "}
            {formatSwedishDateTime(hold.dueAt)}. Rummen är pausade tills den är betald — inget är
            raderat, allt finns kvar.
          </p>
          <p>
            <Link
              href="/ekonomi/fakturor"
              className="inline-flex bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft"
            >
              Öppna fakturan i Ekonomi
            </Link>
          </p>
        </>
      );
    }
  }

  return (
    <Facade session={session} runtime={facadeRuntimeMark()} locale={locale}>
      {content}
    </Facade>
  );
}
