import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Notice, SelectField, SignInGate, Submit } from "@/components/app/SignInGate";
import { caseStatusLine, getCase, parseCaseStatus } from "@/lib/alva/cases";
import {
  PROTOCOL_CHECKS,
  buildProtocolFacts,
  listProtocolMeasurements,
  listProtocolObservations,
} from "@/lib/alva/protocol";
import { readSession } from "@/lib/auth/session";
import { alvaOutcome, t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { tryRuntime } from "@/lib/platform/page";
import {
  recordAlvaMeasurement,
  recordAlvaObservation,
  saveAlvaCaseNotes,
  saveAlvaCaseStatus,
} from "../actions";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "alva.detailMetaTitle"),
    description: t(locale, "alva.metaDescription"),
  };
}

export default async function AlvaCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await readSession();
  const locale = await readLocale();
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
        <SignInGate
          next="/alva"
          title={t(locale, "alva.detailSignInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "alva.detailSignInBody")}
        </SignInGate>
      ) : item ? (
        <>
          <h1 className="pd-h1">{item.complaint}</h1>
          <p className="pd-label">{caseStatusLine(status, locale)}</p>
          <Notice>{t(locale, "alva.detailNotice")}</Notice>

          <dl className="flex flex-col gap-3">
            <div>
              <dt className="text-sm text-ink-soft">{t(locale, "alva.complaint")}</dt>
              <dd className="mt-1">{item.complaint}</dd>
            </div>
            {item.vehicleRef ? (
              <div>
                <dt className="text-sm text-ink-soft">{t(locale, "alva.vehicleRefShort")}</dt>
                <dd className="mt-1 font-mono text-sm">{item.vehicleRef}</dd>
              </div>
            ) : null}
            {item.area ? (
              <div>
                <dt className="text-sm text-ink-soft">{t(locale, "alva.areaShort")}</dt>
                <dd className="mt-1">{item.area}</dd>
              </div>
            ) : null}
            {item.mileageKm != null ? (
              <div>
                <dt className="text-sm text-ink-soft">{t(locale, "alva.mileageShort")}</dt>
                <dd className="mt-1">{item.mileageKm} km</dd>
              </div>
            ) : null}
            {item.desiredOutcome ? (
              <div>
                <dt className="text-sm text-ink-soft">{t(locale, "alva.desiredOutcome")}</dt>
                <dd className="mt-1">{item.desiredOutcome}</dd>
              </div>
            ) : null}
          </dl>

          <form
            action={saveAlvaCaseStatus}
            className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
          >
            <h2 className="text-lg font-semibold">{t(locale, "alva.workflow")}</h2>
            <p className="text-sm text-ink-soft">{t(locale, "alva.workflowLead")}</p>
            <input type="hidden" name="id" value={id} />
            <SelectField
              name="status"
              label={t(locale, "alva.statusLabel")}
              defaultValue={status}
              options={[
                { value: "open", label: t(locale, "alva.status.open") },
                { value: "in_progress", label: t(locale, "alva.status.in_progress") },
                { value: "closed", label: t(locale, "alva.status.closed") },
              ]}
            />
            <Submit large>{t(locale, "alva.saveStatus")}</Submit>
          </form>

          <form
            action={saveAlvaCaseNotes}
            className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
          >
            <h2 className="text-lg font-semibold">{t(locale, "alva.notes")}</h2>
            <input type="hidden" name="id" value={id} />
            <textarea
              name="notes"
              rows={3}
              defaultValue={item.technicianNotes}
              className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
            />
            <Submit large>{t(locale, "alva.saveNotes")}</Submit>
          </form>

          <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
            <h2 className="text-lg font-semibold">{t(locale, "alva.facts")}</h2>
            <p className="text-sm text-ink-soft">{t(locale, "alva.factsLead")}</p>
            {observations.length === 0 && measurements.length === 0 ? (
              <Notice>{t(locale, "alva.protocolEmpty")}</Notice>
            ) : null}
            <form action={recordAlvaObservation} className="grid gap-3 sm:grid-cols-3">
              <input type="hidden" name="id" value={id} />
              <div className="sm:col-span-2">
                <SelectField
                  name="label"
                  label={t(locale, "alva.check")}
                  defaultValue={PROTOCOL_CHECKS[0]}
                  options={PROTOCOL_CHECKS.map((label) => ({ value: label, label }))}
                />
              </div>
              <SelectField
                name="value"
                label={t(locale, "alva.outcome")}
                defaultValue="yes"
                options={[
                  { value: "yes", label: t(locale, "alva.yes") },
                  { value: "no", label: t(locale, "alva.no") },
                  { value: "unknown", label: t(locale, "alva.unknown") },
                ]}
              />
              <div className="sm:col-span-3">
                <Submit large>{t(locale, "alva.saveCheck")}</Submit>
              </div>
            </form>
            {observations.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {observations.map((row) => (
                  <li key={row.id} className="text-sm text-ink-soft">
                    {row.label}: {alvaOutcome(locale, row.value)}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
            <h2 className="text-lg font-semibold">{t(locale, "alva.measurements")}</h2>
            <p className="text-sm text-ink-soft">{t(locale, "alva.measurementsLead")}</p>
            <form action={recordAlvaMeasurement} className="grid gap-3 sm:grid-cols-3">
              <input type="hidden" name="id" value={id} />
              <label className="flex flex-col gap-1">
                <span className="text-sm text-ink-soft">{t(locale, "alva.name")}</span>
                <input
                  name="name"
                  required
                  placeholder={t(locale, "alva.namePlaceholder")}
                  className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-ink-soft">{t(locale, "alva.value")}</span>
                <input
                  name="value"
                  required
                  inputMode="decimal"
                  className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-ink-soft">{t(locale, "alva.unit")}</span>
                <input
                  name="unit"
                  required
                  placeholder="°C"
                  className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                />
              </label>
              <div className="sm:col-span-3">
                <Submit large>{t(locale, "alva.saveMeasurement")}</Submit>
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
              <h2 className="text-lg font-semibold">{t(locale, "alva.factsJson")}</h2>
              <p className="text-sm text-ink-soft">{t(locale, "alva.factsJsonLead")}</p>
              <a
                href={factsHref}
                download={`alva-${id}.json`}
                className="self-start text-sm underline decoration-line underline-offset-4 hover:text-ink"
              >
                {t(locale, "alva.downloadFacts")}
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
