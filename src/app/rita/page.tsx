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
import { formatSwedishDateTime } from "@/lib/format/datetime";
import { tryRuntime } from "@/lib/platform/page";
import { ANALYSIS_STATUS_LABELS, listAnalyses } from "@/lib/rita/analyses";
import { findingsFromAnalysis } from "@/lib/rita/findings";
import { ritaEngineSnapshot } from "@/lib/rita/resolve-engine";
import { requestRitaAnalysis } from "./actions";

export const metadata = {
  title: "RITA — Pixdrift",
  description: "Skattemässiga besparingar i underlaget. Motorn är skattjakt.",
};

export default async function RitaPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await readSession();
  const runtime = tryRuntime();
  const params = await searchParams;
  const status =
    params.status === "completed" || params.status === "blocked" || params.status === "requested"
      ? params.status
      : undefined;
  const analyses =
    session?.org?.ref && runtime
      ? await listAnalyses(runtime.pool, session.org.ref, { status })
      : [];
  const engine = ritaEngineSnapshot();

  return (
    <AppShell current="rita" session={session}>
      <header className="flex flex-col gap-3">
        <p className="pd-label text-faint">PIXDRIFT / RITA</p>
        <h1 className="text-3xl font-semibold tracking-tight">RITA</h1>
        <p className="text-ink-soft">
          RITA jagar skattemässiga besparingar i böckerna: avdrag, moms, K10, pension, FoU. Motorn
          är skattjakt. Fynden är preliminära — inte ett skatteråd. TORA avgör anbud; det är en
          annan fråga.
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
          {engine.available ? (
            <form
              action={requestRitaAnalysis}
              className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
            >
              <h2 className="text-lg font-semibold">Ny analys</h2>
              <Field name="companyName" label="Bolagsnamn" required placeholder="Ert bolagsnamn" />
              <Field
                name="orgNumber"
                label="Organisationsnummer"
                required
                placeholder="556xxx-xxxx"
              />
              <p className="text-sm text-ink-soft">
                Subprocessen kan ta upp till 7 minuter. Det är inte 240000 ms i UI:t.
              </p>
              {engine.kind === "http" ? (
                <p className="text-sm text-ink-soft">
                  HTTP-motorn tar inte demonstrationsfilen. Ladda upp hos hosten, eller kör
                  subprocess.
                </p>
              ) : (
                <CheckField
                  name="useDemoDocument"
                  defaultChecked
                  label="Använd demonstrationsbokslut (exempel-bokslut.txt). Inte en kundfil."
                />
              )}
              <Submit>Begär analys</Submit>
            </form>
          ) : (
            <Notice>
              Formuläret är avstängt tills motorn finns. Se{" "}
              <Link
                href="/kansli/beredskap"
                className="underline decoration-line underline-offset-4"
              >
                beredskap
              </Link>
              .
            </Notice>
          )}

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Analyser</h2>
            <p className="flex flex-wrap gap-3 text-sm">
              <Link href="/rita" className="underline decoration-line underline-offset-4">
                Alla
              </Link>
              <Link
                href="/rita?status=completed"
                className="underline decoration-line underline-offset-4"
              >
                Klara
              </Link>
              <Link
                href="/rita?status=blocked"
                className="underline decoration-line underline-offset-4"
              >
                Blockerade
              </Link>
            </p>
            {analyses.length === 0 ? (
              <EmptyState>Inga analyser ännu.</EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {analyses.map((item) => (
                  <li key={item.id} className="rounded-xl border border-line bg-surface p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-accent">
                      {ANALYSIS_STATUS_LABELS[item.status] ?? item.status}
                    </p>
                    <p className="mt-2 font-medium">
                      <Link href={`/rita/${item.id}`} className="hover:underline">
                        {item.companyName}
                      </Link>
                    </p>
                    <p className="font-mono text-xs text-faint">{item.orgNumber}</p>
                    {item.status === "completed" ? (
                      <p className="mt-1 text-sm text-ink-soft">
                        {findingsFromAnalysis(item.result).length} fynd
                      </p>
                    ) : null}
                    {item.blockedReason ? (
                      <p className="mt-2 text-sm text-muted">{item.blockedReason}</p>
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
