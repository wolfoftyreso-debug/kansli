/**
 * Handlingarna — vad ett krav faktiskt kräver att du skickar in.
 *
 * Ett kvalificeringskrav är en mening i ett underlag. Att uppfylla det är något
 * annat: det är ett intyg från rätt utfärdare, hämtat i tid, med rätt uppgift
 * på. Klyftan däremellan är där små företag fastnar — inte för att de saknar
 * förmågan, utan för att de upptäcker på inlämningsdagen att ett bevis tar en
 * vecka att få fram.
 *
 * Filen är därför en **katalog över bevis**, inte prosa i en komponent: var
 * handlingen kommer ifrån, hur lång tid den tar, vad den bevisar, och vilket
 * misstag som är vanligast med just den. Samma skäl som för tröskelvärdena och
 * fristerna — det ändras genom beslut, det ska gå att spåra, och det ska gå att
 * testa.
 *
 * Tre gränser gäller för allt innehåll här.
 *
 * **Katalogen är inte underlaget.** Den säger vad ett krav av ett visst slag
 * *brukar* kräva för bevis. Vad just den här upphandlingen kräver står i dess
 * egna administrativa föreskrifter, och de går före. Varje lista systemet
 * bygger säger det, i stället för att låtsas vara underlaget.
 *
 * **Ingen post påstås gälla utan att ha kontrollerats.** `verification` bärs av
 * varje juridisk grund, av exakt samma slag som `DirectAwardThreshold` och
 * `StatutoryPeriod`. En uppgift om juridik som ingen kontrollerat får inte
 * presenteras som om någon gjort det.
 *
 * **Föråldrade recept är farligare än inga.** Ett exempel står i katalogen och
 * är skälet till att den finns: blanketten SKV 4820 begärs fortfarande i
 * mallar runt om i landet, men Skatteverket slutade lämna ut uppgift om
 * restförda skatteskulder den vägen den 6 mars 2019. Ett företag som följer en
 * gammal mall hämtar en handling som inte längre visar det den ska.
 */

import type { IsoDate, RequirementKind, SourceRef } from "./ontology";

/* ------------------------------------------------------------------ */
/* Utfärdare                                                           */
/* ------------------------------------------------------------------ */

/**
 * Vem som utfärdar handlingen.
 *
 * Skillnaden avgör två saker användaren behöver veta i förväg: om *du* måste
 * göra något för att få fram den, och hur lång tid det tar. `buyer` är den
 * viktigaste av dem — flera bevis hämtar köparen själv, och att lägga arbete
 * på dem är bortkastad tid.
 */
export type EvidenceIssuer =
  | "self"
  | "buyer"
  | "bolagsverket"
  | "skatteverket"
  | "kronofogden"
  | "insurer"
  | "certification_body"
  | "accountant"
  | "customer";

export const ISSUER_LABEL: Record<EvidenceIssuer, string> = {
  self: "Du själv",
  buyer: "Köparen hämtar själv",
  bolagsverket: "Bolagsverket",
  skatteverket: "Skatteverket",
  kronofogden: "Kronofogden",
  insurer: "Ditt försäkringsbolag",
  certification_body: "Certifieringsorgan eller tillsynsmyndighet",
  accountant: "Din redovisningsbyrå eller revisor",
  customer: "Din tidigare kund",
};

/* ------------------------------------------------------------------ */
/* Rättslig grund                                                      */
/* ------------------------------------------------------------------ */

export interface EvidenceBasis {
  /** Lagrum eller myndighetsbesked, i klartext. */
  rule: string;
  source: SourceRef;
  verification: "verified" | "unverified";
}

const UHM_ESPD: SourceRef = {
  document: "Upphandlingsmyndigheten — ESPD-systemet, vägledning nr 5 (2017)",
  url: "https://www.upphandlingsmyndigheten.se/globalassets/dokument/publikationer/vagledning_2017_5_espd_webb.pdf",
  retrievedAt: "2026-08-22",
};

