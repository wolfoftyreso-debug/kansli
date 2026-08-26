"use client";

export function ListenUnderlag({ src, available }: { src: string; available: boolean }) {
  if (!available) return null;
  return (
    <section className="flex flex-col gap-2">
      <p className="text-sm text-ink-soft">Lyssna på underlaget</p>
      <audio className="w-full" controls preload="none" src={src}>
        Din webbläsare kan inte spela upp ljud.
      </audio>
    </section>
  );
}
