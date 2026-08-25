import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { SignInGate, Submit } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { exportAgreementRecord, getAgreement } from "@/lib/irma/agreements";
import { verifyAgreementIntegrity } from "@/lib/irma/integrity";
import { daysUntilExpiry, statusLabel, verificationLabel } from "@/lib/irma/status";
import { tryRuntime } from "@/lib/platform/page";
import { reissueIrmaAgreement, revokeIrmaAgreement } from "../actions";

export const metadata = {
  title: "Avtal — IRMA — Pixdrift",
};

export default async function IrmaAgreementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await readSession();
  const runtime = tryRuntime();
  const agreement =
    session?.org?.ref && runtime ? await getAgreement(runtime.pool, session.org.ref, id) : null;
  if (session?.org && runtime && !agreement) notFound();
  const integrity = agreement
    ? verifyAgreementIntegrity({
        id: agreement.id,
        title: agreement.title,
        counterparty: agreement.counterparty,
        body: agreement.body,
        clauses: agreement.clauses,
        contentSha256: agreement.contentSha256,
        signerName: agreement.signerName,
        signedAt: agreement.signedAt,
        artifactSha256: agreement.artifactSha256,
      })
    : null;

  return (
    <AppShell current="irma" session={session}>
      <ProductCrumb crumbs={[{ href: "/irma", label: "IRMA" }]} />
      {!session?.org ? (
        <SignInGate next="/irma" title="Logga in för att se avtalet">
          Avtalet tillhör organisationen.
        </SignInGate>
      ) : agreement ? (
        <>
          <h1 className="text-3xl font-semibold tracking-tight">{agreement.title}</h1>
          <p className="text-ink-soft">{agreement.counterparty}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-accent">
            {statusLabel(agreement.status)}
          </p>
          <p className="text-sm text-ink-soft">{verificationLabel(agreement.verificationLevel)}</p>

          {agreement.body ? <p className="text-sm text-ink-soft">{agreement.body}</p> : null}

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Klausuler</h2>
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
          </section>

          <section className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4">
            <h2 className="text-lg font-semibold">Bevis</h2>
            <p className="text-sm text-ink-soft">
              Innehåll{" "}
              {integrity?.contentMatches === true
                ? "oförändrat"
                : integrity?.contentMatches === false
                  ? "har ändrats"
                  : "går inte att kontrollera (äldre avtal)"}
              {agreement.artifactSha256
                ? ` · bekräftelse ${integrity?.artifactMatches === true ? "stämmer" : integrity?.artifactMatches === false ? "stämmer inte" : "kan inte räknas om"}`
                : ""}
            </p>
            {agreement.contentSha256 ? (
              <p className="break-all font-mono text-xs text-faint">
                innehåll {agreement.contentSha256}
              </p>
            ) : null}
            {agreement.artifactSha256 ? (
              <p className="break-all font-mono text-xs text-faint">
                artefakt {agreement.artifactSha256}
              </p>
            ) : null}
            {agreement.signerName ? (
              <p className="text-sm text-ink-soft">
                Bekräftat av {agreement.signerName}
                {agreement.signedAt ? ` · ${agreement.signedAt}` : ""}
              </p>
            ) : null}
            {agreement.tokenExpiresAt && agreement.status !== "signed" ? (
              <p className="text-sm text-muted">
                Länken giltig till {agreement.tokenExpiresAt}
                {daysUntilExpiry(agreement.tokenExpiresAt) != null
                  ? ` · ${daysUntilExpiry(agreement.tokenExpiresAt)} dagar kvar`
                  : ""}
              </p>
            ) : null}
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium">Exportera underlag</summary>
              <pre className="mt-2 overflow-x-auto font-mono text-xs">
                {exportAgreementRecord(agreement)}
              </pre>
            </details>
          </section>

          {agreement.status !== "signed" && agreement.status !== "cancelled" ? (
            <div className="flex flex-wrap gap-3">
              <form action={reissueIrmaAgreement}>
                <input type="hidden" name="id" value={agreement.id} />
                <Submit>Återutfärda länken</Submit>
              </form>
              <form action={revokeIrmaAgreement}>
                <input type="hidden" name="id" value={agreement.id} />
                <Submit>Återkalla länken</Submit>
              </form>
            </div>
          ) : null}
        </>
      ) : null}
    </AppShell>
  );
}
