import { footerGrain } from "@/lib/footer-grain";

/** Hairline SVG rule under the copyright line. Geometry only — not selectable text. */
export function FooterGrain() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      role="presentation"
      width={footerGrain.width}
      height={footerGrain.height}
      viewBox={`-1 -1 ${footerGrain.width + 2} ${footerGrain.height + 2}`}
      preserveAspectRatio="xMinYMid meet"
      className="pointer-events-none mt-5 block h-2 w-full max-w-md select-none text-subtle"
    >
      <path d={footerGrain.d} fill="currentColor" />
    </svg>
  );
}
