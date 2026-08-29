/**
 * Self-service pricing. You register, pick modules, and an invoice is issued
 * with ten days to pay. Cheap on purpose: the platform should carry itself,
 * not chase margins. Kansli and the platform chrome are always included.
 *
 * Like buying a desktop-software subscription, but simpler: no meetings,
 * no demos, no sales call. Pay the invoice and everything keeps working.
 */

export const SELLABLE_MODULES = [
  "ekonomi",
  "tyra",
  "irma",
  "tora",
  "rita",
  "creditae",
  "britt",
  "alva",
] as const;

export type SellableModule = (typeof SELLABLE_MODULES)[number];

export const MODULE_PRICING: Record<
  SellableModule,
  { label: string; blurb: string; monthlyNetOre: number }
> = {
  ekonomi: { label: "Ekonomi", blurb: "bokföring, faktura och betalningar", monthlyNetOre: 34_900 },
  tyra: { label: "TYRA", blurb: "däckhotell och kundkort", monthlyNetOre: 34_900 },
  irma: { label: "IRMA", blurb: "digitala avtal", monthlyNetOre: 24_900 },
  tora: { label: "TORA", blurb: "upphandlingar", monthlyNetOre: 24_900 },
  rita: { label: "RITA", blurb: "skatteanalys", monthlyNetOre: 24_900 },
  creditae: { label: "CREDITAE", blurb: "motpartsbedömning", monthlyNetOre: 24_900 },
  britt: { label: "BRITT", blurb: "inkorg och uppföljning", monthlyNetOre: 14_900 },
  alva: { label: "ALVA", blurb: "ärenden och kontroller", monthlyNetOre: 14_900 },
};

/** Everything, capped. Never pay more than this per month. */
export const ALL_MODULES_MONTHLY_NET_ORE = 99_000;
export const ALL_MODULES_LABEL = "Hela Pixdrift — alla moduler";

export const PAYMENT_DAYS = 10;
export const VAT_RATE_BPS = 2500;

/**
 * One year, ten instalments. You pay for ten months and get twelve. All ten
 * invoices are issued at registration; the first is due in ten days, the rest
 * every thirty days after.
 */
export const YEAR_INSTALMENTS = 10;
export const INSTALMENT_INTERVAL_DAYS = 30;

export function instalmentDueDays(part: number): number {
  if (!Number.isInteger(part) || part < 1 || part > YEAR_INSTALMENTS) {
    throw new Error(`The instalment must be 1–${YEAR_INSTALMENTS}.`);
  }
  return PAYMENT_DAYS + (part - 1) * INSTALMENT_INTERVAL_DAYS;
}

export function moduleLine(id: SellableModule): string {
  const entry = MODULE_PRICING[id];
  return `${entry.label} — ${entry.blurb}`;
}

/** Whole kronor stay whole; anything else shows exact öre. Money is never rounded away. */
export function kronor(ore: number): string {
  const wholeKronor = ore % 100 === 0;
  return `${(ore / 100).toLocaleString("sv-SE", {
    minimumFractionDigits: wholeKronor ? 0 : 2,
    maximumFractionDigits: 2,
  })} kr`;
}

export function parseModules(values: unknown[]): SellableModule[] {
  const allowed = new Set<string>(SELLABLE_MODULES);
  const out: SellableModule[] = [];
  for (const value of values) {
    const key = String(value ?? "").trim();
    if (allowed.has(key) && !out.includes(key as SellableModule)) out.push(key as SellableModule);
  }
  return out;
}

export interface PricedOrder {
  /** What the customer gets. The cap upgrades to every module. */
  modules: SellableModule[];
  /** True when the all-modules cap kicked in. */
  capped: boolean;
  monthlyNetOre: number;
  lines: { description: string; quantity: number; unitNetOre: number }[];
}

/**
 * Price a selection. If the module sum reaches the all-modules cap, the
 * customer is upgraded to everything and pays the cap — never more.
 */
