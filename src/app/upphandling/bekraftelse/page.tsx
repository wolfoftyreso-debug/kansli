import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { Notice } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format/datetime";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { getIntake, isHouseSession } from "@/lib/kansli/intakes";
import { readIntakeReveal } from "@/lib/kansli/intake-reveal";
import {
  instalmentDueDays,
  kronor,
  MODULE_PRICING,
  PAYMENT_DAYS,
  VAT_RATE_BPS,
  YEAR_INSTALMENTS,
} from "@/lib/kansli/pricing";
import { tryRuntime } from "@/lib/platform/page";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "intake.confirm.metaTitle"),
  };
}

export default async function UpphandlingBekraftelsePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const id = (await searchParams).id?.trim() ?? "";
  const locale = await readLocale();
  const runtime = tryRuntime();
  const session = await readSession();
  const reveal = await readIntakeReveal();
  const fromSubmit = Boolean(reveal && reveal.intakeId === id);
  const intake = id && runtime ? await getIntake(runtime.pool, id) : null;
  const house = isHouseSession(session?.org?.ref);
  const ownLogin = Boolean(
    session?.email && intake?.provisionedEmail && session.email === intake.provisionedEmail,
  );
  const showAccount = fromSubmit || house || ownLogin;
  const passwordOnce = fromSubmit ? (reveal?.passwordOnce ?? null) : null;
  const grossOre =
    intake?.monthlyNetOre != null
      ? intake.monthlyNetOre + Math.round((intake.monthlyNetOre * VAT_RATE_BPS) / 10_000)
      : null;
  const dueFor = (part: number): string | null =>
    intake
      ? new Date(
          new Date(intake.createdAt).getTime() + instalmentDueDays(part) * 86_400_000,
        ).toISOString()
      : null;

  return (
    <AppShell current="upphandling" session={session}>
      {!intake ? (
        <>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t(locale, "intake.confirm.missingTitle")}
          </h1>
          <p className="text-ink-soft">{t(locale, "intake.confirm.missingBody")}</p>
          <Link href="/upphandling" className="underline decoration-line underline-offset-4">
            {t(locale, "intake.confirm.back")}
          </Link>
        </>
      ) : (
        <>
          <p className="pd-label text-faint">{t(locale, "intake.confirm.kicker")}</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t(locale, "intake.confirm.heading")}
          </h1>
          <p className="text-ink-soft">
            {t(locale, "intake.confirm.lead", {
              company: intake.companyName,
              instalments: YEAR_INSTALMENTS,
              paymentDays: PAYMENT_DAYS,
            })}
          </p>
          <section className="border border-line bg-surface px-5 py-5">
            <p className="text-sm text-ink-soft">{t(locale, "intake.confirm.modules")}</p>
            <p className="mt-1 font-medium">
              {intake.modules.map((moduleId) => MODULE_PRICING[moduleId].label).join(" · ")}
            </p>
            <p className="mt-2 text-sm text-muted">{t(locale, "intake.confirm.kansliIncluded")}</p>
          </section>
          {showAccount && intake.provisionedEmail ? (
            <section className="border border-line bg-surface px-5 py-5">
              <p className="text-sm text-ink-soft">{t(locale, "intake.confirm.signIn")}</p>
              <p className="mt-1 font-medium">{intake.provisionedEmail}</p>
              {passwordOnce ? (
                <>
                  <p className="mt-3 text-sm text-ink-soft">
                    {t(locale, "intake.confirm.passwordOnce")}
                  </p>
                  <p className="mt-1 font-mono text-lg">{passwordOnce}</p>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  {t(locale, "intake.confirm.passwordGone")}
                </p>
              )}
              {intake.blocked.length > 0 ? <Notice>{intake.blocked.join(" ")}</Notice> : null}
            </section>
          ) : intake.provisionedEmail ? (
            <Notice>{t(locale, "intake.confirm.loginHidden")}</Notice>
          ) : (
            <Notice>
              {t(locale, "intake.confirm.noAccount")}
              {intake.blocked.length > 0 ? ` ${intake.blocked.join(" ")}` : ""}
            </Notice>
          )}
          {showAccount && intake.invoiceNumber ? (
            <section className="border border-line bg-surface px-5 py-5">
              <p className="text-sm text-ink-soft">
                {t(locale, "intake.confirm.plan", { instalments: YEAR_INSTALMENTS })}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {grossOre != null
                  ? t(locale, "intake.confirm.gross", {
                      amount: kronor(grossOre),
                      instalments: YEAR_INSTALMENTS,
                    })
                  : intake.invoiceNumber}
              </p>
              <ul className="mt-3 flex flex-col gap-1">
                {(intake.invoiceNumbers.length > 0
                  ? intake.invoiceNumbers
                  : [intake.invoiceNumber]
                ).map((number, index) => {
                  const due = dueFor(index + 1);
                  return (
                    <li
                      key={number}
                      className="flex items-baseline justify-between gap-3 border-b border-line py-1 text-sm last:border-b-0"
                    >
                      <span className="font-mono">{number}</span>
                      <span className="text-muted">
                        {t(locale, "intake.confirm.part", {
                          part: index + 1,
                          total: YEAR_INSTALMENTS,
                        })}
                        {due
                          ? t(locale, "intake.confirm.due", { when: formatDateTime(due, locale) })
                          : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-sm text-muted">{t(locale, "intake.confirm.planNote")}</p>
            </section>
          ) : null}
          <p>
            <Link
              href="/api/auth/login?next=/ekonomi/fakturor"
              className="inline-flex bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft"
            >
              {t(locale, "intake.confirm.openInvoice")}
            </Link>
          </p>
        </>
      )}
    </AppShell>
  );
}
