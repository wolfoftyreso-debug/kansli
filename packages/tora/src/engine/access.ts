/**
 * Access engine — "har jag rätt till jobbet?"
 *
 * Separate from eligibility on purpose. Meeting the requirements and being able
 * to reach the work are different questions, and conflating them is what makes
 * ordinary procurement search useless: a company can be perfectly qualified for
 * a need that is locked inside somebody else's framework agreement for three
 * more years.
 *
 * This engine answers only the procedural half, and it is the one place allowed
 * to construct a `LegalBasis`.
 */

import {
  areaCovers,
  expandCapabilities,
  indexBy,
  type Company,
  type Contract,
  type IsoDate,
  type Organization,
  type Procurement,
  type ProcurementGraph,
} from "../domain/ontology";
import {
  DOCTRINE,
  directAwardThresholdFor,
  thresholdSettles,
  doctrineCaveat,
  unverifiedThresholdCaveat,
  type Caveat,
} from "../domain/regulations";
import type { AccessStatus, LegalBasis } from "../domain/verdicts";

export interface AccessResult {
  status: AccessStatus;
  /** Only ever set when `status === "granted"`. */
  legalBasis?: LegalBasis;
  /** Plain-language account of the procedural situation. */
  explanation: string;
  caveats: Caveat[];
  /** The contract routing this purchase, when one does. */
  governingContractId?: string;
}

export interface AccessContext {
  graph: ProcurementGraph;
  today: IsoDate;
}

/**
 * Finds a live contract that routes purchases of this kind for this buyer.
 *
 * Includes contracts held at an affiliated procurement centre — a municipality
 * that buys through SKL Kommentus is just as locked as one that signed the
 * framework itself, and missing that produces confidently wrong advice.
 */
export function findGoverningContract(
  organization: Organization,
  capabilities: string[],
  areas: string[],
  ctx: AccessContext,
): Contract | undefined {
  const buyerIds = new Set<string>([
    organization.id,
    ...(organization.affiliatedProcurementCentreIds ?? []),
  ]);
  // Raw intersection, not expanded. A contract covers what it says it covers.
  const wanted = new Set(capabilities);

  const candidates = ctx.graph.contracts.filter((contract) => {
    if (!buyerIds.has(contract.organizationId)) return false;
    if (contract.endDate < ctx.today) return false;
    if (contract.startDate > ctx.today) return false;
    if (!contract.capabilities.some((c) => wanted.has(c))) return false;
    return areaCovers(ctx.graph.areas, contract.areas, areas);
  });

  // When several contracts could route the purchase, the one running longest is
  // the binding constraint — that is the date the company actually has to plan
  // around. Sorting also keeps the result deterministic across graph orderings.
  return candidates.sort((a, b) => b.endDate.localeCompare(a.endDate))[0];
}

/** Access derived from a live contract the company may or may not be party to. */
export function assessContractAccess(
  contract: Contract,
  company: Company,
  ctx: AccessContext,
): AccessResult {
  const ranking = contract.frameworkRankings?.find((r) => r.supplierId === company.id);
  const isSoleSupplier = contract.supplierId === company.id;
  const source = contract.sources[0] ?? { document: contract.title };

  if (isSoleSupplier && contract.callOffMethod !== "renewed_competition") {
    return {
      status: "granted",
      governingContractId: contract.id,
      legalBasis: {
        contractId: contract.id,
        reason:
          `Företaget har avtalet ${contract.title}, som gäller till ${contract.endDate}. ` +
          "Köp som ingår i avtalet beställs direkt från avtalet.",
        source,
      },
      explanation: "Företaget har ett gällande avtal som täcker behovet.",
      caveats: [],
    };
  }

  if (ranking) {
    if (contract.callOffMethod === "renewed_competition") {
      return {
        status: "competitive",
        governingContractId: contract.id,
        explanation:
          `Företaget är med på ramavtalet ${contract.title}, men vid varje beställning får ` +
          "leverantörerna på avtalet tävla om uppdraget igen.",
        caveats: [],
      };
    }
    if (ranking.rank === 1) {
      return {
        status: "granted",
        governingContractId: contract.id,
        legalBasis: {
          contractId: contract.id,
          reason:
            `Företaget står först i turordningen på ramavtalet ${contract.title}, som gäller till ${contract.endDate}. ` +
            "Beställningar ska i första hand gå till den som står först.",
          source,
        },
        explanation: "Företaget står först i turordningen på ramavtalet.",
        caveats: [],
      };
    }
    return {
      status: "discretionary",
      governingContractId: contract.id,
      explanation:
        `Företaget står som nummer ${ranking.rank} i turordningen på ramavtalet ${contract.title}. ` +
        "Beställningar går i första hand till dem som står före.",
      caveats: [],
    };
  }

  return {
    status: "blocked",
    governingContractId: contract.id,
    explanation:
      `Köpet styrs av avtalet ${contract.title} (till ${contract.endDate}), och företaget är inte med i det. ` +
      "Nästa chans kommer när avtalet tar slut eller när en ny upphandling annonseras.",
    caveats: [
      doctrineCaveat("frameworkGovernsPurchase"),
      doctrineCaveat("noEntitlementFromScarcity"),
    ],
  };
}

