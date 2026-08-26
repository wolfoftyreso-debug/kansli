import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { EmptyState, SignInGate } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { Notice } from "@/components/app/SignInGate";
import { houseOrgRefFromEnv, isHouseSession, listIntakes } from "@/lib/kansli/intakes";
import { kronor, MODULE_PRICING } from "@/lib/kansli/pricing";
import { tryRuntime } from "@/lib/platform/page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Registreringar — Kansli",
  description: "Kunder som registrerat sig, deras moduler och fakturor.",
};

export default async function KansliUpphandlingPage() {
  const session = await readSession();
  const runtime = tryRuntime();
  const houseOrgRef = houseOrgRefFromEnv();
  const house = isHouseSession(session?.org?.ref);
  const intakes = session && house && runtime ? await listIntakes(runtime.pool, houseOrgRef) : [];

  return (
    <AppShell current="upphandling" session={session}>
      <ProductCrumb
        crumbs={[
          { href: "/kansli", label: "Kansli" },
          { href: "/kansli/upphandling", label: "Registreringar" },
        ]}
      />
      <h1 className="text-3xl font-semibold tracking-tight">Registreringar</h1>
      <p className="max-w-xl text-ink-soft">
        Kunder som registrerat sig själva. Varje registrering är ett konto och en månadsfaktura med
        tio dagars betalning — inga demos, inga möten.
      </p>
      {!session ? (
        <SignInGate next="/kansli/upphandling" title="Logga in för att läsa registreringarna">
          Det här är kansliets inkorg. Den öppna registreringen finns på sidan Registrera.
        </SignInGate>
      ) : !house ? (
        <Notice>
          Det här är kansliets inkorg, inte verkstadens. Du ser den bara när du är inne som huset.
        </Notice>
      ) : intakes.length === 0 ? (
        <EmptyState>Inga registreringar ännu.</EmptyState>
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
                    ? ` · ${kronor(item.monthlyNetOre)}/mån exkl. moms`
                    : ""}
                  {item.invoiceNumber ? ` · ${item.invoiceNumber}` : ""}
                  {item.provisionedEmail ? " · konto skapat" : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
