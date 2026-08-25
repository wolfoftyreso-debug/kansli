import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { SignInGate, Submit } from "@/components/app/SignInGate";
import { Button } from "@/components/tyra/Button";
import { StatusBanner } from "@/components/tyra/Status";
import { TaskRow } from "@/components/tyra/Rows";
import { WorkCard } from "@/components/tyra/WorkCard";
import { readSession } from "@/lib/auth/session";
import { formatSwedishDateTime } from "@/lib/format/datetime";
import { tryRuntime } from "@/lib/platform/page";
import { CASE_STATUS_LABELS, STEP_STATUS_LABELS, getCaseWorkCard } from "@/lib/tyra/cases";
import { listCaseEvents } from "@/lib/tyra/hotel";
import { INSPECTION_POSITIONS } from "@/lib/tyra/inspections";
import { peekIssuedHubLink, publicTyraUrl } from "@/lib/tyra/issued-link";
import { formatSekFromOre, listQuoteDrafts } from "@/lib/tyra/quotes";
import { listUnbookedTyraQuotes } from "@/lib/ekonomi/tyra-sales";
import { bookTyraQuoteAction } from "@/app/ekonomi/actions";
import {
  cancelTyraCase,
  enqueueTyraReminder,
  issueTyraHubLink,
  recordTyraInspection,
  saveTyraCaseNotes,
  saveTyraCustomer,
  saveTyraQuote,
  saveTyraStorageCode,
  updateTyraStep,
} from "../../actions";

