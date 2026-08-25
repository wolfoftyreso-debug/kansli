import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { EmptyState, Field, Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import { CASE_STATUS_LABELS, listCases, parseCaseStatus } from "@/lib/alva/cases";
import { readSession } from "@/lib/auth/session";
import { formatSwedishDateTime } from "@/lib/format/datetime";
import { tryRuntime } from "@/lib/platform/page";
import { registerAlvaCase } from "./actions";

export const metadata = {
  title: "ALVA — Pixdrift",
  description: "Kundens fel, anteckningar och mätvärden. Diagnosen kommer senare.",
};

export default async function AlvaPage() {
  const session = await readSession();
  const runtime = tryRuntime();
  const cases = session?.org?.ref && runtime ? await listCases(runtime.pool, session.org.ref) : [];

  return (
    <AppShell current="alva" session={session}>
      <header className="flex flex-col gap-3">
        <ProductCrumb crumbs={[{ href: "/alva", label: "ALVA" }]} />
        <h1 className="text-3xl font-semibold tracking-tight">ALVA</h1>
        <p className="text-ink-soft">
          ALVA tar emot vad kunden sa, vad ni antecknade och vad som mättes. Diagnosen kopplas in
          senare. Systemet ställer ingen diagnos själv.
        </p>
        <Notice>
          Diagnosen är inte inkopplad än. Ni kan fylla i ett tomt protokoll med egna uppgifter.
          Systemet hittar aldrig på något.
        </Notice>
      </header>

      {!session?.org ? (
        <SignInGate next="/alva" title="Logga in för att registrera ärenden">
          Ärendet sparas i ALVA. Logga in för att registrera.
        </SignInGate>
      ) : (
        <>
          <form
            action={registerAlvaCase}
            className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
          >
            <h2 className="text-lg font-semibold">Nytt fall</h2>
            <Field name="complaint" label="Kundens beskrivning" required multiline />
            <Field name="vehicleRef" label="Fordonsreferens (valfritt)" />
            <Field name="area" label="Område (valfritt, t.ex. bromsar)" />
            <Field name="mileageKm" label="Mätarställning km (valfritt)" />
            <Field name="desiredOutcome" label="Önskat utfall (valfritt)" />
            <Submit>Registrera fall</Submit>
          </form>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Fall</h2>
            {cases.length === 0 ? (
              <EmptyState>Inga fall ännu.</EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {cases.map((item) => (
                  <li key={item.id} className="rounded-xl border border-line bg-surface p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-accent">
                      {CASE_STATUS_LABELS[parseCaseStatus(item.status) ?? "open"]}
                    </p>
                    <p className="mt-2 font-medium">
                      <Link href={`/alva/${item.id}`} className="hover:underline">
                        {item.complaint}
                      </Link>
                    </p>
                    {item.vehicleRef ? (
                      <p className="font-mono text-xs text-faint">{item.vehicleRef}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-faint">
                      {formatSwedishDateTime(item.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
