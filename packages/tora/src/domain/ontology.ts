/**
 * TORA — ontology.
 *
 * This file is the datamodel. Whatever storage sits behind it (Postgres today,
 * possibly a graph engine later) must express these entities and relations, not
 * the other way around.
 *
 * Two rules run through every type here:
 *  1. An unknown fact is `undefined`, never a zero or a false. The engines must
 *     be able to tell "we know it is 0" from "we do not know".
 *  2. Anything the system asserts about the outside world carries a `SourceRef`
 *     so a user can check the claim against the document it came from.
 */

/** ISO-8601 calendar date, `YYYY-MM-DD`. */
export type IsoDate = string;

/** Where a fact came from. Required on every externally-derived assertion. */
export interface SourceRef {
  /** Human-readable document name, e.g. "Administrativa föreskrifter AF 3.2". */
  document: string;
  /** Clause / section reference within the document. */
  section?: string;
  url?: string;
  /** When this reference was last checked against the source. */
  retrievedAt?: IsoDate;
}

/* ------------------------------------------------------------------ */
/* Geography                                                           */
/* ------------------------------------------------------------------ */

/** SCB kommun-/länskod, e.g. "0138" (Tyresö) or "01" (Stockholms län). */
export type AreaCode = string;

export interface Area {
  code: AreaCode;
  name: string;
  kind: "municipality" | "county" | "country";
  /** Containing area, e.g. Tyresö -> Stockholms län. */
  parent?: AreaCode;
}

/* ------------------------------------------------------------------ */
/* Capability                                                          */
/* ------------------------------------------------------------------ */

/**
 * What a company can actually do, and what a procurement actually asks for.
 * Deliberately separate from CPV: CPV is how the buyer classified the notice,
 * capability is what the work is. Matching on CPV alone misses opportunities
 * that were filed under a neighbouring code.
 */
export type CapabilityCode = string;

export interface Capability {
  code: CapabilityCode;
  label: string;
  /** CPV codes that commonly carry this capability. Used for recall, not proof. */
  cpvCodes: string[];
  /**
   * Capabilities that follow from holding this one — a firm doing `el.entreprenad`
   * can also do `el.installation`.
   *
   * This runs one way only. It widens what a *company* can reach; it must never
   * be used to widen what a *contract* covers, or a charging-infrastructure
   * framework would appear to lock up all electrical work in the municipality.
   */
  implies?: CapabilityCode[];
}

export type CertificationCode = string;

export interface Certification {
  code: CertificationCode;
  label: string;
  /** Issuing or supervising body, e.g. "Elsäkerhetsverket". */
  issuer?: string;
  /** Roughly how long it takes to obtain, used to judge whether a gap is closable. */
  typicalLeadTimeDays?: number;
}

/** Registrations a buyer routinely checks, e.g. F-skatt or VAT registration. */
export type RegistrationCode = "f_tax" | "vat" | "employer" | string;

/* ------------------------------------------------------------------ */
/* Company                                                             */
/* ------------------------------------------------------------------ */

export interface CompanyReference {
  id: string;
  /** Who the work was delivered to. */
  customerName: string;
  /** Whether the customer is a public buyer — some requirements demand this. */
  customerIsPublic?: boolean;
  capabilities: CapabilityCode[];
  /** Contract value of the referenced assignment. */
  valueSek?: number;
  completedAt?: IsoDate;
  areas?: AreaCode[];
}

export interface Company {
  id: string;
  name: string;
  orgNumber?: string;
  /** Headcount. `undefined` means not stated, which is not the same as 0. */
  employees?: number;
  annualRevenueSek?: number;
  /** Areas the company is willing and able to serve. */
  servesAreas: AreaCode[];
  capabilities: CapabilityCode[];
  cpvCodes?: string[];
  certifications: CertificationCode[];
  references: CompanyReference[];
  registrations: RegistrationCode[];
  insurance?: {
    liabilityCoverSek?: number;
  };
  /** Suppliers the company can bring in to close a capacity or capability gap. */
  subcontractorCapabilities?: CapabilityCode[];
  /**
   * Whether the company can lean on another entity's economic or technical
   * capacity — a parent company, a consortium partner, a committed subcontractor.
   *
   * Tri-state on purpose. `undefined` means the question was never asked, and a
   * large capacity gap then resolves to `unknown` rather than `unmet`: saying
   * "this is not a viable route" about an arrangement we never enquired about
   * is an assertion the data does not support. A backtest caught the engine
   * doing exactly that to a firm that had won on precisely such an arrangement.
   */
  canRelyOnExternalCapacity?: boolean;
}

