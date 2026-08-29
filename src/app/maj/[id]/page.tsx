import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format/datetime";
import { t, type MessageKey } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { isHouseSession } from "@/lib/kansli/intakes";
import { capabilityStatuses, listActions, listSignals } from "@/lib/maj/engine";
import { compileImplementationPrompt } from "@/lib/maj/prompt";
import { MAJ_POSTURES, getProject } from "@/lib/maj/projects";
import { listReleases } from "@/lib/maj/releases";
import { usageTotals } from "@/lib/maj/usage";
import { tryRuntime } from "@/lib/platform/page";
import { completeMajAction, decideMajAction, runMajAnalysis, setMajPosture } from "../actions";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "maj.metaTitle"),
    description: t(locale, "maj.metaDescription"),
  };
}

const IMPACT_KEY = {
  low: "maj.impact.low",
  medium: "maj.impact.medium",
  high: "maj.impact.high",
} as const;

const GOAL_KEY = {
  customers: "maj.goal.customers",
  rank: "maj.goal.rank",
  competitors: "maj.goal.competitors",
  authority: "maj.goal.authority",
  all: "maj.goal.all",
} as const;

export default async function MajProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime(session?.org?.ref);
  const internal = isHouseSession(session?.org?.ref);
  const project =
    session?.org?.ref && runtime && internal
      ? await getProject(runtime.pool, session.org.ref, id)
      : null;
  if (session?.org && runtime && internal && !project) notFound();

  const orgRef = session?.org?.ref ?? "";
  const [actions, releases, signals, usage] =
    project && runtime
      ? await Promise.all([
          listActions(runtime.pool, orgRef, project.id),
          listReleases(runtime.pool, orgRef, project.id),
          listSignals(runtime.pool, orgRef, project.id),
          usageTotals(runtime.pool, orgRef, project.id),
        ])
      : [[], [], [], null];
  const open = actions.filter((action) => action.state === "proposed");
  const approved = actions.filter((action) => action.state === "approved");
  const capabilities = capabilityStatuses();

  return (
    <AppShell current="maj" session={session}>
      <ProductCrumb crumbs={[{ href: "/maj", label: "MAJ" }]} />
      {!session?.org ? (
        <SignInGate
          next="/maj"
          title={t(locale, "maj.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "maj.signInBody")}
        </SignInGate>
      ) : !internal ? (
        <Notice>{t(locale, "maj.alphaShort")}</Notice>
      ) : project ? (
        <>
          <h1 className="text-3xl font-semibold tracking-tight">{project.domain}</h1>
          <p className="text-ink-soft">
            {project.market} · {project.language} · {t(locale, GOAL_KEY[project.goal])} ·{" "}
            {project.posture.toUpperCase()}
          </p>
          <p className="text-sm text-muted">
            {capabilities
              .map(
                (cap) =>
                  `${t(locale, `maj.cap.${cap.id}` as MessageKey)} ${t(locale, cap.configured ? "maj.cap.on" : "maj.cap.off")}`,
              )
              .join(" · ")}
            {usage ? ` · ${t(locale, "maj.unitsBooked", { n: usage.vendor_units })}` : ""}
          </p>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">
              {open.length === 0
                ? t(locale, "maj.queueNone")
                : t(locale, "maj.queueCount", { n: open.length })}
            </h2>
            {open.length === 0 && actions.length === 0 ? (
              <p className="text-sm text-muted">{t(locale, "maj.empty")}</p>
            ) : (
              [...open, ...approved].map((action) => (
                <article
                  key={action.id}
                  className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
                >
                  <p className="pd-label text-faint">
                    {action.state === "approved"
                      ? t(locale, "maj.approvedWait")
                      : t(locale, "maj.proposed")}
                  </p>
                  <h3 className="text-lg font-semibold">{action.title}</h3>
                  <p className="text-sm text-ink-soft">{action.why}</p>
                  <p className="text-sm text-muted">
                    {t(locale, "maj.impact")}:{" "}
                    {t(
                      locale,
                      IMPACT_KEY[action.expectedImpact as keyof typeof IMPACT_KEY] ??
                        "maj.impact.medium",
                    )}{" "}
                    · {t(locale, "maj.risk")}:{" "}
                    {t(
                      locale,
                      IMPACT_KEY[action.risk as keyof typeof IMPACT_KEY] ?? "maj.impact.medium",
                    )}{" "}
                    · {t(locale, "maj.confidence")}: {action.confidence} %
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    {action.state === "proposed" ? (
                      <>
                        <form action={decideMajAction}>
                          <input type="hidden" name="actionId" value={action.id} />
                          <input type="hidden" name="projectId" value={project.id} />
                          <input type="hidden" name="decision" value="approved" />
                          <Submit>{t(locale, "maj.approve")}</Submit>
                        </form>
                        <form action={decideMajAction}>
                          <input type="hidden" name="actionId" value={action.id} />
                          <input type="hidden" name="projectId" value={project.id} />
                          <input type="hidden" name="decision" value="declined" />
                          <button
                            type="submit"
                            className="px-3 py-2 text-sm text-ink-soft underline underline-offset-4 hover:text-ink"
                          >
                            {t(locale, "maj.decline")}
                          </button>
                        </form>
                      </>
                    ) : (
                      <form action={completeMajAction} className="flex items-center gap-2">
                        <input type="hidden" name="actionId" value={action.id} />
                        <input type="hidden" name="projectId" value={project.id} />
                        <Submit>{t(locale, "maj.complete")}</Submit>
                      </form>
                    )}
                  </div>
                  <details>
                    <summary className="cursor-pointer text-sm text-ink-soft underline underline-offset-4">
                      {t(locale, "maj.showWhy")}
                    </summary>
                    <pre className="mt-2 overflow-x-auto border border-line bg-paper p-3 font-mono text-xs text-ink-soft">
                      {JSON.stringify(action.evidence, null, 2)}
                    </pre>
                  </details>
                  <details>
                    <summary className="cursor-pointer text-sm text-ink-soft underline underline-offset-4">
                      {t(locale, "maj.showPrompt")}
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap border border-line bg-paper p-3 font-mono text-xs text-ink-soft">
                      {compileImplementationPrompt({ project, action })}
                    </pre>
                  </details>
                </article>
              ))
            )}
            <form action={runMajAnalysis}>
              <input type="hidden" name="id" value={project.id} />
              <Submit>{t(locale, "maj.analyzeAgain")}</Submit>
            </form>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{t(locale, "maj.releases")}</h2>
            {releases.length === 0 ? (
              <p className="text-sm text-muted">{t(locale, "maj.releasesEmpty")}</p>
            ) : (
              releases.map((release) => (
                <article
                  key={release.id}
                  className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4"
                >
                  <p className="pd-label text-faint">
                    Search Update {release.version.replace("maj-", "")} ·{" "}
                    {formatDateTime(release.publishedAt, locale)}
                  </p>
                  <h3 className="font-semibold">{release.title}</h3>
                  <p className="text-sm text-ink-soft">{release.summary}</p>
                  <details>
                    <summary className="cursor-pointer text-sm text-ink-soft underline underline-offset-4">
                      release.v1
                    </summary>
                    <pre className="mt-2 overflow-x-auto border border-line bg-paper p-3 font-mono text-xs text-ink-soft">
                      {JSON.stringify(release.machine, null, 2)}
                    </pre>
                  </details>
                </article>
              ))
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{t(locale, "maj.posture")}</h2>
            <form action={setMajPosture} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="projectId" value={project.id} />
              <label className="flex flex-col gap-1">
                <span className="text-sm text-ink-soft">{t(locale, "maj.postureLabel")}</span>
                <select
                  name="posture"
                  defaultValue={project.posture}
                  className="min-h-12 border border-line bg-paper px-3 py-2 text-sm"
                >
                  {MAJ_POSTURES.map((posture) => (
                    <option key={posture} value={posture}>
                      {posture.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>
              <Submit>{t(locale, "maj.save")}</Submit>
            </form>
            <p className="max-w-xl text-xs text-muted">{t(locale, "maj.hedgeNote")}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">{t(locale, "maj.signals")}</h2>
            <p className="text-sm text-muted">
              {signals.length === 0
                ? t(locale, "maj.signalsEmpty")
                : t(locale, "maj.signalsCount", {
                    n: signals.length,
                    kind: signals[0]!.kind,
                    source: signals[0]!.source,
                    when: formatDateTime(signals[0]!.observedAt, locale),
                  })}
            </p>
          </section>
        </>
      ) : null}
    </AppShell>
  );
}
