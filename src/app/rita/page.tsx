import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import {
  CheckField,
  EmptyState,
  Field,
  Notice,
  SignInGate,
  Submit,
} from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { formatSwedishDateTime } from "@/lib/format/datetime";
import { tryRuntime } from "@/lib/platform/page";
import { ANALYSIS_STATUS_LABELS, listAnalyses } from "@/lib/rita/analyses";
import { findingsFromAnalysis } from "@/lib/rita/findings";
import { ritaEngineSnapshot } from "@/lib/rita/resolve-engine";
import { requestRitaAnalysis } from "./actions";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "rita.metaTitle"),
    description: t(locale, "rita.metaDescription"),
  };
}

export default async function RitaPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; fel?: string }>;
}) {
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime(session?.org?.ref);
  const params = await searchParams;
  const orgNumberWrong = params.fel === "orgnr";
  const status =
    params.status === "completed" || params.status === "blocked" || params.status === "requested"
      ? params.status
      : undefined;
  const analyses =
    session?.org?.ref && runtime
      ? await listAnalyses(runtime.pool, session.org.ref, { status })
      : [];
  const engine = ritaEngineSnapshot();

  return (
    <AppShell current="rita" session={session}>
      <header className="flex flex-col gap-3">
        <ProductCrumb crumbs={[{ href: "/rita", label: "RITA" }]} />
        <h1 className="text-3xl font-semibold tracking-tight">RITA</h1>
        <p className="text-ink-soft">{t(locale, "rita.lead")}</p>
        <Notice>
          {engine.available
            ? engine.modelReady
              ? t(locale, "rita.noticeReady")
              : t(locale, "rita.noticeRules")
            : t(locale, "rita.noticeBlocked")}{" "}
          {t(locale, "rita.noticeExample")}
        </Notice>
      </header>

      {!session?.org ? (
        <SignInGate
          next="/rita"
          title={t(locale, "rita.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "rita.signInBody")}
        </SignInGate>
      ) : (
        <>
          {engine.available ? (
            <form
              action={requestRitaAnalysis}
              className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
            >
              <h2 className="text-lg font-semibold">Ny analys</h2>
              {orgNumberWrong ? (
                <Notice>Organisationsnumret stämmer inte. Kontrollera siffrorna.</Notice>
              ) : null}
              <Field name="companyName" label="Bolagsnamn" required placeholder="Ert bolagsnamn" />
              <Field
                name="orgNumber"
                label="Organisationsnummer"
                required
                placeholder="556xxx-xxxx"
              />
              <p className="text-sm text-ink-soft">
                Analysen kan ta upp till 7 minuter. Ha tålamod.
              </p>
              {engine.kind === "http" ? (
                <p className="text-sm text-ink-soft">
                  Exempelbokslutet går inte att använda i den här driftmiljön. Använd ett eget
                  underlag.
                </p>
              ) : (
                <CheckField
                  name="useDemoDocument"
                  defaultChecked
                  label="Använd exempelbokslutet (inte en riktig kundfil)."
                />
              )}
              <Submit>Begär analys</Submit>
            </form>
          ) : (
            <Notice>
              Det går inte att beställa analyser än. Se{" "}
              <Link
                href="/kansli/beredskap"
                className="underline decoration-line underline-offset-4"
              >
                beredskap
              </Link>
              .
            </Notice>
          )}

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Analyser</h2>
            <p className="flex flex-wrap gap-3 text-sm">
              <Link href="/rita" className="underline decoration-line underline-offset-4">
                Alla
              </Link>
              <Link
                href="/rita?status=completed"
                className="underline decoration-line underline-offset-4"
              >
                Klara
              </Link>
              <Link
                href="/rita?status=blocked"
                className="underline decoration-line underline-offset-4"
              >
                Blockerade
              </Link>
            </p>
            {analyses.length === 0 ? (
              <EmptyState>Inga analyser ännu.</EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {analyses.map((item) => (
                  <li key={item.id} className="rounded-xl border border-line bg-surface p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-accent">
                      {ANALYSIS_STATUS_LABELS[item.status] ?? item.status}
                    </p>
                    <p className="mt-2 font-medium">
                      <Link href={`/rita/${item.id}`} className="hover:underline">
                        {item.companyName}
                      </Link>
                    </p>
                    <p className="font-mono text-xs text-faint">{item.orgNumber}</p>
                    {item.status === "completed" ? (
                      <p className="mt-1 text-sm text-ink-soft">
                        {findingsFromAnalysis(item.result).length} fynd
                      </p>
                    ) : null}
                    {item.blockedReason ? (
                      <p className="mt-2 text-sm text-muted">{item.blockedReason}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-faint">
                      {formatSwedishDateTime(item.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
