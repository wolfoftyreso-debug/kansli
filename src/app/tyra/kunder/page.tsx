import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { EmptyState, SignInGate } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { t, tyraCaseStatus } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { tryRuntime } from "@/lib/platform/page";
import { listCases } from "@/lib/tyra/cases";
import { listCustomerCards } from "@/lib/tyra/hotel";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "tyra.cards.metaTitle"),
    description: t(locale, "tyra.cards.metaDescription"),
  };
}

export default async function TyraCustomersPage() {
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime(session?.org?.ref);
  const cards =
    session?.org?.ref && runtime ? await listCustomerCards(runtime.pool, session.org.ref) : [];
  const cases = session?.org?.ref && runtime ? await listCases(runtime.pool, session.org.ref) : [];

  return (
    <AppShell current="tyra" session={session}>
      <ProductCrumb
        crumbs={[
          { href: "/tyra", label: "TYRA" },
          { href: "/tyra/kunder", label: t(locale, "tyra.customers") },
        ]}
      />
      <h1 className="text-3xl font-semibold tracking-tight">{t(locale, "tyra.cards.heading")}</h1>
      <p className="max-w-xl text-ink-soft">{t(locale, "tyra.cards.lead")}</p>
      {!session?.org ? (
        <SignInGate
          next="/tyra/kunder"
          title={t(locale, "tyra.cards.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "tyra.cards.signInBody")}
        </SignInGate>
      ) : cards.length === 0 ? (
        <EmptyState>{t(locale, "tyra.cards.empty")}</EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {cards.map((card) => (
            <li key={card.customer.id} className="rounded-xl border border-line bg-surface p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-accent">
                {card.nextAction.label}
              </p>
              <p className="mt-2 text-lg font-medium">{card.customer.name}</p>
              <p className="text-sm text-ink-soft">
                {t(locale, "tyra.cards.counts", {
                  vehicles: card.counts.vehicles,
                  wheels: card.counts.wheelSets,
                })}
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {card.vehicles.map((row) => (
                  <li key={row.vehicle.id} className="font-mono text-xs text-faint">
                    {row.vehicle.registrationNumber}
                    {row.vehicle.make ? ` · ${row.vehicle.make}` : ""}
                    {row.wheelSets.length > 0
                      ? ` · ${row.wheelSets
                          .map(
                            (ws) =>
                              `${ws.season} ${ws.storageStatus}${ws.storageCode ? ` ${ws.storageCode}` : ""}`,
                          )
                          .join(", ")}`
                      : t(locale, "tyra.cards.noWheels")}
                  </li>
                ))}
              </ul>
              <ul className="mt-3 flex flex-col gap-1">
                {cases
                  .filter((item) => item.customerId === card.customer.id)
                  .map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/tyra/cases/${item.id}`}
                        className="text-sm underline decoration-line underline-offset-4 hover:text-ink"
                      >
                        {item.registrationNumber ?? t(locale, "tyra.caseFallback")} ·{" "}
                        {tyraCaseStatus(locale, item.caseStatus)}
                      </Link>
                    </li>
                  ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
