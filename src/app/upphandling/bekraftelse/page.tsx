import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { Notice } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { formatSwedishDateTime } from "@/lib/format/datetime";
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

export const metadata = {
  title: "Ni är igång — Pixdrift",
};

export default async function UpphandlingBekraftelsePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const id = (await searchParams).id?.trim() ?? "";
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
          <h1 className="text-3xl font-semibold tracking-tight">Registreringen hittades inte</h1>
          <p className="text-ink-soft">
            Öppna länken från bekräftelsen, eller registrera dig igen.
          </p>
          <Link href="/upphandling" className="underline decoration-line underline-offset-4">
            Tillbaka till registreringen
          </Link>
        </>
      ) : (
        <>
          <p className="pd-label text-faint">Registrering</p>
          <h1 className="text-2xl font-semibold tracking-tight">Ni är igång</h1>
          <p className="text-ink-soft">
            {intake.companyName}. Allt fungerar från och med nu, i tolv månader. Alla{" "}
            {YEAR_INSTALMENTS} fakturorna är utställda med orderspecifikationen som bilaga — den
            första förfaller om {PAYMENT_DAYS} dagar. Betalda i tid — allt fortsätter fungera.
          </p>
          <section className="border border-line bg-surface px-5 py-5">
            <p className="text-sm text-ink-soft">Moduler</p>
            <p className="mt-1 font-medium">
              {intake.modules.map((moduleId) => MODULE_PRICING[moduleId].label).join(" · ")}
            </p>
            <p className="mt-2 text-sm text-muted">Kansli och plattformen ingår alltid.</p>
          </section>
          {showAccount && intake.provisionedEmail ? (
            <section className="border border-line bg-surface px-5 py-5">
              <p className="text-sm text-ink-soft">Inloggning</p>
              <p className="mt-1 font-medium">{intake.provisionedEmail}</p>
              {passwordOnce ? (
                <>
                  <p className="mt-3 text-sm text-ink-soft">Engångslösen — skriv av det nu</p>
                  <p className="mt-1 font-mono text-lg">{passwordOnce}</p>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  Lösenordet visades när ni registrerade er. Det ligger inte i den här länken.
                </p>
              )}
              {intake.blocked.length > 0 ? <Notice>{intake.blocked.join(" ")}</Notice> : null}
            </section>
          ) : intake.provisionedEmail ? (
            <Notice>
              Inloggningen skapades när ni registrerade er. Lösenordet visas inte på den här
              adressen.
            </Notice>
          ) : (
            <Notice>
              Inget konto skapades.
              {intake.blocked.length > 0 ? ` ${intake.blocked.join(" ")}` : ""}
            </Notice>
          )}
          {showAccount && intake.invoiceNumber ? (
            <section className="border border-line bg-surface px-5 py-5">
              <p className="text-sm text-ink-soft">
                Betalplan — {YEAR_INSTALMENTS} fakturor för tolv månader, utställda nu
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {grossOre != null
                  ? `${kronor(grossOre)} inkl. moms × ${YEAR_INSTALMENTS}`
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
                        del {index + 1} av {YEAR_INSTALMENTS}
                        {due ? ` · förfaller ${formatSwedishDateTime(due)}` : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-sm text-muted">
                Betalda i tid — allt fortsätter fungera. Förfaller en obetald pausas rummen tills
                den är betald. Orderspecifikationen ligger som bilaga på varje faktura.
              </p>
            </section>
          ) : null}
          <p>
            <Link
              href="/api/auth/login?next=/ekonomi/fakturor"
              className="inline-flex bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft"
            >
              Logga in och öppna fakturan
            </Link>
          </p>
        </>
      )}
    </AppShell>
  );
}
