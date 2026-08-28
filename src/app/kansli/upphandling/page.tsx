import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { EmptyState, Notice, SignInGate } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { houseOrgRefFromEnv, isHouseSession, listIntakes } from "@/lib/kansli/intakes";
import { kronor, MODULE_PRICING } from "@/lib/kansli/pricing";
import { tryRuntime } from "@/lib/platform/page";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "intake.inbox.metaTitle"),
    description: t(locale, "intake.inbox.metaDescription"),
  };
}

export default async function KansliUpphandlingPage() {
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime();
  const houseOrgRef = houseOrgRefFromEnv();
  const house = isHouseSession(session?.org?.ref);
  const intakes = session && house && runtime ? await listIntakes(runtime.pool, houseOrgRef) : [];

  return (
    <AppShell current="upphandling" session={session}>
      <ProductCrumb
        crumbs={[
          { href: "/kansli", label: "Kansli" },
          { href: "/kansli/upphandling", label: t(locale, "intake.inbox.crumb") },
        ]}
      />
      <h1 className="text-3xl font-semibold tracking-tight">{t(locale, "intake.inbox.heading")}</h1>
      <p className="max-w-xl text-ink-soft">{t(locale, "intake.inbox.lead")}</p>
      {!session ? (
        <SignInGate
          next="/kansli/upphandling"
          title={t(locale, "intake.inbox.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "intake.inbox.signInBody")}
        </SignInGate>
      ) : !house ? (
        <Notice>{t(locale, "intake.inbox.notHouse")}</Notice>
      ) : intakes.length === 0 ? (
        <EmptyState>{t(locale, "intake.inbox.empty")}</EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {intakes.map((item) => (
            <li key={item.id}>
              <Link
                href={`/kansli/upphandling/${item.id}`}
                className="block border border-line bg-surface px-4 py-4 hover:border-line-strong"
              >
                <p className="font-medium">{item.companyName}</p>
                <p className="mt-1 text-sm text-ink-soft">
                  {item.contactName} · {item.contactEmail}
                </p>
                <p className="mt-2 text-sm text-ink-soft">
                  {item.modules.map((moduleId) => MODULE_PRICING[moduleId].label).join(" · ")}
                  {item.monthlyNetOre != null
                    ? t(locale, "intake.inbox.price", { price: kronor(item.monthlyNetOre) })
                    : ""}
                  {item.invoiceNumber ? ` · ${item.invoiceNumber}` : ""}
                  {item.provisionedEmail ? t(locale, "intake.inbox.accountCreated") : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
