import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { SignInGate, Submit } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format/datetime";
import { irmaStatus, irmaVerification, t, type Locale } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { exportAgreementRecord, getAgreement } from "@/lib/irma/agreements";
import { verifyAgreementIntegrity } from "@/lib/irma/integrity";
import { daysUntilExpiry } from "@/lib/irma/status";
import { tryRuntime } from "@/lib/platform/page";
import { ttsConfigured } from "@/lib/platform/tts";
import { ListenUnderlag } from "../ListenUnderlag";
import { reissueIrmaAgreement, revokeIrmaAgreement } from "../actions";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "irma.doc.metaTitle"),
  };
}

function contentState(locale: Locale, matches: boolean | null | undefined): string {
  if (matches === true) return t(locale, "irma.doc.contentUnchanged");
  if (matches === false) return t(locale, "irma.doc.contentChanged");
  return t(locale, "irma.doc.contentUnknown");
}

function artifactState(locale: Locale, matches: boolean | null | undefined): string {
  if (matches === true) return t(locale, "irma.doc.artifactOk");
  if (matches === false) return t(locale, "irma.doc.artifactBad");
  return t(locale, "irma.doc.artifactUnknown");
}

export default async function IrmaAgreementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime(session?.org?.ref);
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
  const daysLeft = agreement ? daysUntilExpiry(agreement.tokenExpiresAt) : null;

  return (
    <AppShell current="irma" session={session}>
      <ProductCrumb crumbs={[{ href: "/irma", label: "IRMA" }]} />
      {!session?.org ? (
        <SignInGate
          next="/irma"
          title={t(locale, "irma.doc.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "irma.doc.signInBody")}
        </SignInGate>
      ) : agreement ? (
        <>
          <h1 className="text-3xl font-semibold tracking-tight">{agreement.title}</h1>
          <p className="text-ink-soft">{agreement.counterparty}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-accent">
            {irmaStatus(locale, agreement.status)}
          </p>
          <p className="text-sm text-ink-soft">
            {irmaVerification(locale, agreement.verificationLevel)}
          </p>

          {agreement.body ? <p className="text-sm text-ink-soft">{agreement.body}</p> : null}

          {ttsConfigured() ? (
            <ListenUnderlag
              src={`/api/irma/agreements/${agreement.id}/speech`}
              available
              listenLabel={t(locale, "irma.listen")}
              unsupportedLabel={t(locale, "irma.listenUnsupported")}
            />
          ) : (
            <p className="text-sm text-muted">{t(locale, "irma.doc.listenUnavailable")}</p>
          )}

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{t(locale, "irma.doc.clauses")}</h2>
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
            <h2 className="text-lg font-semibold">{t(locale, "irma.doc.proof")}</h2>
            <p className="text-sm text-ink-soft">
              {t(locale, "irma.doc.contentPrefix")}{" "}
              {contentState(locale, integrity?.contentMatches)}
              {agreement.artifactSha256
                ? ` · ${artifactState(locale, integrity?.artifactMatches)}`
                : ""}
            </p>
            {agreement.contentSha256 ? (
              <p className="break-all font-mono text-xs text-faint">
                {t(locale, "irma.doc.hashContent")} {agreement.contentSha256}
              </p>
            ) : null}
            {agreement.artifactSha256 ? (
              <p className="break-all font-mono text-xs text-faint">
                {t(locale, "irma.doc.hashArtifact")} {agreement.artifactSha256}
              </p>
            ) : null}
            {agreement.signerName ? (
              <p className="text-sm text-ink-soft">
                {t(locale, "irma.doc.confirmedBy", { name: agreement.signerName })}
                {agreement.signedAt ? ` · ${formatDateTime(agreement.signedAt, locale)}` : ""}
              </p>
            ) : null}
            {agreement.tokenExpiresAt && agreement.status !== "signed" ? (
              <p className="text-sm text-muted">
                {t(locale, "irma.doc.linkUntil", {
                  when: formatDateTime(agreement.tokenExpiresAt, locale),
                })}
                {daysLeft != null ? ` · ${t(locale, "irma.doc.daysLeft", { days: daysLeft })}` : ""}
              </p>
            ) : null}
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium">
                {t(locale, "irma.doc.export")}
              </summary>
              <pre className="mt-2 overflow-x-auto font-mono text-xs">
                {exportAgreementRecord(agreement)}
              </pre>
            </details>
          </section>

          {agreement.status !== "signed" && agreement.status !== "cancelled" ? (
            <div className="flex flex-wrap gap-3">
              <form action={reissueIrmaAgreement}>
                <input type="hidden" name="id" value={agreement.id} />
                <Submit>{t(locale, "irma.doc.reissue")}</Submit>
              </form>
              <form action={revokeIrmaAgreement}>
                <input type="hidden" name="id" value={agreement.id} />
                <Submit>{t(locale, "irma.doc.revoke")}</Submit>
              </form>
            </div>
          ) : null}
        </>
      ) : null}
    </AppShell>
  );
}
