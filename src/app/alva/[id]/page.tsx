import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { Notice, SignInGate } from "@/components/app/SignInGate";
import { getCase } from "@/lib/alva/cases";
import { readSession } from "@/lib/auth/session";
import { tryRuntime } from "@/lib/platform/page";

export const metadata = {
  title: "Fall — ALVA — Pixdrift",
};

export default async function AlvaCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await readSession();
  const runtime = tryRuntime();
  const item =
    session?.org?.ref && runtime ? await getCase(runtime.pool, session.org.ref, id) : null;
  if (session?.org && runtime && !item) notFound();

  return (
    <AppShell current="alva" session={session}>
      <p className="pd-label text-faint">
        <Link href="/alva" className="hover:text-ink">
          PIXDRIFT / ALVA
        </Link>
      </p>
      {!session?.org ? (
        <SignInGate next="/alva" title="Logga in för att se fallet">
          Fallet tillhör organisationen.
        </SignInGate>
      ) : item ? (
        <>
          <h1 className="text-3xl font-semibold tracking-tight">Registrerat fall</h1>
          <p className="text-xs font-medium uppercase tracking-wide text-accent">{item.status}</p>
          <Notice>
            Diagnosmotorn saknas. Det här är intag — inte ett protokoll och inte en diagnos.
          </Notice>
          <dl className="flex flex-col gap-3">
            <div>
              <dt className="text-sm text-ink-soft">Kundens beskrivning</dt>
              <dd className="mt-1">{item.complaint}</dd>
            </div>
            {item.vehicleRef ? (
              <div>
                <dt className="text-sm text-ink-soft">Fordonsreferens</dt>
                <dd className="mt-1 font-mono text-sm">{item.vehicleRef}</dd>
              </div>
            ) : null}
            {item.area ? (
              <div>
                <dt className="text-sm text-ink-soft">Område</dt>
                <dd className="mt-1">{item.area}</dd>
              </div>
            ) : null}
            {item.mileageKm != null ? (
              <div>
                <dt className="text-sm text-ink-soft">Mätarställning</dt>
                <dd className="mt-1">{item.mileageKm} km</dd>
              </div>
            ) : null}
            {item.desiredOutcome ? (
              <div>
                <dt className="text-sm text-ink-soft">Önskat utfall</dt>
                <dd className="mt-1">{item.desiredOutcome}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-sm text-ink-soft">Registrerat</dt>
              <dd className="mt-1 font-mono text-xs text-faint">{item.createdAt}</dd>
            </div>
          </dl>
        </>
      ) : null}
    </AppShell>
  );
}
