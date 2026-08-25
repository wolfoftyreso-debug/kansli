/**
 * The API boundary.
 *
 * Every method here is shaped like the HTTP endpoint it will become: a request
 * carrying the caller's tier, a response containing *only* redacted data. The
 * implementation runs in-process today, but the shape is the point — when this
 * moves behind a server, the UI does not change and the paywall becomes real by
 * relocation rather than by rewrite.
 *
 * The rule that makes it work: **no method returns a raw `Opportunity`.** The UI
 * cannot render a field it was never handed, so a gating mistake becomes a
 * compile error instead of a leak. Building this boundary immediately surfaced
 * two live leaks — the history list and the alert feed were both showing buyer
 * names to free-tier users.
 *
 * Redaction here is still not enforcement: a client that calls the future HTTP
 * endpoint directly must be gated server-side by this same logic. What this
 * buys is that there is now exactly one place to move.
 */

import { indexBy, type Company, type IsoDate, type ProcurementGraph } from "../domain/ontology";
import type { EvaluationModel } from "../domain/ontology";
import type { Verdict } from "../domain/verdicts";
import { buildCalendar } from "./calendar";
import {
  locked,
  redactCalendarEntry,
  redactOpportunity,
  scoreBand,
  unlocked,
  TIER_CAPABILITIES,
  type CalendarEntryView,
  type Locked,
  type OpportunityView,
  type Tier,
} from "./entitlement";
import { buildOpportunities, type Opportunity } from "./opportunity";
import { analysePrices, type PriceIntelligence } from "./priceIntelligence";
import { buildRadar, radarHeadline, type RadarCapabilityArea } from "./radar";
import { buildWalkthrough, redactWalkthroughDates, type Walkthrough } from "./procedureGuide";
import {
  buildEvidenceChecklist,
  redactChecklistDates,
  type EvidenceChecklist,
} from "./evidenceChecklist";
import { buildRemedyOutlook, redactRemedyDates, type RemedyOutlook } from "./remedyWindows";
import { buildCapacityPlan, type CapacityPlan } from "./capacityPlan";
import { buildQuestionPlan, redactQuestionDate, type QuestionPlan } from "./questionPlan";
import { assessProcurementValue, type ValueBreakdown } from "./contractValue";
import type { Alert } from "./alerts";
import { deadlineAlerts } from "./alerts";

const ORGANIZATION_KIND_LABEL: Record<string, string> = {
  municipality: "Kommun",
  region: "Region",
  authority: "Myndighet",
  police: "Polis",
  emergency_service: "Räddningstjänst",
  ambulance: "Ambulans",
  municipal_company: "Kommunalt bolag",
  regional_company: "Regionägt bolag",
  procurement_centre: "Inköpscentral",
};

export interface ApiRequest {
  company: Company;
  tier: Tier;
  today: IsoDate;
}

export interface MarketSummary {
  headline: string;
  totalRelevant: number;
  totalHistorical: number;
  openNowCount: number;
  upcomingCount: number;
  watchCount: number;
  organizationCount: number;
  knownValueSek: number;
  opportunitiesWithoutValue: number;
  verdictCounts: Record<Verdict, number>;
  capabilityAreas: RadarCapabilityArea[];
}

export interface MarketResponse {
  summary: MarketSummary;
  openNow: OpportunityView[];
  upcoming: OpportunityView[];
  watch: OpportunityView[];
  /** Awarded or closed. Redacted like everything else — see the history leak note above. */
  history: OpportunityView[];
}

