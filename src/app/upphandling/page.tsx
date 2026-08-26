import { AppShell } from "@/components/app/AppShell";
import { CheckField, Field, Notice, Submit } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import {
  ALL_MODULES_MONTHLY_NET_ORE,
  kronor,
  MODULE_PRICING,
  PAYMENT_DAYS,
  SELLABLE_MODULES,
} from "@/lib/kansli/pricing";

export const metadata = {
  title: "Registrera — Pixdrift",
  description:
    "Välj moduler, registrera dig och betala fakturan inom tio dagar. Inga demos, inga möten.",
};

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
  const fel = (await searchParams).fel;
  const orgNumberWrong = fel === "orgnr";
  const noModules = fel === "moduler";
  return (
    <AppShell current="upphandling" session={session}>
      <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-start">
        <aside className="flex flex-col gap-4">
          <p className="pd-label text-faint">Registrera</p>
          <h1 className="text-2xl font-semibold tracking-tight">Välj moduler och kom igång</h1>
          <p className="text-ink-soft">
            Du registrerar dig själv. Inloggningen skapas direkt och en månadsfaktura ställs ut med{" "}
            {PAYMENT_DAYS} dagars betalning. Betald faktura — allt fortsätter fungera. Så enkelt är
            det.
          </p>
          <ul className="flex flex-col gap-2 text-sm text-ink-soft">
            <li>Kansli och plattformen ingår alltid, utan kostnad.</li>
            <li>Köp en modul eller flera — du väljer.</li>
            <li>
              Allt i Pixdrift kostar aldrig mer än {kronor(ALL_MODULES_MONTHLY_NET_ORE)}/mån exkl.
              moms. Når valet taket får du alla moduler.
            </li>
          </ul>
          <div className="border border-line bg-surface">
            {SELLABLE_MODULES.map((id) => (
              <p
                key={id}
                className="flex items-baseline justify-between gap-3 border-b border-line px-3 py-2 text-sm last:border-b-0"
              >
                <span>
                  <span className="font-medium">{MODULE_PRICING[id].label}</span>
                  <span className="text-ink-soft"> — {MODULE_PRICING[id].blurb}</span>
                </span>
                <span className="shrink-0 tabular-nums text-ink-soft">
                  {kronor(MODULE_PRICING[id].monthlyNetOre)}/mån
                </span>
              </p>
            ))}
          </div>
          <p className="text-sm text-muted">Priser exkl. moms. Inga demos, inga säljmöten.</p>
        </aside>

        <form
          action="/api/kansli/intake"
          method="post"
          className="flex flex-col gap-4 border border-line bg-surface p-4"
        >
          {orgNumberWrong ? (
            <Notice>Organisationsnumret stämmer inte. Kontrollera siffrorna.</Notice>
          ) : null}
          {noModules ? <Notice>Välj minst en modul.</Notice> : null}
          <fieldset className="flex flex-col gap-1">
            <legend className="text-sm text-ink-soft">Moduler *</legend>
            {SELLABLE_MODULES.map((id) => (
              <CheckField
                key={id}
                name="modules"
                value={id}
                large
                label={`${MODULE_PRICING[id].label} — ${MODULE_PRICING[id].blurb} · ${kronor(MODULE_PRICING[id].monthlyNetOre)}/mån`}
              />
            ))}
          </fieldset>
          <Field name="contactEmail" label="Arbets-e-post" type="email" required large />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              name="contactName"
              label="Kontaktperson"
              required
              large
              placeholder="Anna Andersson"
            />
            <Field name="contactTitle" label="Roll" large placeholder="Verkstadschef" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              name="companyName"
              label="Bolag"
              required
              large
              placeholder="Bilia Personbilar AB"
            />
            <Field name="orgNumber" label="Organisationsnummer" large placeholder="556xxx-xxxx" />
          </div>
          <CheckField
            name="termsAccepted"
            required
            large
            label={`Jag beställer de valda modulerna. Inloggning skapas nu och en månadsfaktura ställs ut med ${PAYMENT_DAYS} dagars betalning. Betalas den inte pausas rummen tills den är betald. Priser exkl. moms.`}
          />
          <Submit large>Registrera och få faktura</Submit>
        </form>
      </div>
    </AppShell>
  );
}
