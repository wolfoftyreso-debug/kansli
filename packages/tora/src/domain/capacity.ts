/**
 * Du behöver inte klara varje krav ensam.
 *
 * Det här är den regel som oftast avgör om ett litet företag över huvud taget
 * kan delta, och den är samtidigt en av de minst kända. En leverantör får för
 * ett visst kontrakt åberopa andra företags kapacitet för att uppfylla krav på
 * ekonomisk och finansiell ställning eller teknisk och yrkesmässig kapacitet.
 * Ett omsättningskrav som är fyra gånger den egna omsättningen är alltså inte
 * automatiskt ett stopp.
 *
 * Motorn räknar redan med möjligheten — se `beyondCapacityReach` i
 * `eligibility.ts`, och den gräns bortom vilken den slutar tro på den. Vad som
 * saknats är att *lära ut* den, och två saker måste då sägas rakt ut, eftersom
 * de är det som gör skillnad mellan ett användbart råd och en fälla.
 *
 * **Åberopa kapacitet är inte samma sak som att anlita en underleverantör.**
 * Det företag vars kapacitet åberopas svarar mot kvalificeringskravet; en
 * underleverantör utför delar av arbetet. Ett företag kan vara både och, men
 * begreppen har olika konsekvenser och blandas ihop i nästan varje samtal om
 * saken.
 *
 * **Det kan kosta den andra parten mer än en underskrift.** Gäller den åberopade
 * kapaciteten ekonomisk och finansiell ställning får köparen kräva att företaget
 * åtar sig *solidariskt ansvar* för att kontraktet fullgörs. Att be en kollega
 * om "bara ett intyg" utan att nämna det är att be om något annat än man tror.
 *
 * Modulen påstår ingenting om vad som gäller i en enskild upphandling. Vad
 * köparen faktiskt kräver står i dess underlag.
 */

import type { RequirementKind, SourceRef } from "./ontology";

/* ------------------------------------------------------------------ */

const UHM_CAPACITY: SourceRef = {
  document: "Upphandlingsmyndigheten — åberopa andra företags kapacitet",
  url: "https://www.upphandlingsmyndigheten.se/regler-och-lagstiftning/samarbeta-med-underleverantorer-och-andra-samarbetspartners/aberopa-annans-kapacitet/",
  retrievedAt: "2026-08-22",
};

const UHM_SUBCONTRACTOR: SourceRef = {
  document: "Upphandlingsmyndigheten — underleverantör eller åberopad kapacitet",
  url: "https://www.upphandlingsmyndigheten.se/frageportalen/1514456/underleverantor-och-leverantorers-aberopande-av-an/",
  retrievedAt: "2026-08-22",
};

export interface CapacityRule {
  rule: string;
  source: SourceRef;
  verification: "verified" | "unverified";
}

/**
 * Grundregeln — att det alls är tillåtet.
 */
export const CAPACITY_RELIANCE_ALLOWED: CapacityRule = {
  rule:
    "En leverantör får för ett visst kontrakt åberopa andra företags kapacitet för att uppfylla " +
    "krav som avser ekonomisk och finansiell ställning eller teknisk och yrkesmässig kapacitet " +
    "(14 kap. LOU).",
  source: UHM_CAPACITY,
  verification: "verified",
};

/**
 * Priset den andra parten kan få betala.
 *
 * Den här regeln står separat för att den ska gå att visa ensam. Den är det
 * enda i sammanhanget som kan göra att ett åtagande bör tänkas över en gång
 * till, och att gömma den i en längre text vore att låta någon skriva under
 * något de inte förstått.
 */
export const CAPACITY_JOINT_LIABILITY: CapacityRule = {
  rule:
    "Avser den åberopade kapaciteten ekonomisk och finansiell ställning får den upphandlande " +
    "myndigheten kräva att företaget åtar sig solidariskt ansvar för att kontraktet fullgörs " +
    "(14 kap. 8 § LOU).",
  source: UHM_CAPACITY,
  verification: "verified",
};

/**
 * Skillnaden mot underleverantör.
 */
export const CAPACITY_VS_SUBCONTRACTOR: CapacityRule = {
  rule:
    "Ett företag vars kapacitet åberopas svarar mot ett kvalificeringskrav. En underleverantör " +
    "utför delar av leveransen. Samma företag kan vara båda, men rollerna är olika i lagen.",
  source: UHM_SUBCONTRACTOR,
  verification: "verified",
};

/* ------------------------------------------------------------------ */

/**
 * Om ett krav av ett visst slag går att uppfylla med annans kapacitet.
 *
 * `unclear` är ett eget svar och inte en artig nej. Försäkringskrav är det
 * tydligaste fallet: de ligger nära ekonomisk ställning, men vad köparen godtar
 * beror på hur kravet är formulerat. Att svara ja eller nej där vore att hitta
 * på en regel — och ett felaktigt nej stänger ute lika effektivt som ett krav.
 */
export type Bridgeable = "yes" | "no" | "unclear";

export interface BridgeRule {
  bridgeable: Bridgeable;
  /** Vad som krävs av den andra parten, när det går. */
  commitment?: string;
  /** Varför det inte går, när det inte gör det. */
  why?: string;
  /** Sant när solidariskt ansvar kan bli aktuellt. */
  jointLiabilityPossible?: boolean;
}

export const BRIDGE_RULES: Record<RequirementKind, BridgeRule> = {
  revenue: {
    bridgeable: "yes",
    commitment:
      "Ett skriftligt åtagande från företaget vars ekonomiska kapacitet du åberopar. Åtagandet " +
      "ska minst motsvara det kravet begär.",
    jointLiabilityPossible: true,
  },
  employees: {
    bridgeable: "yes",
    commitment:
      "Ett åtagande från den partner eller underleverantör vars personal räknas in, med de " +
      "resurser som faktiskt ställs till förfogande.",
  },
  reference: {
    bridgeable: "yes",
    commitment:
      "Referensuppdraget tillhör det företag vars kapacitet åberopas, och det företaget ska " +
      "medverka i uppdraget. En lånad referens utan medverkan är inte kapacitet.",
  },
  capability: {
    bridgeable: "yes",
    commitment:
      "Ett åtagande om att den tekniska förmågan står till förfogande under hela avtalstiden.",
  },
  certification: {
    bridgeable: "unclear",
    why:
      "Beror på vad certifikatet gäller. En personlig behörighet följer personen, och den " +
      "personen måste då utföra arbetet. Ett verksamhetscertifikat kan vara ett krav på " +
      "leverantören själv. Läs kravet innan du planerar runt det.",
  },
  insurance: {
    bridgeable: "unclear",
    why:
      "Ligger nära ekonomisk ställning, men vad köparen godtar beror på hur kravet är skrivet. " +
      "Fråga under frågeperioden — det är gratis och svaret går till alla.",
  },
  registration: {
    bridgeable: "no",
    why:
      "Registreringar som F-skatt gäller leverantören själv. Ingen annans registrering kan träda " +
      "i stället för din.",
  },
  geography: {
    bridgeable: "no",
    why:
      "Serviceområde är ett åtagande i anbudet, inte kapacitet. Ska någon annan täcka området är " +
      "det underleverantörskap och regleras som sådant.",
  },
  document: {
    bridgeable: "no",
    why: "En handling underlaget begär ska lämnas av den som ska lämna den. Det framgår där.",
  },
  other: {
    bridgeable: "unclear",
    why: "Kravets slag går inte att avgöra härifrån. Vad som gäller står i underlaget.",
  },
};

export function bridgeRule(kind: RequirementKind): BridgeRule {
  return BRIDGE_RULES[kind];
}
