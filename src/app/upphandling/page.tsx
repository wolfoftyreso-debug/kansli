import { AppShell } from "@/components/app/AppShell";
import { CheckField, Field, Submit } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { DEMO_MODULE_LABELS, DEMO_MODULES } from "@/lib/kansli/intakes";
import { submitUpphandling } from "./actions";

export const metadata = {
  title: "Koncernupphandling — Pixdrift",
  description:
    "Underlag för demo och uppföljningsmöte. Anpassning sker mot er miljö när stacken är känd.",
};

/**
 * Layout from Sana AI “Book an intro”
 * https://mobbin.com/flows/b579b13d-0b90-4ca4-9b77-e03c42a7c851
 * Two columns: trust left, form right. CTA is a held meeting, not a calendar picker.
 * Login pattern (email + password, error under field, no fake Google SSO):
 * https://mobbin.com/flows/4e3afa58-8eac-4166-bfbf-e606b061e637
 */
export default async function UpphandlingPage() {
  const session = await readSession();
  return (
    <AppShell current="upphandling" session={session}>
      <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-start">
        <aside className="flex flex-col gap-4">
          <p className="pd-label text-faint">Koncernupphandling</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Underlag för demo och uppföljningsmöte
          </h1>
          <p className="text-ink-soft">
            Fyll i hur ni arbetar idag: system, anläggningar och identitet. Vi använder svaret till
            att förbereda en demonstration och ett möte tio dagar senare. Anpassningen gör vi när vi
            vet vilka system ni har.
          </p>
          <ul className="flex flex-col gap-2 text-sm text-ink-soft">
            <li>Inloggning med arbets-e-post och lösenord i Pixdrift Identity.</li>
            <li>Startfaktura med tio dagars betalning i Ekonomi.</li>
            <li>Pilot kan erbjudas med avgränsad omfattning. Avtal tecknas efter demot.</li>
          </ul>
          <p className="text-sm text-muted">
            När du skickar in bokas mötet automatiskt: klockan 10.00, tio dagar från idag.
          </p>
        </aside>

        <form
          action={submitUpphandling}
          className="flex flex-col gap-4 border border-line bg-surface p-4"
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
            label="Jag bekräftar att det här är underlag för demo och möte. BankID, live-leverantörspriser, Visma, Fortnox och kvalificerad e-signatur ingår inte. SMS vid sälj går bara när telefonen är kopplad och ni sagt ja."
          />
          <CheckField
            name="provisionAccount"
            defaultChecked
            label="Skapa inloggning med arbets-e-post och tillfälligt lösenord."
          />
          <CheckField
            name="issueInvoice"
            defaultChecked
            label="Utfärda startfaktura med tio dagars betalning."
          />
          <Field name="invoiceKronor" label="Fakturabelopp exkl. moms (kr)" defaultValue="2500" />
          <Submit large>Boka möte om 10 dagar</Submit>
        </form>
      </div>
    </AppShell>
  );
}
