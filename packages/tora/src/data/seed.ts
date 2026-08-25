/**
 * Seed dataset — a small, realistic slice of the Stockholm public market.
 *
 * This is demonstration data, not harvested data. It is shaped so that every
 * verdict path in the engines is reachable from one company profile, because a
 * demo that only ever produces green cards would hide the parts of the product
 * that matter most: the framework that locks you out, and the question the data
 * cannot answer.
 *
 * Organizations, contracts, values and suppliers here are illustrative. Nothing
 * in this file should be presented to a user as a fact about a real buyer.
 */

import type {
  Area,
  Award,
  Capability,
  Certification,
  Company,
  Contract,
  IsoDate,
  Organization,
  Procurement,
  ProcurementGraph,
  RequirementsExtraction,
  SourceRef,
} from "../domain/ontology";

/** Fixed evaluation date so the demo and its tests stay reproducible. */
export const DEMO_TODAY: IsoDate = "2026-08-10";

const DEMO_SOURCE: SourceRef = {
  document: "Demonstrationsdata — TORA",
  section: "seed.ts",
};

/**
 * Kravlistorna nedan är fullständiga för de påhittade upphandlingar de hör till.
 *
 * Utan det påståendet svarar motorn `UNKNOWN` på allt, och det vore fel här av
 * exakt samma skäl som det är rätt för en verklig oläst upphandling: här *är*
 * kravlistan hela sanningen, eftersom den skrevs samtidigt som upphandlingen.
 *
 * Att posten är påhittad döljs inte av detta — den bär `DEMO_SOURCE` hela vägen,
 * och intyget är påhittat i precis samma mån som upphandlingen är det. Vad det
 * inte får bli är en genväg: en inhämtad post får aldrig ärva ett sådant här
 * intyg, den ska bära ett som beskriver hur just den lästes.
 */
const DEMO_EXTRACTION: RequirementsExtraction = {
  source: DEMO_SOURCE,
  method: "manual",
  extractedAt: "2026-08-01",
};

/* ------------------------------------------------------------------ */
/* Geography                                                           */
/* ------------------------------------------------------------------ */

export const areas: Area[] = [
  { code: "00", name: "Sverige", kind: "country" },
  { code: "01", name: "Stockholms län", kind: "county", parent: "00" },
  { code: "0138", name: "Tyresö", kind: "municipality", parent: "01" },
  { code: "0182", name: "Nacka", kind: "municipality", parent: "01" },
  { code: "0136", name: "Haninge", kind: "municipality", parent: "01" },
  { code: "0180", name: "Stockholm", kind: "municipality", parent: "01" },
];

/* ------------------------------------------------------------------ */
/* Capabilities and certifications                                     */
/* ------------------------------------------------------------------ */

export const capabilities: Capability[] = [
  { code: "el.installation", label: "Elinstallation", cpvCodes: ["45311000", "45310000"] },
  { code: "el.service", label: "Elservice och underhåll", cpvCodes: ["50711000"] },
  {
    code: "el.entreprenad",
    label: "Elentreprenad",
    cpvCodes: ["45310000"],
    implies: ["el.installation"],
  },
  {
    code: "el.laddinfra",
    label: "Laddinfrastruktur",
    cpvCodes: ["31681500", "45316000"],
    implies: ["el.installation"],
  },
  {
    code: "el.fastighet",
    label: "Fastighetsel och drift",
    cpvCodes: ["50711000", "71314100"],
    implies: ["el.service"],
  },
  { code: "el.reservkraft", label: "Reservkraft och UPS", cpvCodes: ["31121000"] },
  {
    code: "el.belysning",
    label: "Belysning och armaturer",
    cpvCodes: ["31520000"],
    implies: ["el.installation"],
  },
];

export const certifications: Certification[] = [
  {
    code: "auktorisation_a",
    label: "Elinstallatörsauktorisation A",
    issuer: "Elsäkerhetsverket",
    typicalLeadTimeDays: 120,
  },
  { code: "iso9001", label: "ISO 9001", typicalLeadTimeDays: 180 },
  { code: "iso14001", label: "ISO 14001", typicalLeadTimeDays: 180 },
  { code: "sbsc_larm", label: "SBSC-behörighet larm", typicalLeadTimeDays: 90 },
];