const UHM_TAX_EVIDENCE: SourceRef = {
  document: "Upphandlingsmyndigheten — hämta in bevis om obetalda skatter och socialförsäkringsavgifter",
  url: "https://www.upphandlingsmyndigheten.se/inkopsprocessen/genomfor-upphandlingen/att-hamta-in-bevis-om-obetalda-skatter-och-socialforsakringsavgifter/",
  retrievedAt: "2026-08-22",
};

const UHM_EXCLUSION: SourceRef = {
  document: "Upphandlingsmyndigheten — uteslutning av leverantörer",
  url: "https://www.upphandlingsmyndigheten.se/inkopsprocessen/genomfor-upphandlingen/uteslutning/",
  retrievedAt: "2026-08-22",
};

/* ------------------------------------------------------------------ */
/* Bevis                                                               */
/* ------------------------------------------------------------------ */

export interface EvidenceItem {
  id: string;
  title: string;
  /** Vad handlingen bevisar, i en mening. */
  proves: string;
  issuer: EvidenceIssuer;
  /** Var man hämtar den, konkret nog att gå på. */
  where: string;
  /**
   * Ungefär hur lång tid den tar att få fram.
   *
   * `0` betyder att den går att hämta direkt. Saknas fältet är ledtiden okänd,
   * vilket är något annat än kort — och skrivs ut som okänd.
   */
  typicalLeadTimeDays?: number;
  /** Det vanligaste misstaget med just den här handlingen. */
  pitfall?: string;
  basis?: EvidenceBasis;
}

/**
 * Katalogen.
 *
 * Ordningen är den man arbetar i: försäkran först, sedan det som styrker den.
 */