/* ------------------------------------------------------------------ */
/* Organization (the demand side)                                      */
/* ------------------------------------------------------------------ */

export type OrganizationKind =
  | "municipality"
  | "region"
  | "authority"
  | "police"
  | "emergency_service"
  | "ambulance"
  | "municipal_company"
  | "regional_company"
  | "procurement_centre";

export interface Organization {
  id: string;
  name: string;
  orgNumber?: string;
  kind: OrganizationKind;
  /** Areas the organization buys for. */
  operatesIn: AreaCode[];
  /** Owning municipality/region for municipal and regional companies. */
  parentOrganizationId?: string;
  /**
   * Procurement centres this organization has authorised to buy on its behalf.
   * A live framework at the centre can block a direct route to the organization.
   */
  affiliatedProcurementCentreIds?: string[];
}

/* ------------------------------------------------------------------ */
/* Regulation                                                          */
/* ------------------------------------------------------------------ */

/** LOU, LUF, LUFS, LUK — the regime that governs a given purchase. */
export type RegulationCode = "LOU" | "LUF" | "LUFS" | "LUK";

/* ------------------------------------------------------------------ */
/* Requirements                                                        */
/* ------------------------------------------------------------------ */

export type RequirementKind =
  | "revenue"
  | "employees"
  | "certification"
  | "reference"
  | "geography"
  | "insurance"
  | "registration"
  | "capability"
  | "document"
  | "other";

interface RequirementBase {
  id: string;
  label: string;
  /**
   * Mandatory (ska-krav) requirements exclude a bid when unmet. Non-mandatory
   * ones (bör-krav / evaluation criteria) only affect the score.
   */
  mandatory: boolean;
  source: SourceRef;
}

/**
 * Beviset för att kravlistan är läst.
 *
 * En upphandling utan krav i databasen kan betyda två helt olika saker: att
 * underlaget är läst och inte ställer några kvalificeringskrav, eller att ingen
 * har läst det. Skillnaden avgör om `requirements: []` betyder *inga krav* eller
 * *okända krav*, och utan den blir en oläst upphandling till ett godkännande.
 *
 * Fältet är avsiktligt ett objekt och inte en flagga. Ett påstående om att
 * kraven är lästa är i sig ett påstående om verkligheten, och lyder under samma
 * regel som alla andra: det bär sin källa.
 */
export interface RequirementsExtraction {
  /** Dokumentet kraven lästes ur. */
  source: SourceRef;
  /**
   * `manual` — en människa har läst underlaget.
   * `automated` — en maskin har tolkat det.
   */
  method: "manual" | "automated";
  extractedAt: IsoDate;
  /**
   * Sant när en människa har granskat en maskinell tolkning. En automatisk
   * extraktion är evidens, inte en garanti, och skillnaden ska synas.
   */
  reviewed?: boolean;
}

export type Requirement =
  | (RequirementBase & { kind: "revenue"; minAnnualRevenueSek: number })
  | (RequirementBase & { kind: "employees"; minEmployees: number })
  | (RequirementBase & { kind: "certification"; certification: CertificationCode })
  | (RequirementBase & {
      kind: "reference";
      count: number;
      withinYears: number;
      capability?: CapabilityCode;
      minValueSek?: number;
      mustBePublicCustomer?: boolean;
    })
  | (RequirementBase & { kind: "geography"; areas: AreaCode[] })
  | (RequirementBase & { kind: "insurance"; minLiabilityCoverSek: number })
  | (RequirementBase & { kind: "registration"; registration: RegistrationCode })
  | (RequirementBase & { kind: "capability"; capability: CapabilityCode })
  | (RequirementBase & { kind: "document"; documentType: string })
  | (RequirementBase & { kind: "other"; description: string });

/* ------------------------------------------------------------------ */
/* Evaluation                                                          */
/* ------------------------------------------------------------------ */

export interface EvaluationCriterion {
  name: string;
  weightPct: number;
}

