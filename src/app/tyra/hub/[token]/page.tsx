import { notFound } from "next/navigation";
import { StatusBanner } from "@/components/tyra/Status";
import { TaskRow } from "@/components/tyra/Rows";
import { tryRuntime } from "@/lib/platform/page";
import { getHubViewByToken } from "@/lib/tyra/hub";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Däckstatus",
  description: "Kundvy via verkstadslänk. Inget konto krävs.",
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

      <StatusBanner tone="neutral">{view.commercialNote}</StatusBanner>

      {view.storageCode ? (
        <p className="text-sm text-ink-soft">
          Lagerplats {view.storageCode}
          {view.wheelStatus ? ` · ${view.wheelStatus}` : ""}
        </p>
      ) : (
        <p className="text-sm text-muted">Ingen lagerplats är sparad ännu.</p>
      )}

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
            <li key={position.position}>
              <TaskRow
                headline={
                  [position.tyre.brand, position.tyre.model, position.tyre.dimension]
                    .filter(Boolean)
                    .join(" ") || "Däckuppgifter saknas"
                }
                subtitle={
                  position.health.treadDepthMm != null
                    ? `Mönsterdjup ${position.health.treadDepthMm.toFixed(1)} mm`
                    : position.health.label
                }
                status={{
                  tone: "neutral",
                  label: `${position.position} · ${position.health.label}`,
                }}
              />
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
