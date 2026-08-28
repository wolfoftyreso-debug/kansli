import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Notice, SignInGate } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format/datetime";
import { t, type Locale, type MessageKey } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { getHouseIntake, houseOrgRefFromEnv, isHouseSession } from "@/lib/kansli/intakes";
import { kronor, MODULE_PRICING, type SellableModule } from "@/lib/kansli/pricing";
import { tryRuntime } from "@/lib/platform/page";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "intake.inbox.metaTitle"),
    description: t(locale, "intake.inbox.metaDescription"),
  };
}

function moduleLineLocalized(locale: Locale, id: SellableModule): string {
  return `${MODULE_PRICING[id].label} — ${t(locale, `intake.module.${id}` as MessageKey)}`;
}

export default async function KansliIntakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime();
  const house = isHouseSession(session?.org?.ref);
  const intake =
    session && house && runtime
      ? await getHouseIntake(runtime.pool, houseOrgRefFromEnv(), id)
      : null;
  if (session && runtime && !intake) notFound();

  return (
    <AppShell current="upphandling" session={session}>
      <ProductCrumb
        crumbs={[
          { href: "/kansli", label: "Kansli" },
          { href: "/kansli/upphandling", label: t(locale, "intake.inbox.crumb") },
        ]}
      />
      {!session ? (
        <SignInGate
          next="/kansli/upphandling"
          title={t(locale, "intake.inbox.signInDetailTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "intake.inbox.signInDetailBody")}
        </SignInGate>
      ) : intake ? (
        <>
          <h1 className="text-3xl font-semibold tracking-tight">{intake.companyName}</h1>
          <p className="text-ink-soft">
            {t(locale, "intake.inbox.registered", {
              when: formatDateTime(intake.createdAt, locale),
            })}
          </p>
          {intake.blocked.length > 0 ? <Notice>{intake.blocked.join(" ")}</Notice> : null}
          <dl className="flex flex-col gap-3">
            <Row
              label={t(locale, "intake.contact")}
              value={`${intake.contactName} · ${intake.contactEmail}`}
            />
            <Row label={t(locale, "intake.role")} value={intake.contactTitle} />
            <Row label={t(locale, "intake.orgNumber")} value={intake.orgNumber} />
            <Row
              label={t(locale, "intake.confirm.modules")}
              value={intake.modules
                .map((moduleId) => moduleLineLocalized(locale, moduleId))
                .join(" · ")}
            />
            <Row
              label={t(locale, "intake.inbox.monthly")}
              value={
                intake.monthlyNetOre != null
                  ? t(locale, "intake.inbox.monthlyValue", { price: kronor(intake.monthlyNetOre) })
                  : null
              }
            />
            <Row label={t(locale, "intake.inbox.notes")} value={intake.notes} />
            <Row label={t(locale, "intake.inbox.account")} value={intake.provisionedEmail} />
            <Row label={t(locale, "intake.inbox.invoice")} value={intake.invoiceNumber} />
          </dl>
        </>
      ) : null}
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="border border-line bg-surface px-4 py-3">
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}
