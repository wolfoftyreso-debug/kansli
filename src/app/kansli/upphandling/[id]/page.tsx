import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Notice, SignInGate } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { formatSwedishDateTime } from "@/lib/format/datetime";
import {
  DEMO_MODULE_LABELS,
  getHouseIntake,
  houseOrgRefFromEnv,
  isHouseSession,
} from "@/lib/kansli/intakes";
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
          { href: "/kansli/upphandling", label: "Upphandling" },
        ]}
      />
      {!session ? (
        <SignInGate next="/kansli/upphandling" title="Logga in för att läsa anmälan">
          Anmälan tillhör kansliet.
        </SignInGate>
      ) : intake ? (
        <>
          <h1 className="text-3xl font-semibold tracking-tight">{intake.companyName}</h1>
          <p className="text-ink-soft">
            Möte {formatSwedishDateTime(intake.meetingAt)}. Demo byggs mot raderna nedan.
          </p>
          {intake.blocked.length > 0 ? <Notice>{intake.blocked.join(" ")}</Notice> : null}
          <dl className="flex flex-col gap-3">
            <Row label="Kontakt" value={`${intake.contactName} · ${intake.contactEmail}`} />
            <Row label="Roll" value={intake.contactTitle} />
            <Row label="Org.nr" value={intake.orgNumber} />
            <Row label="Anläggningar" value={intake.sites} />
            <Row label="Märken" value={intake.brands} />
            <Row label="DMS" value={intake.dms} />
            <Row label="Ekonomi" value={intake.economySystem} />
            <Row label="Däckhotell" value={intake.tireHotel} />
            <Row label="SMS" value={intake.smsProvider} />
            <Row label="Identitet" value={intake.identitySystem} />
            <Row label="Miljö" value={intake.environment} />
            <Row label="OIDC / allowlist" value={intake.oidcNotes} />
            <Row
              label="Demo"
              value={intake.demoModules.map((id) => DEMO_MODULE_LABELS[id]).join(" · ")}
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
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}