/* ------------------------------------------------------------------ */
/* Organizations                                                       */
/* ------------------------------------------------------------------ */

export const organizations: Organization[] = [
  {
    id: "org:tyreso",
    name: "Tyresö kommun",
    kind: "municipality",
    operatesIn: ["0138"],
    // The affiliation is what makes the charging-infrastructure lock-out below
    // visible. Without it the system would confidently point a company at work
    // that is already routed through a national framework.
    affiliatedProcurementCentreIds: ["org:inkopscentral"],
  },
  { id: "org:nacka", name: "Nacka kommun", kind: "municipality", operatesIn: ["0182"] },
  { id: "org:haninge", name: "Haninge kommun", kind: "municipality", operatesIn: ["0136"] },
  { id: "org:region", name: "Region Stockholm", kind: "region", operatesIn: ["01"] },
  {
    id: "org:tyresobostader",
    name: "Tyresö Bostäder AB",
    kind: "municipal_company",
    operatesIn: ["0138"],
    parentOrganizationId: "org:tyreso",
  },
  {
    id: "org:inkopscentral",
    name: "Inköpscentralen Syd (demo)",
    kind: "procurement_centre",
    operatesIn: ["00"],
  },
];

/* ------------------------------------------------------------------ */
/* The demo company                                                    */
/* ------------------------------------------------------------------ */

