import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { EmptyState, Notice, SignInGate } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { formatSwedishDateTime } from "@/lib/format/datetime";
import { tryRuntime } from "@/lib/platform/page";
import { getAnalysis } from "@/lib/rita/analyses";
import {
  analysisDisclaimer,
  analysisLimitations,
  analysisSummary,
  categoryLabel,
  estimatedTotalHint,
  findingStatusLabel,
  findingsFromAnalysis,
  formatOre,
} from "@/lib/rita/findings";

export const metadata = {
  title: "Analys — RITA — Pixdrift",
};

export default async function RitaAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await readSession();
  const runtime = tryRuntime(session?.org?.ref);
  const analysis =
    session?.org?.ref && runtime ? await getAnalysis(runtime.pool, session.org.ref, id) : null;
  if (session?.org && runtime && !analysis) notFound();
  const findings = analysis ? findingsFromAnalysis(analysis.result) : [];
  const summary = analysis ? analysisSummary(analysis.result) : null;
  const disclaimer = analysis ? analysisDisclaimer(analysis.result) : null;
  const limitations = analysis ? analysisLimitations(analysis.result) : [];
  const totalHint = analysis ? estimatedTotalHint(analysis.result) : null;

  return (
    <AppShell current="rita" session={session}>
      <ProductCrumb crumbs={[{ href: "/rita", label: "RITA" }]} />
      {!session?.org ? (
        <SignInGate next="/rita" title="Logga in för att se analysen">
          Analysen tillhör ert företag. Logga in för att se den.
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
              Analysen stoppades: {analysis.blockedReason}. Vi visar aldrig påhittade resultat. Be
              den som sköter driften koppla in analysen.
            </Notice>
          ) : null}
          {summary ? <p className="text-sm text-ink-soft">{summary}</p> : null}
          {totalHint ? <p className="text-sm text-ink-soft">{totalHint}</p> : null}
          {disclaimer ? <Notice>{disclaimer}</Notice> : null}
          {limitations.length > 0 ? (
            <ul className="list-disc pl-5 text-sm text-muted">
              {limitations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}

          {findings.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Fynd</h2>
              <ul className="flex flex-col gap-3">
                {findings.map((finding) => (
                  <li key={finding.id} className="rounded-xl border border-line bg-surface p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-accent">
                      {findingStatusLabel(finding.status)} · {categoryLabel(finding.category)}
                      {finding.risk ? ` · ${finding.risk}` : ""}
                    </p>
                    <p className="mt-2 font-medium">{finding.title}</p>
                    {finding.ruleId || finding.ruleTitle ? (
                      <p className="mt-1 font-mono text-xs text-faint">
                        Regel{finding.ruleId ? `: ${finding.ruleId}` : ""}
                        {finding.ruleTitle ? ` — ${finding.ruleTitle}` : ""}
                      </p>
                    ) : null}
                    {finding.impactHighOre != null && finding.impactHighOre > 0 ? (
                      <p className="mt-1 text-sm text-ink-soft">
                        Möjlig effekt (ej garanti): {formatOre(finding.impactLowOre ?? 0)}–
                        {formatOre(finding.impactHighOre)}
                      </p>
                    ) : null}
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
            <EmptyState>Analysen är klar och hittade inget att rapportera.</EmptyState>
          ) : analysis.status !== "blocked" ? (
            <p className="text-sm text-muted">Inget resultat än — analysen kunde inte köras.</p>
          ) : null}

          {analysis.result != null ? (
            <details className="rounded-xl border border-line bg-surface p-4">
              <summary className="cursor-pointer text-sm font-medium">
                Visa hela svaret (tekniskt)
              </summary>
              <pre className="mt-3 overflow-x-auto font-mono text-xs">
                {JSON.stringify(analysis.result, null, 2)}
              </pre>
            </details>
          ) : null}
          <p className="text-xs text-faint">{formatSwedishDateTime(analysis.createdAt)}</p>
        </>
      ) : null}
    </AppShell>
  );
}
