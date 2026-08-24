import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { EmptyState, Notice, SignInGate } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { tryRuntime } from "@/lib/platform/page";
import { getAnalysis } from "@/lib/rita/analyses";
import { analysisSummary, findingsFromAnalysis } from "@/lib/rita/findings";

export const metadata = {
  title: "Analys — RITA — Pixdrift",
};

export default async function RitaAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await readSession();
  const runtime = tryRuntime();
  const analysis =
    session?.org?.ref && runtime ? await getAnalysis(runtime.pool, session.org.ref, id) : null;
  if (session?.org && runtime && !analysis) notFound();
  const findings = analysis ? findingsFromAnalysis(analysis.result) : [];
  const summary = analysis ? analysisSummary(analysis.result) : null;

  return (
    <AppShell current="rita" session={session}>
      <p className="pd-label text-faint">
        <Link href="/rita" className="hover:text-ink">
          PIXDRIFT / RITA
        </Link>
      </p>
      {!session?.org ? (
        <SignInGate next="/rita" title="Logga in för att se analysen">
          Analysen tillhör organisationen. Utan session visas den inte.
        </SignInGate>
      ) : analysis ? (
        <>
          <h1 className="text-3xl font-semibold tracking-tight">{analysis.companyName}</h1>
          <p className="font-mono text-sm text-faint">{analysis.orgNumber}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-accent">
            {analysis.status}
          </p>
          {analysis.blockedReason ? (
            <Notice>
              Blockerad: {analysis.blockedReason}. Motorn fejkars inte. Koppla{" "}
              <span className="font-mono">RITA_ENGINE_URL</span> eller{" "}
              <span className="font-mono">RITA_ENGINE_BINARY</span> mot skattjakt.
            </Notice>
          ) : null}
          {summary ? <p className="text-sm text-ink-soft">{summary}</p> : null}

          {findings.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Fynd</h2>
              <ul className="flex flex-col gap-3">
                {findings.map((finding) => (
                  <li key={finding.id} className="rounded-xl border border-line bg-surface p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-accent">
                      {finding.status}
                      {finding.risk ? ` · ${finding.risk}` : ""}
                    </p>
                    <p className="mt-2 font-medium">{finding.title}</p>
                    {finding.rationale ? (
                      <p className="mt-1 text-sm text-ink-soft">{finding.rationale}</p>
                    ) : null}
                    {finding.recommendedAction ? (
                      <p className="mt-2 text-sm text-muted">{finding.recommendedAction}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : analysis.status === "completed" ? (
            <EmptyState>Inga fynd i resultatobjektet. Motorn har kört; listan är tom.</EmptyState>
          ) : analysis.status !== "blocked" ? (
            <p className="text-sm text-muted">
              Inget resultatobjekt. Det är avsiktligt när status är blocked.
            </p>
          ) : null}

          {analysis.result != null ? (
            <details className="rounded-xl border border-line bg-surface p-4">
              <summary className="cursor-pointer text-sm font-medium">Rå kuvert</summary>
              <pre className="mt-3 overflow-x-auto font-mono text-xs">
                {JSON.stringify(analysis.result, null, 2)}
              </pre>
            </details>
          ) : null}
          <p className="font-mono text-xs text-faint">{analysis.createdAt}</p>
        </>
      ) : null}
    </AppShell>
  );
}
