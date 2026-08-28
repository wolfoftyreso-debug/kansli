"use client";

export function ListenUnderlag({
  src,
  available,
  listenLabel,
  unsupportedLabel,
}: {
  src: string;
  available: boolean;
  listenLabel: string;
  unsupportedLabel: string;
}) {
  if (!available) return null;
  return (
    <section className="flex flex-col gap-2">
      <p className="text-sm text-ink-soft">{listenLabel}</p>
      <audio className="w-full" controls preload="none" src={src}>
        {unsupportedLabel}
      </audio>
    </section>
  );
}
