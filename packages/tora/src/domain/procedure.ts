/**
 * Processen, förklarad.
 *
 * Den här filen finns för att den vanligaste orsaken till att ett litet företag
 * inte deltar i en upphandling inte är att kraven är för höga. Det är att
 * processen är okänd: vad som händer när, vad orden betyder, vad man själv
 * förväntas göra, och — dyrast av allt — att det finns ett tidsfönster efter
 * tilldelningsbeslutet där ett fel faktiskt går att få prövat, och att fönstret
 * stängs efter tio dagar.
 *
 * Innehållet är **data, inte prosa i en komponent**. Samma skäl som för
 * tröskelvärdena: det ändras genom beslut, det ska gå att spåra till en källa,
 * och det ska gå att testa. Varje frist bär därför en `verification`-flagga av
 * exakt samma slag som `DirectAwardThreshold` — ett tal om juridik som ingen
 * kontrollerat får inte presenteras som om någon gjort det.
 *
 * Stegbeskrivningarna är avsiktligt allmänna. Det som står ska gälla för
 * förfarandet som sådant; det som gäller just den här upphandlingen står i dess
 * eget underlag, och guiden säger det i stället för att låtsas vara underlaget.
 */

import type { IsoDate, ProcedureKind, SourceRef } from "./ontology";

/* ------------------------------------------------------------------ */
/* Lagstadgade frister                                                 */
/* ------------------------------------------------------------------ */

export interface StatutoryPeriod {
  /** Antal dagar. */
  days: number;
  label: string;
  /** Vad fristen är till för, i klarspråk. */
  meaning: string;
  source: SourceRef;
  verification: "verified" | "unverified";
}

const UHM_PROCESS: SourceRef = {
  document: "Upphandlingsmyndigheten — avtalsspärr och att ingå avtal",
  url: "https://www.upphandlingsmyndigheten.se/inkopsprocessen/genomfor-upphandlingen/avtalssparr-och-inga-avtal/",
  retrievedAt: "2026-08-21",
};

const UHM_QUESTIONS: SourceRef = {
  document: "Upphandlingsmyndigheten — frågor från leverantörer",
  url: "https://www.upphandlingsmyndigheten.se/inkopsprocessen/genomfor-upphandlingen/fragor-fran-leverantorer/",
  retrievedAt: "2026-08-21",
};

/**
 * Avtalsspärren — det enda tidsfönster där ett fel går att stoppa innan avtal
 * tecknas.
 *
 * Efter att spärren löpt ut är rätten att ansöka om överprövning av
 * *upphandlingen* förlorad. Det är inte en formalitet: skillnaden mellan att
 * agera dag nio och dag elva är skillnaden mellan en prövning och ingen
 * prövning alls. Därför är den här fristen den enda i systemet som visas även
 * när den inte är aktuell — man ska känna till den *innan* den börjar löpa.
 */
export const STANDSTILL_ELECTRONIC: StatutoryPeriod = {
  days: 10,
  label: "Avtalsspärr (elektroniskt utskick)",
  meaning:
    "Avtal får inte ingås förrän tio dagar gått från att tilldelningsbeslutet skickades " +
    "elektroniskt. Under den tiden — och bara då — kan en ansökan om överprövning av " +
    "upphandlingen komma in till förvaltningsrätten.",
  source: UHM_PROCESS,
  verification: "verified",
};

export const STANDSTILL_OTHER: StatutoryPeriod = {
  days: 15,
  label: "Avtalsspärr (annat utskickssätt)",
  meaning:
    "Skickas tilldelningsbeslutet på annat sätt än elektroniskt är fristen femton dagar. " +
    "Den upphandlande organisationen får ange en längre spärr, och då gäller den längre.",
  source: UHM_PROCESS,
  verification: "verified",
};

/**
 * Kompletterande upplysningar.
 *
 * En fråga som ställs för sent hinner inte besvaras, och svaret går till alla —
 * aldrig bara till den som frågade. Båda halvorna är värda att veta: den första
 * för att man ska hinna fråga, den andra för att man inte ska tro att en fråga
 * avslöjar något för konkurrenterna som de inte ändå får veta.
 */
export const SUPPLEMENTARY_INFORMATION: StatutoryPeriod = {
  days: 6,
  label: "Kompletterande upplysningar",
  meaning:
    "Den upphandlande organisationen ska på begäran lämna kompletterande upplysningar om " +
    "underlaget senast sex dagar före sista anbudsdag. Svaren går till samtliga leverantörer, " +
    "eftersom alla ska ha samma information samtidigt.",
  source: UHM_QUESTIONS,
  verification: "verified",
};