export function priceOrder(selected: SellableModule[]): PricedOrder {
  if (selected.length === 0) throw new Error("Pick at least one module.");
  const sum = selected.reduce((acc, id) => acc + MODULE_PRICING[id].monthlyNetOre, 0);
  if (sum >= ALL_MODULES_MONTHLY_NET_ORE) {
    return {
      modules: [...SELLABLE_MODULES],
      capped: true,
      monthlyNetOre: ALL_MODULES_MONTHLY_NET_ORE,
      lines: [
        {
          description: `${ALL_MODULES_LABEL}, månad 1`,
          quantity: 1,
          unitNetOre: ALL_MODULES_MONTHLY_NET_ORE,
        },
      ],
    };
  }
  return {
    modules: selected,
    capped: false,
    monthlyNetOre: sum,
    lines: selected.map((id) => ({
      description: `${moduleLine(id)}, månad 1`,
      quantity: 1,
      unitNetOre: MODULE_PRICING[id].monthlyNetOre,
    })),
  };
}

/** Net öre for the whole year: ten instalments at the monthly price. */
export function yearNetOre(order: PricedOrder): number {
  return order.monthlyNetOre * YEAR_INSTALMENTS;
}

function specDate(base: Date, days: number): string {
  return new Date(base.getTime() + days * 86_400_000).toISOString().slice(0, 10);
}

/**
 * The detailed order specification attached to every instalment invoice.
 * The invoices themselves are one-row invoices; this is the full picture.
 */
export function orderSpecification(
  order: PricedOrder,
  input: {
    companyName: string;
    orgNumber?: string | null;
    contactName: string;
    contactEmail: string;
    registeredAt: Date;
  },
): string {
  const registered = input.registeredAt.toISOString().slice(0, 10);
  const yearEnd = specDate(input.registeredAt, 365);
  const gross = (ore: number) => kronor(ore + Math.round((ore * VAT_RATE_BPS) / 10_000));
  const lines: string[] = [
    "ORDERSPECIFIKATION — PIXDRIFT",
    "",
    `Kund: ${input.companyName}${input.orgNumber ? ` (${input.orgNumber})` : ""}`,
    `Kontakt: ${input.contactName} · ${input.contactEmail}`,
    `Registrerad: ${registered}`,
    `Avtalsperiod: 12 månader, ${registered} – ${yearEnd}`,
    "",
    "MODULER",
    ...(order.capped
      ? [
          `${ALL_MODULES_LABEL} · ${kronor(ALL_MODULES_MONTHLY_NET_ORE)}/mån exkl. moms`,
          ...order.modules.map((id) => `${moduleLine(id)} · ingår`),
        ]
      : order.modules.map(
          (id) => `${moduleLine(id)} · ${kronor(MODULE_PRICING[id].monthlyNetOre)}/mån exkl. moms`,
        )),
    "Kansli och plattformen ingår utan kostnad.",
    "",
    "PRIS",
    `Månadspris: ${kronor(order.monthlyNetOre)} exkl. moms (${gross(order.monthlyNetOre)} inkl. moms)`,
    `År: ${YEAR_INSTALMENTS} betalningar för 12 månader — ${kronor(yearNetOre(order))} exkl. moms (${gross(yearNetOre(order))} inkl. moms)`,
    "",
    `BETALPLAN — ${YEAR_INSTALMENTS} fakturor, utställda samtidigt`,
    ...Array.from({ length: YEAR_INSTALMENTS }, (_, index) => {
      const part = index + 1;
      return `Del ${part} av ${YEAR_INSTALMENTS}: ${gross(order.monthlyNetOre)} inkl. moms · förfaller ${specDate(input.registeredAt, instalmentDueDays(part))}`;
    }),
    "",
    "VILLKOR",
    "Betald faktura i tid — allt fortsätter fungera. Förfaller en faktura obetald",
    "pausas rummen tills den är betald. Inget raderas.",
    "Inga live-leverantörspriser, ingen kvalificerad e-signatur, ingen Visma eller Fortnox.",
  ];
  return lines.join("\n");
}
