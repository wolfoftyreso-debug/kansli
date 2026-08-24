const ROUTES: ReadonlyArray<{ prefix: string; href: (id: string) => string }> = [
  { prefix: "tyra:case:", href: (id) => `/tyra/cases/${id}` },
  { prefix: "rita:analysis:", href: (id) => `/rita/${id}` },
  { prefix: "irma:agreement:", href: (id) => `/irma/${id}` },
  { prefix: "alva:case:", href: (id) => `/alva/${id}` },
  { prefix: "tora:snapshot:", href: (id) => `/tora/${id}` },
  { prefix: "kansli:task:", href: () => "/kansli" },
  { prefix: "tyra:outbox:", href: () => "/tyra/integrations" },
  { prefix: "tyra:customer:", href: () => "/tyra/kunder" },
];

export function observationHref(subjectRef: string | null | undefined): string | null {
  if (!subjectRef) return null;
  for (const route of ROUTES) {
    if (subjectRef.startsWith(route.prefix)) {
      return route.href(subjectRef.slice(route.prefix.length));
    }
  }
  return null;
}

export const SOURCE_LABELS: Record<string, string> = {
  tora: "TORA — anbudsrätt",
  rita: "RITA — skattefynd",
  irma: "IRMA — avtal",
  tyra: "TYRA — däckhotell",
  alva: "ALVA — fallintag",
  kansli: "Kansli — intern uppgift",
  britt: "BRITT — egen anteckning",
};

export function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source.toUpperCase();
}
