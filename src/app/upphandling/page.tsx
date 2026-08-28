import { AppShell } from "@/components/app/AppShell";
import { CheckField, Field, Notice, Submit } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { t, type Locale, type MessageKey } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import {
  ALL_MODULES_MONTHLY_NET_ORE,
  INSTALMENT_INTERVAL_DAYS,
  kronor,
  MODULE_PRICING,
  PAYMENT_DAYS,
  SELLABLE_MODULES,
  YEAR_INSTALMENTS,
  type SellableModule,
} from "@/lib/kansli/pricing";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "intake.metaTitle"),
    description: t(locale, "intake.metaDescription"),
  };
}

function moduleBlurb(locale: Locale, id: SellableModule): string {
  return t(locale, `intake.module.${id}` as MessageKey);
}

/**
 * Self-service, like buying a desktop-software subscription but simpler:
 * pick modules, register, pay the invoice. No demos, no meetings, no sales.
 */
export default async function UpphandlingPage({
  searchParams,
}: {
  searchParams: Promise<{ fel?: string }>;
}) {
  const session = await readSession();
  const locale = await readLocale();
  const fel = (await searchParams).fel;
  const orgNumberWrong = fel === "orgnr";
  const noModules = fel === "moduler";
  const vars = {
    instalments: YEAR_INSTALMENTS,
    paymentDays: PAYMENT_DAYS,
    interval: INSTALMENT_INTERVAL_DAYS,
  };
  return (
    <AppShell current="upphandling" session={session}>
      <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-start">
        <aside className="flex flex-col gap-4">
          <p className="pd-label text-faint">{t(locale, "intake.kicker")}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{t(locale, "intake.heading")}</h1>
          <p className="text-ink-soft">{t(locale, "intake.lead", vars)}</p>
          <ul className="flex flex-col gap-2 text-sm text-ink-soft">
            <li>{t(locale, "intake.bullet.kansli")}</li>
            <li>{t(locale, "intake.bullet.pick")}</li>
            <li>
              {t(locale, "intake.bullet.cap", { price: kronor(ALL_MODULES_MONTHLY_NET_ORE) })}
            </li>
            <li>{t(locale, "intake.bullet.year", { instalments: YEAR_INSTALMENTS })}</li>
          </ul>
          <div className="border border-line bg-surface">
            {SELLABLE_MODULES.map((id) => (
              <p
                key={id}
                className="flex items-baseline justify-between gap-3 border-b border-line px-3 py-2 text-sm last:border-b-0"
              >
                <span>
                  <span className="font-medium">{MODULE_PRICING[id].label}</span>
                  <span className="text-ink-soft"> — {moduleBlurb(locale, id)}</span>
                </span>
                <span className="shrink-0 tabular-nums text-ink-soft">
                  {t(locale, "intake.perMonth", {
                    price: kronor(MODULE_PRICING[id].monthlyNetOre),
                  })}
                </span>
              </p>
            ))}
          </div>
          <p className="text-sm text-muted">{t(locale, "intake.pricesNote")}</p>
        </aside>

        <form
          action="/api/kansli/intake"
          method="post"
          className="flex flex-col gap-4 border border-line bg-surface p-4"
        >
          {orgNumberWrong ? <Notice>{t(locale, "intake.errorOrg")}</Notice> : null}
          {noModules ? <Notice>{t(locale, "intake.errorModules")}</Notice> : null}
          <fieldset className="flex flex-col gap-1">
            <legend className="text-sm text-ink-soft">{t(locale, "intake.modulesLegend")}</legend>
            {SELLABLE_MODULES.map((id) => (
              <CheckField
                key={id}
                name="modules"
                value={id}
                large
                label={t(locale, "intake.moduleLine", {
                  label: MODULE_PRICING[id].label,
                  blurb: moduleBlurb(locale, id),
                  price: kronor(MODULE_PRICING[id].monthlyNetOre),
                })}
              />
            ))}
          </fieldset>
          <Field
            name="contactEmail"
            label={t(locale, "intake.email")}
            type="email"
            required
            large
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              name="contactName"
              label={t(locale, "intake.contact")}
              required
              large
              placeholder={t(locale, "intake.placeholder.contact")}
            />
            <Field
              name="contactTitle"
              label={t(locale, "intake.role")}
              large
              placeholder={t(locale, "intake.placeholder.role")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              name="companyName"
              label={t(locale, "intake.company")}
              required
              large
              placeholder={t(locale, "intake.placeholder.company")}
            />
            <Field
              name="orgNumber"
              label={t(locale, "intake.orgNumber")}
              large
              placeholder="556xxx-xxxx"
            />
          </div>
          <CheckField name="termsAccepted" required large label={t(locale, "intake.terms", vars)} />
          <Submit large>{t(locale, "intake.submit")}</Submit>
        </form>
      </div>
    </AppShell>
  );
}
