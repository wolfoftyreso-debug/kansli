import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import {
  CheckField,
  EmptyState,
  Field,
  Notice,
  SignInGate,
  Submit,
} from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { tryRuntime } from "@/lib/platform/page";
import {
  CASE_STATUS_LABELS,
  INTENT_LABELS,
  listCases,
  type TireCaseListItem,
} from "@/lib/tyra/cases";
import { createTyraCase } from "./actions";

export const metadata = {
  title: "TYRA — Pixdrift",
  description: "Däckärenden, arbetssteg och kundhub. Ingen NextAuth, ingen live-pris.",
};

function CaseRow({ item }: { item: TireCaseListItem }) {
  return (
    <li className="rounded-2xl border border-line bg-surface px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-accent">
        {CASE_STATUS_LABELS[item.caseStatus] ?? item.caseStatus} · {INTENT_LABELS[item.intent]}
      </p>
      <p className="mt-2 text-lg font-medium tracking-tight">
        <Link href={`/tyra/cases/${item.id}`} className="hover:underline">
          {item.registrationNumber ?? "Ärende"}
        </Link>
      </p>
      <p className="mt-1 text-sm text-ink-soft">{item.customerName ?? "Kund saknas"}</p>
    </li>
  );
}

export default async function TyraPage() {
  const session = await readSession();
  const runtime = tryRuntime();
  const cases = session?.org?.ref && runtime ? await listCases(runtime.pool, session.org.ref) : [];

  return (
    <AppShell current="tyra" session={session}>
      <header className="flex flex-col gap-4 pt-4 sm:pt-8">
        <p className="pd-label text-faint">TYRA</p>
        <h1 className="max-w-xl text-4xl font-semibold tracking-tight">Vilket fordon ska in?</h1>
        <p className="max-w-xl text-ink-soft">
          Öppna ett ärende. Stegen kommer från de åtgärder du väljer — inte från en påhittad motor.
          Kunden kan få en hub-länk utan konto.
        </p>
      </header>

      {!session?.org ? (
        <SignInGate next="/tyra" title="Logga in för att öppna ärenden">
          TYRA använder PIXDRIFT-sessionen. Ingen separat verkstadslogin.
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
              <CheckField name="quote" label="Förbered offert" />
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
                  <CaseRow key={item.id} item={item} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <Notice>
        Slice 1 från TYRA-repot (`cursor/tyra-instrument-ui-06e9`). Ingen leverantörsgateway, ingen
        cron, ingen Fortnox.
      </Notice>
    </AppShell>
  );
}
