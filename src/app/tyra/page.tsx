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
import { TaskRow } from "@/components/tyra/Rows";
import { CASE_STATUS_LABELS, INTENT_LABELS, listCases } from "@/lib/tyra/cases";
import { createTyraCase } from "./actions";

export const metadata = {
  title: "TYRA — Pixdrift",
  description: "Däckärenden, arbetssteg och kundhub. Ingen NextAuth, ingen live-pris.",
};

function caseTone(status: string) {
  if (status === "DONE") return "good" as const;
  if (status === "BLOCKED") return "blocked" as const;
  if (status === "IN_PROGRESS") return "attention" as const;
  return "neutral" as const;
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="phone" label="Telefon (för påminnelse)" placeholder="+46…" />
              <Field name="email" label="E-post (för påminnelse)" placeholder="kund@exempel.se" />
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

      <Notice>
        Port från `cursor/tyra-instrument-ui-06e9`. Outbox kan köas. Utan sändadapter blir den
        BLOCKED, inte skickad. Ingen live-pris.
      </Notice>
    </AppShell>
  );
}