export const demoCompany: Company = {
  id: "comp:tyresoel",
  name: "Tyresö El & Installation AB",
  employees: 5,
  annualRevenueSek: 8_000_000,
  servesAreas: ["0138", "0182", "0136"],
  capabilities: ["el.installation", "el.service", "el.fastighet", "el.laddinfra"],
  cpvCodes: ["45311000", "50711000"],
  certifications: ["auktorisation_a", "iso9001"],
  registrations: ["f_tax", "vat"],
  insurance: { liabilityCoverSek: 10_000_000 },
  subcontractorCapabilities: ["el.reservkraft"],
  // Fristående femmansföretag utan koncern eller konsortiepartner. Att frågan
  // är besvarad är vad som gör ett definitivt nej möjligt — hade den varit
  // obesvarad skulle motorn svara "okänt" i stället, vilket är hela poängen.
  canRelyOnExternalCapacity: false,
  references: [
    {
      id: "ref:tyreso-skola",
      customerName: "Tyresö kommun",
      customerIsPublic: true,
      capabilities: ["el.service", "el.installation"],
      valueSek: 850_000,
      completedAt: "2025-06-30",
      areas: ["0138"],
    },
    {
      id: "ref:brf-sjohojden",
      customerName: "Brf Sjöhöjden",
      customerIsPublic: false,
      capabilities: ["el.installation"],
      valueSek: 420_000,
      completedAt: "2024-11-15",
      areas: ["0138"],
    },
    {
      id: "ref:tyresobostader",
      customerName: "Tyresö Bostäder AB",
      customerIsPublic: true,
      capabilities: ["el.fastighet", "el.service"],
      valueSek: 1_200_000,
      completedAt: "2026-02-28",
      areas: ["0138"],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Contracts                                                           */
/* ------------------------------------------------------------------ */

export const contracts: Contract[] = [
  // The company is rank 1 here — the one situation in this dataset that can
  // legitimately produce a RIGHT verdict.
  {
    id: "contract:tyresobostader-fastighetsel",
    organizationId: "org:tyresobostader",
    title: "Ramavtal fastighetsel och elservice 2024–2027",
    capabilities: ["el.fastighet", "el.service"],
    cpvCodes: ["50711000"],
    areas: ["0138"],
    startDate: "2024-04-01",
    endDate: "2027-03-31",
    options: [{ extensionMonths: 12 }],
    valueSek: 4_200_000,
    isFramework: true,
    callOffMethod: "rank",
    frameworkRankings: [
      { supplierId: "comp:tyresoel", supplierName: "Tyresö El & Installation AB", rank: 1 },
      { supplierId: "sup:riks", supplierName: "Rikselektriska AB", rank: 2 },
    ],
    sources: [DEMO_SOURCE],
  },

  // Incumbent held by someone else, expiring inside the planning horizon. This
  // is the "start preparing now" case the product exists for.
  {
    id: "contract:tyreso-elservice",
    organizationId: "org:tyreso",
    title: "Ramavtal elservice 2023–2027",
    supplierId: "sup:riks",
    supplierName: "Rikselektriska AB",
    capabilities: ["el.service", "el.installation"],
    cpvCodes: ["50711000", "45311000"],
    areas: ["0138"],
    startDate: "2023-01-01",
    endDate: "2027-06-30",
    options: [{ extensionMonths: 12 }],
    valueSek: 9_600_000,
    isFramework: true,
    callOffMethod: "rank",
    frameworkRankings: [{ supplierId: "sup:riks", supplierName: "Rikselektriska AB", rank: 1 }],
    sources: [DEMO_SOURCE],
  },

  // Expired predecessors. Invisible as constraints, but they are what establish
  // that this buyer re-procures on a four-year rhythm. Two of them, because one
  // gap is a single observation and the lifecycle engine will not call that a
  // rhythm — Tyresö Bostäder below is left thin on purpose so the UI shows both
  // the well-evidenced and the weakly-evidenced case.
  {
    id: "contract:tyreso-elservice-2015",
    organizationId: "org:tyreso",
    title: "Ramavtal elservice 2015–2018",
    supplierId: "sup:elteam",
    supplierName: "ElTeam Stockholm AB",
    capabilities: ["el.service", "el.installation"],
    cpvCodes: ["50711000"],
    areas: ["0138"],
    startDate: "2015-01-01",
    endDate: "2018-12-31",
    options: [],
    valueSek: 5_800_000,
    sources: [DEMO_SOURCE],
  },
  {
    id: "contract:tyreso-elservice-2019",
    organizationId: "org:tyreso",
    title: "Ramavtal elservice 2019–2022",
    supplierId: "sup:elteam",
    supplierName: "ElTeam Stockholm AB",
    capabilities: ["el.service", "el.installation"],
    cpvCodes: ["50711000"],
    areas: ["0138"],
    startDate: "2019-01-01",
    endDate: "2022-12-31",
    options: [],
    valueSek: 7_100_000,
    sources: [DEMO_SOURCE],
  },

  // A national framework at the procurement centre. Tyresö buys charging
  // infrastructure through it, so a local firm cannot reach that work at all
  // until 2028 — regardless of how well qualified it is.
  {
    id: "contract:central-laddinfra",
    organizationId: "org:inkopscentral",
    title: "Ramavtal laddinfrastruktur 2025–2028",
    capabilities: ["el.laddinfra"],
    cpvCodes: ["31681500"],
    areas: ["00"],
    startDate: "2025-06-01",
    endDate: "2028-05-31",
    options: [{ extensionMonths: 24 }],
    valueSek: 180_000_000,
    isFramework: true,
    callOffMethod: "renewed_competition",
    frameworkRankings: [
      { supplierId: "sup:charge", supplierName: "Charge Nordic AB", rank: 1 },
      { supplierId: "sup:storel", supplierName: "Storel Entreprenad AB", rank: 2 },
    ],
    sources: [DEMO_SOURCE],
  },

  {
    id: "contract:tyreso-laddinfra-pilot",
    organizationId: "org:tyreso",
    title: "Avtal laddstolpar pilotprojekt",
    supplierId: "sup:charge",
    supplierName: "Charge Nordic AB",
    capabilities: ["el.laddinfra"],
    cpvCodes: ["31681500"],
    areas: ["0138"],
    startDate: "2024-09-01",
    endDate: "2027-02-28",
    options: [],
    valueSek: 1_400_000,
    sources: [DEMO_SOURCE],
  },
];

/* ------------------------------------------------------------------ */
/* Procurements                                                        */
/* ------------------------------------------------------------------ */

export const procurements: Procurement[] = [
  // Ett konkret avrop under det ramavtal där företaget är rangordnat etta.
  //
  // Det här är den enda situation i datasetet som får bli RÄTTIGHET, och den är
  // avsiktligt ett *avrop* och inte en prognos. Skillnaden är hela regeln:
  // rangordningen styr vem det här köpet ska riktas till, och den säger
  // ingenting om nästa upphandling. Tidigare kom det blå kortet i stället upp på
  // den förväntade efterträdaren — en rättighet till något som inte var
  // annonserat.
  //
  // Kraven är få med flit. Ett avrop mot ett gällande ramavtal prövar inte om
  // leverantören är kvalificerad; det gjordes när ramavtalet upphandlades.
  {
    id: "proc:tyresobostader-avrop-hiss",
    organizationId: "org:tyresobostader",
    title: "Avrop: elarbeten vid hissrenovering Granängsringen",
    description:
      "Avrop mot gällande ramavtal för fastighetsel. Kraftmatning och styrning i samband med " +
      "hissrenovering i tre trapphus.",
    cpvCodes: ["50711000"],
    capabilities: ["el.fastighet"],
    areas: ["0138"],
    regulation: "LOU",
    procedure: "framework_call_off",
    status: "planned",
    estimatedValueSek: 380_000,
    contractStart: "2026-10-01",
    contractEnd: "2027-03-31",
    requirementsExtraction: DEMO_EXTRACTION,
    requirements: [
      {
        id: "req:avrop-hiss:auktorisation",
        kind: "certification",
        label: "Elinstallatörsauktorisation A",
        mandatory: true,
        certification: "auktorisation_a",
        source: { document: "Avropsförfrågan", section: "2.2 Behörighet" },
      },
    ],
    sources: [DEMO_SOURCE],
  },

  // Announced, open, qualified except for two closable gaps -> POSSIBLE.
  {
    id: "proc:nacka-elservice",
    organizationId: "org:nacka",
    title: "Ramavtal elservice och elinstallation 2027–2030",
    description:
      "Löpande elservice, felavhjälpning och mindre installationsarbeten för kommunens fastigheter.",
    cpvCodes: ["50711000", "45311000"],
    capabilities: ["el.service", "el.installation"],
    areas: ["0182"],
    regulation: "LOU",
    procedure: "open",
    status: "announced",
    estimatedValueSek: 14_000_000,
    announcedAt: "2026-07-15",
    deadlineAt: "2026-09-18",
    contractStart: "2027-01-01",
    contractEnd: "2030-12-31",
    evaluation: {
      kind: "best_price_quality_ratio",
      criteria: [
        { name: "Pris", weightPct: 60 },
        { name: "Kvalitet och organisation", weightPct: 30 },
        { name: "Miljö", weightPct: 10 },
      ],
      source: DEMO_SOURCE,
    },
    requirementsExtraction: DEMO_EXTRACTION,
    requirements: [
      {
        id: "req:nacka:revenue",
        kind: "revenue",
        label: "Årsomsättning minst 6 MSEK",
        mandatory: true,
        minAnnualRevenueSek: 6_000_000,
        source: { document: "Anbudsinbjudan", section: "4.2 Ekonomisk ställning" },
      },
      {
        id: "req:nacka:employees",
        kind: "employees",
        label: "Minst 3 anställda elektriker",
        mandatory: true,
        minEmployees: 3,
        source: { document: "Anbudsinbjudan", section: "4.3 Teknisk kapacitet" },
      },
      {
        id: "req:nacka:auktorisation",
        kind: "certification",
        label: "Elinstallatörsauktorisation A",
        mandatory: true,
        certification: "auktorisation_a",
        source: { document: "Anbudsinbjudan", section: "4.4 Behörighet" },
      },
      {
        id: "req:nacka:iso14001",
        kind: "certification",
        label: "Certifierat miljöledningssystem (ISO 14001)",
        mandatory: true,
        certification: "iso14001",
        source: { document: "Anbudsinbjudan", section: "4.6 Miljöledning" },
      },
      {
        id: "req:nacka:references",
        kind: "reference",
        label: "Två referensuppdrag hos offentlig kund",
        mandatory: true,
        count: 2,
        withinYears: 3,
        capability: "el.service",
        minValueSek: 500_000,
        mustBePublicCustomer: true,
        source: { document: "Anbudsinbjudan", section: "4.5 Referensuppdrag" },
      },
      {
        id: "req:nacka:geography",
        kind: "geography",
        label: "Inställelse inom Nacka kommun",
        mandatory: true,
        areas: ["0182"],
        source: { document: "Kravspecifikation", section: "2.1 Inställelsetid" },
      },
      {
        id: "req:nacka:insurance",
        kind: "insurance",
        label: "Ansvarsförsäkring minst 10 MSEK",
        mandatory: true,
        minLiabilityCoverSek: 10_000_000,
        source: { document: "Avtalsvillkor", section: "9 Försäkring" },
      },
      {
        id: "req:nacka:ftax",
        kind: "registration",
        label: "Registrerad för F-skatt",
        mandatory: true,
        registration: "f_tax",
        source: { document: "Anbudsinbjudan", section: "4.1 Uteslutningsgrunder" },
      },
      {
        id: "req:nacka:sanningsforsakran",
        kind: "document",
        label: "Sanningsförsäkran",
        mandatory: true,
        documentType: "Undertecknad sanningsförsäkran",
        source: { document: "Anbudsinbjudan", section: "5.2 Bilagor" },
      },
      {
        id: "req:nacka:beredskap",
        kind: "other",
        label: "Beredskapsorganisation dygnet runt",
        mandatory: true,
        description:
          "Anbudsgivaren ska beskriva sin beredskapsorganisation för akuta fel utanför kontorstid.",
        source: { document: "Kravspecifikation", section: "3.4 Beredskap" },
      },
    ],
    sources: [DEMO_SOURCE],
  },

  // DPS with an open admission window and requirements the company meets
  // outright -> ELIGIBLE. This is the realistic way in for a small supplier.
  {
    id: "proc:region-dis-laddinfra",
    organizationId: "org:region",
    title: "Dynamiskt inköpssystem — laddinfrastruktur Södertörn",
    description:
      "Löpande antagning av leverantörer för installation och service av laddpunkter i södra länet.",
    cpvCodes: ["31681500", "45316000"],
    capabilities: ["el.laddinfra"],
    areas: ["0138", "0182", "0136"],
    regulation: "LOU",
    procedure: "dynamic_purchasing_system",
    status: "announced",
    announcedAt: "2026-03-01",
    admissionOpenUntil: "2030-12-31",
    requirementsExtraction: DEMO_EXTRACTION,
    requirements: [
      {
        id: "req:dis:auktorisation",
        kind: "certification",
        label: "Elinstallatörsauktorisation A",
        mandatory: true,
        certification: "auktorisation_a",
        source: { document: "Ansökningsinbjudan DIS", section: "3.1" },
      },
      {
        id: "req:dis:capability",
        kind: "capability",
        label: "Installation av laddinfrastruktur",
        mandatory: true,
        capability: "el.laddinfra",
        source: { document: "Ansökningsinbjudan DIS", section: "2.1 Omfattning" },
      },
      {
        id: "req:dis:geography",
        kind: "geography",
        label: "Leverans inom Södertörn",
        mandatory: true,
        areas: ["0138", "0182", "0136"],
        source: { document: "Ansökningsinbjudan DIS", section: "2.2 Geografi" },
      },
      {
        id: "req:dis:insurance",
        kind: "insurance",
        label: "Ansvarsförsäkring minst 5 MSEK",
        mandatory: true,
        minLiabilityCoverSek: 5_000_000,
        source: { document: "Ansökningsinbjudan DIS", section: "3.4" },
      },
      {
        id: "req:dis:ftax",
        kind: "registration",
        label: "Registrerad för F-skatt",
        mandatory: true,
        registration: "f_tax",
        source: { document: "Ansökningsinbjudan DIS", section: "3.2" },
      },
    ],
    sources: [DEMO_SOURCE],
  },

  // Below the direct-award ceiling. The company qualifies, but the decision is
  // the buyer's — the verdict must never read as an entitlement.
  {
    id: "proc:haninge-forskola",
    organizationId: "org:haninge",
    title: "Elarbeten ombyggnad förskola Vega",
    description: "Mindre elinstallationsarbeten i samband med ombyggnad.",
    cpvCodes: ["45311000"],
    capabilities: ["el.installation"],
    areas: ["0136"],
    regulation: "LOU",
    procedure: "direct_award",
    status: "announced",
    estimatedValueSek: 450_000,
    announcedAt: "2026-08-01",
    deadlineAt: "2026-08-28",
    evaluation: {
      kind: "best_price_quality_ratio",
      criteria: [
        { name: "Pris", weightPct: 70 },
        { name: "Kvalitet och bemanning", weightPct: 30 },
      ],
      // Mervärdesmodell: kvalitetspoängen räknas om till kronor och dras av från
      // anbudspriset, så det som jämförs är utvärderingspriset. Därför kan ett
      // dyrare anbud vinna — och det är inget en anbudsgivare ser i huvudet.
      priceModel: { kind: "quality_as_deduction", sekPerQualityPoint: 12_000 },
      qualityPointsMax: 20,
      source: DEMO_SOURCE,
    },
    requirementsExtraction: DEMO_EXTRACTION,
    requirements: [
      {
        id: "req:haninge:auktorisation",
        kind: "certification",
        label: "Elinstallatörsauktorisation A",
        mandatory: true,
        certification: "auktorisation_a",
        source: { document: "Förfrågan", section: "2" },
      },
      {
        id: "req:haninge:ftax",
        kind: "registration",
        label: "Registrerad för F-skatt",
        mandatory: true,
        registration: "f_tax",
        source: { document: "Förfrågan", section: "3" },
      },
      {
        id: "req:haninge:geography",
        kind: "geography",
        label: "Arbete utförs i Haninge",
        mandatory: true,
        areas: ["0136"],
        source: { document: "Förfrågan", section: "1" },
      },
    ],
    sources: [DEMO_SOURCE],
  },

  // Qualified, announced, decided in open competition -> COMPETITIVE.
  //
  // Den vanligaste verkliga situationen, och den som saknades. Datasetet påstod
  // sig nå varje utfall och nådde fem av sex: `COMPETITIVE` fanns i README:s
  // tabell och i motorn, men aldrig i demon. Utan den läser sidan som om
  // systemet antingen ger dig något eller stänger dig ute, medan svaret oftast
  // är "du får vara med och slåss om det".
  //
  // Kraven är sådana företaget faktiskt uppfyller — inga profilluckor, inga
  // åtgärder. Det är vad som skiljer det här kortet från `proc:nacka-elservice`,
  // som fastnar på OKÄNT för att profilen inte svarar på allt.
  {
    id: "proc:tyreso-belysning",
    organizationId: "org:tyreso",
    title: "Byte av belysning i kommunens idrottshallar",
    description:
      "Utbyte till LED-armaturer i fem idrottshallar, inklusive styrning och närvarodetektering.",
    cpvCodes: ["45311000", "31520000"],
    capabilities: ["el.installation"],
    areas: ["0138"],
    regulation: "LOU",
    procedure: "open",
    status: "announced",
    estimatedValueSek: 2_400_000,
    announcedAt: "2026-07-28",
    deadlineAt: "2026-09-04",
    contractStart: "2026-11-01",
    contractEnd: "2027-06-30",
    evaluation: {
      kind: "lowest_price",
      criteria: [{ name: "Pris", weightPct: 100 }],
      priceModel: { kind: "lowest_price_wins" },
      source: DEMO_SOURCE,
    },
    requirementsExtraction: DEMO_EXTRACTION,
    requirements: [
      {
        id: "req:belysning:auktorisation",
        kind: "certification",
        label: "Elinstallatörsauktorisation A",
        mandatory: true,
        certification: "auktorisation_a",
        source: { document: "Anbudsinbjudan", section: "4.3 Behörighet" },
      },
      {
        id: "req:belysning:ftax",
        kind: "registration",
        label: "Registrerad för F-skatt",
        mandatory: true,
        registration: "f_tax",
        source: { document: "Anbudsinbjudan", section: "4.1 Uteslutningsgrunder" },
      },
      {
        id: "req:belysning:kapacitet",
        kind: "employees",
        label: "Minst 3 anställda",
        mandatory: true,
        minEmployees: 3,
        source: { document: "Anbudsinbjudan", section: "4.4 Teknisk kapacitet" },
      },
      {
        id: "req:belysning:referens",
        kind: "reference",
        label: "En referens från offentlig kund de senaste tre åren",
        mandatory: true,
        count: 1,
        withinYears: 3,
        capability: "el.installation",
        mustBePublicCustomer: true,
        source: { document: "Anbudsinbjudan", section: "4.5 Referensuppdrag" },
      },
      {
        id: "req:belysning:geography",
        kind: "geography",
        label: "Arbete utförs i Tyresö",
        mandatory: true,
        areas: ["0138"],
        source: { document: "Anbudsinbjudan", section: "1.2 Omfattning" },
      },
    ],
    sources: [DEMO_SOURCE],
  },

  // A requirement the company definitively fails -> NOT_ELIGIBLE, stated plainly
  // so no time is wasted on it.
  {
    id: "proc:region-reservkraft",
    organizationId: "org:region",
    title: "Reservkraft och UPS för sjukhusfastigheter",
    description: "Installation, service och beredskap för reservkraftanläggningar.",
    cpvCodes: ["31121000"],
    capabilities: ["el.reservkraft"],
    areas: ["0180", "0138"],
    regulation: "LOU",
    procedure: "open",
    status: "announced",
    estimatedValueSek: 62_000_000,
    announcedAt: "2026-06-20",
    deadlineAt: "2026-09-30",
    requirementsExtraction: DEMO_EXTRACTION,
    requirements: [
      {
        id: "req:reservkraft:revenue",
        kind: "revenue",
        label: "Årsomsättning minst 40 MSEK",
        mandatory: true,
        minAnnualRevenueSek: 40_000_000,
        source: { document: "Anbudsinbjudan", section: "4.2" },
      },
      {
        id: "req:reservkraft:capability",
        kind: "capability",
        label: "Egen kapacitet för reservkraft och UPS",
        mandatory: true,
        capability: "el.reservkraft",
        source: { document: "Kravspecifikation", section: "2.1" },
      },
      {
        id: "req:reservkraft:employees",
        kind: "employees",
        label: "Minst 25 anställda",
        mandatory: true,
        minEmployees: 25,
        source: { document: "Anbudsinbjudan", section: "4.3" },
      },
      {
        id: "req:reservkraft:geography",
        kind: "geography",
        label: "Inställelse i Stockholms kommun inom 2 timmar",
        mandatory: true,
        areas: ["0180"],
        source: { document: "Kravspecifikation", section: "3.1" },
      },
    ],
    sources: [DEMO_SOURCE],
  },

  /* --- History: feeds lead times, renewal rhythm and price intelligence --- */
  {
    id: "proc:hist:tyreso-2024",
    organizationId: "org:tyreso",
    title: "Ramavtal elservice 2025–2029 (historik)",
    cpvCodes: ["50711000"],
    capabilities: ["el.service"],
    areas: ["0138"],
    regulation: "LOU",
    procedure: "open",
    status: "awarded",
    announcedAt: "2024-09-02",
    deadlineAt: "2024-10-15",
    contractStart: "2025-03-01",
    estimatedValueSek: 3_200_000,
    requirements: [],
    sources: [DEMO_SOURCE],
  },
  {
    id: "proc:hist:tyreso-2022",
    organizationId: "org:tyreso",
    title: "Elinstallationer skolfastigheter (historik)",
    cpvCodes: ["45311000"],
    capabilities: ["el.installation"],
    areas: ["0138"],
    regulation: "LOU",
    procedure: "open",
    status: "awarded",
    announcedAt: "2022-03-14",
    deadlineAt: "2022-04-25",
    contractStart: "2022-09-01",
    estimatedValueSek: 2_750_000,
    requirements: [],
    sources: [DEMO_SOURCE],
  },
  {
    id: "proc:hist:tyreso-2018",
    organizationId: "org:tyreso",
    title: "Ramavtal elservice 2019–2022 (historik)",
    cpvCodes: ["50711000"],
    capabilities: ["el.service"],
    areas: ["0138"],
    regulation: "LOU",
    procedure: "open",
    status: "awarded",
    announcedAt: "2018-08-15",
    deadlineAt: "2018-09-28",
    contractStart: "2019-01-01",
    estimatedValueSek: 2_400_000,
    requirements: [],
    sources: [DEMO_SOURCE],
  },
  {
    id: "proc:hist:nacka-2023",
    organizationId: "org:nacka",
    title: "Elservice kommunala fastigheter (historik)",
    cpvCodes: ["50711000"],
    capabilities: ["el.service"],
    areas: ["0182"],
    regulation: "LOU",
    procedure: "open",
    status: "awarded",
    announcedAt: "2023-01-10",
    deadlineAt: "2023-02-20",
    contractStart: "2023-07-01",
    estimatedValueSek: 4_100_000,
    requirements: [],
    sources: [DEMO_SOURCE],
  },
  {
    id: "proc:hist:nacka-2021",
    organizationId: "org:nacka",
    title: "Elservice och jour (historik)",
    cpvCodes: ["50711000"],
    capabilities: ["el.service"],
    areas: ["0182"],
    regulation: "LOU",
    procedure: "open",
    status: "awarded",
    announcedAt: "2021-02-01",
    deadlineAt: "2021-03-15",
    contractStart: "2021-08-01",
    estimatedValueSek: 3_450_000,
    requirements: [],
    sources: [DEMO_SOURCE],
  },
  {
    id: "proc:hist:haninge-2023",
    organizationId: "org:haninge",
    title: "Elinstallation idrottshall (historik)",
    cpvCodes: ["45311000"],
    capabilities: ["el.installation"],
    areas: ["0136"],
    regulation: "LOU",
    procedure: "open",
    status: "awarded",
    announcedAt: "2023-04-03",
    deadlineAt: "2023-05-12",
    contractStart: "2023-09-01",
    estimatedValueSek: 5_600_000,
    requirements: [],
    sources: [DEMO_SOURCE],
  },
];

/* ------------------------------------------------------------------ */
/* Awards                                                              */
/* ------------------------------------------------------------------ */

export const awards: Award[] = [
  {
    id: "award:tyreso-2024",
    procurementId: "proc:hist:tyreso-2024",
    supplierId: "sup:riks",
    supplierName: "Rikselektriska AB",
    awardedAt: "2024-11-20",
    valueSek: 3_180_000,
    bidCount: 4,
    sources: [DEMO_SOURCE],
  },
  {
    id: "award:tyreso-2022",
    procurementId: "proc:hist:tyreso-2022",
    supplierId: "sup:storel",
    supplierName: "Storel Entreprenad AB",
    awardedAt: "2022-05-30",
    valueSek: 2_690_000,
    bidCount: 6,
    sources: [DEMO_SOURCE],
  },
  {
    id: "award:tyreso-2018",
    procurementId: "proc:hist:tyreso-2018",
    supplierId: "sup:elteam",
    supplierName: "ElTeam Stockholm AB",
    awardedAt: "2018-11-12",
    valueSek: 2_380_000,
    bidCount: 5,
    sources: [DEMO_SOURCE],
  },
  {
    id: "award:nacka-2023",
    procurementId: "proc:hist:nacka-2023",
    supplierId: "sup:riks",
    supplierName: "Rikselektriska AB",
    awardedAt: "2023-03-28",
    valueSek: 4_050_000,
    bidCount: 3,
    sources: [DEMO_SOURCE],
  },
  {
    id: "award:nacka-2021",
    procurementId: "proc:hist:nacka-2021",
    supplierId: "sup:elteam",
    supplierName: "ElTeam Stockholm AB",
    awardedAt: "2021-04-19",
    valueSek: 3_390_000,
    bidCount: 5,
    sources: [DEMO_SOURCE],
  },
  {
    id: "award:haninge-2023",
    procurementId: "proc:hist:haninge-2023",
    supplierId: "sup:storel",
    supplierName: "Storel Entreprenad AB",
    awardedAt: "2023-06-14",
    // Value withheld in the published decision — the coverage figure in the
    // price analysis has to reflect that rather than quietly dropping it.
    bidCount: 2,
    sources: [DEMO_SOURCE],
  },
];

/* ------------------------------------------------------------------ */

export const demoGraph: ProcurementGraph = {
  areas,
  capabilities,
  certifications,
  organizations,
  procurements,
  contracts,
  awards,
};