/* ------------------------------------------------------------------ */
/* Stegen                                                              */
/* ------------------------------------------------------------------ */

/** Vem som gör något i steget. Att skilja på det är halva pedagogiken. */
export type Actor = "buyer" | "supplier" | "court";

export interface ProcedureStage {
  id: string;
  title: string;
  actor: Actor;
  /** Vad som händer. Beskrivande, aldrig ett påstående om just den här affären. */
  what: string;
  /** Vad företaget självt behöver göra, när det är företagets tur. */
  yourMove?: string;
  /** Fällan i just det här steget — det som kostar pengar att inte veta. */
  pitfall?: string;
  /** Fristen som styr steget, när en sådan finns. */
  period?: StatutoryPeriod;
}

export interface ProcedureGuide {
  kind: ProcedureKind;
  name: string;
  /** En mening som säger vad förfarandet *är*. */
  summary: string;
  stages: ProcedureStage[];
}

/** Steg som är gemensamma för de annonserade förfarandena. */
const ANNOUNCED_TAIL: ProcedureStage[] = [
  {
    id: "opening",
    title: "Anbudsöppning",
    actor: "buyer",
    what:
      "Anbuden öppnas samtidigt efter att anbudstiden gått ut. Innan dess får ingen ta del av " +
      "innehållet, inte heller den upphandlande organisationen.",
  },
  {
    id: "examination",
    title: "Prövning och utvärdering",
    actor: "buyer",
    what:
      "Först prövas att anbudsgivaren uppfyller de obligatoriska kraven, sedan utvärderas de " +
      "anbud som klarat prövningen mot tilldelningskriterierna.",
    pitfall:
      "Ett anbud som missar ett enda obligatoriskt krav utvärderas inte alls, hur bra det än är " +
      "i övrigt. Det är därför kravlistan är viktigare än priset att gå igenom först.",
  },
  {
    id: "award_decision",
    title: "Tilldelningsbeslut",
    actor: "buyer",
    what:
      "Organisationen meddelar vilken leverantör som vunnit och varför. Samtliga anbudsgivare " +
      "får beslutet, med skälen för utvärderingen.",
    yourMove:
      "Läs motiveringen mot din egen utvärdering. Det är här du ser om något bedömts på ett " +
      "sätt underlaget inte angav.",
  },
  {
    id: "standstill",
    title: "Avtalsspärr",
    actor: "supplier",
    what:
      "Under avtalsspärren får avtal inte tecknas. Det är det enda fönstret där en ansökan om " +
      "överprövning av upphandlingen kan komma in.",
    yourMove:
      "Anser du att något gått fel: ansök om överprövning hos förvaltningsrätten innan spärren " +
      "löper ut. Ansökan ska ha kommit in — det räcker inte att den skickats.",
    pitfall:
      "När spärren löpt ut är rätten att få upphandlingen överprövad förlorad. Skillnaden " +
      "mellan dag nio och dag elva är skillnaden mellan en prövning och ingen alls.",
    period: STANDSTILL_ELECTRONIC,
  },
  {
    id: "contract",
    title: "Avtal",
    actor: "buyer",
    what: "Avtal tecknas med den vinnande leverantören när avtalsspärren löpt ut.",
  },
];

const TENDER_PERIOD: ProcedureStage = {
  id: "tender_period",
  title: "Anbudstid",
  actor: "supplier",
  what:
    "Underlaget är publicerat och anbud kan lämnas fram till sista anbudsdag. Frågor om " +
    "underlaget ställs under den här tiden.",
  yourMove:
    "Gå igenom de obligatoriska kraven först — de avgör om det är någon idé att räkna på " +
    "priset. Ställ frågor tidigt; svaren går till alla och kan ändra förutsättningarna.",
  pitfall:
    "Ett anbud som kommer in för sent måste avvisas. Likabehandlingen tillåter inget undantag, " +
    "oavsett orsak.",
  period: SUPPLEMENTARY_INFORMATION,
};

const ANNOUNCEMENT: ProcedureStage = {
  id: "announcement",
  title: "Annonsering",
  actor: "buyer",
  what:
    "Upphandlingen annonseras publikt tillsammans med underlaget: krav, tilldelningskriterier, " +
    "avtalsvillkor och sista anbudsdag.",
};

/* ------------------------------------------------------------------ */

