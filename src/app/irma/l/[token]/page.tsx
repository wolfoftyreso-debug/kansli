import { notFound } from "next/navigation";
import { Field, Notice, Submit } from "@/components/app/SignInGate";
import { ACKNOWLEDGEMENT_DECLARATION } from "@/lib/irma/clauses";
import { openAgreementByToken } from "@/lib/irma/agreements";
import {
  irmaThrottleKey,
  irmaTokenBlocked,
  noteIrmaTokenFailure,
  noteIrmaTokenSuccess,
} from "@/lib/irma/throttle";
import { tryRuntime } from "@/lib/platform/page";
import { GuestFrame, GuestProgress, GuestReceipt } from "../../guest-chrome";
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
  const step: 1 | 2 | 3 = signed ? 3 : needsAck ? 2 : 1;

  return (
    <GuestFrame>
      <p className="pd-label text-faint">IRMA</p>
      <GuestProgress step={step} />

      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{agreement.title}</h1>
        <p className="text-ink-soft">Till {agreement.counterparty}. Inget konto behövs.</p>
      </header>

      {signed && agreement.signerName ? (
        <GuestReceipt signerName={agreement.signerName} signedAt={agreement.signedAt} />
      ) : null}

      {agreement.body ? (
        <p className="text-base leading-relaxed text-ink-soft">{agreement.body}</p>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Det här ska du läsa</h2>
        {agreement.clauses.length === 0 ? (
          <p className="text-sm text-muted">
            Inga klausuler lagrades. Bekräftelsen gäller titel och motpart.
          </p>
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

      {needsAck ? (
        <form action={acknowledgeIrmaAgreement} className="flex flex-col gap-4 pb-4">
          <h2 className="text-lg font-semibold">Bekräfta</h2>
          <p className="text-sm leading-relaxed text-ink-soft">{ACKNOWLEDGEMENT_DECLARATION}</p>
          <input type="hidden" name="token" value={token} />
          <Field name="signerName" label="Ditt namn" required large />
          <label className="flex items-start gap-3 text-base text-ink-soft">
            <input type="checkbox" name="accepted" required className="mt-1 h-5 w-5" />
            <span>Jag har läst underlaget och bekräftar det.</span>
          </label>
          <div className="sticky bottom-0 -mx-5 bg-paper/95 px-5 py-3 backdrop-blur sm:-mx-6 sm:px-6">
            <Submit large>Bekräfta</Submit>
          </div>
        </form>
      ) : null}

      {!signed && !needsAck ? (
        <Notice>Det här är ett informationsunderlag. Ingen bekräftelse krävs.</Notice>
      ) : null}
    </GuestFrame>
  );
}
