import { notFound } from "next/navigation";
import { Field, Notice, Submit } from "@/components/app/SignInGate";
import { ACKNOWLEDGEMENT_DECLARATION } from "@/lib/irma/clauses";
import { openAgreementByToken } from "@/lib/irma/agreements";
import { irmaThrottleKey, irmaTokenBlocked, noteIrmaTokenFailure, noteIrmaTokenSuccess } from "@/lib/irma/throttle";
import { statusLabel } from "@/lib/irma/status";
import { tryRuntime } from "@/lib/platform/page";
import { acknowledgeIrmaAgreement } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Underlag — IRMA",
  description: "Underlag öppnat via IRMA-länk. Inget konto krävs.",
  robots: { index: false, follow: false },
};

export default async function IrmaLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const key = irmaThrottleKey(token);
  if (irmaTokenBlocked(key)) notFound();
  const runtime = tryRuntime();
  if (!runtime) notFound();
  const agreement = await openAgreementByToken({
    pool: runtime.pool,
    events: runtime.events,
    token,
    requestId: crypto.randomUUID(),
  });
  if (!agreement) {
    noteIrmaTokenFailure(key);
    notFound();
  }
  noteIrmaTokenSuccess(key);
  const signed = agreement.status === "signed";
  const needsAck = agreement.verificationLevel === 1 && !signed;

  return (
    <div className="min-h-full bg-paper text-ink">
      <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-5 py-12 sm:px-6 sm:py-16">
        <p className="pd-label text-faint">IRMA</p>
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">{agreement.title}</h1>
          <p className="text-ink-soft">Till {agreement.counterparty}. Inget konto behövs.</p>
        </header>

        <ol className="flex gap-2 text-xs font-medium uppercase tracking-wide text-faint">
          <li className="text-ink">1. Läs</li>
          <li aria-hidden="true">·</li>
          <li className={needsAck ? "text-ink" : "text-faint"}>2. Bekräfta</li>
          <li aria-hidden="true">·</li>
          <li className={signed ? "text-ink" : "text-faint"}>3. Klart</li>
        </ol>

        {agreement.body ? <p className="text-base leading-relaxed text-ink-soft">{agreement.body}</p> : null}

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Det här ska du läsa</h2>
          {agreement.clauses.length === 0 ? (
            <p className="text-sm text-muted">Inga klausuler lagrades. Bekräftelsen gäller titel och motpart.</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {agreement.clauses.map((clause, index) => (
                <li key={clause.id} className="rounded-2xl border border-line bg-surface p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-accent">
                    {index + 1}. {clause.heading}
                  </p>
                  <p className="mt-2 text-base leading-relaxed text-ink-soft">{clause.text}</p>
                </li>
              ))}
            </ol>
          )}
        </section>

        {signed ? (
          <Notice>
            Bekräftat av <span className="font-medium text-ink">{agreement.signerName}</span>. Det är
            inte BankID och inte en kvalificerad e-signatur.
          </Notice>
        ) : needsAck ? (
          <form
            action={acknowledgeIrmaAgreement}
            className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5"
          >
            <h2 className="text-lg font-semibold">Bekräfta</h2>
            <p className="text-sm leading-relaxed text-ink-soft">{ACKNOWLEDGEMENT_DECLARATION}</p>
            <input type="hidden" name="token" value={token} />
            <Field name="signerName" label="Ditt namn" required large />
            <label className="flex items-start gap-3 text-base text-ink-soft">
              <input type="checkbox" name="accepted" required className="mt-1 h-5 w-5" />
              <span>Jag har läst underlaget och bekräftar det.</span>
            </label>
            <Submit large>Bekräfta</Submit>
          </form>
        ) : (
          <Notice>Det här är ett informationsunderlag. Ingen bekräftelse krävs.</Notice>
        )}

        <p className="text-sm text-muted">Status: {statusLabel(agreement.status)}</p>
      </main>
    </div>
  );
}
