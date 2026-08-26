import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import { caseStatusLine, getCase, parseCaseStatus } from "@/lib/alva/cases";
import {
  PROTOCOL_CHECKS,
  buildProtocolFacts,
  listProtocolMeasurements,
  listProtocolObservations,
  observationValueLabel,
} from "@/lib/alva/protocol";
import { readSession } from "@/lib/auth/session";
import { tryRuntime } from "@/lib/platform/page";
import {
  recordAlvaMeasurement,
  recordAlvaObservation,
  saveAlvaCaseNotes,
  saveAlvaCaseStatus,
} from "../actions";

export const metadata = {
  title: "Fall — ALVA — Pixdrift",
};

export default async function AlvaCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await readSession();
  const runtime = tryRuntime(session?.org?.ref);
  const item =
    session?.org?.ref && runtime ? await getCase(runtime.pool, session.org.ref, id) : null;
  const observations =
    session?.org?.ref && runtime && item
      ? await listProtocolObservations(runtime.pool, session.org.ref, id)
      : [];
  const measurements =
    session?.org?.ref && runtime && item
      ? await listProtocolMeasurements(runtime.pool, session.org.ref, id)
      : [];
  if (session?.org && runtime && !item) notFound();
  const status = item ? (parseCaseStatus(item.status) ?? "open") : "open";
  const facts = item ? buildProtocolFacts({ item, observations, measurements }) : null;
  const factsJson = facts ? JSON.stringify(facts, null, 2) : "";
  const factsHref = facts
    ? `data:application/json;charset=utf-8,${encodeURIComponent(factsJson)}`
    : "";

  return (
    <AppShell current="alva" session={session}>
      <ProductCrumb crumbs={[{ href: "/alva", label: "ALVA" }]} />
      {!session?.org ? (
        <SignInGate next="/alva" title="Logga in för att se ärendet">
          Ärendet tillhör organisationen.
        </SignInGate>
      ) : item ? (
        <>
          <h1 className="pd-h1">{item.complaint}</h1>
          <p className="pd-label">{caseStatusLine(status)}</p>
          <Notice>Här fyller ni i fakta själva. Systemet drar inga egna slutsatser.</Notice>

          <dl className="flex flex-col gap-3">
            <div>
              <dt className="text-sm text-ink-soft">Kundens beskrivning</dt>
              <dd className="mt-1">{item.complaint}</dd>
            </div>
            {item.vehicleRef ? (
              <div>
                <dt className="text-sm text-ink-soft">Fordonsreferens</dt>
                <dd className="mt-1 font-mono text-sm">{item.vehicleRef}</dd>
              </div>
            ) : null}
            {item.area ? (
              <div>
                <dt className="text-sm text-ink-soft">Område</dt>
                <dd className="mt-1">{item.area}</dd>
              </div>
            ) : null}
            {item.mileageKm != null ? (
              <div>
                <dt className="text-sm text-ink-soft">Mätarställning</dt>
                <dd className="mt-1">{item.mileageKm} km</dd>
              </div>
            ) : null}
            {item.desiredOutcome ? (
              <div>
                <dt className="text-sm text-ink-soft">Önskat utfall</dt>
                <dd className="mt-1">{item.desiredOutcome}</dd>
              </div>
            ) : null}
          </dl>

          <form
            action={saveAlvaCaseStatus}
            className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
          >
            <h2 className="text-lg font-semibold">Arbetsflöde</h2>
            <p className="text-sm text-ink-soft">Öppet / pågår / stängt. Inte diagnostiserat.</p>
            <input type="hidden" name="id" value={id} />
            <label className="flex flex-col gap-1">
              <span className="text-sm text-ink-soft">Status</span>
              <select
                name="status"
                defaultValue={status}
                className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
              >
                <option value="open">Öppet</option>
                <option value="in_progress">Pågår</option>
                <option value="closed">Stängt</option>
              </select>
            </label>
            <Submit large>Spara status</Submit>
          </form>

          <form
            action={saveAlvaCaseNotes}
            className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
          >
            <h2 className="text-lg font-semibold">Verkstadsanteckning</h2>
            <input type="hidden" name="id" value={id} />
            <textarea
              name="notes"
              rows={3}
              defaultValue={item.technicianNotes}
              className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
            />
            <Submit large>Spara anteckning</Submit>
          </form>

          <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
            <h2 className="text-lg font-semibold">Kontrollerade fakta</h2>
            <p className="text-sm text-ink-soft">Svara ja, nej eller okänt på varje kontroll.</p>
            {observations.length === 0 && measurements.length === 0 ? (
              <Notice>
                Protokollet är tomt tills ni fyller i kontroller eller mätvärden. Diagnosen är inte
                inkopplad än.
              </Notice>
            ) : null}
            <form action={recordAlvaObservation} className="grid gap-3 sm:grid-cols-3">
              <input type="hidden" name="id" value={id} />
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-sm text-ink-soft">Kontroll</span>
                <select
                  name="label"
                  className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                >
                  {PROTOCOL_CHECKS.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-ink-soft">Utfall</span>
                <select
                  name="value"
                  className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                >
                  <option value="yes">Ja</option>
                  <option value="no">Nej</option>
                  <option value="unknown">Okänt</option>
                </select>
              </label>
              <div className="sm:col-span-3">
                <Submit large>Spara kontroll</Submit>
              </div>
            </form>
            {observations.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {observations.map((row) => (
                  <li key={row.id} className="text-sm text-ink-soft">
                    {row.label}: {observationValueLabel(row.value)}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
            <h2 className="text-lg font-semibold">Mätvärden</h2>
            <p className="text-sm text-ink-soft">Namn, värde, enhet. Inte tolkade av systemet.</p>
            <form action={recordAlvaMeasurement} className="grid gap-3 sm:grid-cols-3">
              <input type="hidden" name="id" value={id} />
              <label className="flex flex-col gap-1">
                <span className="text-sm text-ink-soft">Namn</span>
                <input
                  name="name"
                  required
                  placeholder="Kylvätska"
                  className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-ink-soft">Värde</span>
                <input
                  name="value"
                  required
                  inputMode="decimal"
                  className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-ink-soft">Enhet</span>
                <input
                  name="unit"
                  required
                  placeholder="°C"
                  className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                />
              </label>
              <div className="sm:col-span-3">
                <Submit large>Spara mätning</Submit>
              </div>
            </form>
            {measurements.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {measurements.map((row) => (
                  <li key={row.id} className="text-sm text-ink-soft">
                    {row.name}: {row.value} {row.unit}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {facts ? (
            <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
              <h2 className="text-lg font-semibold">Fakta som JSON</h2>
              <p className="text-sm text-ink-soft">
                Export av det ni fyllt i. `diagnosis` är null. Ingen slutsats läggs till.
              </p>
              <a
                href={factsHref}
                download={`alva-${id}.json`}
                className="self-start text-sm underline decoration-line underline-offset-4 hover:text-ink"
              >
                Ladda ner protokollfakta
              </a>
              <pre className="overflow-x-auto rounded-md border border-line bg-paper p-3 font-mono text-xs text-ink-soft">
                {factsJson}
              </pre>
            </section>
          ) : null}
        </>
      ) : null}
    </AppShell>
  );
}