export const EVIDENCE: Record<string, EvidenceItem> = {
  espd: {
    id: "espd",
    title: "Egen försäkran (ESPD)",
    proves:
      "Preliminärt att inga uteslutningsgrunder finns och att kvalificeringskraven är uppfyllda.",
    issuer: "self",
    where:
      "Formuläret ingår i upphandlingsdokumenten. Du fyller i det, du behöver inte hämta det någon annanstans.",
    typicalLeadTimeDays: 0,
    pitfall:
      "Försäkran är preliminär, inte slutlig. Vinner du ska de riktiga handlingarna fram — kryssa " +
      "därför aldrig i något du inte kan styrka, för det är då det upptäcks.",
    basis: {
      rule:
        "Vid direktivstyrda annonserade upphandlingar ska den upphandlande myndigheten godta en " +
        "egen försäkran som preliminärt bevis (15 kap. 1–2 §§ LOU).",
      source: UHM_ESPD,
      verification: "verified",
    },
  },

  registration_certificate: {
    id: "registration_certificate",
    title: "Registreringsbevis",
    proves: "Att företaget finns registrerat och vem som får teckna dess firma.",
    issuer: "bolagsverket",
    where: "Bolagsverket, e-tjänst. Går att hämta direkt.",
    typicalLeadTimeDays: 0,
    pitfall:
      "Köpare sätter ofta en åldersgräns på beviset — vanligen några månader. Det är köparens " +
      "krav och inte lag, så det står i underlaget och ingen annanstans.",
  },

  tax_status: {
    id: "tax_status",
    title: "Uppgift om skatter och socialförsäkringsavgifter",
    proves: "Att företaget inte har obetalda skatter eller avgifter som kan leda till uteslutning.",
    issuer: "buyer",
    where:
      "Köparen hämtar uppgiften själv, numera från Kronofogden. Du behöver som regel inte skicka in något.",
    typicalLeadTimeDays: 0,
    pitfall:
      "Mallar begär fortfarande blanketten SKV 4820. Skatteverket slutade lämna ut uppgift om " +
      "restförd skatteskuld den vägen den 6 mars 2019 — en SKV 4820 visar alltså inte längre det " +
      "som efterfrågas. Står den i underlaget är det värt en fråga under frågeperioden.",
    basis: {
      rule:
        "Obetalda skatter och socialförsäkringsavgifter är en uteslutningsgrund (13 kap. 2 § LOU). " +
        "Bevis hämtas numera från Kronofogden sedan Skatteverket den 6 mars 2019 slutade lämna ut " +
        "uppgift om restförd skatteskuld via SKV 4820.",
      source: UHM_TAX_EVIDENCE,
      verification: "verified",
    },
  },

  exclusion_grounds: {
    id: "exclusion_grounds",
    title: "Kontroll av uteslutningsgrunder",
    proves: "Att inget av de förhållanden som tvingar eller tillåter uteslutning föreligger.",
    issuer: "buyer",
    where:
      "Köparen ska kontrollera detta innan kontrakt tilldelas. Din del är den egna försäkran.",
    pitfall:
      "Grunderna gäller även företrädare för företaget, inte bara bolaget. Ett förhållande hos en " +
      "styrelseledamot kan alltså träffa anbudet.",
    basis: {
      rule:
        "Uteslutningsgrunderna finns i 13 kap. LOU och ska kontrolleras innan kontrakt tilldelas.",
      source: UHM_EXCLUSION,
      verification: "verified",
    },
  },

  annual_report: {
    id: "annual_report",
    title: "Årsredovisning eller årsbokslut",
    proves: "Företagets omsättning och ekonomiska ställning för ett räkenskapsår.",
    issuer: "accountant",
    where: "Din egen bokföring, din redovisningsbyrå, eller Bolagsverket för inlämnade årsredovisningar.",
    typicalLeadTimeDays: 3,
    pitfall:
      "Omsättningskrav mäts på räkenskapsår. Ett ungt företag kan sakna det år kravet pekar på — " +
      "då är det inte samma sak som att kravet är obestyrkt, utan en fråga om vilka andra bevis " +
      "köparen godtar.",
  },

  credit_report: {
    id: "credit_report",
    title: "Kreditupplysning",
    proves: "Företagets kreditvärdighet enligt ett upplysningsföretags mått.",
    issuer: "buyer",
    where:
      "Köparen tar oftast upplysningen själv. Du kan ta en egen i förväg för att veta vad den visar.",
    typicalLeadTimeDays: 0,
    pitfall:
      "En riskklass- eller ratinggräns är köparens krav, inte lag, och måtten skiljer sig mellan " +
      "upplysningsföretag. Läs vilket mått underlaget pekar på innan du drar en slutsats om din egen.",
  },

  insurance_certificate: {
    id: "insurance_certificate",
    title: "Försäkringsbevis, ansvarsförsäkring",
    proves: "Att en ansvarsförsäkring finns och vilket belopp den täcker.",
    issuer: "insurer",
    where: "Ditt försäkringsbolag utfärdar beviset på begäran.",
    typicalLeadTimeDays: 5,
    pitfall:
      "Beviset ska visa beloppet underlaget kräver, och försäkringen ska normalt gälla under hela " +
      "avtalstiden. En försäkring som förnyas mitt i avtalet behöver därför ofta en utfästelse och " +
      "inte bara ett bevis för i år.",
  },

  certificate: {
    id: "certificate",
    title: "Certifikat eller behörighetsbevis",
    proves: "Att företaget eller en namngiven person har den behörighet kravet pekar på.",
    issuer: "certification_body",
    where:
      "Certifieringsorganet eller tillsynsmyndigheten som utfärdat behörigheten. För elarbete: Elsäkerhetsverket.",
    typicalLeadTimeDays: 10,
    pitfall:
      "Certifikatet ska gälla vid anbudstidens utgång, inte vid avtalsstart. Ett som löper ut " +
      "däremellan behöver förnyas först.",
  },

  reference_list: {
    id: "reference_list",
    title: "Referensuppdrag med kontaktuppgifter",
    proves: "Att liknande uppdrag utförts, inom den tid och av det slag kravet anger.",
    issuer: "customer",
    where:
      "Dina egna uppdrag. Kontaktuppgiften är till kunden — fråga personen först, både av artighet och för att uppgiften ska stämma.",
    typicalLeadTimeDays: 5,
    pitfall:
      "Köpare ringer referenserna. En kontaktperson som slutat, eller ett uppdrag som ligger " +
      "utanför tidsfönstret, gör att referensen inte räknas — och den räknas sällan om.",
  },

  personnel_cv: {
    id: "personnel_cv",
    title: "CV för nyckelpersoner",
    proves: "Att de personer som ska utföra uppdraget har den erfarenhet kravet anger.",
    issuer: "self",
    where: "Du sammanställer dem. Underlaget anger ofta en mall som ska användas.",
    typicalLeadTimeDays: 2,
    pitfall:
      "Är CV:t bevis för ett kvalificeringskrav prövas det före tilldelning. Namnge då personer " +
      "som faktiskt kommer att utföra uppdraget.",
  },

  capability_description: {
    id: "capability_description",
    title: "Beskrivning av hur uppdraget ska utföras",
    proves: "Att företaget har den tekniska förmåga och kapacitet uppdraget kräver.",
    issuer: "self",
    where: "Du skriver den, mot de frågor underlaget ställer.",
    typicalLeadTimeDays: 3,
    pitfall:
      "Svara på frågan som ställs, i den ordning den ställs. Utvärderare läser mot en mall, och " +
      "det som inte går att hitta räknas som obesvarat även när det står någon annanstans.",
  },

  named_document: {
    id: "named_document",
    title: "Handling som underlaget namnger",
    proves: "Det som just den handlingen är begärd för att visa.",
    issuer: "self",
    where: "Framgår av underlaget. Vilken handling det är avgörs där, inte här.",
    pitfall:
      "En namngiven handling är ofta ett ska-krav i sig. Att den saknas kan göra anbudet " +
      "ogiltigt även när själva sakförhållandet är uppfyllt.",
  },

  authorized_signature: {
    id: "authorized_signature",
    title: "Underskrift av behörig firmatecknare",
    proves: "Att anbudet är avgivet av någon som får binda företaget.",
    issuer: "self",
    where: "Du själv, eller den som enligt registreringsbeviset tecknar firman.",
    typicalLeadTimeDays: 0,
    pitfall:
      "Skriver någon annan under behövs en fullmakt, och den ska följa med anbudet — inte skickas " +
      "in efteråt.",
  },
};

