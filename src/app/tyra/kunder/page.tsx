import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { EmptyState, SignInGate } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { tryRuntime } from "@/lib/platform/page";
import { listCases } from "@/lib/tyra/cases";
import { listCustomerCards } from "@/lib/tyra/hotel";

export const metadata = {
  title: "Kunder — TYRA",
  description: "Kundkort från TYRA-schemat. Ingen live-pris, ingen SMS-sändning.",
};

export default async function TyraCustomersPage() {
  const session = await readSession();
  const runtime = tryRuntime();
  const cards =
    session?.org?.ref && runtime ? await listCustomerCards(runtime.pool, session.org.ref) : [];
  const cases = session?.org?.ref && runtime ? await listCases(runtime.pool, session.org.ref) : [];

  return (
    <AppShell current="tyra" session={session}>
      <p className="pd-label text-faint">
        <Link href="/tyra" className="hover:text-ink">
          PIXDRIFT / TYRA
        </Link>
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">Kundkort</h1>
      <p className="max-w-xl text-ink-soft">
        Kunder, fordon och hjulset som faktiskt ligger i databasen. Nästa åtgärd är en heuristik —
        inte en live offert.
      </p>
      {!session?.org ? (
        <SignInGate next="/tyra/kunder" title="Logga in för att se kundkort">
          Kundkortet tillhör organisationen.
        </SignInGate>
      ) : cards.length === 0 ? (
        <EmptyState>Inga kunder ännu. Öppna ett ärende först.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {cards.map((card) => (
            <li key={card.customer.id} className="rounded-xl border border-line bg-surface p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-accent">
                {card.nextAction.label}
              </p>
              <p className="mt-2 text-lg font-medium">{card.customer.name}</p>
              <p className="text-sm text-ink-soft">
                {card.counts.vehicles} fordon · {card.counts.wheelSets} hjulset
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {card.vehicles.map((row) => (
                  <li key={row.vehicle.id} className="font-mono text-xs text-faint">
                    {row.vehicle.registrationNumber}
                    {row.vehicle.make ? ` · ${row.vehicle.make}` : ""}
                    {row.wheelSets.length > 0
                      ? ` · ${row.wheelSets
                          .map(
                            (ws) =>
                              `${ws.season} ${ws.storageStatus}${ws.storageCode ? ` ${ws.storageCode}` : ""}`,
                          )
                          .join(", ")}`
                      : " · inget hjulset"}
                  </li>
                ))}
              </ul>
              <ul className="mt-3 flex flex-col gap-1">
                {cases
                  .filter((item) => item.customerId === card.customer.id)
                  .map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/tyra/cases/${item.id}`}
                        className="text-sm underline decoration-line underline-offset-4 hover:text-ink"
                      >
                        {item.registrationNumber ?? "Ärende"} · {item.caseStatus}
                      </Link>
                    </li>
                  ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
