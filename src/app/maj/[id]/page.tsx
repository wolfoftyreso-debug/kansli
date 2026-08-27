import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { formatSwedishDateTime } from "@/lib/format/datetime";
import { isHouseSession } from "@/lib/kansli/intakes";
import { capabilityStatuses, listActions, listSignals } from "@/lib/maj/engine";
import { compileImplementationPrompt } from "@/lib/maj/prompt";
import {
  MAJ_GOAL_LABELS,
  MAJ_POSTURE_LABELS,
  MAJ_POSTURES,
  getProject,
} from "@/lib/maj/projects";
import { listReleases } from "@/lib/maj/releases";
import { usageTotals } from "@/lib/maj/usage";
import { tryRuntime } from "@/lib/platform/page";
import { completeMajAction, decideMajAction, runMajAnalysis, setMajPosture } from "../actions";

export const dynamic = "force-dynamic";

const IMPACT: Record<string, string> = { low: "Låg", medium: "Medel", high: "Hög" };

export default async function MajProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await readSession();
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
        <SignInGate next="/maj" title="Logga in för att se projektet">
          Projektet tillhör organisationen.
        </SignInGate>
      ) : !internal ? (
        <Notice>MAJ är i intern alfa.</Notice>
      ) : project ? (
        <>
          <h1 className="text-3xl font-semibold tracking-tight">{project.domain}</h1>
          <p className="text-ink-soft">
            {project.market} · {project.language} · {MAJ_GOAL_LABELS[project.goal]} ·{" "}
            {MAJ_POSTURE_LABELS[project.posture]}
          </p>
          <p className="text-sm text-muted">
            {capabilities.map((cap) => `${cap.label} ${cap.configured ? "på" : "av"}`).join(" · ")}
            {usage ? ` · ${usage.vendor_units} units bokförda` : ""}
          </p>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">
              {open.length === 0
                ? "Inga beslut väntar"
                : `${open.length} beslut behöver din uppmärksamhet`}
            </h2>
            {open.length === 0 && actions.length === 0 ? (
              <EmptyRow />
            ) : (
              [...open, ...approved].map((action) => (
                <article
                  key={action.id}
                  className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
                >
                  <p className="pd-label text-faint">
                    {action.state === "approved" ? "Godkänt — väntar på utförande" : "Föreslaget"}
                  </p>
                  <h3 className="text-lg font-semibold">{action.title}</h3>
                  <p className="text-sm text-ink-soft">{action.why}</p>
                  <p className="text-sm text-muted">
                    Förväntad effekt: {IMPACT[action.expectedImpact] ?? action.expectedImpact} ·
                    Risk: {IMPACT[action.risk] ?? action.risk} · Confidence: {action.confidence} %
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    {action.state === "proposed" ? (
                      <>
                        <form action={decideMajAction}>
                          <input type="hidden" name="actionId" value={action.id} />
                          <input type="hidden" name="projectId" value={project.id} />
                          <input type="hidden" name="decision" value="approved" />
                          <Submit>Godkänn</Submit>
                        </form>
                        <form action={decideMajAction}>
                          <input type="hidden" name="actionId" value={action.id} />
                          <input type="hidden" name="projectId" value={project.id} />
                          <input type="hidden" name="decision" value="declined" />
                          <button
                            type="submit"
                            className="px-3 py-2 text-sm text-ink-soft underline underline-offset-4 hover:text-ink"
                          >
                            Avstå
                          </button>
                        </form>
                      </>
                    ) : (
                      <form action={completeMajAction} className="flex items-center gap-2">
                        <input type="hidden" name="actionId" value={action.id} />
                        <input type="hidden" name="projectId" value={project.id} />
                        <Submit>Markera utförd — publicera release</Submit>
                      </form>
                    )}
                  </div>
                  <details>
                    <summary className="cursor-pointer text-sm text-ink-soft underline underline-offset-4">
                      Visa varför
                    </summary>
                    <pre className="mt-2 overflow-x-auto border border-line bg-paper p-3 font-mono text-xs text-ink-soft">
                      {JSON.stringify(action.evidence, null, 2)}
                    </pre>
                  </details>
                  <details>
                    <summary className="cursor-pointer text-sm text-ink-soft underline underline-offset-4">
                      Generera implementationsprompt
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
              <Submit>Analysera igen</Submit>
            </form>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Search Updates</h2>
            {releases.length === 0 ? (
              <p className="text-sm text-muted">
                Inga releaser ännu. Varje utfört beslut publiceras som en versionerad release.
              </p>
            ) : (
              releases.map((release) => (
                <article
                  key={release.id}
                  className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4"
                >
                  <p className="pd-label text-faint">
                    Search Update {release.version.replace("maj-", "")} ·{" "}
                    {formatSwedishDateTime(release.publishedAt)}
                  </p>
                  <h3 className="font-semibold">{release.title}</h3>
                  <p className="text-sm text-ink-soft">{release.summary}</p>
                  <details>
                    <summary className="cursor-pointer text-sm text-ink-soft underline underline-offset-4">
                      Visa teknisk rapport (release.v1)
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
            <h2 className="text-lg font-semibold">Competitive posture</h2>
            <form action={setMajPosture} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="projectId" value={project.id} />
              <label className="flex flex-col gap-1">
                <span className="text-sm text-ink-soft">Läge</span>
                <select
                  name="posture"
                  defaultValue={project.posture}
                  className="border border-line bg-paper px-3 py-2 text-sm"
                >
                  {MAJ_POSTURES.map((posture) => (
                    <option key={posture} value={posture}>
                      {MAJ_POSTURE_LABELS[posture]}
                    </option>
                  ))}
                </select>
              </label>
              <Submit>Spara</Submit>
            </form>
            <p className="max-w-xl text-xs text-muted">
              HEDGE maximerar laglig och plattformsförenlig konkurrensrespons: gap, jämförelser,
              bättre resurser, digital PR. Aldrig falska omdömen, klickbedrägeri, negativa länkar
              eller vilseledande sidor — sådant skapar juridisk risk och skadar er egen ranking.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Signaler</h2>
            <p className="text-sm text-muted">
              {signals.length === 0
                ? "Inga signaler ännu. Koppla datakällor så börjar systemet mäta."
                : `${signals.length} signaler lagrade med proveniens. Senaste: ${signals[0]!.kind} från ${signals[0]!.source}, ${formatSwedishDateTime(signals[0]!.observedAt)}.`}
            </p>
          </section>
        </>
      ) : null}
    </AppShell>
  );
}

function EmptyRow() {
  return (
    <p className="text-sm text-muted">
      Inga beslut ännu. Kör en analys så väger systemet evidensen och föreslår nästa steg.
    </p>
  );
}
