import { notFound } from "next/navigation";
import { Notice } from "@/components/app/SignInGate";
import { tryRuntime } from "@/lib/platform/page";
import { getHubViewByToken } from "@/lib/tyra/hub";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Däckstatus — TYRA",
  description: "Kundvy via TYRA-länk. Inget konto krävs.",
  robots: { index: false, follow: false },
};

export default async function TyraHubPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const runtime = tryRuntime();
  if (!runtime) notFound();
  const view = await getHubViewByToken(runtime.pool, token);
  if (!view) notFound();

  const vehicleLabel = view.vehicle
    ? [view.vehicle.make, view.vehicle.model, view.vehicle.registrationNumber]
        .filter(Boolean)
        .join(" ")
    : "Inget fordon";

  return (
    <main className="mx-auto flex min-h-full w-full max-w-xl flex-col gap-8 bg-paper px-6 py-12 text-ink">
      <p className="pd-label text-faint">Kundhub</p>
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{view.customerName}</h1>
        <p className="text-ink-soft">{vehicleLabel}</p>
      </header>

      <Notice>{view.commercialNote}</Notice>

      {view.setWarnings.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {view.setWarnings.map((warning) => (
            <li key={warning.code} className="text-sm text-ink-soft">
              {warning.title}
              {warning.detail ? ` — ${warning.detail}` : ""}
            </li>
          ))}
        </ul>
      ) : null}

      {view.positions.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {view.positions.map((position) => (
            <li
              key={position.position}
              className="rounded-2xl border border-line bg-surface px-5 py-4"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-accent">
                {position.position} · {position.health.label}
              </p>
              <p className="mt-2 font-medium">
                {[position.tyre.brand, position.tyre.model, position.tyre.dimension]
                  .filter(Boolean)
                  .join(" ") || "Däckuppgifter saknas"}
              </p>
              {position.health.treadDepthMm != null ? (
                <p className="mt-1 text-sm text-ink-soft">
                  Mönsterdjup {position.health.treadDepthMm.toFixed(1)} mm
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="text-sm text-muted">
        Inget konto. Inga live-priser. Bara det verkstaden har verifierat.
      </p>
    </main>
  );
}
