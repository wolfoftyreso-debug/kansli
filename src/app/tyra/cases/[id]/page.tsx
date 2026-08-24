import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { Notice, SignInGate } from "@/components/app/SignInGate";
import { Button } from "@/components/tyra/Button";
import { StatusBanner } from "@/components/tyra/Status";
import { TaskRow } from "@/components/tyra/Rows";
import { WorkCard } from "@/components/tyra/WorkCard";
import { readSession } from "@/lib/auth/session";
import { tryRuntime } from "@/lib/platform/page";
import { CASE_STATUS_LABELS, STEP_STATUS_LABELS, getCaseWorkCard } from "@/lib/tyra/cases";
import { peekIssuedHubLink, publicTyraUrl } from "@/lib/tyra/issued-link";
import { enqueueTyraReminder, issueTyraHubLink, updateTyraStep } from "../../actions";

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
  if (session?.org && !card) notFound();
  const issued = query.issued === "1" ? await peekIssuedHubLink() : null;
  const senderName = session?.org?.name ?? "Verkstaden";

  return (
    <AppShell current="tyra" session={session}>
      {!session?.org ? (
        <SignInGate next="/tyra" title="Logga in för att se ärendet">
          Work card läses ur TYRA-schemat för din organisation.
        </SignInGate>
      ) : card ? (
        <>
          <p className="pd-label text-faint">
            <Link href="/tyra" className="hover:underline">
              TYRA
            </Link>
            {" · "}
            <Link href="/tyra/integrations" className="hover:underline">
              Integrationer
            </Link>
          </p>

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
        </>
      ) : null}
    </AppShell>
  );
}
