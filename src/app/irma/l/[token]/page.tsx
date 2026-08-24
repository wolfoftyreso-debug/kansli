import { notFound } from "next/navigation";
import { Field, Notice, Submit } from "@/components/app/SignInGate";
import { ACKNOWLEDGEMENT_DECLARATION } from "@/lib/irma/clauses";
import { openAgreementByToken } from "@/lib/irma/agreements";
import { tryRuntime } from "@/lib/platform/page";
import { acknowledgeIrmaAgreement } from "./actions";

export const metadata = {
  title: "Avtal — IRMA — Pixdrift",
  description: "Underlag öppnat via IRMA-länk. Inget konto krävs.",
};

export default async function IrmaLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const runtime = tryRuntime();
  if (!runtime) notFound();
  const agreement = await openAgreementByToken({
    pool: runtime.pool,
    events: runtime.events,
    token,
    requestId: crypto.randomUUID(),
  });
  if (!agreement) notFound();
  const signed = agreement.status === "signed";

  return (
    <div className="min-h-full bg-paper text-ink">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-16">
        <p className="pd-label text-faint">PIXDRIFT / IRMA</p>
        <h1 className="text-3xl font-semibold tracking-tight">{agreement.title}</h1>
        <p className="text-ink-soft">
          Underlag till <span className="text-ink">{agreement.counterparty}</span>. Inget konto
          krävs. Token hashas — den här URL:en är hemligheten.
        </p>
        {agreement.body ? <p className="text-sm text-ink-soft">{agreement.body}</p> : null}

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Klausuler</h2>
          {agreement.clauses.length === 0 ? (
            <p className="text-sm text-muted">
              Inga klausuler lagrades när avtalet skapades. Bekräftelsen gäller titel och motpart.
            </p>
          ) : (
            <ol className="flex flex-col gap-3">
              {agreement.clauses.map((clause, index) => (
                <li key={clause.id} className="rounded-xl border border-line bg-surface p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-accent">
                    {index + 1}. {clause.heading}
                  </p>
                  <p className="mt-2 text-sm text-ink-soft">{clause.text}</p>
                </li>
              ))}
            </ol>
          )}
        </section>

        {signed ? (
          <Notice>
            Bekräftat av <span className="font-medium text-ink">{agreement.signerName}</span>. Inte
            BankID och inte kvalificerad e-signatur. Artefakt{" "}
            <span className="break-all font-mono text-xs">{agreement.artifactSha256}</span>
          </Notice>
        ) : (
          <form
            action={acknowledgeIrmaAgreement}
            className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
          >
            <h2 className="text-lg font-semibold">Bekräfta underlaget</h2>
            <p className="text-sm text-ink-soft">{ACKNOWLEDGEMENT_DECLARATION}</p>
            <input type="hidden" name="token" value={token} />
            <Field name="signerName" label="Namn" required />
            <label className="flex items-start gap-2 text-sm text-ink-soft">
              <input type="checkbox" name="accepted" required className="mt-1" />
              <span>Jag har läst klausulerna och bekräftar underlaget.</span>
            </label>
            <Submit>Bekräfta</Submit>
          </form>
        )}

        <p className="rounded-md border border-line bg-accent-soft px-3 py-2 text-sm text-ink-soft">
          Status: <span className="font-medium text-ink">{agreement.status}</span>. Öppning sätter
          viewed. Bekräftelse sätter signed och en SHA-256-artefakt.
        </p>
        <p className="font-mono text-xs text-faint">{agreement.createdAt}</p>
      </main>
    </div>
  );
}
