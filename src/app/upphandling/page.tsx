import Link from "next/link";
import { CheckField, Field, Submit } from "@/components/app/SignInGate";
import { DEMO_MODULE_LABELS, DEMO_MODULES } from "@/lib/kansli/intakes";
import { submitUpphandling } from "./actions";

export const metadata = {
  title: "Koncernupphandling — Pixdrift",
  description:
    "Intag för demo och möte om 10 dagar. Inte ett sålt koncernavtal. Vi anpassar när vi vet er stack.",
};

/**
 * Layout from Sana AI “Book an intro”
 * https://mobbin.com/flows/b579b13d-0b90-4ca4-9b77-e03c42a7c851
 * Two columns: trust left, form right. CTA is a held meeting, not a calendar picker.
 * Login pattern (email + password, error under field, no fake Google SSO):
 * https://mobbin.com/flows/4e3afa58-8eac-4166-bfbf-e606b061e637
 */
export default function UpphandlingPage() {
  return (
    <div className="min-h-full bg-paper text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-sm font-semibold tracking-[0.18em]">
            PIXDRIFT
          </Link>
          <Link
            href="/kansli"
            className="text-sm text-ink-soft underline decoration-line underline-offset-4 hover:text-ink"
          >
            Logga in
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-5xl gap-12 px-6 py-12 lg:grid-cols-[1fr_1.15fr] lg:items-start lg:py-16">
        <aside className="flex flex-col gap-6">
          <p className="pd-label text-faint">Koncernupphandling</p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Ett formulär. Ett möte om 10 dagar. Inte ett sålt avtal.
          </h1>
          <p className="text-ink-soft">
            När vi vet er stack och miljö bygger vi anpassningen. Det här intaget är allt som krävs
            för att förbereda en demo och hålla tiden. Volkswagen-logik: sanning före teater.
          </p>
          <ul className="flex flex-col gap-2 text-sm text-ink-soft">
            <li>Konto skapas i vårt IdP — e-post och lösenord. Ingen påhittad Google-SSO.</li>
            <li>Faktura 10 dagar i Ekonomi. Stripe och Swish bara med riktiga nycklar.</li>
            <li>Pilot kan erbjudas med skriftliga gränser. Koncernavtal skrivs efter demot.</li>
          </ul>
          <p className="text-sm text-muted">
            Layout efter{" "}
            <a
              href="https://mobbin.com/flows/b579b13d-0b90-4ca4-9b77-e03c42a7c851"
              className="underline decoration-line underline-offset-4"
            >
              Sana AI Book an intro
            </a>
            . Knappen bokar inte en kalender — den håller mötet om 10 dagar.
          </p>
        </aside>

        <form
          action={submitUpphandling}
          className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6 shadow-sm"
        >
          <Field name="contactEmail" label="Arbets-e-post" type="email" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="contactName" label="Kontaktperson" required placeholder="Anna Andersson" />
            <Field name="contactTitle" label="Roll" placeholder="IT-inköp" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="companyName" label="Bolag" required placeholder="Bilia Personbilar AB" />
            <Field name="orgNumber" label="Organisationsnummer" placeholder="556xxx-xxxx" />
          </div>
          <Field name="sites" label="Anläggningar" placeholder="Göteborg, Stockholm…" />
          <Field name="brands" label="Märken" placeholder="Volkswagen, Audi, Seat" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="dms" label="DMS / verkstadssystem" />
            <Field name="economySystem" label="Ekonomisystem" placeholder="Fortnox, Visma, annat" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="tireHotel" label="Däckhotell idag" />
            <Field name="smsProvider" label="SMS-leverantör" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-ink-soft">Identitet idag</span>
              <select
                name="identitySystem"
                className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                defaultValue=""
              >
                <option value="">Välj</option>
                <option value="entra">Microsoft Entra</option>
                <option value="okta">Okta</option>
                <option value="local">Lokala konton</option>
                <option value="other">Annat</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-ink-soft">Miljö</span>
              <select
                name="environment"
                className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                defaultValue=""
              >
                <option value="">Välj</option>
                <option value="cloud">Moln</option>
                <option value="onprem">On-prem</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </label>
          </div>
          <Field
            name="oidcNotes"
            label="OIDC / brandvägg / allowlist"
            multiline
            placeholder="Vilka originer ska in? Vilket IdP ska vi samexistera med?"
          />
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm text-ink-soft">Vad ska demot visa</legend>
            {DEMO_MODULES.map((id) => (
              <CheckField
                key={id}
                name="demoModules"
                value={id}
                label={DEMO_MODULE_LABELS[id]}
                defaultChecked={id === "tyra" || id === "ekonomi" || id === "irma"}
              />
            ))}
          </fieldset>
          <Field name="notes" label="Övrigt vi måste veta" multiline />
          <CheckField
            name="honestyAccepted"
            required
            label="Jag har läst vad produkten inte är: inte BankID, inte live-däckpriser, inte SMS SENT, inte TED/HILMA, inte ALVA-diagnos, inte Fortnox. Stripe/Swish bara med nyckel."
          />
          <CheckField
            name="provisionAccount"
            defaultChecked
            label="Skapa inloggning nu (e-post + engångslösen). Kräver PIXDRIFT_DB_OWNER_URL."
          />
          <CheckField
            name="issueInvoice"
            defaultChecked
            label="Utfärda onboardingfaktura, 10 dagar. Inte en påhittad Stripe-charge."
          />
          <Field name="invoiceKronor" label="Fakturabelopp exkl. moms (kr)" defaultValue="2500" />
          <Submit large>Boka möte om 10 dagar</Submit>
        </form>
      </main>
    </div>
  );
}
