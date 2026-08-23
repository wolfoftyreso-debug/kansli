import { STATUS_COLOR_VAR, type Region, type SystemStatus } from "@/lib/pixdrift/systems";

export function StatusIndicator({ status }: { status: SystemStatus }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className="inline-block h-2 w-2"
        style={{ backgroundColor: STATUS_COLOR_VAR[status] }}
      />
      <span className="pd-label" style={{ color: STATUS_COLOR_VAR[status] }}>
        {status}
      </span>
    </span>
  );
}

export function RegionIndicator({ regions }: { regions: Region[] }) {
  return <span className="pd-label">{regions.join(" · ")}</span>;
}
