import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { EmptyState, Field, Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import {
  assessmentLabel,
  inquiryStatusLabel,
  listInquiries,
  vendorStatusLabel,
} from "@/lib/creditae/inquiries";
import { readSession } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format/datetime";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { creditConfigured } from "@/lib/platform/credit";
import { tryRuntime } from "@/lib/platform/page";
import { registerCreditaeInquiry } from "./actions";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "creditae.metaTitle"),
    description: t(locale, "creditae.metaDescription"),
  };
}

export default async function CreditaePage() {
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime(session?.org?.ref);
  const inquiries =
    session?.org?.ref && runtime ? await listInquiries(runtime.pool, session.org.ref) : [];

  return (
    <AppShell current="creditae" session={session}>
      <header className="flex flex-col gap-3">
        <ProductCrumb crumbs={[{ href: "/creditae", label: "CREDITAE" }]} />
        <h1 className="text-3xl font-semibold tracking-tight">CREDITAE</h1>
        <p className="text-ink-soft">{t(locale, "creditae.lead")}</p>
        <Notice>
          {creditConfigured() ? t(locale, "creditae.noticeOn") : t(locale, "creditae.noticeOff")}
        </Notice>
      </header>

      {!session?.org ? (
        <SignInGate
          next="/creditae"
          title={t(locale, "creditae.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "creditae.signInBody")}
        </SignInGate>
      ) : (
        <>
          <form
            action={registerCreditaeInquiry}
            className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
          >
            <h2 className="text-lg font-semibold">{t(locale, "creditae.newInquiry")}</h2>
            <Field
              name="subjectOrgNumber"
              label={t(locale, "creditae.orgNumber")}
              required
              placeholder="556016-0680"
            />
            <Field name="subjectName" label={t(locale, "creditae.companyName")} />
            <Field name="reason" label={t(locale, "creditae.reason")} multiline />
            <Submit>{t(locale, "creditae.register")}</Submit>
          </form>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{t(locale, "creditae.inquiries")}</h2>
            {inquiries.length === 0 ? (
              <EmptyState>{t(locale, "creditae.empty")}</EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {inquiries.map((item) => (
                  <li key={item.id} className="rounded-xl border border-line bg-surface p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-accent">
                      {item.assessment
                        ? assessmentLabel(item.assessment, locale)
                        : inquiryStatusLabel(item.status, locale)}
                      {item.vendorStatus
                        ? ` · ${vendorStatusLabel(item.vendorStatus, locale)}`
                        : ""}
                    </p>
                    <p className="mt-2 font-medium">
                      <Link href={`/creditae/${item.id}`} className="hover:underline">
                        {item.subjectName || item.subjectOrgNumber}
                      </Link>
                    </p>
                    <p className="font-mono text-xs text-faint">{item.subjectOrgNumber}</p>
                    <p className="mt-2 text-xs text-faint">
                      {formatDateTime(item.createdAt, locale)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
