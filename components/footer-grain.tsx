import { footerGrain } from "@/lib/footer-grain";

export function FooterGrain() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      role="presentation"
      viewBox={`-1 -1 ${footerGrain.width + 2} ${footerGrain.height + 2}`}
      className="pointer-events-none mt-5 block w-[min(100%,28rem)] select-none text-subtle/40"
    >
      <path d={footerGrain.d} fill="currentColor" />
    </svg>
  );
}
