import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { EmptyState, Field, Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import { caseStatusLine, listCases, parseCaseStatus } from "@/lib/alva/cases";
import { readSession } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format/datetime";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { tryRuntime } from "@/lib/platform/page";
import { registerAlvaCase } from "./actions";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "alva.metaTitle"),
    description: t(locale, "alva.metaDescription"),
  };
}

export default async function AlvaPage() {
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime(session?.org?.ref);
  const cases = session?.org?.ref && runtime ? await listCases(runtime.pool, session.org.ref) : [];

  return (
    <AppShell current="alva" session={session}>
      <header className="flex flex-col gap-3">
        <ProductCrumb crumbs={[{ href: "/alva", label: "ALVA" }]} />
        <h1 className="pd-h1">ALVA</h1>
        <p className="text-ink-soft">{t(locale, "alva.lead")}</p>
        <Notice>{t(locale, "alva.notice")}</Notice>
      </header>

      {!session?.org ? (
        <SignInGate
          next="/alva"
          title={t(locale, "alva.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "alva.signInBody")}
        </SignInGate>
      ) : (
        <>
          <form
            action={registerAlvaCase}
            className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
          >
            <h2 className="text-lg font-semibold">{t(locale, "alva.newCase")}</h2>
            <Field name="complaint" label={t(locale, "alva.complaint")} required multiline />
            <Field name="vehicleRef" label={t(locale, "alva.vehicleRef")} />
            <Field name="area" label={t(locale, "alva.area")} />
            <Field name="mileageKm" label={t(locale, "alva.mileage")} />
            <Field name="desiredOutcome" label={t(locale, "alva.desiredOutcome")} />
            <Submit large>{t(locale, "alva.register")}</Submit>
          </form>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{t(locale, "alva.cases")}</h2>
            {cases.length === 0 ? (
              <EmptyState>{t(locale, "alva.empty")}</EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {cases.map((item) => (
                  <li key={item.id} className="rounded-xl border border-line bg-surface p-4">
                    <p className="pd-label">
                      {caseStatusLine(parseCaseStatus(item.status) ?? "open", locale)}
                    </p>
                    <p className="mt-2 font-medium">
                      <Link href={`/alva/${item.id}`} className="hover:underline">
                        {item.complaint}
                      </Link>
                    </p>
                    {item.vehicleRef ? (
                      <p className="font-mono text-xs text-faint">{item.vehicleRef}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-faint">
                      {formatDateTime(item.createdAt, locale)}
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
