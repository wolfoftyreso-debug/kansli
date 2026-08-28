import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { EmptyState, Notice, SignInGate } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format/datetime";
import { ritaAnalysisStatus, ritaCategory, ritaFindingStatus, t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { tryRuntime } from "@/lib/platform/page";
import { getAnalysis } from "@/lib/rita/analyses";
import {
  analysisDisclaimer,
  analysisLimitations,
  analysisSummaryText,
  estimatedTotalHintText,
  findingsFromAnalysis,
  formatOre,
} from "@/lib/rita/findings";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "rita.doc.metaTitle"),
  };
}

export default async function RitaAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime(session?.org?.ref);
  const analysis =
    session?.org?.ref && runtime ? await getAnalysis(runtime.pool, session.org.ref, id) : null;
  if (session?.org && runtime && !analysis) notFound();
  const findings = analysis ? findingsFromAnalysis(analysis.result) : [];
  const summary = analysis ? analysisSummaryText(analysis.result, locale) : null;
  const disclaimer = analysis ? analysisDisclaimer(analysis.result) : null;
  const limitations = analysis ? analysisLimitations(analysis.result) : [];
  const totalHint = analysis ? estimatedTotalHintText(analysis.result, locale) : null;

  return (
    <AppShell current="rita" session={session}>
      <ProductCrumb crumbs={[{ href: "/rita", label: "RITA" }]} />
      {!session?.org ? (
        <SignInGate
          next="/rita"
          title={t(locale, "rita.doc.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "rita.doc.signInBody")}
        </SignInGate>
      ) : analysis ? (
        <>
          <h1 className="text-3xl font-semibold tracking-tight">{analysis.companyName}</h1>
          <p className="font-mono text-sm text-faint">{analysis.orgNumber}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-accent">
            {ritaAnalysisStatus(locale, analysis.status)}
          </p>
          {analysis.blockedReason ? (
            <Notice>{t(locale, "rita.doc.stopped", { reason: analysis.blockedReason })}</Notice>
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
              <h2 className="text-lg font-semibold">{t(locale, "rita.doc.findings")}</h2>
              <ul className="flex flex-col gap-3">
                {findings.map((finding) => (
                  <li key={finding.id} className="rounded-xl border border-line bg-surface p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-accent">
                      {ritaFindingStatus(locale, finding.status)} ·{" "}
                      {ritaCategory(locale, finding.category)}
                      {finding.risk ? ` · ${finding.risk}` : ""}
                    </p>
                    <p className="mt-2 font-medium">{finding.title}</p>
                    {finding.ruleId || finding.ruleTitle ? (
                      <p className="mt-1 font-mono text-xs text-faint">
                        {t(locale, "rita.doc.rule")}
                        {finding.ruleId ? `: ${finding.ruleId}` : ""}
                        {finding.ruleTitle ? ` — ${finding.ruleTitle}` : ""}
                      </p>
                    ) : null}
                    {finding.impactHighOre != null && finding.impactHighOre > 0 ? (
                      <p className="mt-1 text-sm text-ink-soft">
                        {t(locale, "rita.doc.impact", {
                          low: formatOre(finding.impactLowOre ?? 0),
                          high: formatOre(finding.impactHighOre),
                        })}
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
            <EmptyState>{t(locale, "rita.doc.emptyDone")}</EmptyState>
          ) : analysis.status !== "blocked" ? (
            <p className="text-sm text-muted">{t(locale, "rita.doc.noResult")}</p>
          ) : null}

          {analysis.result != null ? (
            <details className="rounded-xl border border-line bg-surface p-4">
              <summary className="cursor-pointer text-sm font-medium">
                {t(locale, "rita.doc.showRaw")}
              </summary>
              <pre className="mt-3 overflow-x-auto font-mono text-xs">
                {JSON.stringify(analysis.result, null, 2)}
              </pre>
            </details>
          ) : null}
          <p className="text-xs text-faint">{formatDateTime(analysis.createdAt, locale)}</p>
        </>
      ) : null}
    </AppShell>
  );
}
