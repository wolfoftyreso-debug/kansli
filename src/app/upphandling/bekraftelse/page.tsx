import Link from "next/link";
import { Notice } from "@/components/app/SignInGate";
import { formatSwedishDateTime } from "@/lib/format/datetime";
import { getIntake, takePasswordOnce } from "@/lib/kansli/intakes";
import { tryRuntime } from "@/lib/platform/page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mötet är bokat — Pixdrift",
};

export default async function UpphandlingBekraftelsePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const id = (await searchParams).id?.trim() ?? "";
  const runtime = tryRuntime();
  const intake = id && runtime ? await getIntake(runtime.pool, id) : null;
  const passwordOnce = id && runtime ? await takePasswordOnce(runtime.pool, id) : null;

  return (
    <div className="min-h-full bg-paper text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-sm font-semibold tracking-[0.18em]">
            PIXDRIFT
          </Link>
          <Link
            href="/api/auth/login?next=/ekonomi/fakturor"
            className="text-sm font-medium underline decoration-line underline-offset-4"
          >
            Logga in
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        {!intake ? (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">Anmälan hittades inte</h1>
            <p className="text-ink-soft">
              Öppna länken från bekräftelsen, eller fyll i formuläret igen.
            </p>
            <Link href="/upphandling" className="underline decoration-line underline-offset-4">
              Tillbaka till formuläret
            </Link>
          </>
        ) : (
          <>
            <p className="pd-label text-faint">Koncernupphandling</p>
            <h1 className="text-3xl font-semibold tracking-tight">Mötet är lagt</h1>
            <p className="text-ink-soft">
              {intake.companyName}. Demot förbereds mot den miljö ni angav. Anpassning i drift sker
              efter genomgång på plats.
            </p>
            <section className="rounded-xl border border-line bg-surface px-5 py-5">
              <p className="text-sm text-ink-soft">Möte</p>
              <p className="mt-1 text-2xl font-semibold">
                {formatSwedishDateTime(intake.meetingAt)}
              </p>
              <p className="mt-2 text-sm text-muted">Tio dagar efter anmälan, klockan 10:00.</p>
            </section>
            {intake.provisionedEmail ? (
              <section className="rounded-xl border border-line bg-surface px-5 py-5">
                <p className="text-sm text-ink-soft">Inloggning</p>
                <p className="mt-1 font-medium">{intake.provisionedEmail}</p>
                {passwordOnce ? (
                  <>
                    <p className="mt-3 text-sm text-ink-soft">Engångslösen — skriv av det nu</p>
                    <p className="mt-1 font-mono text-lg">{passwordOnce}</p>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-muted">
                    Lösenordet visades redan, eller kontot fanns. Använd det ni redan har.
                  </p>
                )}
                {intake.blocked.length > 0 ? <Notice>{intake.blocked.join(" ")}</Notice> : null}
              </section>
            ) : (
              <Notice>
                Inget konto skapades.
                {intake.blocked.length > 0 ? ` ${intake.blocked.join(" ")}` : ""}
              </Notice>
            )}
            {intake.invoiceNumber ? (
              <section className="rounded-xl border border-line bg-surface px-5 py-5">
                <p className="text-sm text-ink-soft">Faktura 10 dagar</p>
                <p className="mt-1 font-medium">{intake.invoiceNumber}</p>
                <p className="mt-2 text-sm text-muted">
                  Onboardingfaktura med tio dagars betalning. Öppna Ekonomi efter inloggning.
                </p>
              </section>
            ) : null}
            <p>
              <Link
                href="/api/auth/login?next=/ekonomi/fakturor"
                className="inline-flex rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft"
              >
                Logga in och öppna fakturan
              </Link>
            </p>
          </>
        )}
      </main>
    </div>
  );
}
