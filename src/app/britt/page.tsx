import { AppShell } from "@/components/app/AppShell";
import { EmptyState, Field, Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { listObservations } from "@/lib/britt/observations";
import { tryRuntime } from "@/lib/platform/page";
import { recordObservation } from "./actions";

export const metadata = {
  title: "BRITT — Pixdrift",
  description: "Operativa observationer och uppföljning.",
};

export default async function BrittPage() {
  const session = await readSession();
  const runtime = tryRuntime();
  const observations =
    session?.org?.ref && runtime ? await listObservations(runtime.pool, session.org.ref) : [];

  return (
    <AppShell current="britt" session={session}>
      <header className="flex flex-col gap-3">
        <p className="pd-label text-faint">PIXDRIFT / BRITT</p>
        <h1 className="text-3xl font-semibold tracking-tight">BRITT</h1>
        <p className="text-ink-soft">
          Operativa observationer. BRITT skriver bara i sitt eget schema. När TORA publicerar
          en marknadsutvärdering eller RITA avslutar en analys lyssnar BRITT på händelsen.
        </p>
        <Notice>
          Detta är observationsinkorgen — inte hela underrättelseprodukten från BRITT-repot.
        </Notice>
      </header>

      {!session?.org ? (
        <SignInGate next="/britt" title="Logga in för att se observationer">
          Observationer är per organisation. Synk från TORA och RITA syns här när de publicerar.
        </SignInGate>
      ) : (
        <>
          <form action={recordObservation} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
            <h2 className="text-lg font-semibold">Ny observation</h2>
            <Field name="title" label="Rubrik" required />
            <Field name="body" label="Anteckning" multiline />
            <Submit>Spara</Submit>
          </form>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Inkorgen</h2>
            {observations.length === 0 ? (
              <EmptyState>Inga observationer ännu.</EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {observations.map((item) => (
                  <li key={item.id} className="rounded-xl border border-line bg-surface p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-accent">
                      {item.sourceSystem} · {item.severity}
                    </p>
                    <p className="mt-2 font-medium">{item.title}</p>
                    {item.body ? <p className="mt-1 text-sm text-ink-soft">{item.body}</p> : null}
                    <p className="mt-2 font-mono text-xs text-faint">{item.createdAt}</p>
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
