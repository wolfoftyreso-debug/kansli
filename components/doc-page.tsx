import type { ReactNode } from "react";

export function DocPage({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <main id="main">
      <section className="border-b border-line">
        <div className="mx-auto max-w-[760px] px-6 py-16 site:px-10 site:py-[104px]">
          <span className="eyebrow text-teal">{eyebrow}</span>
          <h1 className="headline mt-5 mb-5 max-w-[20ch]">{title}</h1>
          <p className="intro">{lead}</p>
        </div>
      </section>
      <section className="border-b border-line">
        <div className="mx-auto max-w-[760px] px-6 py-16 site:px-10 site:py-20">
          {children}
        </div>
      </section>
    </main>
  );
}

export function DocHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-12 mb-4 text-[26px] font-semibold tracking-[-0.015em] first:mt-0">
      {children}
    </h2>
  );
}

export function DocText({ children }: { children: ReactNode }) {
  return <p className="mt-0 mb-5 text-[16px] leading-[1.7] text-muted">{children}</p>;
}

export function DocList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mb-6 list-disc space-y-2 pl-5 text-[16px] leading-[1.7] text-muted">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
