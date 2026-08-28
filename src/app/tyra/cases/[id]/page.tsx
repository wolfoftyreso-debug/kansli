import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Field, SignInGate, Submit } from "@/components/app/SignInGate";
import { Button } from "@/components/tyra/Button";
import { StatusBanner } from "@/components/tyra/Status";
import { TaskRow } from "@/components/tyra/Rows";
import { WorkCard } from "@/components/tyra/WorkCard";
import { bookTyraQuoteAction } from "@/app/ekonomi/actions";
import { readSession } from "@/lib/auth/session";
import { listBookedTyraQuotes, listUnbookedTyraQuotes } from "@/lib/ekonomi/tyra-sales";
import { formatDateTime } from "@/lib/format/datetime";
import { t, tyraCaseStatus, tyraStepStatus } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { tryRuntime } from "@/lib/platform/page";
import { getCaseWorkCard } from "@/lib/tyra/cases";
import { listCaseEvents } from "@/lib/tyra/hotel";
import { INSPECTION_POSITIONS } from "@/lib/tyra/inspections";
import { peekIssuedHubLink, publicTyraUrl } from "@/lib/tyra/issued-link";
import { formatSekFromOre, listQuoteDrafts } from "@/lib/tyra/quotes";
import {
  cancelTyraCase,
  enqueueTyraReminder,
  issueTyraHubLink,
  recordTyraInspection,
  saveAndBookTyraQuote,
  saveTyraCaseNotes,
  saveTyraCustomer,
  saveTyraQuote,
  saveTyraStorageCode,
  updateTyraStep,
} from "../../actions";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "tyra.case.metaTitle"),
    description: t(locale, "tyra.case.metaDescription"),
  };
}

function caseTone(status: string) {
  if (status === "DONE") return "good" as const;
  if (status === "BLOCKED") return "blocked" as const;
  if (status === "IN_PROGRESS") return "attention" as const;
  return "neutral" as const;
}

function stepTone(status: string) {
  if (status === "DONE") return "good" as const;
  if (status === "BLOCKED") return "blocked" as const;
  if (status === "DOING") return "attention" as const;
  return "neutral" as const;
}