export interface OpportunityDetailResponse {
  view: OpportunityView;
  evaluation: Locked<EvaluationModel | undefined>;
  /** Gated on its own capability, not merely on `fullDetail`. */
  prices: Locked<PriceIntelligence>;
  /**
   * Processguiden — hur det här förfarandet går till och var man står i det.
   *
   * **Aldrig betalvägg**, av samma skäl som de juridiska förbehållen: att ta
   * betalt för den kunskap som hindrar ett företag från att missa en frist vore
   * att göra gratisnivån aktivt skadlig. Avtalsspärren är tio dagar för alla.
   *
   * Datumen i guiden följer däremot samma redaktion som `view.deadlineAt` —
   * själva tidplanen är uppgifter om upphandlingen, inte kunskap om förfarandet.
   *
   * Saknas den helt beror det på att upphandlingen är förutsagd och ännu inte
   * annonserad: då är förfarandet inte känt, och att anta det vanligaste vore
   * att lära ut en gissning.
   */
  walkthrough?: Walkthrough;
  /**
   * Vad avtalet är värt och vad det inte är.
   *
   * Gatead som `evaluation`, eftersom nedbrytningen till största delen består av
   * upphandlingens egna belopp. Kunskapen om *att* ett ramavtal inte garanterar
   * volym är däremot fri — den står i processguiden och i ordlistan, som ingen
   * nivå saknar.
   */
  value: Locked<ValueBreakdown | undefined>;
  /**
   * Handlingarna att ha på plats, och när de senast måste börja hämtas.
   *
   * **Aldrig betalvägg**, av samma skäl som processguiden. Att en egen
   * försäkran är preliminär, att ett certifikat tar tio dagar, och att
   * blanketten SKV 4820 inte längre visar det den brukade — det är kunskap om
   * regelverket, och den som betalar minst har mest att förlora på att sakna
   * den.
   *
   * Datumen följer däremot samma redaktion som `walkthrough`: när något ska
   * vara klart är en uppgift om upphandlingen, inte om regelverket.
   */
  documents: EvidenceChecklist;
  /**
   * Vad som går att göra om något gått fel, och när vägarna stänger.
   *
   * **Aldrig betalvägg.** Att avtalsspärren är tio dagar, att ansökan ska ha
   * kommit in och inte bara skickats, och att en överprövning inte kostar någon
   * ansökningsavgift — det är kunskap om rättsmedlen. Den som betalar minst har
   * mest att förlora på att sakna den, och en frist som passerar är inte
   * återställbar.
   *
   * De uträknade slutdagarna följer samma redaktion som `walkthrough` och
   * `documents`: när en frist löper ut i just den här upphandlingen är en
   * uppgift om affären.
   */
  remedies: RemedyOutlook;
  /**
   * Vilka luckor som går att täcka med ett annat företags kapacitet.
   *
   * **Aldrig betalvägg och inga datum att redigera.** Innehållet är regeln och
   * kravens egna etiketter, som redan följer kravanalysen — att en lucka går
   * att lösa tillsammans med någon annan är kunskap, och den som betalar minst
   * har mest nytta av den.
   *
   * Saknas kravanalysen för nivån blir planen tom, vilket är sant: utan
   * bedömning finns inga luckor att dela upp.
   */
  capacity: CapacityPlan;
  /**
   * Frågorna som är värda att ställa under anbudstiden.
   *
   * **Aldrig betalvägg.** Att fråga är den billigaste åtgärden i hela
   * processen och den enda som kan rätta ett krav innan det fått verkan. Att
   * ta betalt för den vore att sälja tillbaka en möjlighet som redan är gratis.
   *
   * Datumet är däremot härlett ur sista anbudsdag och följer samma redaktion
   * som `walkthrough` — men bara datumet, aldrig frågorna.
   */
  questions: QuestionPlan;
}

export interface CalendarResponse {
  thisWeek: CalendarEntryView[];
  next30Days: CalendarEntryView[];
  next90Days: CalendarEntryView[];
  next12Months: CalendarEntryView[];
  /** Count is visible to everyone; content is not. */
  alertCount: number;
  alerts: Locked<Alert[]>;
}

export interface OpportunityApi {
  getMarket(request: ApiRequest): MarketResponse;
  getOpportunity(
    request: ApiRequest & { opportunityId: string },
  ): OpportunityDetailResponse | undefined;
  getCalendar(request: ApiRequest): CalendarResponse;
}