/* ------------------------------------------------------------------ */
/* Från krav till bevis                                                */
/* ------------------------------------------------------------------ */

/**
 * Vilka bevis ett krav av ett visst slag brukar kräva.
 *
 * `geography` och `employees` saknar egna bevis med flit. Serviceområde
 * styrks av åtagandet i anbudet, och antalet anställda framgår av handlingar
 * som ändå lämnas. Att uppfinna ett intyg för dem vore att skapa arbete som
 * ingen har begärt — och katalogen finns för att minska sådant, inte öka det.
 */
export const EVIDENCE_FOR_REQUIREMENT: Record<RequirementKind, string[]> = {
  revenue: ["annual_report", "credit_report"],
  employees: [],
  certification: ["certificate"],
  reference: ["reference_list"],
  geography: [],
  insurance: ["insurance_certificate"],
  registration: ["registration_certificate"],
  capability: ["capability_description", "personnel_cv"],
  document: ["named_document"],
  other: [],
};

/**
 * Bevis som gäller oavsett vad kravlistan säger.
 *
 * De följer av upphandlingsreglerna och inte av den enskilda upphandlingen, och
 * de ska därför stå kvar även för en upphandling utan ett enda
 * kvalificeringskrav.
 */
export const BASELINE_EVIDENCE: string[] = [
  "espd",
  "exclusion_grounds",
  "tax_status",
  "registration_certificate",
  "authorized_signature",
];

/* ------------------------------------------------------------------ */

export function evidenceItem(id: string): EvidenceItem | undefined {
  return EVIDENCE[id];
}

/**
 * Ledtid i klartext.
 *
 * Okänd ledtid skrivs ut som okänd. Att låta ett saknat fält läsas som "går
 * direkt" vore att uppmuntra någon att vänta med en handling som kan ta en
 * vecka — precis det fel katalogen finns för att förhindra.
 */
export function leadTimeLabel(days: number | undefined): string {
  if (days === undefined) return "Ledtid okänd";
  if (days === 0) return "Går att få direkt";
  if (days === 1) return "Ungefär en dag";
  return `Ungefär ${days} dagar`;
}

/** Senaste dagen att börja hämta något som tar `days` dagar, givet en deadline. */
export function startBy(deadline: IsoDate, days: number): IsoDate {
  const date = new Date(`${deadline}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10) as IsoDate;
}
