import { PixelMark } from "./PixelMark";

/**
 * A restrained deterministic flow: inputs → PIXDRIFT → output. Technical, not
 * decorative — no AI brains, robots or glow. Renders horizontally on desktop and
 * stacks with a downward arrow on mobile.
 *
 *   <PixelFlow from="5 systems" to="1 decision" />
 */
function FlowArrow() {
  return (
    <span aria-hidden className="shrink-0 rotate-90 text-faint sm:rotate-0">
      →
    </span>
  );
}

export function PixelFlow({ from, to }: { from: string; to: string }) {
  return (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
      <div className="flex-1 border border-line-strong bg-surface px-4 py-5 text-center text-sm font-medium text-ink">
        {from}
      </div>
      <FlowArrow />
      <div className="flex items-center justify-center gap-2 border border-accent/40 bg-accent-soft px-4 py-5">
        <PixelMark size={16} />
        <span className="pd-label" style={{ color: "var(--color-accent)" }}>
          PIXDRIFT
        </span>
      </div>
      <FlowArrow />
      <div className="flex-1 border border-line-strong bg-surface px-4 py-5 text-center text-sm font-medium text-ink">
        {to}
      </div>
    </div>
  );
}
