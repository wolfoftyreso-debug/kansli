import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Notice, SignInGate } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { loadFirstCustomerBoard, type GateState } from "@/lib/platform/first-customer";
import { tryRuntime } from "@/lib/platform/page";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "ready.metaTitle"),
    description: t(locale, "ready.metaDescription"),
  };
}

function tone(state: GateState) {
  if (state === "ready") return "text-ink";
  if (state === "blocked") return "text-ink";
  return "text-ink-soft";
}

export default async function BeredskapPage() {
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime(session?.org?.ref);
  const board = await loadFirstCustomerBoard(
    runtime?.pool ?? null,
    session?.org?.ref ?? null,
    locale,
  );

  return (
    <AppShell current="kansli" session={session}>
      <ProductCrumb
        crumbs={[
          { href: "/kansli", label: "Kansli" },
          { href: "/kansli/beredskap", label: t(locale, "ops.readiness") },
        ]}
      />
      <h1 className="text-3xl font-semibold tracking-tight">{t(locale, "ready.heading")}</h1>
      <p className="max-w-xl text-ink-soft">{t(locale, "ready.lead")}</p>

      {!session?.org ? (
        <SignInGate
          next="/kansli/beredskap"
          title={t(locale, "ready.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "ready.signInBody")}
        </SignInGate>
      ) : (
        <>
          <section className="rounded-xl border border-line bg-surface px-4 py-4">
            <p className="font-medium">
              {board.pilotOfferable ? t(locale, "ready.pilotYes") : t(locale, "ready.pilotNo")}
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              {t(locale, "ready.allLabel", {
                answer: board.allSystemsReady
                  ? t(locale, "ready.allYes")
                  : t(locale, "ready.allNo"),
              })}
            </p>
            <p className="mt-3 text-sm">
              <Link href="/upphandling" className="underline decoration-line underline-offset-4">
                {t(locale, "ready.procurementLink")}
              </Link>
              {t(locale, "ready.procurementHint")}
            </p>
          </section>

          <ol className="flex flex-col gap-2">
            {board.gates.map((gate) => (
              <li key={gate.id} className="rounded-xl border border-line bg-surface px-4 py-3">
                <p className={`text-xs font-medium uppercase tracking-wide ${tone(gate.state)}`}>
                  {gate.state === "ready"
                    ? t(locale, "ops.gate.ready")
                    : gate.state === "blocked"
                      ? t(locale, "ops.gate.blocked")
                      : t(locale, "ops.gate.open")}
                </p>
                <p className="mt-1 font-medium">{gate.title}</p>
                <p className="mt-1 text-sm text-ink-soft">{gate.detail}</p>
              </li>
            ))}
          </ol>

          <Notice>{t(locale, "ready.footer")}</Notice>
        </>
      )}
    </AppShell>
  );
}