export function createLocalApi(graph: ProcurementGraph): OpportunityApi {
  const organizationIndex = indexBy(graph.organizations, (o) => o.id);
  const procurementIndex = indexBy(graph.procurements, (p) => p.id);

  const kindHint = (organizationId: string) =>
    ORGANIZATION_KIND_LABEL[organizationIndex.get(organizationId)?.kind ?? ""] ??
    "Offentlig organisation";

  const redact = (opportunity: Opportunity, tier: Tier) =>
    redactOpportunity(opportunity, tier, kindHint(opportunity.organizationId));

  const load = (request: ApiRequest) =>
    buildOpportunities(request.company, { graph, today: request.today });

  return {
    getMarket(request) {
      const opportunities = load(request);
      const radar = buildRadar(request.company, opportunities, graph);
      const view = (list: Opportunity[]) => list.map((o) => redact(o, request.tier));

      return {
        summary: {
          headline: radarHeadline(radar),
          totalRelevant: radar.totalRelevant,
          totalHistorical: radar.totalHistorical,
          openNowCount: radar.openNow.length,
          upcomingCount: radar.upcoming.length,
          watchCount: radar.watch.length,
          organizationCount: radar.organizations.length,
          knownValueSek: radar.knownValueSek,
          opportunitiesWithoutValue: radar.opportunitiesWithoutValue,
          verdictCounts: radar.verdictCounts,
          capabilityAreas: radar.capabilityAreas,
        },
        openNow: view(radar.openNow),
        upcoming: view(radar.upcoming),
        watch: view(radar.watch),
        history: view(radar.closed),
      };
    },

    getOpportunity(request) {
      const opportunity = load(request).find((o) => o.id === request.opportunityId);
      if (!opportunity) return undefined;

      const caps = TIER_CAPABILITIES[request.tier];
      const procurement = procurementIndex.get(opportunity.procurementId);

      const walkthrough = procurement
        ? redactWalkthroughDates(buildWalkthrough(procurement, request.today), caps.fullDetail)
        : undefined;

      // Bedömningen är redan gjord; checklistan återanvänder den i stället för
      // att fråga en gång till, så att ett krav aldrig kan sägas vara uppfyllt
      // på ett ställe och obestyrkt på ett annat.
      const documents = procurement
        ? redactChecklistDates(
            buildEvidenceChecklist({
              procurement,
              assessments: opportunity.qualification.assessments,
              today: request.today,
            }),
            caps.fullDetail,
          )
        : {
            status: "unknown" as const,
            explanation:
              "Upphandlingen är förutsagd och ännu inte annonserad. Det finns inget underlag att " +
              "läsa krav ur, och en checklista skulle vara en gissning.",
            caveats: [],
          };

      // Kapacitetsplanen används två gånger: en gång som svar, en gång som
      // underlag för frågorna. Att bygga den två gånger vore att riskera att
      // panelerna visar olika bild av samma luckor.
      const capacityPlan = buildCapacityPlan(opportunity.qualification.assessments);

      // Utan känd upphandling matchar id:t ingen tilldelning, och samtliga
      // vägar svarar `unknown` — vilket är sant och fortfarande lär ut regeln.
      const remedies = redactRemedyDates(
        buildRemedyOutlook(procurement?.id ?? "", graph, request.today),
        caps.fullDetail,
      );

      return {
        view: redact(opportunity, request.tier),
        walkthrough,
        documents,
        remedies,
        capacity: capacityPlan,
        questions: redactQuestionDate(
          buildQuestionPlan({
            assessments: opportunity.qualification.assessments,
            capacity: capacityPlan,
            deadlineAt: procurement?.deadlineAt,
            today: request.today,
          }),
          caps.fullDetail,
        ),
        value:
          caps.fullDetail && procurement
            ? unlocked(assessProcurementValue(procurement))
            : locked("Lås upp för värde, avtalstid och vad som faktiskt kan bli din del."),
        evaluation: caps.fullDetail
          ? unlocked(procurement?.evaluation)
          : locked("Lås upp för utvärderingsmodell."),
        // Scope comes from the graph, not from the caller — a client must not be
        // able to widen a price query by asking for a different scope.
        prices: caps.priceIntelligence
          ? unlocked(
              analysePrices(
                {
                  capabilities: procurement?.capabilities ?? [],
                  areas: procurement?.areas ?? [],
                },
                graph,
              ),
            )
          : locked("Historiska tilldelningar ingår i Pro och uppåt."),
      };
    },

    getCalendar(request) {
      const opportunities = load(request);
      const calendar = buildCalendar(opportunities, request.today);
      const alerts = deadlineAlerts(opportunities, request.today);
      const caps = TIER_CAPABILITIES[request.tier];
      const entries = (list: typeof calendar.thisWeek) =>
        list.map((entry) => redactCalendarEntry(entry, request.tier));

      return {
        thisWeek: entries(calendar.thisWeek),
        next30Days: entries(calendar.next30Days),
        next90Days: entries(calendar.next90Days),
        next12Months: entries(calendar.next12Months),
        alertCount: alerts.length,
        alerts: caps.identifyOpportunity
          ? unlocked(alerts)
          : locked("Lås upp för att se vad aviseringarna gäller."),
      };
    },
  };
}

/** Re-exported so the UI can band a score without reaching into the engine. */
export { scoreBand };

/**
 * Tar bort tidplanen ur guiden för nivåer som inte ser upphandlingens datum.
 *
 * Stegens *ordning och innehåll* står kvar — det är kunskapen, och den är inte
 * till salu. Det som faller bort är datumen och nedräkningen, exakt de
 * uppgifter `view.deadlineAt` redan låser. Att visa dem här hade varit en läcka
 * genom en sidodörr, och den sortens läcka är precis vad redaktionslagret
 * infördes för att omöjliggöra.
 *
 * Positionen behålls: att veta att anbudstiden pågår avslöjar inte vilket datum
 * den slutar, och att stryka den skulle ta bort halva poängen med guiden.
 */
