import { notFound } from "next/navigation";
import { Field, Notice, Submit } from "@/components/app/SignInGate";
import { ACKNOWLEDGEMENT_DECLARATION } from "@/lib/irma/clauses";
import { peekAgreementByToken } from "@/lib/irma/agreements";
import { daysUntilExpiry } from "@/lib/irma/status";
import { formatDateTime } from "@/lib/format/datetime";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { ttsConfigured } from "@/lib/platform/tts";
import {
  irmaThrottleKey,
  irmaTokenBlocked,
  noteIrmaTokenFailure,
  noteIrmaTokenSuccess,
} from "@/lib/irma/throttle";
import { tryRuntime } from "@/lib/platform/page";
import { GuestFrame, GuestProgress, GuestReceipt } from "../../guest-chrome";
import { ListenUnderlag } from "../../ListenUnderlag";
import { acknowledgeIrmaAgreement, markIrmaViewed } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "irma.guest.metaTitle"),
    description: t(locale, "irma.guest.metaDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function IrmaLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const locale = await readLocale();
  const key = irmaThrottleKey(token);
  if (irmaTokenBlocked(key)) notFound();
  const runtime = tryRuntime();
  if (!runtime) notFound();
  const agreement = await peekAgreementByToken(runtime.pool, token);
  if (!agreement) {
    noteIrmaTokenFailure(key);
    notFound();
  }
  noteIrmaTokenSuccess(key);
  const signed = agreement.status === "signed";
  const unread = agreement.status === "draft";
  const needsAck = agreement.verificationLevel === 1 && !signed && !unread;
  const step: 1 | 2 | 3 = signed ? 3 : unread ? 1 : needsAck ? 2 : 1;
  const days = daysUntilExpiry(agreement.tokenExpiresAt);

  return (
    <GuestFrame>
      <p className="pd-label text-faint">IRMA</p>
      <GuestProgress
        step={step}
        ariaLabel={t(locale, "irma.guest.stepAria", { step })}
        labels={[
          t(locale, "irma.guest.stepRead"),
          t(locale, "irma.guest.stepConfirm"),
          t(locale, "irma.guest.stepDone"),
        ]}
      />

      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{agreement.title}</h1>
        <p className="text-ink-soft">
          {t(locale, "irma.guest.forWhom", { name: agreement.counterparty })}
        </p>
        {!signed && days != null ? (
          <p className="text-sm text-muted">
            {days <= 0
              ? t(locale, "irma.guest.linkExpired")
              : t(locale, "irma.guest.linkDays", { days })}
          </p>
        ) : null}
      </header>

      {signed && agreement.signerName ? (
        <GuestReceipt
          signerName={agreement.signerName}
          signedAt={agreement.signedAt ? formatDateTime(agreement.signedAt, locale) : null}
          heading={t(locale, "irma.guest.receiptHeading")}
          lead={t(locale, "irma.guest.receiptLead")}
        />
      ) : null}

      {agreement.body ? (
        <p className="text-base leading-relaxed text-ink-soft">{agreement.body}</p>
      ) : null}

      <ListenUnderlag
        src={`/api/irma/l/${token}/speech`}
        available={ttsConfigured()}
        listenLabel={t(locale, "irma.listen")}
        unsupportedLabel={t(locale, "irma.listenUnsupported")}
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t(locale, "irma.guest.readHeading")}</h2>
        {agreement.clauses.length === 0 ? (
          <p className="text-sm text-muted">{t(locale, "irma.guest.noClauses")}</p>
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

      {unread ? (
        <form action={markIrmaViewed} className="flex flex-col gap-3">
          <Notice>{t(locale, "irma.guest.openedNotice")}</Notice>
          <input type="hidden" name="token" value={token} />
          <Submit>{t(locale, "irma.guest.opened")}</Submit>
        </form>
      ) : null}

      {needsAck ? (
        <form action={acknowledgeIrmaAgreement} className="flex flex-col gap-4 pb-4">
          <h2 className="text-lg font-semibold">{t(locale, "irma.guest.confirmHeading")}</h2>
          <p className="text-sm leading-relaxed text-ink-soft">{ACKNOWLEDGEMENT_DECLARATION}</p>
          <input type="hidden" name="token" value={token} />
          <Field name="signerName" label={t(locale, "irma.guest.signerName")} required large />
          <label className="flex items-start gap-3 text-base text-ink-soft">
            <input type="checkbox" name="accepted" required className="mt-1 h-5 w-5" />
            <span>{t(locale, "irma.guest.accept")}</span>
          </label>
          <div className="sticky bottom-0 -mx-5 bg-paper/95 px-5 py-3 backdrop-blur sm:-mx-6 sm:px-6">
            <Submit large>{t(locale, "irma.guest.confirm")}</Submit>
          </div>
        </form>
      ) : null}

      {!signed && !needsAck ? <Notice>{t(locale, "irma.guest.infoOnly")}</Notice> : null}
    </GuestFrame>
  );
}