export const PROCEDURE_GUIDES: Record<ProcedureKind, ProcedureGuide> = {
  open: {
    kind: "open",
    name: "Öppet förfarande",
    summary:
      "Alla får lämna anbud direkt. Ingen ansökan, inget urval i förväg — underlaget är " +
      "publikt och den som vill lämnar anbud före sista anbudsdag.",
    stages: [ANNOUNCEMENT, TENDER_PERIOD, ...ANNOUNCED_TAIL],
  },

  selective: {
    kind: "selective",
    name: "Selektivt förfarande",
    summary:
      "Två steg: först ansöker man om att få delta, sedan bjuds ett urval in att lämna anbud. " +
      "Man kan alltså bli utan att få lämna anbud över huvud taget.",
    stages: [
      ANNOUNCEMENT,
      {
        id: "application",
        title: "Ansökan om att få delta",
        actor: "supplier",
        what:
          "Leverantörer ansöker om att bli inbjudna. Här prövas kvalificeringen — kapacitet, " +
          "erfarenhet, referenser — inte anbudet.",
        yourMove:
          "Missa inte ansökningstiden. Den är ofta kortare än anbudstiden och är den enda vägen in.",
        pitfall:
          "Att uppfylla kraven räcker inte alltid: bjuds ett begränsat antal in rangordnas de " +
          "sökande, och man kan bli utan trots godkänd kvalificering.",
      },
      {
        id: "selection",
        title: "Urval och inbjudan",
        actor: "buyer",
        what: "De som klarat kvalificeringen bjuds in att lämna anbud.",
      },
      { ...TENDER_PERIOD, title: "Anbudstid (för inbjudna)" },
      ...ANNOUNCED_TAIL,
    ],
  },

  negotiated: {
    kind: "negotiated",
    name: "Förhandlat förfarande",
    summary:
      "Som ett selektivt förfarande, men med förhandling om anbuden innan tilldelning. " +
      "Används när behovet inte går att beskriva tillräckligt exakt i förväg.",
    stages: [
      ANNOUNCEMENT,
      {
        id: "application",
        title: "Ansökan om att få delta",
        actor: "supplier",
        what: "Leverantörer ansöker och kvalificeringen prövas.",
        yourMove:
          "Ansök även om du är osäker på om du vill lämna anbud. Ansökan binder dig inte, " +
          "men utan den är du utanför när förhandlingen börjar.",
      },
      { ...TENDER_PERIOD, title: "Inledande anbud" },
      {
        id: "negotiation",
        title: "Förhandling",
        actor: "buyer",
        what:
          "Anbuden förhandlas, ofta i flera omgångar. De obligatoriska kraven och " +
          "tilldelningskriterierna får däremot inte förhandlas bort.",
        yourMove:
          "Räkna om efter varje omgång. Det som förhandlas är oftast omfattning och villkor, " +
          "och båda flyttar kalkylen.",
      },
      {
        id: "final_tender",
        title: "Slutligt anbud",
        actor: "supplier",
        what: "Efter avslutad förhandling lämnas ett slutligt anbud som utvärderas.",
      },
      ...ANNOUNCED_TAIL,
    ],
  },

  simplified: {
    kind: "simplified",
    name: "Förenklat förfarande",
    summary:
      "Ett annonserat förfarande under tröskelvärdena med enklare regler. Alla får lämna " +
      "anbud, och organisationen får förhandla med anbudsgivarna.",
    stages: [
      ANNOUNCEMENT,
      TENDER_PERIOD,
      {
        id: "negotiation_optional",
        title: "Eventuell förhandling",
        actor: "buyer",
        what:
          "Organisationen får förhandla med en eller flera anbudsgivare, men måste behandla " +
          "dem lika. Förhandling är en möjlighet, inte ett krav.",
      },
      ...ANNOUNCED_TAIL,
    ],
  },

  direct_award: {
    kind: "direct_award",
    name: "Direktupphandling",
    summary:
      "Ingen annonsering krävs. Organisationen får vända sig direkt till en eller flera " +
      "leverantörer — men får inte köpa hur som helst, och beslutet är alltid köparens.",
    stages: [
      {
        id: "buyer_decision",
        title: "Köparen avgör förutsättningarna",
        actor: "buyer",
        what:
          "Organisationen bedömer om direktupphandling är tillåten: värdet mot " +
          "direktupphandlingsgränsen, och om ett befintligt avtal redan styr köpet.",
        pitfall:
          "Ingen leverantör kan kräva en direktupphandling. Att förutsättningarna ser " +
          "uppfyllda ut ger ingen rätt till uppdraget.",
      },
      {
        id: "contact",
        title: "Kontakt och förfrågan",
        actor: "supplier",
        what:
          "Organisationen frågar en eller flera leverantörer. Många har riktlinjer om att ta " +
          "in fler än en offert även när lagen inte kräver det.",
        yourMove:
          "Se till att vara känd och sökbar hos köparen innan behovet uppstår. Den som inte " +
          "finns i deras leverantörsregister blir inte tillfrågad.",
      },
      {
        id: "award",
        title: "Beslut och avtal",
        actor: "buyer",
        what:
          "Organisationen väljer leverantör och tecknar avtal. Någon avtalsspärr krävs " +
          "normalt inte vid direktupphandling.",
      },
    ],
  },

  framework_call_off: {
    kind: "framework_call_off",
    name: "Avrop från ramavtal",
    summary:
      "Köpet sker inom ett avtal som redan är upphandlat. Ingen ny upphandling görs — " +
      "villkoren är satta, och det som avgör är ramavtalets egen avropsordning.",
    stages: [
      {
        id: "which_model",
        title: "Avropsordningen avgör",
        actor: "buyer",
        what:
          "Ramavtalet anger hur avrop går till: rangordning, där den högst rangordnade " +
          "tillfrågas först, eller förnyad konkurrensutsättning, där de anslutna " +
          "leverantörerna får lämna nya anbud.",
        pitfall:
          "Skillnaden avgör om du har något att göra alls. Vid rangordning finns ingen tävling " +
          "att delta i — turen kommer eller kommer inte.",
      },
      {
        id: "call_off",
        title: "Avropet",
        actor: "supplier",
        what:
          "Vid rangordning: den först rangordnade svarar på förfrågan. Vid förnyad " +
          "konkurrensutsättning: samtliga anslutna leverantörer inbjuds att lämna anbud på " +
          "det enskilda köpet.",
        yourMove:
          "Vid förnyad konkurrensutsättning gäller ramavtalets villkor som tak — du kan " +
          "erbjuda bättre, aldrig sämre.",
      },
      {
        id: "call_off_contract",
        title: "Avtal om avropet",
        actor: "buyer",
        what: "Kontrakt tecknas inom ramavtalet, på ramavtalets villkor.",
      },
    ],
  },

  dynamic_purchasing_system: {
    kind: "dynamic_purchasing_system",
    name: "Dynamiskt inköpssystem",
    summary:
      "Ett öppet system man ansöker om att bli antagen till. Ansökan tas emot löpande under " +
      "hela giltighetstiden — man behöver alltså inte vänta på nästa upphandling.",
    stages: [
      {
        id: "admission",
        title: "Ansökan om antagning",
        actor: "supplier",
        what:
          "Leverantörer ansöker löpande. Den som uppfyller kvalificeringskraven ska antas, " +
          "och antagningen är inte begränsad till ett visst antal.",
        yourMove:
          "Ansök så snart du uppfyller kraven. Antagningen är inte köpet — den är biljetten " +
          "till att få vara med när köpen kommer.",
      },
      {
        id: "dps_call_off",
        title: "Avrop inom systemet",
        actor: "buyer",
        what:
          "När ett behov uppstår inbjuds samtliga antagna leverantörer att lämna anbud på det " +
          "enskilda köpet.",
        pitfall:
          "Antagen betyder inte tilldelad. Varje avrop är en egen tävling mellan de antagna.",
      },
      ...ANNOUNCED_TAIL.filter((s) => s.id !== "opening"),
    ],
  },

  concession: {
    kind: "concession",
    name: "Koncession",
    summary:
      "Leverantören får rätten att driva verksamheten och ta betalt av dem som använder den, " +
      "i stället för en ersättning från köparen. Verksamhetsrisken ligger därmed hos " +
      "leverantören.",
    stages: [
      ANNOUNCEMENT,
      {
        ...TENDER_PERIOD,
        pitfall:
          "Kalkylen ser annorlunda ut än i en vanlig upphandling: intäkten kommer från " +
          "användarna och är inte garanterad. Risken är en del av det du åtar dig.",
      },
      ...ANNOUNCED_TAIL,
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Ordlistan                                                           */
/* ------------------------------------------------------------------ */

export interface GlossaryEntry {
  term: string;
  plain: string;
  /** Varför det spelar roll för just en anbudsgivare. */
  whyItMatters?: string;
}

/**
 * Orden som står mellan en företagare och en begriplig upphandling.
 *
 * Urvalet är gjort efter en enda regel: bara ord som *förekommer i systemets
 * egna svar*. En ordlista som förklarar termer produkten aldrig använder är
 * dekoration; den här ska gå att slå upp i när något i gränssnittet är oklart.
 */
export const GLOSSARY: GlossaryEntry[] = [
  {
    term: "Obligatoriskt krav (skallkrav)",
    plain: "Ett krav som måste vara uppfyllt för att anbudet ska prövas alls.",
    whyItMatters:
      "Ett missat obligatoriskt krav gör anbudet ogiltigt oavsett hur bra resten är. Gå igenom " +
      "dem innan du lägger tid på priset.",
  },
  {
    term: "Tilldelningskriterier",
    plain: "Det som avgör vilket av de godkända anbuden som vinner — pris, kvalitet, miljö.",
    whyItMatters:
      "Vikterna säger vad som betyder mest, men inte hur kronor blir poäng. Den formeln står " +
      "separat i underlaget, och utan den går anbudet inte att räkna på.",
  },
  {
    term: "Utvärderingspris",
    plain:
      "Det belopp anbuden faktiskt jämförs med, efter att kvalitet räknats om till kronor.",
    whyItMatters:
      "Skiljer sig från anbudspriset i en mervärdesmodell. Det är därför ett dyrare anbud kan " +
      "vinna.",
  },
  {
    term: "Tilldelningsbeslut",
    plain: "Köparens besked om vem som vunnit och varför. Går till alla som lämnat anbud.",
    whyItMatters: "Det startar avtalsspärren — och därmed klockan för en eventuell överprövning.",
  },
  {
    term: "Avtalsspärr",
    plain:
      "Perioden efter tilldelningsbeslutet då avtal inte får tecknas. Tio dagar vid " +
      "elektroniskt utskick, femton annars.",
    whyItMatters:
      "Det enda fönstret för att få upphandlingen överprövad. När det stängts är den rätten " +
      "förlorad.",
  },
  {
    term: "Överprövning",
    plain:
      "Att be förvaltningsrätten pröva om upphandlingen gått rätt till, innan avtal tecknas.",
    whyItMatters:
      "Ansökan ska ha kommit in innan avtalsspärren löper ut. Att den skickats i tid räcker inte.",
  },
  {
    term: "Ramavtal",
    plain:
      "Ett avtal som sätter villkoren i förväg. Köpen görs sedan som avrop, utan ny upphandling.",
    whyItMatters:
      "Under avtalstiden är marknaden stängd för den som inte är med. Det är därför en " +
      "avtalsutgång är mer intressant än en annons.",
  },
  {
    term: "Avrop",
    plain: "Ett enskilt köp inom ett befintligt ramavtal.",
    whyItMatters:
      "Hur det går till — rangordning eller förnyad konkurrensutsättning — avgör om du kan " +
      "påverka utgången.",
  },
  {
    term: "Rangordning",
    plain:
      "En ordning mellan ramavtalsleverantörerna. Den först rangordnade tillfrågas först.",
    whyItMatters:
      "Är du rangordnad etta för ett behov har du en verklig rätt till avropet — en av få " +
      "situationer där ordet rätt är befogat.",
  },
  {
    term: "Förnyad konkurrensutsättning",
    plain: "Att ramavtalets leverantörer får tävla om ett enskilt avrop.",
    whyItMatters: "Ramavtalets villkor är ett tak: du kan erbjuda bättre, aldrig sämre.",
  },
  {
    term: "Dynamiskt inköpssystem (DIS)",
    plain: "Ett öppet system med löpande antagning, som man ansöker till när som helst.",
    whyItMatters:
      "En av få vägar in mitt i en avtalsperiod — man behöver inte vänta på nästa upphandling.",
  },
  {
    term: "Direktupphandling",
    plain:
      "Ett köp utan annonsering, tillåtet under en beloppsgräns eller i vissa särskilda fall.",
    whyItMatters:
      "Ingen leverantör kan kräva en direktupphandling. Det är alltid köparens beslut.",
  },
  {
    term: "Direktupphandlingsgräns",
    plain: "Beloppet under vilket ett köp får direktupphandlas.",
    whyItMatters:
      "Ligger värdet nära gränsen avgörs frågan av exakt hur köpet räknas — och då finns " +
      "sällan ett säkert svar i förväg.",
  },
  {
    term: "Kvalificering",
    plain:
      "Prövningen av leverantören som sådan: ekonomi, kapacitet, erfarenhet, tillstånd.",
    whyItMatters:
      "Skiljer sig från utvärderingen av anbudet. Man kan vara kvalificerad och ändå förlora, " +
      "och okvalificerad även med det bästa priset.",
  },
  {
    term: "Åberopa annans kapacitet",
    plain:
      "Att stödja sig på ett annat företags resurser — moderbolag, underleverantör, partner — " +
      "för att uppfylla ett krav.",
    whyItMatters:
      "Gör att ett krav du inte klarar själv ändå kan uppfyllas. Åtagandet måste kunna visas, " +
      "och resurserna faktiskt stå till förfogande.",
  },
];
