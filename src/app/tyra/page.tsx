import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import {
  CheckField,
  EmptyState,
  Field,
  Notice,
  SelectField,
  SignInGate,
  Submit,
} from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { t, tyraCaseStatus, tyraIntentLabel } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { tryRuntime } from "@/lib/platform/page";
import { TaskRow } from "@/components/tyra/Rows";
import { listCases } from "@/lib/tyra/cases";
import { createTyraCase } from "./actions";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "tyra.metaTitle"),
    description: t(locale, "tyra.metaDescription"),
  };
}

function caseTone(status: string) {
  if (status === "DONE") return "good" as const;
  if (status === "BLOCKED") return "blocked" as const;
  if (status === "IN_PROGRESS") return "attention" as const;
  return "neutral" as const;
}

export default async function TyraPage() {
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime(session?.org?.ref);
  const cases = session?.org?.ref && runtime ? await listCases(runtime.pool, session.org.ref) : [];

  return (
    <AppShell current="tyra" session={session}>
      <header className="flex flex-col gap-4 pt-4 sm:pt-8">
        <ProductCrumb crumbs={[{ href: "/tyra", label: "TYRA" }]} />
        <h1 className="max-w-xl text-4xl font-semibold tracking-tight">
          {t(locale, "tyra.heading")}
        </h1>
        <p className="max-w-xl text-ink-soft">{t(locale, "tyra.lead")}</p>
        <p className="text-sm">
          <Link
            href="/tyra/kunder"
            className="font-medium underline decoration-line underline-offset-4"
          >
            {t(locale, "tyra.customers")}
          </Link>
          {" · "}
          <Link
            href="/tyra/integrations"
            className="font-medium underline decoration-line underline-offset-4"
          >
            {t(locale, "tyra.integrations")}
          </Link>
        </p>
      </header>

      {!session?.org ? (
        <SignInGate
          next="/tyra"
          title={t(locale, "tyra.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "tyra.signInBody")}
        </SignInGate>
      ) : (
        <>
          <form action={createTyraCase} className="flex flex-col gap-4">
            <Field
              name="customerName"
              label={t(locale, "tyra.field.customer")}
              required
              large
              placeholder="Anna Andersson"
            />
            <Field
              name="registrationNumber"
              label={t(locale, "tyra.field.registration")}
              required
              large
              placeholder="ABC123"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="make" label={t(locale, "tyra.field.make")} large placeholder="Volvo" />
              <Field name="model" label={t(locale, "tyra.field.model")} large placeholder="XC60" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                name="phone"
                label={t(locale, "tyra.field.phone")}
                type="tel"
                large
                placeholder="+46…"
              />
              <Field
                name="email"
                label={t(locale, "tyra.field.email")}
                type="email"
                large
                placeholder="kund@exempel.se"
              />
            </div>
            <SelectField
              name="intent"
              label={t(locale, "tyra.field.intent")}
              large
              defaultValue="TIRE_SWAP_APPOINTMENT"
              options={[
                {
                  value: "TIRE_SWAP_APPOINTMENT",
                  label: tyraIntentLabel(locale, "TIRE_SWAP_APPOINTMENT"),
                },
                { value: "STORE_ONLY", label: tyraIntentLabel(locale, "STORE_ONLY") },
                { value: "PICKUP_ONLY", label: tyraIntentLabel(locale, "PICKUP_ONLY") },
                { value: "QUOTE_ONLY", label: tyraIntentLabel(locale, "QUOTE_ONLY") },
                { value: "MIXED", label: tyraIntentLabel(locale, "MIXED") },
              ]}
            />
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm text-ink-soft">{t(locale, "tyra.jobs")}</legend>
              <CheckField
                name="swapFromStorage"
                label={t(locale, "tyra.job.swapFromStorage")}
                large
                defaultChecked
              />
              <CheckField name="wash" label={t(locale, "tyra.job.wash")} large defaultChecked />
              <CheckField
                name="balance"
                label={t(locale, "tyra.job.balance")}
                large
                defaultChecked
              />
              <CheckField name="storageIn" label={t(locale, "tyra.job.storageIn")} large />
              <CheckField name="quote" label={t(locale, "tyra.job.quote")} large />
            </fieldset>
            <Submit large>{t(locale, "tyra.openCase")}</Submit>
          </form>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{t(locale, "tyra.cases")}</h2>
            {cases.length === 0 ? (
              <EmptyState>{t(locale, "tyra.empty")}</EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {cases.map((item) => (
                  <li key={item.id}>
                    <Link href={`/tyra/cases/${item.id}`} className="block">
                      <TaskRow
                        headline={item.registrationNumber ?? t(locale, "tyra.caseFallback")}
                        subtitle={`${item.customerName ?? t(locale, "tyra.noCustomer")} · ${tyraIntentLabel(locale, item.intent)}`}
                        status={{
                          tone: caseTone(item.caseStatus),
                          label: tyraCaseStatus(locale, item.caseStatus),
                        }}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <Notice>{t(locale, "tyra.notice")}</Notice>
    </AppShell>
  );
}