/**
 * Hur ett anbudspris blir poäng — eller ett jämförbart värde.
 *
 * Det här är den halva av utvärderingen som avgör om något går att räkna på.
 * "Pris 60 %" säger vad priset *väger*, inte hur kronor blir poäng, och utan
 * det andra går det inte att komma från ett pris till ett utfall. Två anbud med
 * samma pris och samma vikt får olika poäng under relativ modell och linjär
 * modell, och skillnaden kan vara det som avgör tilldelningen.
 *
 * Modellerna nedan är de som faktiskt förekommer i svenska förfrågningsunderlag.
 * Är köparens modell någon annan — eller bara inte utläst ur underlaget — ska
 * fältet utelämnas. Motorn svarar då `unknown` och säger vad som saknas, i
 * stället för att anta den vanligaste och presentera en siffra som ser exakt ut.
 */
export type PriceEvaluationModel =
  /** Lägsta pris vinner. Ingen poängsättning sker; kvalitet är enbart skallkrav. */
  | { kind: "lowest_price_wins" }
  /**
   * Prispoäng i förhållande till det lägsta inkomna anbudet:
   * `poäng = maxPoints × lägstaPris / egetPris`.
   *
   * Beror på de andra anbudsgivarna och går därför inte att räkna på i förväg
   * utan ett antagande om lägsta pris — ett antagande användaren gör, inte
   * systemet.
   */
  | { kind: "relative_to_lowest"; maxPoints: number }
  /**
   * Prispoäng faller linjärt från `maxPoints` vid `bestPriceSek` till noll vid
   * `worstPriceSek`. Köparen har satt båda gränserna i underlaget, så modellen
   * går att räkna på utan att veta något om konkurrenterna.
   */
  | { kind: "linear_between"; maxPoints: number; bestPriceSek: number; worstPriceSek: number }
  /**
   * Mervärdesmodell: kvalitetspoäng räknas om till kronor och dras av från
   * anbudspriset. Det som jämförs är `utvärderingspris`, inte anbudspriset —
   * en skillnad som gör att ett dyrare anbud kan vinna, och som är hela skälet
   * att räkna på den.
   */
  | { kind: "quality_as_deduction"; sekPerQualityPoint: number }
  /** Köparen har fastställt priset; endast kvalitet utvärderas. */
  | { kind: "fixed_price"; priceSek: number };

export interface EvaluationModel {
  kind: "lowest_price" | "best_price_quality_ratio" | "fixed_price_best_quality";
  criteria: EvaluationCriterion[];
  /**
   * Saknas fältet är prissättningens matematik inte känd, och motorn räknar
   * inte. Se `PriceEvaluationModel`.
   */
  priceModel?: PriceEvaluationModel;
  /** Högsta möjliga kvalitetspoäng, när underlaget anger den. */
  qualityPointsMax?: number;
  source?: SourceRef;
}

/* ------------------------------------------------------------------ */
/* Procurement                                                         */
/* ------------------------------------------------------------------ */

export type ProcedureKind =
  | "open"
  | "selective"
  | "negotiated"
  | "simplified"
  | "direct_award"
  | "framework_call_off"
  | "dynamic_purchasing_system"
  | "concession";

export type ProcurementStatus =
  | "predicted"
  | "planned"
  | "market_dialogue"
  | "announced"
  | "closed"
  | "awarded"
  | "under_review"
  | "cancelled";

export interface Procurement {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  cpvCodes: string[];
  capabilities: CapabilityCode[];
  areas: AreaCode[];
  regulation: RegulationCode;
  procedure: ProcedureKind;
  status: ProcurementStatus;
  estimatedValueSek?: number;
  announcedAt?: IsoDate;
  /** Last day to submit a bid. */
  deadlineAt?: IsoDate;
  /** For a DPS: applications are accepted until this date. */
  admissionOpenUntil?: IsoDate;
  contractStart?: IsoDate;
  contractEnd?: IsoDate;
  requirements: Requirement[];
  /**
   * Saknas fältet är listan ovan inte känt fullständig, och motorn får inte
   * påstå att företaget uppfyller kraven. Se `RequirementsExtraction`.
   */
  requirementsExtraction?: RequirementsExtraction;
  evaluation?: EvaluationModel;
  /** The contract this procurement replaces, when known. */
  predecessorContractId?: string;
  sources: SourceRef[];
}

