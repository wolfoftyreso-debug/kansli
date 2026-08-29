import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Field, Notice, SelectField, SignInGate, Submit } from "@/components/app/SignInGate";
import {
  ASSESSMENTS,
  assessmentLabel,
  getInquiry,
  inquiryStatusLabel,
  vendorStatusLabel,
  webStatusLabel,
} from "@/lib/creditae/inquiries";
import { readSession } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format/datetime";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { creditConfigured } from "@/lib/platform/credit";
import { webintelConfigured } from "@/lib/platform/webintel";
import { tryRuntime } from "@/lib/platform/page";
import { fetchCreditaeWebPresence, saveCreditaeAssessment } from "../actions";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "creditae.detailMetaTitle"),
    description: t(locale, "creditae.metaDescription"),
  };
}

export default async function CreditaeInquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime(session?.org?.ref);
  const item =
    session?.org?.ref && runtime ? await getInquiry(runtime.pool, session.org.ref, id) : null;
  if (session?.org && runtime && !item) notFound();

  return (
    <AppShell current="creditae" session={session}>
      <ProductCrumb crumbs={[{ href: "/creditae", label: "CREDITAE" }]} />
      {!session?.org ? (
        <SignInGate
          next="/creditae"
          title={t(locale, "creditae.detailSignInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "creditae.detailSignInBody")}
        </SignInGate>
      ) : item ? (
        <>
          <h1 className="text-3xl font-semibold tracking-tight">
            {item.subjectName || item.subjectOrgNumber}
          </h1>
          <p className="text-xs font-medium uppercase tracking-wide text-accent">
            {item.assessment
              ? assessmentLabel(item.assessment, locale)
              : inquiryStatusLabel(item.status, locale)}
          </p>
          <Notice>
            {creditConfigured()
              ? t(locale, "creditae.detailNoticeOn")
              : t(locale, "creditae.detailNoticeOff")}
          </Notice>

          <dl className="flex flex-col gap-3">
            <div>
              <dt className="text-sm text-ink-soft">{t(locale, "creditae.orgNumber")}</dt>
              <dd className="mt-1 font-mono text-sm">{item.subjectOrgNumber}</dd>
            </div>
            {item.subjectName ? (
              <div>
                <dt className="text-sm text-ink-soft">{t(locale, "creditae.companyName")}</dt>
                <dd className="mt-1">{item.subjectName}</dd>
              </div>
            ) : null}
            {item.reason ? (
              <div>
                <dt className="text-sm text-ink-soft">{t(locale, "creditae.why")}</dt>
                <dd className="mt-1">{item.reason}</dd>
              </div>
            ) : null}
            {item.vendorStatus ? (
              <div>
                <dt className="text-sm text-ink-soft">{t(locale, "creditae.bureau")}</dt>
                <dd className="mt-1">{vendorStatusLabel(item.vendorStatus, locale)}</dd>
              </div>
            ) : null}
            {item.vendorStatus === "fetched" ? (
              <>
                {item.vendorName ? (
                  <div>
                    <dt className="text-sm text-ink-soft">{t(locale, "creditae.vendorName")}</dt>
                    <dd className="mt-1">{item.vendorName}</dd>
                  </div>
                ) : null}
                {item.vendorScore ? (
                  <div>
                    <dt className="text-sm text-ink-soft">{t(locale, "creditae.vendorScore")}</dt>
                    <dd className="mt-1 font-mono text-sm">{item.vendorScore}</dd>
                  </div>
                ) : null}
                {item.vendorLimit ? (
                  <div>
                    <dt className="text-sm text-ink-soft">{t(locale, "creditae.vendorLimit")}</dt>
                    <dd className="mt-1 font-mono text-sm">{item.vendorLimit}</dd>
                  </div>
                ) : null}
                <p className="text-xs text-faint">{t(locale, "creditae.vendorNotConclusion")}</p>
              </>
            ) : null}
            {item.vendorStatus === "failed" && item.vendorReason ? (
              <div>
                <dt className="text-sm text-ink-soft">{t(locale, "creditae.vendorWhyMissing")}</dt>
                <dd className="mt-1">{item.vendorReason}</dd>
              </div>
            ) : null}
            {item.notes ? (
              <div>
                <dt className="text-sm text-ink-soft">{t(locale, "creditae.notes")}</dt>
                <dd className="mt-1">{item.notes}</dd>
              </div>
            ) : null}
          </dl>

          <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
            <h2 className="text-lg font-semibold">{t(locale, "creditae.web")}</h2>
            <Notice>
              {webintelConfigured()
                ? t(locale, "creditae.webNoticeOn")
                : t(locale, "creditae.webNoticeOff")}
            </Notice>
            {item.webStatus ? (
              <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                {webStatusLabel(item.webStatus, locale)}
                {item.webFetchedAt ? ` · ${formatDateTime(item.webFetchedAt, locale)}` : ""}
              </p>
            ) : null}
            {item.webStatus === "fetched" ? (
              <dl className="flex flex-col gap-3">
                {item.subjectDomain ? (
                  <div>
                    <dt className="text-sm text-ink-soft">{t(locale, "creditae.domainField")}</dt>
                    <dd className="mt-1 font-mono text-sm">{item.subjectDomain}</dd>
                  </div>
                ) : null}
                {item.webRank ? (
                  <div>
                    <dt className="text-sm text-ink-soft">{t(locale, "creditae.webRank")}</dt>
                    <dd className="mt-1 font-mono text-sm">{item.webRank}</dd>
                  </div>
                ) : null}
                {item.webOrganicKeywords ? (
                  <div>
                    <dt className="text-sm text-ink-soft">{t(locale, "creditae.webKeywords")}</dt>
                    <dd className="mt-1 font-mono text-sm">{item.webOrganicKeywords}</dd>
                  </div>
                ) : null}
                {item.webOrganicTraffic ? (
                  <div>
                    <dt className="text-sm text-ink-soft">{t(locale, "creditae.webTraffic")}</dt>
                    <dd className="mt-1 font-mono text-sm">{item.webOrganicTraffic}</dd>
                  </div>
                ) : null}
                {item.webAdwordsKeywords ? (
                  <div>
                    <dt className="text-sm text-ink-soft">{t(locale, "creditae.webAds")}</dt>
                    <dd className="mt-1 font-mono text-sm">{item.webAdwordsKeywords}</dd>
                  </div>
                ) : null}
                <p className="text-xs text-faint">{t(locale, "creditae.webNotConclusion")}</p>
              </dl>
            ) : null}
            {item.webStatus === "failed" && item.webReason ? (
              <div>
                <p className="text-sm text-ink-soft">{t(locale, "creditae.webWhyMissing")}</p>
                <p className="mt-1">{item.webReason}</p>
              </div>
            ) : null}
            <form action={fetchCreditaeWebPresence} className="flex flex-col gap-3">
              <input type="hidden" name="id" value={item.id} />
              <Field
                name="domain"
                label={t(locale, "creditae.domainField")}
                placeholder="exempel.se"
                defaultValue={item.subjectDomain ?? undefined}
                required
              />
              <Submit>{t(locale, "creditae.webFetch")}</Submit>
            </form>
          </section>

          <form
            action={saveCreditaeAssessment}
            className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
          >
            <h2 className="text-lg font-semibold">{t(locale, "creditae.yourAssessment")}</h2>
            <input type="hidden" name="id" value={item.id} />
            <SelectField
              name="assessment"
              label={t(locale, "creditae.conclusion")}
              placeholder={t(locale, "creditae.choose")}
              required
              defaultValue={item.assessment ?? ""}
              options={ASSESSMENTS.map((value) => ({
                value,
                label: assessmentLabel(value, locale),
              }))}
            />
            <label className="flex flex-col gap-1">
              <span className="text-sm text-ink-soft">{t(locale, "creditae.notes")}</span>
              <textarea
                name="notes"
                defaultValue={item.notes}
                className="min-h-24 border border-line bg-paper px-3 py-2 text-sm"
              />
            </label>
            <Submit>{t(locale, "creditae.saveAssessment")}</Submit>
          </form>
        </>
      ) : null}
    </AppShell>
  );
}
