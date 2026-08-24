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
          `Företaget är avtalspart i ${contract.title} som löper till ${contract.endDate}. ` +
          "Inköp inom avtalets omfattning sker genom avrop mot avtalet.",
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
          `Företaget är antaget på ramavtalet ${contract.title}, men avrop sker genom förnyad ` +
          "konkurrensutsättning mellan ramavtalsleverantörerna.",
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
            `Företaget är rangordnat som nummer 1 på ramavtalet ${contract.title} till ${contract.endDate}. ` +
            "Avrop ska enligt avtalets avropsordning i första hand riktas till den rangordnade leverantören.",
          source,
        },
        explanation: "Företaget är först i rangordningen på gällande ramavtal.",
        caveats: [],
      };
    }
    return {
      status: "discretionary",
      governingContractId: contract.id,
      explanation:
        `Företaget är rangordnat som nummer ${ranking.rank} på ramavtalet ${contract.title}. ` +
        "Avrop går i första hand till leverantörer före i rangordningen.",
      caveats: [],
    };
  }

  return {
    status: "blocked",
    governingContractId: contract.id,
    explanation:
      `Behovet omfattas av ${contract.title} (till ${contract.endDate}) där företaget inte är part. ` +
      "Nästa möjlighet uppstår när avtalet löper ut eller när en ny upphandling annonseras.",
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
              "ger ingen rätt till den efterföljande upphandlingen — den är inte annonserad, och " +
              "kraven går ännu inte att bedöma. Detta är tiden att förbereda sig."
            : `${governing.supplierName ?? "En annan leverantör"} har uppdraget genom ${governing.title} ` +
              `till ${governing.endDate}. Den nya upphandlingen är inte annonserad, så kraven går ännu ` +
              "inte att bedöma. Detta är tiden att förbereda sig.",
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
        explanation: "Tilldelningsbeslut är fattat. Uppdraget är inte längre öppet för anbud.",
        caveats: [],
      };
    case "under_review":
      return {
        status: "unknown",
        explanation: "Upphandlingen är föremål för överprövning. Utgången är inte avgjord.",
        caveats: [],
      };
    case "predicted":
      return {
        status: "unknown",
        explanation:
          "Upphandlingen är inte annonserad. Krav och förfarande är ännu inte publicerade, " +
          "så det går inte att avgöra om företaget kan delta.",
        caveats: [],
      };
    case "planned":
    case "market_dialogue":
      return {
        status: "unknown",
        explanation:
          procurement.status === "market_dialogue"
            ? "Organisationen för marknadsdialog inför upphandlingen. Krav är inte fastställda."
            : "Upphandlingen är planerad men ännu inte annonserad.",
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
          explanation: "Det dynamiska inköpssystemets giltighetstid har löpt ut.",
          caveats: [],
        };
      }
      return {
        status: "open",
        explanation:
          "Dynamiskt inköpssystem. Ansökan om att bli antagen kan lämnas löpande, och antagna " +
          "leverantörer får delta i kommande avrop.",
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
          explanation: `Ingen känd direktupphandlingsgräns för ${procurement.regulation} vid detta datum.`,
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
            `(${threshold.amountSek.toLocaleString("sv-SE")} kr), och den gränsen är inte verifierad mot ` +
            "källan. Är beloppet felaktigt avgörs frågan åt andra hållet, så systemet lämnar inget besked. " +
            "Kontrollera gällande gräns hos källan.",
          caveats,
        };
      }

      if (procurement.estimatedValueSek >= threshold.amountSek) {
        return {
          status: "competitive",
          explanation:
            `Uppskattat värde ${procurement.estimatedValueSek.toLocaleString("sv-SE")} kr når eller överstiger ` +
            `direktupphandlingsgränsen för ${procurement.regulation}. Köpet behöver därför konkurrensutsättas.`,
          caveats,
        };
      }
      return {
        status: "discretionary",
        explanation:
          `Uppskattat värde ${procurement.estimatedValueSek.toLocaleString("sv-SE")} kr ligger under ` +
          `direktupphandlingsgränsen för ${procurement.regulation}. Direktupphandling kan vara möjlig, ` +
          "men beslutet är organisationens.",
        caveats,
      };
    }

    case "framework_call_off":
      return {
        status: "competitive",
        explanation: "Avrop sker mellan leverantörer som redan är antagna på ramavtalet.",
        caveats: [],
      };

    default:
      return {
        status: "competitive",
        explanation: "Annonserad upphandling. Uppdraget avgörs i konkurrens mellan inkomna anbud.",
        caveats: [],
      };
  }
}

/** Exposed so the UI can show the scarcity guardrail wherever it is relevant. */
export const SCARCITY_GUARDRAIL = DOCTRINE.noEntitlementFromScarcity;