export const metadata = {
  title: "Ärende — TYRA",
  description: "Arbetssteg för ett däckärende.",
};

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
  const runtime = tryRuntime();
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
  const unbookedIds = new Set(unbookedQuotes.map((quote) => quote.id));
  if (session?.org && !card) notFound();
  const issued = query.issued === "1" ? await peekIssuedHubLink() : null;
  const senderName = session?.org?.name ?? "Verkstaden";

  return (
    <AppShell current="tyra" session={session}>
      {!session?.org ? (
        <SignInGate next="/tyra" title="Logga in för att se ärendet">
          Ärendet tillhör organisationen. Logga in med Pixdrift.
        </SignInGate>
      ) : card ? (
        <>
          <ProductCrumb
            crumbs={[
              { href: "/tyra", label: "TYRA" },
              { href: "/tyra/kunder", label: "Kundkort" },
              { href: "/tyra/integrations", label: "Integrationer" },
            ]}
          />

          <WorkCard
            title={card.headline}
            subtitle={card.summary || "Inga åtgärder"}
            status={{
              tone: caseTone(card.caseStatus),
              label: CASE_STATUS_LABELS[card.caseStatus] ?? card.caseStatus,
            }}
            nextTitle={card.nextBestAction?.title ?? "Klart."}
            nextHint={card.customerName}
          >
            {issued ? (
              <StatusBanner tone="attention" title="Länk till kunden">
                Giltig två minuter i den här webbläsaren. Kopiera den nu.
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
                    Öppna kundvyn
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
                    Skapa kundhub-länk
                  </Button>
                </form>
              ) : (
                <StatusBanner tone="neutral">Ingen kund är kopplad.</StatusBanner>
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
                  <Button type="submit">Köa säsongspåminnelse</Button>
                </form>
              ) : null}
            </div>
          </WorkCard>

          <section className="grid gap-3 md:grid-cols-2">
            <form
              action={saveTyraCustomer}
              className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
            >
              <h2 className="text-lg font-semibold">Kund</h2>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="customerId" value={card.customerId ?? ""} />
              <label className="flex flex-col gap-1">
                <span className="text-sm text-ink-soft">Namn</span>
                <input
                  name="customerName"
                  required
                  defaultValue={card.customerName ?? ""}
                  className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-ink-soft">Telefon</span>
                <input
                  name="phone"
                  defaultValue={card.customerPhone ?? ""}
                  className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-ink-soft">E-post</span>
                <input
                  name="email"
                  defaultValue={card.customerEmail ?? ""}
                  className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                />
              </label>
              <Submit>Spara kund</Submit>
            </form>

            <form
              action={saveTyraStorageCode}
              className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
            >
              <h2 className="text-lg font-semibold">Lagerplats</h2>
              <p className="text-sm text-ink-soft">
                Verkstadens egen kod. Inte ett live-lager. Sätter hjulsetet som inlagrat.
              </p>
              <input type="hidden" name="id" value={id} />
              <label className="flex flex-col gap-1">
                <span className="text-sm text-ink-soft">Plats</span>
                <input
                  name="storageCode"
                  required
                  defaultValue={card.storageCode ?? ""}
                  placeholder="A-12"
                  className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                />
              </label>
              <Submit>Spara lagerplats</Submit>
            </form>
          </section>

          <form
            action={saveTyraCaseNotes}
            className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
          >
            <h2 className="text-lg font-semibold">Verkstadsanteckning</h2>
            <p className="text-sm text-ink-soft">Bara ni. Inte kunden i hubben.</p>
            <input type="hidden" name="id" value={id} />
            <textarea
              name="notes"
              rows={3}
              defaultValue={card.advisorNotes}
              className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
            />
            <Submit>Spara anteckning</Submit>
          </form>

          {card.caseStatus !== "DONE" && card.caseStatus !== "CANCELLED" ? (
            <form action={cancelTyraCase}>
              <input type="hidden" name="id" value={id} />
              <Button type="submit">Avbryt ärendet</Button>
            </form>
          ) : null}

          <ol className="flex flex-col gap-3">
            {card.steps.map((step) => (
              <li key={step.kind}>
                <TaskRow
                  headline={step.title}
                  subtitle={step.required ? undefined : "Valfritt"}
                  status={{ tone: stepTone(step.status), label: STEP_STATUS_LABELS[step.status] }}
                  right={
                    <form action={updateTyraStep} className="flex flex-wrap gap-2">
                      <input type="hidden" name="id" value={id} />
                      <input type="hidden" name="stepKind" value={step.kind} />
                      {step.status !== "DOING" ? (
                        <Button type="submit" name="status" value="DOING" size="md">
                          Påbörja
                        </Button>
                      ) : null}
                      {step.status !== "DONE" ? (
                        <Button type="submit" name="status" value="DONE" tone="primary">
                          Klart
                        </Button>
                      ) : null}
                      {step.status !== "BLOCKED" ? (
                        <Button type="submit" name="status" value="BLOCKED">
                          Blockera
                        </Button>
                      ) : null}
                    </form>
                  }
                />
              </li>
            ))}
          </ol>

          <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
            <h2 className="text-lg font-semibold">Verifierad inspektion</h2>
            <p className="text-sm text-ink-soft">
              Fyra mönsterdjup, tekniker-verifierade. Det är det kunden får se i hubben. Ingen AI.
            </p>
            <form action={recordTyraInspection} className="grid gap-3 sm:grid-cols-4">
              <input type="hidden" name="id" value={id} />
              {INSPECTION_POSITIONS.map((position) => (
                <label key={position} className="flex flex-col gap-1">
                  <span className="text-sm text-ink-soft">{position} mm</span>
                  <input
                    name={`tread_${position}`}
                    required
                    inputMode="decimal"
                    placeholder="5.5"
                    className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                  />
                </label>
              ))}
              <div className="sm:col-span-4">
                <Submit>Spara inspektion</Submit>
              </div>
            </form>
          </section>

          <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
            <h2 className="text-lg font-semibold">Offertutkast</h2>
            <p className="text-sm text-ink-soft">
              Verkstadens egna belopp. Inte live-leverantör, inte skickad.
            </p>
            <form action={saveTyraQuote} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={id} />
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-sm text-ink-soft">Rubrik</span>
                <input
                  name="title"
                  defaultValue="Däck + montering"
                  className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-ink-soft">Antal</span>
                <input
                  name="quantity"
                  defaultValue="4"
                  className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-ink-soft">Inköp per däck (kr)</span>
                <input
                  name="unitCostSek"
                  defaultValue="1200"
                  className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-ink-soft">Påslag %</span>
                <input
                  name="markupPercent"
                  defaultValue="20"
                  className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-ink-soft">Montering per däck (kr)</span>
                <input
                  name="installationSek"
                  defaultValue="150"
                  className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-ink-soft">Miljöavgift per däck (kr)</span>
                <input
                  name="environmentalSek"
                  defaultValue="25"
                  className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-sm text-ink-soft">Intern notering</span>
                <input
                  name="note"
                  className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                />
              </label>
              <div className="sm:col-span-2">
                <Submit>Beräkna utkast</Submit>
              </div>
            </form>
            {quotes.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {quotes.map((quote) => (
                  <li
                    key={quote.id}
                    className="flex flex-wrap items-center justify-between gap-3 text-sm text-ink-soft"
                  >
                    <span>
                      {quote.title}: {formatSekFromOre(quote.snapshot.totalCustomerPriceOre)} ·{" "}
                      {formatSwedishDateTime(quote.createdAt)}
                    </span>
                    {unbookedIds.has(quote.id) ? (
                      <form action={bookTyraQuoteAction}>
                        <input type="hidden" name="quoteId" value={quote.id} />
                        <input type="hidden" name="tireCaseId" value={id} />
                        <Submit>Boka sälj</Submit>
                      </form>
                    ) : (
                      <span>Bokad i Ekonomi</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {timeline.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Händelser i ärendet</h2>
              <ol className="flex flex-col gap-2">
                {timeline.map((item) => (
                  <li key={`${item.eventType}-${item.createdAt}`} className="text-sm text-ink-soft">
                    <span className="text-xs text-faint">
                      {formatSwedishDateTime(item.createdAt)}
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
