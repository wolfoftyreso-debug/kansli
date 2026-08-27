import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { EmptyState, Field, Notice, SelectField, SignInGate, Submit } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { formatSwedishDateTime } from "@/lib/format/datetime";
import { isHouseSession } from "@/lib/kansli/intakes";
import { capabilityStatuses } from "@/lib/maj/engine";
import { MAJ_GOAL_LABELS, MAJ_GOALS, listProjects } from "@/lib/maj/projects";
import { tryRuntime } from "@/lib/platform/page";
import { createMajProject } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "MAJ — Pixdrift",
  description: "Mät, analysera, justera. Söksynlighet som beslut att godkänna, inte siffror.",
};

export default async function MajPage() {
  const session = await readSession();
  const runtime = tryRuntime(session?.org?.ref);
  const internal = isHouseSession(session?.org?.ref);
  const projects =
    session?.org?.ref && runtime && internal
      ? await listProjects(runtime.pool, session.org.ref)
      : [];
  const capabilities = capabilityStatuses();

  return (
    <AppShell current="maj" session={session}>
      <header className="flex flex-col gap-3">
        <ProductCrumb crumbs={[{ href: "/maj", label: "MAJ" }]} />
        <h1 className="text-3xl font-semibold tracking-tight">Vad har hänt i sök?</h1>
        <p className="max-w-xl text-ink-soft">
          MAJ mäter, analyserar och justerar. Du anger domän, marknad och mål — systemet upptäcker
          resten och kommer tillbaka med ett fåtal beslut: det här har förändrats, det här bör
          göras, det här är varför. Evidensen ligger bakom varje beslut.
        </p>
      </header>

      {!session?.org ? (
        <SignInGate next="/maj" title="Logga in för att se era projekt">
          Projekten tillhör organisationen. Samma inloggning som i alla rum.
        </SignInGate>
      ) : !internal ? (
        <Notice>
          MAJ är i intern alfa. Rummet öppnas för kunder när systemet arbetat klart på våra egna
          domäner — vi använder samma produkt som ni kommer att få.
        </Notice>
      ) : (
        <>
          <form
            action={createMajProject}
            className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
          >
            <h2 className="text-lg font-semibold">Lägg till webbplats</h2>
            <Field name="domain" label="Domän" required placeholder="exempel.se" />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                name="market"
                label="Marknad"
                placeholder="Sverige"
                defaultValue="SE"
                options={[
                  { value: "SE", label: "Sverige" },
                  { value: "NO", label: "Norge" },
                  { value: "DK", label: "Danmark" },
                  { value: "FI", label: "Finland" },
                  { value: "DE", label: "Tyskland" },
                ]}
              />
              <SelectField
                name="language"
                label="Språk"
                placeholder="Svenska"
                defaultValue="sv"
                options={[
                  { value: "sv", label: "Svenska" },
                  { value: "no", label: "Norska" },
                  { value: "da", label: "Danska" },
                  { value: "fi", label: "Finska" },
                  { value: "de", label: "Tyska" },
                  { value: "en", label: "Engelska" },
                ]}
              />
            </div>
            <fieldset className="flex flex-col gap-1">
              <legend className="text-sm text-ink-soft">Vad vill du uppnå?</legend>
              {MAJ_GOALS.map((goal) => (
                <label key={goal} className="flex min-h-9 items-center gap-2 text-sm text-ink-soft">
                  <input type="radio" name="goal" value={goal} defaultChecked={goal === "all"} />
                  <span>{MAJ_GOAL_LABELS[goal]}</span>
                </label>
              ))}
            </fieldset>
            <Submit>Analysera min webbplats</Submit>
            <p className="text-xs text-muted">
              Systemet hittar konkurrenter, rankings och möjligheter självt. Det frågar bara när
              information verkligen saknas.
            </p>
          </form>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Datakällor</h2>
            <p className="text-sm text-ink-soft">
              {capabilities
                .map((cap) => `${cap.label} ${cap.configured ? "på" : "av"}`)
                .join(" · ")}
            </p>
            <p className="text-xs text-muted">
              Källor utan uppgifter är avstängda och hittar aldrig på siffror. Leverantörer är
              kanaler — du behöver aldrig förstå dem.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Projekt</h2>
            {projects.length === 0 ? (
              <EmptyState>Inga projekt ännu. Lägg till en webbplats ovan.</EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {projects.map((project) => (
                  <li key={project.id} className="rounded-xl border border-line bg-surface p-4">
                    <p className="font-medium">
                      <Link href={`/maj/${project.id}`} className="hover:underline">
                        {project.domain}
                      </Link>
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {project.market} · {project.language} · {MAJ_GOAL_LABELS[project.goal]}
                    </p>
                    <p className="mt-2 text-xs text-faint">
                      {formatSwedishDateTime(project.createdAt)}
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
