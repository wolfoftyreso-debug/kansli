import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  intro,
  as = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  as?: "h1" | "h2" | "h3";
}) {
  const Title = as;
  return (
    <div className="flex flex-col gap-4">
      {eyebrow ? <p className="pd-label">{eyebrow}</p> : null}
      <Title
        className={
          as === "h1"
            ? "max-w-3xl text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
            : "max-w-3xl text-xl font-semibold tracking-tight text-ink"
        }
      >
        {title}
      </Title>
      {intro ? <p className="max-w-2xl text-sm text-ink-soft">{intro}</p> : null}
    </div>
  );
}
