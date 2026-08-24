import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { tryRuntime } from "@/lib/platform/page";
import { CASE_STATUS_LABELS, STEP_STATUS_LABELS, getCaseWorkCard } from "@/lib/tyra/cases";
import { peekIssuedHubLink, publicTyraUrl } from "@/lib/tyra/issued-link";
import { issueTyraHubLink, updateTyraStep } from "../../actions";

export const metadata = {
  title: "Ärende — TYRA",
  description: "Arbetssteg för ett däckärende.",
};

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
          </p>
          <header className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-accent">
              {CASE_STATUS_LABELS[card.caseStatus] ?? card.caseStatus}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">{card.headline}</h1>
            <p className="text-ink-soft">{card.summary || "Inga åtgärder"}</p>
            {card.nextBestAction ? (
              <p className="text-sm text-ink">{card.nextBestAction.title}</p>
            ) : (
              <p className="text-sm text-ink-soft">Inget nästa steg.</p>
            )}
          </header>

          {issued ? (
            <Notice>
              Länk till kunden — giltig två minuter i den här webbläsaren. Kopiera den nu.
              <label className="mt-2 flex flex-col gap-1">
                <span className="sr-only">Kundhub-länk</span>
                <input
                  readOnly
                  value={publicTyraUrl(issued)}
                  className="min-h-11 w-full rounded-md border border-line bg-paper px-3 py-2 font-mono text-sm text-ink"
                />
              </label>
            </Notice>
          ) : null}

          {card.customerId ? (
            <form action={issueTyraHubLink}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="customerId" value={card.customerId} />
              <Submit>Skapa kundhub-länk</Submit>
            </form>
          ) : (
            <Notice>Ingen kund är kopplad. Hub-länk kan inte skapas.</Notice>
          )}

          <ol className="flex flex-col gap-3">
            {card.steps.map((step) => (
              <li key={step.kind} className="rounded-2xl border border-line bg-surface px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-accent">
                  {STEP_STATUS_LABELS[step.status]}
                  {step.required ? "" : " · valfritt"}
                </p>
                <p className="mt-2 font-medium">{step.title}</p>
                <form action={updateTyraStep} className="mt-3 flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="stepKind" value={step.kind} />
                  {step.status !== "DOING" ? (
                    <button
                      type="submit"
                      name="status"
                      value="DOING"
                      className="rounded-md border border-line px-3 py-1.5 text-sm text-ink-soft hover:text-ink"
                    >
                      Påbörja
                    </button>
                  ) : null}
                  {step.status !== "DONE" ? (
                    <button
                      type="submit"
                      name="status"
                      value="DONE"
                      className="rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-paper"
                    >
                      Klart
                    </button>
                  ) : null}
                  {step.status !== "BLOCKED" ? (
                    <button
                      type="submit"
                      name="status"
                      value="BLOCKED"
                      className="rounded-md border border-line px-3 py-1.5 text-sm text-ink-soft hover:text-ink"
                    >
                      Blockera
                    </button>
                  ) : null}
                </form>
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </AppShell>
  );
}
