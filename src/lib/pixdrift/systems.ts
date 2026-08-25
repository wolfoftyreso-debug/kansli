/**
 * The PIXDRIFT systems catalog — a single structured source reused by the
 * homepage, the systems index, product pages, search, metadata and (later)
 * documentation and APIs. Content is never hardcoded into components.
 *
 * Truthfulness rule: descriptions stay at a level supported by what actually
 * exists. Where a system is still in development, its status says so and detail
 * sections read "forthcoming" rather than inventing capabilities.
 */

export type SystemStatus = "Operational" | "Development" | "Pilot";
export type Region = "Europe" | "United States" | "Global";

/**
 * The three possible outcomes for anything PIXDRIFT builds (doctrine §4).
 * Software becomes a MANAGED_PRODUCT only when PIXDRIFT is prepared to take
 * operational responsibility for it (hosting, security, support, lifecycle).
 */
export type Stewardship = "INTERNAL" | "OPEN_SOURCE" | "MANAGED_PRODUCT";

export const STEWARDSHIP_LABEL: Record<Stewardship, string> = {
  INTERNAL: "Internal",
  OPEN_SOURCE: "Open source",
  MANAGED_PRODUCT: "Managed product",
};

export interface SystemSection {
  /** Standardized product-page section id, e.g. "01". */
  no: string;
  title: string;
  /** Prose paragraphs; empty array renders a "forthcoming" note. */
  body: string[];
}

export interface PixSystem {
  /** Portfolio index, e.g. "01". */
  index: string;
  slug: string;
  name: string;
  /** One precise sentence. */
  purpose: string;
  category: string;
  status: SystemStatus;
  /** Which of the three outcomes this system is (doctrine §4). */
  stewardship: Stewardship;
  regions: Region[];
  /** Short summary for cards/metadata. */
  summary: string;
  /** Standardized sections 01–10 (Purpose … Availability). */
  sections: SystemSection[];
}

const sharedIdentityIntegration =
  "Samma inloggning som de andra systemen. Ni loggar in en gång. Produkterna delar inte varandras användarlistor.";

function forthcoming(no: string, title: string): SystemSection {
  return { no, title, body: [] };
}