export default async function TyraCasePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ issued?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime(session?.org?.ref);
  const card =
    session?.org?.ref && runtime ? await getCaseWorkCard(runtime.pool, session.org.ref, id) : null;
  const timeline =
    session?.org?.ref && runtime && card
      ? await listCaseEvents(runtime.pool, session.org.ref, id)
      : [];
  const quotes =
    session?.org?.ref && runtime && card
      ? await listQuoteDrafts(runtime.pool, session.org.ref, id)
      : [];
  const unbookedQuotes =
    session?.org?.ref && runtime && card
      ? await listUnbookedTyraQuotes(runtime.pool, session.org.ref, id)
      : [];
  const bookedQuotes =
    session?.org?.ref && runtime && card
      ? await listBookedTyraQuotes(runtime.pool, session.org.ref, id)
      : [];
  const unbookedIds = new Set(unbookedQuotes.map((quote) => quote.id));
  const bookedByQuoteId = new Map(bookedQuotes.map((row) => [row.quoteId, row]));
  if (session?.org && !card) notFound();
  const issued = query.issued === "1" ? await peekIssuedHubLink() : null;
  const senderName = session?.org?.name ?? t(locale, "tyra.case.workshop");

  return (
    <AppShell current="tyra" session={session}>
      {!session?.org ? (
        <SignInGate
          next="/tyra"
          title={t(locale, "tyra.case.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "tyra.case.signInBody")}
        </SignInGate>
      ) : card ? (
        <>
          <ProductCrumb
            crumbs={[
              { href: "/tyra", label: "TYRA" },
              { href: "/tyra/kunder", label: t(locale, "tyra.customers") },
              { href: "/tyra/integrations", label: t(locale, "tyra.integrations") },
            ]}
          />

          <WorkCard
            title={card.headline}
            subtitle={card.summary || t(locale, "tyra.case.noJobs")}
            status={{
              tone: caseTone(card.caseStatus),
              label: tyraCaseStatus(locale, card.caseStatus),
            }}
            nextTitle={card.nextBestAction?.title ?? t(locale, "tyra.case.doneFallback")}
            nextHint={card.customerName}
          >
            {issued ? (
              <StatusBanner tone="attention" title={t(locale, "tyra.case.hubLinkTitle")}>
                {t(locale, "tyra.case.hubLinkBody")}
                <input
                  readOnly
                  value={publicTyraUrl(issued)}
                  className="mt-2 min-h-11 w-full rounded-md border border-line bg-paper px-3 py-2 font-mono text-sm text-ink"
                />
                <p className="mt-2">
                  <a
                    href={issued}
                    className="text-sm underline decoration-line underline-offset-4 hover:text-ink"
                  >
                    {t(locale, "tyra.case.openHub")}
                  </a>
                </p>
              </StatusBanner>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              {card.customerId ? (
                <form action={issueTyraHubLink}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="customerId" value={card.customerId} />
                  <Button type="submit" tone="primary">
                    {t(locale, "tyra.case.createHub")}
                  </Button>
                </form>
              ) : (
                <StatusBanner tone="neutral">
                  {t(locale, "tyra.case.noCustomerLinked")}
                </StatusBanner>
              )}
              {card.vehicleId && card.registrationNumber ? (
                <form action={enqueueTyraReminder}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="customerId" value={card.customerId ?? ""} />
                  <input type="hidden" name="vehicleId" value={card.vehicleId} />
                  <input type="hidden" name="registrationNumber" value={card.registrationNumber} />
                  <input type="hidden" name="make" value={card.make ?? ""} />
                  <input type="hidden" name="model" value={card.model ?? ""} />
                  <input type="hidden" name="customerName" value={card.customerName ?? ""} />
                  <input type="hidden" name="phone" value={card.customerPhone ?? ""} />
                  <input type="hidden" name="email" value={card.customerEmail ?? ""} />
                  <input type="hidden" name="senderName" value={senderName} />
                  <Button type="submit">{t(locale, "tyra.case.queueReminder")}</Button>
                </form>
              ) : null}
            </div>
          </WorkCard>

          <section className="grid gap-3 md:grid-cols-2">
            <form
              action={saveTyraCustomer}
              className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
            >
              <h2 className="text-lg font-semibold">{t(locale, "tyra.case.customerHeading")}</h2>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="customerId" value={card.customerId ?? ""} />
              <Field
                name="customerName"
                label={t(locale, "tyra.field.name")}
                required
                defaultValue={card.customerName ?? ""}
              />
              <Field
                name="phone"
                label={t(locale, "tyra.field.phone")}
                type="tel"
                defaultValue={card.customerPhone ?? ""}
              />
              <Field
                name="email"
                label={t(locale, "tyra.field.email")}
                type="email"
                defaultValue={card.customerEmail ?? ""}
              />
              <Submit>{t(locale, "tyra.case.saveCustomer")}</Submit>
            </form>

            <form
              action={saveTyraStorageCode}
              className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
            >
              <h2 className="text-lg font-semibold">{t(locale, "tyra.case.storageHeading")}</h2>
              <p className="text-sm text-ink-soft">{t(locale, "tyra.case.storageLead")}</p>
              <input type="hidden" name="id" value={id} />
              <Field
                name="storageCode"
                label={t(locale, "tyra.field.place")}
                required
                defaultValue={card.storageCode ?? ""}
                placeholder="A-12"
              />
              <Submit>{t(locale, "tyra.case.saveStorage")}</Submit>
            </form>
          </section>

          <form
            action={saveTyraCaseNotes}
            className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
          >
            <h2 className="text-lg font-semibold">{t(locale, "tyra.case.notesHeading")}</h2>
            <p className="text-sm text-ink-soft">{t(locale, "tyra.case.notesLead")}</p>
            <input type="hidden" name="id" value={id} />
            <Field
              name="notes"
              label={t(locale, "tyra.field.notes")}
              multiline
              defaultValue={card.advisorNotes}
            />
            <Submit>{t(locale, "tyra.case.saveNotes")}</Submit>
          </form>

          {card.caseStatus !== "DONE" && card.caseStatus !== "CANCELLED" ? (
            <form action={cancelTyraCase}>
              <input type="hidden" name="id" value={id} />
              <Button type="submit">{t(locale, "tyra.case.cancel")}</Button>
            </form>
          ) : null}

          <ol className="flex flex-col gap-3">
            {card.steps.map((step) => (
              <li key={step.kind}>
                <TaskRow
                  headline={step.title}
                  subtitle={step.required ? undefined : t(locale, "tyra.step.optional")}
                  status={{
                    tone: stepTone(step.status),
                    label: tyraStepStatus(locale, step.status),
                  }}
                  right={
                    <form action={updateTyraStep} className="flex flex-wrap gap-2">
                      <input type="hidden" name="id" value={id} />
                      <input type="hidden" name="stepKind" value={step.kind} />
                      {step.status !== "DOING" ? (
                        <Button type="submit" name="status" value="DOING" size="md">
                          {t(locale, "tyra.step.start")}
                        </Button>
                      ) : null}
                      {step.status !== "DONE" ? (
                        <Button type="submit" name="status" value="DONE" tone="primary">
                          {t(locale, "tyra.step.done")}
                        </Button>
                      ) : null}
                      {step.status !== "BLOCKED" ? (
                        <Button type="submit" name="status" value="BLOCKED">
                          {t(locale, "tyra.step.block")}
                        </Button>
                      ) : null}
                    </form>
                  }
                />
              </li>
            ))}
          </ol>

          <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
            <h2 className="text-lg font-semibold">{t(locale, "tyra.case.inspectionHeading")}</h2>
            <p className="text-sm text-ink-soft">{t(locale, "tyra.case.inspectionLead")}</p>
            <form action={recordTyraInspection} className="grid gap-3 sm:grid-cols-4">
              <input type="hidden" name="id" value={id} />
              {INSPECTION_POSITIONS.map((position) => (
                <Field
                  key={position}
                  name={`tread_${position}`}
                  label={`${position} mm`}
                  required
                  inputMode="decimal"
                  placeholder="5.5"
                />
              ))}
              <div className="sm:col-span-4">
                <Submit>{t(locale, "tyra.case.saveInspection")}</Submit>
              </div>
            </form>
          </section>

          <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
            <h2 className="text-lg font-semibold">{t(locale, "tyra.case.sellHeading")}</h2>
            <p className="text-sm text-ink-soft">{t(locale, "tyra.case.sellLead")}</p>
            <form action={saveAndBookTyraQuote} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={id} />
              <div className="sm:col-span-2">
                <Field
                  name="title"
                  label={t(locale, "tyra.field.title")}
                  defaultValue="Däck + montering"
                />
              </div>
              <Field
                name="quantity"
                label={t(locale, "tyra.field.quantity")}
                defaultValue="4"
                inputMode="numeric"
              />
              <Field
                name="unitCostSek"
                label={t(locale, "tyra.field.unitCost")}
                defaultValue="1200"
                inputMode="decimal"
              />
              <Field
                name="markupPercent"
                label={t(locale, "tyra.field.markup")}
                defaultValue="20"
                inputMode="decimal"
              />
              <Field
                name="installationSek"
                label={t(locale, "tyra.field.installation")}
                defaultValue="150"
                inputMode="decimal"
              />
              <Field
                name="environmentalSek"
                label={t(locale, "tyra.field.environmental")}
                defaultValue="25"
                inputMode="decimal"
              />
              <div className="sm:col-span-2">
                <Field name="note" label={t(locale, "tyra.field.internalNote")} />
              </div>
              <div className="flex flex-wrap gap-3 sm:col-span-2">
                <Submit>{t(locale, "tyra.case.bookSale")}</Submit>
                <button
                  type="submit"
                  formAction={saveTyraQuote}
                  className="self-start border border-line bg-paper px-4 py-2 text-sm"
                >
                  {t(locale, "tyra.case.saveDraft")}
                </button>
              </div>
            </form>
            {quotes.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {quotes.map((quote) => {
                  const booked = bookedByQuoteId.get(quote.id);
                  return (
                    <li
                      key={quote.id}
                      className="flex flex-wrap items-center justify-between gap-3 text-sm text-ink-soft"
                    >
                      <span>
                        {quote.title}: {formatSekFromOre(quote.snapshot.totalCustomerPriceOre)} ·{" "}
                        {formatDateTime(quote.createdAt, locale)}
                      </span>
                      {unbookedIds.has(quote.id) ? (
                        <form action={bookTyraQuoteAction}>
                          <input type="hidden" name="quoteId" value={quote.id} />
                          <input type="hidden" name="tireCaseId" value={id} />
                          <Submit>{t(locale, "tyra.case.bookSale")}</Submit>
                        </form>
                      ) : booked ? (
                        <Link
                          href={`/ekonomi/fakturor/${booked.invoiceId}`}
                          className="underline decoration-line underline-offset-4"
                        >
                          {t(locale, "tyra.case.bookedInvoice", { number: booked.invoiceNumber })}
                        </Link>
                      ) : (
                        <span>{t(locale, "tyra.case.bookedEkonomi")}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>

          {timeline.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">{t(locale, "tyra.case.eventsHeading")}</h2>
              <ol className="flex flex-col gap-2">
                {timeline.map((item) => (
                  <li key={`${item.eventType}-${item.createdAt}`} className="text-sm text-ink-soft">
                    <span className="text-xs text-faint">
                      {formatDateTime(item.createdAt, locale)}
                    </span>
                    {" · "}
                    {item.eventType.replaceAll("_", " ").toLowerCase()}
                    {" · "}
                    {item.source}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </>
      ) : null}
    </AppShell>
  );
}
