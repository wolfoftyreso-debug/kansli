import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import {
  CheckField,
  EmptyState,
  Field,
  Notice,
  SignInGate,
  Submit,
} from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { tryRuntime } from "@/lib/platform/page";
import { listAnalyses } from "@/lib/rita/analyses";
import { ritaEngineSnapshot } from "@/lib/rita/resolve-engine";
import { requestRitaAnalysis } from "./actions";

export const metadata = {
  title: "RITA — Pixdrift",
  description: "Verifiering av räkenskaper mot ett regelverk.",
};

export default async function RitaPage() {
  const session = await readSession();
  const runtime = tryRuntime();
  const analyses =
    session?.org?.ref && runtime ? await listAnalyses(runtime.pool, session.org.ref) : [];
  const engine = ritaEngineSnapshot();

  return (
    <AppShell current="rita" session={session}>
      <header className="flex flex-col gap-3">
        <p className="pd-label text-faint">PIXDRIFT / RITA</p>
        <h1 className="text-3xl font-semibold tracking-tight">RITA</h1>
        <p className="text-ink-soft">
          Verifierar räkenskaper mot ett regelverk. Det är inte TORA — TORA avgör om ett bolag får
          lämna anbud.
        </p>
        <Notice>
          {engine.available
            ? engine.modelReady
              ? `Motorn är kopplad (${engine.kind}${engine.modelId ? `, ${engine.modelId}` : ""}). Regelverk plus språkmodell. Svaret är inferens där modellen bidragit.`
              : `Motorn är kopplad (${engine.kind}) men kör bara regelverket. ANTHROPIC_API_KEY saknas i subprocessen.`
            : "Ingen motor. Utan RITA_ENGINE_URL + token eller RITA_ENGINE_BINARY blir status blocked. Motorn fejkars inte."}{" "}
          Demonstrationsbokslutet är en inbyggd textfil, inte en kunduppladdning.
        </Notice>
      </header>

      {!session?.org ? (
        <SignInGate next="/rita" title="Logga in för att begära analys">
          Analysen skrivs i RITA:s eget schema. BRITT får veta via händelseloggen när något slutar
          eller blockeras.
        </SignInGate>
      ) : (
        <>
          <form
            action={requestRitaAnalysis}
            className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
          >
            <h2 className="text-lg font-semibold">Ny analys</h2>
            <Field
              name="companyName"
              label="Bolagsnamn"
              required
              defaultValue="Exempelbolaget AB"
            />
            <Field
              name="orgNumber"
              label="Organisationsnummer"
              required
              defaultValue="556016-0680"
            />
            <CheckField
              name="useDemoDocument"
              defaultChecked
              label="Använd demonstrationsbokslut (exempel-bokslut.txt). Inte en kundfil."
            />
            <Submit>Begär analys</Submit>
          </form>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Analyser</h2>
            {analyses.length === 0 ? (
              <EmptyState>Inga analyser ännu.</EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {analyses.map((item) => (
                  <li key={item.id} className="rounded-xl border border-line bg-surface p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-accent">
                      {item.status}
                    </p>
                    <p className="mt-2 font-medium">
                      <Link href={`/rita/${item.id}`} className="hover:underline">
                        {item.companyName}
                      </Link>
                    </p>
                    <p className="font-mono text-xs text-faint">{item.orgNumber}</p>
                    {item.blockedReason ? (
                      <p className="mt-2 text-sm text-muted">{item.blockedReason}</p>
                    ) : null}
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