/* ------------------------------------------------------------------ */
/* Contract                                                            */
/* ------------------------------------------------------------------ */

export interface ContractOption {
  /** Length of the extension, in months. */
  extensionMonths: number;
  /**
   * `true` exercised, `false` declined, `undefined` not yet decided.
   * The tri-state matters: an undecided option is exactly the uncertainty a
   * lifecycle prediction has to expose rather than average away.
   */
  exercised?: boolean;
}

export interface FrameworkRanking {
  supplierId: string;
  supplierName?: string;
  /** 1 = first in line under a ranked call-off model. */
  rank: number;
}

export type CallOffMethod = "rank" | "renewed_competition" | "direct_assignment";

export interface Contract {
  id: string;
  organizationId: string;
  title: string;
  supplierId?: string;
  supplierName?: string;
  capabilities: CapabilityCode[];
  cpvCodes: string[];
  areas: AreaCode[];
  startDate: IsoDate;
  endDate: IsoDate;
  options: ContractOption[];
  valueSek?: number;
  procurementId?: string;
  /** Set when the contract is a framework agreement rather than a single contract. */
  isFramework?: boolean;
  frameworkRankings?: FrameworkRanking[];
  callOffMethod?: CallOffMethod;
  sources: SourceRef[];
}

/* ------------------------------------------------------------------ */
/* Awards and history                                                  */
/* ------------------------------------------------------------------ */

export interface Award {
  id: string;
  procurementId: string;
  supplierId?: string;
  supplierName: string;
  awardedAt: IsoDate;
  valueSek?: number;
  /** Total number of bids received, when published. */
  bidCount?: number;
  /** Whether the award was challenged in court. */
  underReview?: boolean;
  sources: SourceRef[];
}

/* ------------------------------------------------------------------ */
/* The knowledge base                                                  */
/* ------------------------------------------------------------------ */

/**
 * The full graph the engines read from. In production this is materialised per
 * query from Postgres; the in-memory shape is identical so the engines are
 * storage-agnostic and directly testable.
 */
export interface ProcurementGraph {
  areas: Area[];
  capabilities: Capability[];
  certifications: Certification[];
  organizations: Organization[];
  procurements: Procurement[];
  contracts: Contract[];
  awards: Award[];
}

/* ------------------------------------------------------------------ */
/* Small lookup helpers                                                */
/* ------------------------------------------------------------------ */

export function indexBy<T, K extends string>(items: T[], key: (item: T) => K): Map<K, T> {
  return new Map(items.map((item) => [key(item), item]));
}

/** Every area code that contains `code`, including `code` itself. */
export function areaLineage(areas: Area[], code: AreaCode): AreaCode[] {
  const byCode = indexBy(areas, (a) => a.code);
  const lineage: AreaCode[] = [];
  let current = byCode.get(code);
  while (current) {
    lineage.push(current.code);
    current = current.parent ? byCode.get(current.parent) : undefined;
  }
  return lineage;
}

/**
 * True when a company serving `served` can serve work located in `required`.
 * Serving a county implies serving its municipalities, but not the reverse —
 * serving Tyresö says nothing about ability to serve the whole county.
 */
export function areaCovers(areas: Area[], served: AreaCode[], required: AreaCode[]): boolean {
  const servedSet = new Set(served);
  return required.some((code) => areaLineage(areas, code).some((ancestor) => servedSet.has(ancestor)));
}

/**
 * Expands capabilities to themselves plus everything they imply.
 * Only valid on the supply side — see the note on `Capability.implies`.
 */
export function expandCapabilities(
  capabilities: Capability[],
  codes: CapabilityCode[],
): Set<CapabilityCode> {
  const byCode = indexBy(capabilities, (c) => c.code);
  const out = new Set<CapabilityCode>();
  const visit = (code: CapabilityCode) => {
    if (out.has(code)) return;
    out.add(code);
    byCode.get(code)?.implies?.forEach(visit);
  };
  codes.forEach(visit);
  return out;
}

/** Days between two ISO dates, positive when `to` is after `from`. */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/** Adds whole months to an ISO date, clamping to the end of the target month. */
export function addMonths(date: IsoDate, months: number): IsoDate {
  const [y, m, d] = date.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}
