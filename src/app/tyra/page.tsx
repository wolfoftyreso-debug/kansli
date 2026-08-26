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
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { tryRuntime } from "@/lib/platform/page";
import { TaskRow } from "@/components/tyra/Rows";
import { CASE_STATUS_LABELS, INTENT_LABELS, listCases } from "@/lib/tyra/cases";
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
            <Field name="customerName" label="Kund" required placeholder="Anna Andersson" />
            <Field
              name="registrationNumber"
              label="Registreringsnummer"
              required
              placeholder="ABC123"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="make" label="Märke" placeholder="Volvo" />
              <Field name="model" label="Modell" placeholder="XC60" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="phone" label="Telefon" placeholder="+46…" />
              <Field name="email" label="E-post" placeholder="kund@exempel.se" />
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-ink-soft">Avsikt</span>
              <select
                name="intent"
                defaultValue="TIRE_SWAP_APPOINTMENT"
                className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
              >
                <option value="TIRE_SWAP_APPOINTMENT">Hjulskifte</option>
                <option value="STORE_ONLY">Inlagring</option>
                <option value="PICKUP_ONLY">Utlämning</option>
                <option value="QUOTE_ONLY">Offert</option>
                <option value="MIXED">Blandat</option>
              </select>
            </label>
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm text-ink-soft">Åtgärder</legend>
              <CheckField name="swapFromStorage" label="Hjulskifte från lager" defaultChecked />
              <CheckField name="wash" label="Tvätt" defaultChecked />
              <CheckField name="balance" label="Balansering" defaultChecked />
              <CheckField name="storageIn" label="Lägga in hjul" />
              <CheckField name="quote" label="Sälj däck" />
            </fieldset>
            <Submit>Öppna ärende</Submit>
          </form>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Ärenden</h2>
            {cases.length === 0 ? (
              <EmptyState>Inga ärenden ännu.</EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {cases.map((item) => (
                  <li key={item.id}>
                    <Link href={`/tyra/cases/${item.id}`} className="block">
                      <TaskRow
                        headline={item.registrationNumber ?? "Ärende"}
                        subtitle={`${item.customerName ?? "Kund saknas"} · ${INTENT_LABELS[item.intent]}`}
                        status={{
                          tone: caseTone(item.caseStatus),
                          label: CASE_STATUS_LABELS[item.caseStatus] ?? item.caseStatus,
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
