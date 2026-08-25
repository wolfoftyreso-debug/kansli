import type { CompanyBriefing } from "@/lib/tora/briefing";

export function CompanyBriefingCard({ briefing }: { briefing: CompanyBriefing }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4">
      <div>
        <p className="pd-label text-faint">Ert bolag</p>
        <h2 className="mt-1 text-lg font-semibold">{briefing.name}</h2>
        <p className="mt-1 text-sm text-ink-soft">{briefing.headline}</p>
      </div>
      {briefing.facts.length > 0 ? (
        <dl className="grid gap-3 sm:grid-cols-2">
          {briefing.facts.map((fact) => (
            <div key={fact.label}>
              <dt className="pd-label text-faint">{fact.label}</dt>
              <dd className="mt-1 text-sm">{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {briefing.frameworks.length > 0 ? (
        <div>
          <p className="pd-label text-faint">Avtal ni redan är med på</p>
          <ul className="mt-2 flex flex-col gap-2">
            {briefing.frameworks.map((item) => (
              <li key={item.title} className="text-sm">
                <p className="font-medium">{item.title}</p>
                <p className="text-ink-soft">
                  {item.buyer} · {item.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {briefing.references.length > 0 ? (
        <div>
          <p className="pd-label text-faint">Referenser TORA räknar med</p>
          <ul className="mt-2 flex flex-col gap-2">
            {briefing.references.map((item) => (
              <li key={item.customer} className="text-sm">
                <p className="font-medium">{item.customer}</p>
                {item.detail ? <p className="text-ink-soft">{item.detail}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