/** Access derived from a procurement's procedure and timing. */
export function assessProcurementAccess(
  procurement: Procurement,
  company: Company,
  ctx: AccessContext,
): AccessResult {
  const organization = indexBy(ctx.graph.organizations, (o) => o.id).get(
    procurement.organizationId,
  );

  // A live contract outranks the notice: if something already routes this
  // purchase, that is the situation the company is actually in.
  if (organization && procurement.status !== "announced") {
    const governing = findGoverningContract(
      organization,
      procurement.capabilities,
      procurement.areas,
      ctx,
    );
    if (governing) {
      const result = assessContractAccess(governing, company, ctx);

      // En förutsedd efterträdare ärver inte det nuvarande avtalets ställning.
      //
      // Det gäller åt båda hållen, och åt det ena hållet var det fel. Att den
      // som *inte* har avtalet inte utestängs från nästa upphandling var redan
      // hanterat. Men den som har det fick tillbaka sin egen rättighet — det
      // nuvarande avtalets `LegalBasis` — fäst på en upphandling som ännu inte
      // finns. Kortet lästes då som "Rättighet" på nästa uppdrag.
      //
      // Ingen har en rättighet till en upphandling som inte är annonserad.
      // Rangordningen gäller till avtalets slut och inte en dag längre, och för
      // den som sitter på avtalet är just den förväxlingen den dyraste produkten
      // kan producera: ett blått kort där svaret är att börja förbereda ett nytt
      // anbud.
      if (
        procurement.status === "predicted" &&
        procurement.predecessorContractId === governing.id
      ) {
        const incumbent = result.status !== "blocked";
        return {
          status: "unknown",
          governingContractId: governing.id,
          explanation: incumbent
            ? `Företaget har uppdraget genom ${governing.title} till ${governing.endDate}. Avtalet ` +
              "betyder inte att ni får nästa upphandling — den är inte annonserad än, och " +
              "kraven går inte att bedöma ännu. Använd tiden till att förbereda er."
            : `${governing.supplierName ?? "En annan leverantör"} har uppdraget genom ${governing.title} ` +
              `till ${governing.endDate}. Den nya upphandlingen är inte annonserad än, så kraven går ` +
              "inte att bedöma ännu. Använd tiden till att förbereda er.",
          caveats: [doctrineCaveat("noEntitlementFromScarcity")],
        };
      }

      // Any outcome where the company is a party to the contract is the real
      // answer, whatever the notice says.
      if (result.status !== "blocked") return result;

      // Blocked by some *other* live contract is a genuine dead end.
      if (procurement.status === "predicted") return result;
    }
  }

  switch (procurement.status) {
    case "cancelled":
      return { status: "blocked", explanation: "Upphandlingen är avbruten.", caveats: [] };
    case "awarded":
      return {
        status: "blocked",
        explanation: "Köparen har valt leverantör. Det går inte längre att lämna anbud.",
        caveats: [],
      };
    case "under_review":
      return {
        status: "unknown",
        explanation: "Upphandlingen är överklagad. Det är inte avgjort hur det slutar.",
        caveats: [],
      };
    case "predicted":
      return {
        status: "unknown",
        explanation:
          "Upphandlingen är inte annonserad än. Krav och upplägg är inte publicerade, " +
          "så det går inte att säga om företaget kan vara med.",
        caveats: [],
      };
    case "planned":
    case "market_dialogue":
      return {
        status: "unknown",
        explanation:
          procurement.status === "market_dialogue"
            ? "Köparen pratar med marknaden inför upphandlingen. Kraven är inte bestämda än."
            : "Upphandlingen är planerad men inte annonserad än.",
        caveats: [doctrineCaveat("marketDialogueIsAllowed")],
      };
    case "closed":
      return { status: "blocked", explanation: "Sista anbudsdag har passerat.", caveats: [] };
    case "announced":
      break;
  }

  if (procurement.deadlineAt && procurement.deadlineAt < ctx.today) {
    return { status: "blocked", explanation: "Sista anbudsdag har passerat.", caveats: [] };
  }

  switch (procurement.procedure) {
    case "dynamic_purchasing_system": {
      const open =
        procurement.admissionOpenUntil === undefined || procurement.admissionOpenUntil >= ctx.today;
      if (!open) {
        return {
          status: "blocked",
          explanation: "Det dynamiska inköpssystemet gäller inte längre.",
          caveats: [],
        };
      }
      return {
        status: "open",
        explanation:
          "Dynamiskt inköpssystem. Det går att ansöka när som helst, och den som är antagen " +
          "får vara med när köparen beställer.",
        caveats: [doctrineCaveat("dpsAdmissionStaysOpen")],
      };
    }

    case "direct_award": {
      const threshold = directAwardThresholdFor(procurement.regulation, ctx.today);
      const caveats: Caveat[] = [
        doctrineCaveat("directAwardIsBuyersDecision"),
        doctrineCaveat("noEntitlementFromScarcity"),
      ];
      if (!threshold) {
        return {
          status: "unknown",
          explanation: `Vi känner inte till någon direktupphandlingsgräns för ${procurement.regulation} vid det här datumet.`,
          caveats,
        };
      }
      if (threshold.verification === "unverified")
        caveats.push(unverifiedThresholdCaveat(threshold));

      if (procurement.estimatedValueSek === undefined) {
        return {
          status: "unknown",
          explanation:
            "Uppskattat värde saknas, så det går inte att bedöma om direktupphandling är möjlig.",
          caveats,
        };
      }
      // Nära en overifierad gräns finns inget svar att ge.
      //
      // Både utfallen nedan är påståenden om juridik: "detta måste
      // konkurrensutsättas" respektive "direktupphandling kan vara möjlig". Om
      // talet som skiljer dem åt inte är verifierat, och värdet ligger nära det,
      // vilar båda på en siffra vi själva säger att vi inte kan gå i god för.
      // Att skriva ut ett förbehåll under en bestämd mening räcker inte — det är
      // meningen användaren agerar på.
      if (!thresholdSettles(threshold, procurement.estimatedValueSek)) {
        return {
          status: "unknown",
          explanation:
            `Uppskattat värde ${procurement.estimatedValueSek.toLocaleString("sv-SE")} kr ligger nära ` +
            `direktupphandlingsgränsen för ${procurement.regulation} ` +
            `(${threshold.amountSek.toLocaleString("sv-SE")} kr), och vi har inte kontrollerat gränsen mot ` +
            "källan. Om beloppet är fel blir svaret det motsatta, så vi lämnar inget besked. " +
            "Kontrollera hos källan vilken gräns som gäller.",
          caveats,
        };
      }

      if (procurement.estimatedValueSek >= threshold.amountSek) {
        return {
          status: "competitive",
          explanation:
            `Uppskattat värde ${procurement.estimatedValueSek.toLocaleString("sv-SE")} kr ligger på eller över ` +
            `direktupphandlingsgränsen för ${procurement.regulation}. Köparen behöver därför göra en upphandling i konkurrens.`,
          caveats,
        };
      }
      return {
        status: "discretionary",
        explanation:
          `Uppskattat värde ${procurement.estimatedValueSek.toLocaleString("sv-SE")} kr ligger under ` +
          `direktupphandlingsgränsen för ${procurement.regulation}. Direktupphandling kan vara möjlig, ` +
          "men det är köparen som bestämmer.",
        caveats,
      };
    }

    case "framework_call_off":
      return {
        status: "competitive",
        explanation: "Beställningen görs bland de leverantörer som redan är med på ramavtalet.",
        caveats: [],
      };

    default:
      return {
        status: "competitive",
        explanation:
          "Annonserad upphandling. Uppdraget avgörs i konkurrens mellan de anbud som kommer in.",
        caveats: [],
      };
  }
}

/** Exposed so the UI can show the scarcity guardrail wherever it is relevant. */
export const SCARCITY_GUARDRAIL = DOCTRINE.noEntitlementFromScarcity;
