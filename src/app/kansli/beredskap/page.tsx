import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { Notice, SignInGate } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { loadFirstCustomerBoard, type GateState } from "@/lib/platform/first-customer";
import { tryRuntime } from "@/lib/platform/page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Beredskap — Kansli",
  description: "Checklistan för första kunden. Inte ett datum.",
};

function tone(state: GateState) {
  if (state === "ready") return "text-ink";
  if (state === "blocked") return "text-ink";
  return "text-ink-soft";
}

function label(state: GateState) {
  if (state === "ready") return "Klar";
  if (state === "blocked") return "Blockerad";
  return "Öppen";
}

export default async function BeredskapPage() {
  const session = await readSession();
  const runtime = tryRuntime();
  const board = await loadFirstCustomerBoard(runtime?.pool ?? null, session?.org?.ref ?? null);

  return (
    <AppShell current="kansli" session={session}>
      <p className="pd-label text-faint">
        <Link href="/kansli" className="hover:underline">
          Kansli
        </Link>
        {" · "}
        Beredskap
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">Första kunden</h1>
      <p className="max-w-xl text-ink-soft">
        Ingen lanseringsdag — en checklista. Varje punkt läses direkt ur systemet, inte ur en plan.
      </p>

      {!session?.org ? (
        <SignInGate next="/kansli/beredskap" title="Logga in för att läsa checklistan">
          Checklistan bygger på hur ert system faktiskt mår just nu.
        </SignInGate>
      ) : (
        <>
          <section className="rounded-xl border border-line bg-surface px-4 py-4">
            <p className="font-medium">
              {board.pilotOfferable
                ? "Pilot kan erbjudas — om kunden skriver under vad produkten inte är."
                : "Pilot kan inte erbjudas. En blockerad punkt måste lösas först."}
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              Alla sex system klara:{" "}
              {board.allSystemsReady
                ? "ja."
                : "nej. ALVA:s diagnos och RITA:s analys ligger utanför det här systemet."}
            </p>
            <p className="mt-3 text-sm">
              <Link href="/upphandling" className="underline decoration-line underline-offset-4">
                Koncernupphandling är formuläret
              </Link>
              {" — "}
              underlag för demo och möte om tio dagar.
            </p>
          </section>

          <ol className="flex flex-col gap-2">
            {board.gates.map((gate) => (
              <li key={gate.id} className="rounded-xl border border-line bg-surface px-4 py-3">
                <p className={`text-xs font-medium uppercase tracking-wide ${tone(gate.state)}`}>
                  {label(gate.state)}
                </p>
                <p className="mt-1 font-medium">{gate.title}</p>
                <p className="mt-1 text-sm text-ink-soft">{gate.detail}</p>
              </li>
            ))}
          </ol>

          <Notice>
            Sälj inget som inte finns: RITA utan analys säljs inte, ALVA utan diagnos är bara
            registrering, och TYRA:s påminnelser läggs i kö men skickas inte.
          </Notice>
        </>
      )}
    </AppShell>
  );
}