export const systems: PixSystem[] = [
  {
    index: "01",
    slug: "identity",
    name: "PIXDRIFT Identity",
    purpose: "En inloggning till alla system.",
    stewardship: "MANAGED_PRODUCT",
    category: "Inloggning",
    status: "Operational",
    regions: ["Europe", "United States"],
    summary: "Logga in en gång. Sedan är du inne i Kansli, TORA, RITA och de andra.",
    sections: [
      {
        no: "01",
        title: "Purpose",
        body: ["En inloggning till alla system, så ni inte loggar in om och om igen."],
      },
      {
        no: "02",
        title: "Problem",
        body: ["Varje system får egna konton. Folk loggar in om och om igen, och lösenord sprids."],
      },
      {
        no: "03",
        title: "System",
        body: [
          "Egen inloggning. Du loggar in en gång. De andra systemen litar på den inloggningen.",
        ],
      },
      {
        no: "04",
        title: "How it works",
        body: [
          "Ett system kan kolla att du är inloggad, men inte logga in någon annan i ditt namn.",
        ],
      },
      {
        no: "05",
        title: "Architecture",
        body: [
          "Användare och bolag ligger i en egen databas. Nycklar byts. Produkterna delar inte listan.",
        ],
      },
      forthcoming("06", "Applications"),
      {
        no: "07",
        title: "Integrations",
        body: [
          "Alla andra system kopplar hit. Ett nytt system läggs till utan att inloggningen byggs om.",
        ],
      },
      {
        no: "08",
        title: "Security",
        body: ["Inloggningen är en gång. Hemligheter skickas inte mellan systemen."],
      },
      {
        no: "09",
        title: "Documentation",
        body: ["Teknisk text under Dokumentation → System → Identity."],
      },
      {
        no: "10",
        title: "Availability",
        body: ["Igång. Europa och USA."],
      },
    ],
  },
  {
    index: "02",
    slug: "alva",
    name: "ALVA",
    purpose: "Kundens fel, anteckningar och mätvärden. Diagnosen kommer senare.",
    stewardship: "MANAGED_PRODUCT",
    category: "Verkstad",
    status: "Development",
    regions: ["Europe"],
    summary:
      "Tar emot vad kunden sa, vad ni antecknade och vad som mättes. Ställer ingen diagnos själv.",
    sections: [
      {
        no: "01",
        title: "Purpose",
        body: [
          "Tar emot kundens fel, anteckningar och mätvärden. Diagnosen kopplas in senare. Systemet ställer ingen diagnos och ger inget råd.",
        ],
      },
      {
        no: "02",
        title: "Problem",
        body: [
          "Kundens fel sitter i huvudet och i lappar. Det som sagts och mätts går inte att följa senare.",
        ],
      },
      {
        no: "03",
        title: "System",
        body: ["Ett ärende per kundfel: anteckningar och mätvärden. Ingen diagnos från systemet."],
      },
      forthcoming("04", "How it works"),
      forthcoming("05", "Architecture"),
      forthcoming("06", "Applications"),
      { no: "07", title: "Integrations", body: [sharedIdentityIntegration] },
      forthcoming("08", "Security"),
      {
        no: "09",
        title: "Documentation",
        body: ["Skrivs när diagnosen är inkopplad."],
      },
      { no: "10", title: "Availability", body: ["Inte klart än. Europa."] },
    ],
  },
  {
    index: "03",
    slug: "rita",
    name: "RITA",
    purpose: "Letar skattebesparingar i era böcker.",
    stewardship: "MANAGED_PRODUCT",
    category: "Skatt",
    status: "Development",
    regions: ["Europe"],
    summary:
      "Läser bokslutet mot svenska skatteregler och lämnar förslag att kolla. Inte skatteråd.",
    sections: [
      {
        no: "01",
        title: "Purpose",
        body: [
          "Letar skattebesparingar i era böcker: avdrag, moms och andra luckor. Förslagen är att kolla — inte skatteråd.",
        ],
      },
      forthcoming("02", "Problem"),
      forthcoming("03", "System"),
      forthcoming("04", "How it works"),
      forthcoming("05", "Architecture"),
      forthcoming("06", "Applications"),
      { no: "07", title: "Integrations", body: [sharedIdentityIntegration] },
      forthcoming("08", "Security"),
      { no: "09", title: "Documentation", body: ["Skrivs när mer av produkten är klar."] },
      { no: "10", title: "Availability", body: ["Inte klart än. Europa."] },
    ],
  },
  {
    index: "04",
    slug: "tora",
    name: "TORA",
    purpose: "Vilka upphandlingar just ert bolag kan ta.",
    stewardship: "MANAGED_PRODUCT",
    category: "Upphandling",
    status: "Pilot",
    regions: ["Europe"],
    summary:
      "Jämför bolaget mot upphandlingarna: krav, luckor, belopp, datum och nästa steg. Inte RITA.",
    sections: [
      {
        no: "01",
        title: "Purpose",
        body: [
          "Visa vilka upphandlingar just ert bolag kan lämna anbud på — och varför. Krav, luckor och nästa steg.",
        ],
      },
      {
        no: "02",
        title: "Problem",
        body: [
          "Bolaget lägger tid på upphandlingar de inte kan ta, eller missar dem de kan ta. Kraven, datumen och nästa steg sitter i olika huvuden.",
        ],
      },
      {
        no: "03",
        title: "System",
        body: [
          "Jämför bolagsprofilen mot upphandlingarna. Visar krav, luckor, belopp och vad ni ska göra nu. RITA tittar i räkenskaperna. TORA gör det inte.",
        ],
      },
      {
        no: "04",
        title: "How it works",
        body: [
          "Bolaget läggs mot upphandlingarna. Ni får en bedömning och ett nästa steg, inte en juridisk slutsats.",
        ],
      },
      {
        no: "05",
        title: "Architecture",
        body: [
          "TORA räknar i samma sajt. Uppgifterna är TORAs. Inloggningen är densamma som i de andra systemen.",
        ],
      },
      {
        no: "06",
        title: "Applications",
        body: ["Finns under /tora. Upphandlingarna i demon är exempel."],
      },
      { no: "07", title: "Integrations", body: [sharedIdentityIntegration] },
      {
        no: "08",
        title: "Security",
        body: ["Bedömningen räknas på servern. Exempeldata är märkt som exempel."],
      },
      {
        no: "09",
        title: "Documentation",
        body: ["Kör TORA i navet för att se hur det fungerar."],
      },
      { no: "10", title: "Availability", body: ["På väg. Europa."] },
    ],
  },
  {
    index: "05",
    slug: "irma",
    name: "IRMA",
    purpose: "Skicka ett avtal, se om det är läst och bekräftat.",
    stewardship: "MANAGED_PRODUCT",
    category: "Avtal",
    status: "Development",
    regions: ["Europe"],
    summary: "Skickar avtalet. Visar om det är öppnat, signerat eller avvisat.",
    sections: [
      {
        no: "01",
        title: "Purpose",
        body: [
          "Skicka ett avtal med en länk. Motparten läser och bekräftar. Ni ser var avtalet är.",
        ],
      },
      forthcoming("02", "Problem"),
      forthcoming("03", "System"),
      forthcoming("04", "How it works"),
      forthcoming("05", "Architecture"),
      forthcoming("06", "Applications"),
      { no: "07", title: "Integrations", body: [sharedIdentityIntegration] },
      forthcoming("08", "Security"),
      { no: "09", title: "Documentation", body: ["Skrivs när mer av produkten är klar."] },
      { no: "10", title: "Availability", body: ["Inte klart än. Europa."] },
    ],
  },
  {
    index: "06",
    slug: "britt",
    name: "BRITT",
    purpose: "Det som hänt och behöver följas upp.",
    stewardship: "MANAGED_PRODUCT",
    category: "Uppföljning",
    status: "Development",
    regions: ["Europe"],
    summary: "Samlar saker som måste följas upp. En sak i taget, med nästa steg.",
    sections: [
      {
        no: "01",
        title: "Purpose",
        body: [
          "Samlar det som redan hänt och behöver en uppföljning. Inte ett ärendesystem och inte en chatt.",
        ],
      },
      forthcoming("02", "Problem"),
      forthcoming("03", "System"),
      forthcoming("04", "How it works"),
      forthcoming("05", "Architecture"),
      forthcoming("06", "Applications"),
      { no: "07", title: "Integrations", body: [sharedIdentityIntegration] },
      forthcoming("08", "Security"),
      { no: "09", title: "Documentation", body: ["Skrivs när mer av produkten är klar."] },
      { no: "10", title: "Availability", body: ["Inte klart än. Europa."] },
    ],
  },
  {
    index: "07",
    slug: "tyra",
    name: "TYRA",
    purpose: "Kund, bil, hjul och vad som ska göras härnäst.",
    stewardship: "MANAGED_PRODUCT",
    category: "Däckhotell",
    status: "Development",
    regions: ["Europe"],
    summary: "Håller ihop kund, fordon och däck. Visar när det är dags att byta eller hämta.",
    sections: [
      {
        no: "01",
        title: "Purpose",
        body: [
          "Håller ihop kund, bil och hjul, och visar vad som ska göras härnäst. Inte ett allmänt kundregister.",
        ],
      },
      {
        no: "02",
        title: "Problem",
        body: [
          "Kund, bil och hjul sitter i lappar, SMS och huvudet. Kunden ser sällan samma sak som verkstaden.",
        ],
      },
      {
        no: "03",
        title: "System",
        body: [
          "Kund, fordon, ärende och en kundlänk. Offert och live-priser är inte inkopplade än.",
        ],
      },
      forthcoming("04", "How it works"),
      forthcoming("05", "Architecture"),
      forthcoming("06", "Applications"),
      { no: "07", title: "Integrations", body: [sharedIdentityIntegration] },
      forthcoming("08", "Security"),
      { no: "09", title: "Documentation", body: ["Kör TYRA i navet för att se hur det fungerar."] },
      { no: "10", title: "Availability", body: ["På väg. Europa."] },
    ],
  },
  {
    index: "08",
    slug: "ekonomi",
    name: "Ekonomi",
    purpose: "Fakturor, moms och hur pengarna kom in.",
    stewardship: "MANAGED_PRODUCT",
    category: "Ekonomi",
    status: "Development",
    regions: ["Europe"],
    summary:
      "Skriver faktura, bokför moms och matchar inbetalningar när banken är ansluten. Ingen påhittad inbetalning.",
    sections: [
      {
        no: "01",
        title: "Purpose",
        body: [
          "Fakturor, moms och hur pengarna kom in. De andra systemen lägger sina fakturor här.",
        ],
      },
      {
        no: "02",
        title: "Problem",
        body: [
          "Pengarna sitter i Fortnox, Swish-bilder och huvudet. Momsen och inbetalningen möts inte.",
        ],
      },
      {
        no: "03",
        title: "System",
        body: [
          "Faktura i öre, moms och koppling till Stripe och Revolut. Ingen påhittad inbetalning.",
        ],
      },
      forthcoming("04", "How it works"),
      forthcoming("05", "Architecture"),
      forthcoming("06", "Applications"),
      { no: "07", title: "Integrations", body: [sharedIdentityIntegration] },
      forthcoming("08", "Security"),
      {
        no: "09",
        title: "Documentation",
        body: ["Kör Ekonomi i navet för att se hur det fungerar."],
      },
      {
        no: "10",
        title: "Availability",
        body: ["På väg. Europa. Kort och Swish kräver att de är inkopplade."],
      },
    ],
  },
];

export function getSystem(slug: string): PixSystem | undefined {
  return systems.find((s) => s.slug === slug);
}

export const STATUS_COLOR_VAR: Record<SystemStatus, string> = {
  Operational: "var(--color-status-operational)",
  Development: "var(--color-status-development)",
  Pilot: "var(--color-status-pilot)",
};
