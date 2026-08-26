import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Notice, SignInGate } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { formatSwedishDateTime } from "@/lib/format/datetime";
import { getHouseIntake, houseOrgRefFromEnv, isHouseSession } from "@/lib/kansli/intakes";
import { kronor, moduleLine } from "@/lib/kansli/pricing";
import { tryRuntime } from "@/lib/platform/page";

export const dynamic = "force-dynamic";

export default async function KansliIntakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await readSession();
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
          { href: "/kansli/upphandling", label: "Registreringar" },
        ]}
      />
      {!session ? (
        <SignInGate next="/kansli/upphandling" title="Logga in för att läsa registreringen">
          Registreringen tillhör kansliet.
        </SignInGate>
      ) : intake ? (
        <>
          <h1 className="text-3xl font-semibold tracking-tight">{intake.companyName}</h1>
          <p className="text-ink-soft">
            Registrerade sig {formatSwedishDateTime(intake.createdAt)}. Konto och faktura skapades
            direkt.
          </p>
          {intake.blocked.length > 0 ? <Notice>{intake.blocked.join(" ")}</Notice> : null}
          <dl className="flex flex-col gap-3">
            <Row label="Kontakt" value={`${intake.contactName} · ${intake.contactEmail}`} />
            <Row label="Roll" value={intake.contactTitle} />
            <Row label="Org.nr" value={intake.orgNumber} />
            <Row label="Moduler" value={intake.modules.map(moduleLine).join(" · ")} />
            <Row
              label="Månadspris"
              value={
                intake.monthlyNetOre != null
                  ? `${kronor(intake.monthlyNetOre)}/mån exkl. moms`
                  : null
              }
            />
            <Row label="Anteckning" value={intake.notes} />
            <Row label="Konto" value={intake.provisionedEmail} />
            <Row label="Faktura" value={intake.invoiceNumber} />
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
