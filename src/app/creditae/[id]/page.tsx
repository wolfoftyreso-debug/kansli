import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import {
  ASSESSMENTS,
  assessmentLabel,
  getInquiry,
  inquiryStatusLabel,
  vendorStatusLabel,
} from "@/lib/creditae/inquiries";
import { readSession } from "@/lib/auth/session";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { creditConfigured } from "@/lib/platform/credit";
import { tryRuntime } from "@/lib/platform/page";
import { saveCreditaeAssessment } from "../actions";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "creditae.detailMetaTitle") };
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
                    <dt className="text-sm text-ink-soft">Byråns värde</dt>
                    <dd className="mt-1 font-mono text-sm">{item.vendorScore}</dd>
                  </div>
                ) : null}
                {item.vendorLimit ? (
                  <div>
                    <dt className="text-sm text-ink-soft">Byråns gräns</dt>
                    <dd className="mt-1 font-mono text-sm">{item.vendorLimit}</dd>
                  </div>
                ) : null}
                <p className="text-xs text-faint">Det är byråns fält, inte er slutsats.</p>
              </>
            ) : null}
            {item.vendorStatus === "failed" && item.vendorReason ? (
              <div>
                <dt className="text-sm text-ink-soft">Varför rapporten saknas</dt>
                <dd className="mt-1">{item.vendorReason}</dd>
              </div>
            ) : null}
            {item.notes ? (
              <div>
                <dt className="text-sm text-ink-soft">Anteckning</dt>
                <dd className="mt-1">{item.notes}</dd>
              </div>
            ) : null}
          </dl>

          <form
            action={saveCreditaeAssessment}
            className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
          >
            <h2 className="text-lg font-semibold">Er bedömning</h2>
            <input type="hidden" name="id" value={item.id} />
            <label className="flex flex-col gap-1">
              <span className="text-sm text-ink-soft">Slutsats</span>
              <select
                name="assessment"
                required
                defaultValue={item.assessment ?? ""}
                className="border border-line bg-paper px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  Välj
                </option>
                {ASSESSMENTS.map((value) => (
                  <option key={value} value={value}>
                    {assessmentLabel(value, locale)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-ink-soft">Anteckning</span>
              <textarea
                name="notes"
                defaultValue={item.notes}
                className="min-h-24 border border-line bg-paper px-3 py-2 text-sm"
              />
            </label>
            <Submit>Spara bedömning</Submit>
          </form>
        </>
      ) : null}
    </AppShell>
  );
}
