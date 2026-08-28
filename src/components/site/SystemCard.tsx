import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";
import type { PixSystem } from "@/lib/pixdrift/systems";
import { RegionIndicator, StatusIndicator } from "./indicators";

export function SystemCard({ system, locale }: { system: PixSystem; locale: Locale }) {
  return (
    <Link
      href={`/systems/${system.slug}`}
      className="group flex flex-col justify-between gap-8 border border-line bg-surface p-6 transition-colors hover:border-line-strong focus-visible:border-accent"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <span className="pd-label">System {system.index}</span>
          <StatusIndicator status={system.status} />
        </div>
        <h3 className="text-xl font-semibold tracking-tight text-ink">{system.name}</h3>
        <p className="text-ink-soft">{system.purpose}</p>
      </div>
      <div className="flex flex-col gap-3">
        <hr className="pd-hr" />
        <div className="flex items-center justify-between">
          <span className="pd-label">{system.category}</span>
          <RegionIndicator regions={system.regions} />
        </div>
        <span className="text-sm font-medium text-ink">{t(locale, "site.systems.open")}</span>
      </div>
    </Link>
  );
}
