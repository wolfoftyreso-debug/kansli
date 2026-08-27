import type { MessageKey } from "./en.ts";

export const NO: Record<MessageKey, string> = {
  "chrome.rooms": "Rom",
  "chrome.services": "Tjenester",
  "chrome.signIn": "Logg inn",
  "chrome.signOut": "Logg ut",
  "chrome.signedOut": "ikke innlogget",
  "chrome.switchOrg": "Bytt selskap",
  "chrome.menu": "Meny",
  "chrome.language": "Språk",
  "chrome.orgs": "Selskaper",
  "chrome.skipToContent": "Hopp til innholdet",
  "chrome.roomsMobile": "Rom, mobil",

  "runtime.production": "produksjon",
  "runtime.preview": "forhåndsvisning",
  "runtime.local": "lokal",

  "home.hello": "Hei",
  "home.helloNamed": "Hei, {name}",
  "home.roleAdmin": "Systemadministrator",
  "home.roleOpen": "Åpen flate",
  "home.programs": "Programmer · {count} installert",
  "home.openKansli": "Åpne Kansli",
  "home.documentation": "Dokumentasjon",
  "home.metaDescription": "Ett rom per jobb. Samme innlogging.",

  "service.platform": "Plattform",
  "service.ops": "Drift",
  "service.events": "Hendelser",
  "service.procurement": "Anskaffelse",
  "service.intake": "Ny kunde",
  "service.docs": "Dokumentasjon",

  "category.kansli": "Start",
  "category.ekonomi": "Bok",
  "category.tora": "Anskaffelse",
  "category.rita": "Skatt",
  "category.britt": "Oppfølging",
  "category.irma": "Avtaler",
  "category.tyra": "Dekkhotell",
  "category.alva": "Diagnose",
  "category.creditae": "Kreditt",
  "category.maj": "Søk",

  "idp.title": "Logg inn · Pixdrift",
  "idp.heading": "Innlogging",
  "idp.email": "E-post",
  "idp.password": "Passord",
  "idp.submit": "Logg inn",
  "idp.noAccount": "Ingen konto?",
  "idp.requestAccess": "Be om tilgang via konsernanskaffelse",
  "idp.wrongCredentials": "Feil e-post eller passord.",
  "idp.tooManyAttempts": "For mange forsøk. Prøv igjen om et øyeblikk.",
  "idp.errorTitle": "Feil",
  "idp.errorHeading": "Forespørselen kan ikke behandles",
  "idp.loginUnavailable": "Innlogging er ikke tilgjengelig akkurat nå",
  "idp.loginUnavailableBody":
    "Vi nådde ikke innloggingen. Prøv igjen om et øyeblikk, eller gå tilbake til {home}.",
  "idp.home": "startsiden",
  "idp.pkceRequired": "PKCE (S256) kreves",
  "idp.demo": "Demo: {email} / {password}",

  "common.missing": "mangler",
  "common.all": "Alle",
  "common.loading": "Laster…",
  "common.saving": "Lagrer…",
  "common.configured": "konfigurert · {auth}",
  "common.missingKey": "mangler nøkkel",

  "alva.metaTitle": "ALVA — Pixdrift",
  "alva.metaDescription": "Kundens feil, notater og målinger. Diagnosen kommer senere.",
  "alva.lead":
    "ALVA tar imot det kunden sa, det dere noterte og det som ble målt. Diagnosen kobles inn senere. Systemet stiller ingen diagnose selv.",
  "alva.notice":
    "Diagnosen er ikke koblet inn ennå. Dere kan fylle et tomt protokoll med egne fakta. Systemet finner aldri på noe.",
  "alva.signInTitle": "Logg inn for å registrere saker",
  "alva.signInBody": "Saken lagres i ALVA. Logg inn for å registrere.",
  "alva.newCase": "Ny sak",
  "alva.complaint": "Kundens beskrivelse",
  "alva.vehicleRef": "Kjøretøyreferanse (valgfritt)",
  "alva.area": "Område (valgfritt, f.eks. bremser)",
  "alva.mileage": "Kilometerstand km (valgfritt)",
  "alva.desiredOutcome": "Ønsket utfall (valgfritt)",
  "alva.register": "Registrer sak",
  "alva.cases": "Saker",
  "alva.empty": "Ingen saker ennå.",
  "alva.status.open": "Åpen",
  "alva.status.in_progress": "Pågår",
  "alva.status.closed": "Lukket",
  "alva.detailMetaTitle": "Sak — ALVA — Pixdrift",
  "alva.detailSignInTitle": "Logg inn for å se saken",
  "alva.detailSignInBody": "Saken tilhører organisasjonen.",
  "alva.detailNotice": "Dere fyller inn fakta selv. Systemet trekker ingen egne slutninger.",
  "alva.vehicleRefShort": "Kjøretøyreferanse",
  "alva.areaShort": "Område",
  "alva.mileageShort": "Kilometerstand",

  "creditae.metaTitle": "CREDITAE — Pixdrift",
  "creditae.metaDescription":
    "Kredittvurdering av en motpart. Deres konklusjon, ingen funnet karakter.",
  "creditae.lead":
    "CREDITAE tar imot hvem dere skal vurdere og hva dere selv kom fram til. Systemet setter ingen kredittkarakter.",
  "creditae.noticeOn":
    "Kreditt på. Byråets rapport hentes når forespørselen registreres. Konklusjonen er fortsatt deres.",
  "creditae.noticeOff":
    "Kreditt av. Ingen kredittbyrå er koblet inn. Vurderingen er deres. Systemet finner aldri på en karakter.",
  "creditae.signInTitle": "Logg inn for å vurdere en motpart",
  "creditae.signInBody": "Forespørselen lagres i CREDITAE. Logg inn for å registrere.",
  "creditae.newInquiry": "Ny forespørsel",
  "creditae.orgNumber": "Organisasjonsnummer",
  "creditae.companyName": "Selskapsnavn (valgfritt)",
  "creditae.reason": "Hvorfor dere vurderer (valgfritt)",
  "creditae.register": "Registrer forespørsel",
  "creditae.inquiries": "Forespørsler",
  "creditae.empty": "Ingen forespørsler ennå.",
  "creditae.status.open": "Åpen",
  "creditae.status.assessed": "Vurdert",
  "creditae.assess.go": "Kjør",
  "creditae.assess.watch": "Følg",
  "creditae.assess.stop": "Stans",
  "creditae.vendor.blocked": "Kreditt av",
  "creditae.vendor.failed": "Ingen rapport",
  "creditae.vendor.fetched": "Rapport inne",
  "creditae.domain": "Nettsted (valgfritt)",
  "creditae.domainField": "Nettsted",
  "creditae.web": "Nettnærvær",
  "creditae.webNoticeOn":
    "Nettdata på. Synligheten hentes fra kilden når du trykker på knappen. Tallene er leverandørens, ordrett.",
  "creditae.webNoticeOff": "Nettdata av. Ingen nettdatakilde er koblet til. Ingenting hentes.",
  "creditae.web.blocked": "Nettdata av",
  "creditae.web.failed": "Ingen nettdata",
  "creditae.web.fetched": "Nettdata inne",
  "creditae.webRank": "Leverandørens rangering",
  "creditae.webKeywords": "Organiske søkeord",
  "creditae.webTraffic": "Organisk trafikk, leverandørens anslag",
  "creditae.webAds": "Betalte søkeord",
  "creditae.webFetch": "Hent nettdata",
  "creditae.webWhyMissing": "Hvorfor dataene mangler",
  "creditae.webNotConclusion": "Det er leverandørens tall, ikke deres konklusjon.",
  "creditae.detailMetaTitle": "Forespørsel — CREDITAE — Pixdrift",
  "creditae.detailSignInTitle": "Logg inn for å se forespørselen",
  "creditae.detailSignInBody": "Forespørselen tilhører organisasjonen.",
  "creditae.detailNoticeOn":
    "Dere fyller inn konklusjonen selv. Byråets felt er ikke deres vurdering.",
  "creditae.detailNoticeOff":
    "Dere fyller inn konklusjonen selv. Systemet setter ingen kredittkarakter.",
  "creditae.why": "Hvorfor",
  "creditae.bureau": "Kredittbyrået",
  "creditae.vendorName": "Navn hos byrået",

  "kansli.metaTitle": "Kansli — Pixdrift",
  "kansli.metaDescription": "Startsiden. Oppgaver og veien inn.",
  "kansli.lead":
    "Her begynner det. Samme innlogging i alle systemer, og et oppgavetavle for det interne.",
  "kansli.signInTitle": "Logg inn med Pixdrift",
  "kansli.signInBody": "Samme innlogging gjelder TORA, RITA, BRITT, IRMA og ALVA.",
  "kansli.firstCustomer": "Første kunde — en sjekkliste, ikke en dato",
  "kansli.groupProcurement": "Konsernanskaffelse",
  "kansli.family": "Familien",
  "kansli.map": "Kartet",
  "kansli.mapLead": "Hva hvert system gjør, og hvordan de henger sammen.",
  "kansli.recentEvents": "Siste hendelser",
  "kansli.notice":
    "Når en oppgave opprettes, får BRITT noe å følge opp. Kansli eier fortsatt oppgaven.",

  "tasks.summary": "Oppgavetavle — {open} åpne, {done} ferdige.",
  "tasks.titlePlaceholder": "Ny oppgave…",
  "tasks.titleAria": "Oppgavens tittel",
  "tasks.ownerPlaceholder": "Ansvarlig",
  "tasks.ownerAria": "Ansvarlig",
  "tasks.add": "Legg til",
  "tasks.empty": "Ingen oppgaver ennå. Legg til den første ovenfor.",
  "tasks.remove": "Fjern",
  "tasks.markDone": 'Merk "{title}" som ferdig',
  "tasks.removeNamed": 'Fjern "{title}"',
  "tasks.fetchError": "Kunne ikke hente oppgaver.",
  "tasks.saveError": "Kunne ikke lagre oppgaven.",
  "tasks.updateError": "Kunne ikke oppdatere oppgaven.",
  "tasks.deleteError": "Kunne ikke fjerne oppgaven.",
  "tasks.genericError": "Noe gikk galt.",
  "tasks.emptyTitle": "Tittelen kan ikke være tom.",

  "platform.metaTitle": "Plattform — Pixdrift",
  "platform.metaDescription": "Hva hvert system gjør, og hvordan de henger sammen.",
  "platform.heading": "Hva hvert system gjør",
  "platform.notice":
    "Hvert system gjør én jobb. TORA tar anskaffelser. RITA tar skatt. De blandes ikke.",
  "platform.systems": "Systemene",
  "platform.howTheyConnect": "Hvordan de henger sammen",
  "platform.moreSystems": "Flere systemer",
  "platform.waiting": "Venter på å bli koblet inn",
  "platform.tech": "Teknikk — for den som driver driften",
  "platform.gateway": "Modellgateway",
  "platform.gatewayLead":
    "Én nøkkel gir tilgang til mer enn 100 modeller. Husk: systemets svar er gjetninger, ikke fakta.",
  "platform.gatewayHint": "Sett {key} i Secrets eller {oidc} på Vercel.",

  "family.status.operational": "I gang",
  "family.status.pilot": "På vei",
  "family.status.deferred": "Ikke klart ennå",
  "family.principle":
    "Samme innlogging i alle systemer. Hvert system gjør sitt. TORA tar anskaffelser. RITA tar skatt. De blandes ikke.",
  "family.incoming":
    "Flere systemer er på vei. De får samme innlogging og egne data. Navn kommer når de er klare — ikke før.",
  "family.party.products": "alle produkter",
  "family.party.events": "hendelseslisten",
  "family.identity.mission": "Én innlogging til alle systemer.",
  "family.kansli.mission": "Startsiden. Oppgaver og veien inn.",
  "family.ekonomi.mission": "Fakturaer, merverdiavgift og hvordan pengene kom inn.",
  "family.tora.mission": "Hvilke anskaffelser nettopp deres selskap kan ta.",
  "family.rita.mission": "Leter etter skattebesparelser i bøkene deres.",
  "family.britt.mission": "Det som har skjedd og trenger oppfølging.",
  "family.irma.mission": "Send en avtale, se om den er lest og bekreftet.",
  "family.tyra.mission": "Kunde, bil, hjul og hva som skal gjøres nå.",
  "family.alva.mission": "Kundens feil, notater og målinger. Diagnosen kommer senere.",
  "family.creditae.mission":
    "Kredittvurdering av en motpart. Deres konklusjon, ingen funnet karakter.",
  "family.identity.question": "Hvem er du, og hvilket selskap gjelder det?",
  "family.identity.does":
    "Du logger inn én gang. Deretter er du inne i Kansli, TORA, RITA og de andre.",
  "family.identity.doesNot":
    "Her sendes ingen fakturaer, og det finnes ingen ekstra kode i mobilen ennå.",
  "family.kansli.question": "Hvor begynner jeg, og hva skal vi gjøre internt?",
  "family.kansli.does": "Innlogging, intern oppgavetavle og skjemaet for nye kunder.",
  "family.kansli.doesNot":
    "Kansli regner ikke på anskaffelse, skatt eller dekk. Det gjør de andre systemene.",
  "family.ekonomi.question": "Hva er bokført, hva er forfalt, og hvordan kom pengene inn?",
  "family.ekonomi.does":
    "Skriver en faktura på 10 dager, bokfører i øre, kobler Stripe og Revolut, matcher innbetalinger når banken er tilkoblet.",
  "family.ekonomi.doesNot":
    "Ikke Visma. Ikke Fortnox. Ingen påfunnet innbetaling. Kort krever Stripe. Swish krever at Swish er koblet inn.",
  "family.tora.question": "Kan vi gi tilbud her — og hva skal vi gjøre nå?",
  "family.tora.does":
    "Sammenligner selskapet med anskaffelsene: krav, hull, beløp, datoer og neste steg.",
  "family.tora.doesNot": "Ser ikke i regnskapet. Det gjør RITA.",
  "family.rita.question": "Hvilke fradrag, merverdiavgift og andre hull sitter i årsregnskapet?",
  "family.rita.does":
    "Leser årsregnskapet mot svenske skatteregler og etterlater forslag å sjekke. Ikke skatteråd.",
  "family.rita.doesNot":
    "Finner ikke på resultater. Sier ikke om dere får gi tilbud. Ingen kundefil å laste opp ennå.",
  "family.britt.question": "Hva trenger dere å gjøre nå, ut fra det som allerede har skjedd?",
  "family.britt.does": "Samler ting som må følges opp. Én ting om gangen, med neste steg.",
  "family.britt.doesNot": "BRITT er ikke et saksystem og ikke en prat.",
  "family.irma.question": "Har motparten lest og bekreftet avtalen?",
  "family.irma.does": "Sender avtalen. Viser om den er åpnet, signert eller avvist.",
  "family.irma.doesNot": "IRMA er ikke e-post og ikke et arkiv for alle dokumenter.",
  "family.tyra.question": "Hvilken kunde, hvilken bil, hvilke hjul — og hva er neste steg?",
  "family.tyra.does":
    "Holder kunde, kjøretøy og dekk samlet. Viser når det er på tide å bytte eller hente.",
  "family.tyra.doesNot": "TYRA er ikke et allment kunderegister for andre bransjer.",
  "family.alva.question": "Hva sa kunden, hva ble målt — og hva er neste steg?",
  "family.alva.does":
    "Tar imot det som er sagt og målt. Viser notatet. Stiller ingen diagnose selv.",
  "family.alva.doesNot": "ALVA stiller ingen diagnose og gir ingen råd.",
  "family.creditae.question": "Hvem skal vi vurdere — og hva kom dere fram til?",
  "family.creditae.does":
    "Tar imot organisasjonsnummer og deres vurdering. Henter byråets rapport via plattformens kredittkanal når den er koblet inn. Kjør, følg eller stans.",
  "family.creditae.doesNot":
    "CREDITAE setter ingen kredittkarakter. Produktet kaller ikke Creditsafe.",
  "family.maj.mission": "Mål, analyser, juster. Søkesynlighet som beslutninger, ikke dashbord.",
  "family.maj.question": "Hva har endret seg i søk — og hva bør vi gjøre med det?",
  "family.maj.does":
    "Tar et domene, et marked og et mål. Overvåker søkedata gjennom plattformens kanaler, veier bevisene og foreslår en kort kø av beslutninger med fullt proveniensspor. Hver utført endring publiseres som en versjonert release.",
  "family.maj.doesNot":
    "MAJ kjøper aldri lenker, forfalsker aldri omtaler og rører aldri konkurrenters ressurser. Den viser beslutninger, ikke leverandørmetrikk — kunden trenger aldri å forstå datakildene.",
  "family.stack.language": "Språk",
  "family.stack.language.runs":
    "TypeScript 5 i hele systemet. SQL i databasen. RITAs analyse kjører som et eget program. ekonomi-ledger sjekker bilag, poster ikke i drift.",
  "family.stack.web": "Nett",
  "family.stack.web.runs":
    "Next.js 16.3 App Router, React 19.2, Tailwind CSS 4. Én prosess: nettsted, /idp, produkter og API.",
  "family.stack.identity": "Identitet",
  "family.stack.identity.runs":
    "Egen innlogging, bygget på åpen standard. Én informasjonskapsel holder dere innlogget. Samme innlogging i alle systemer.",
  "family.stack.data": "Data",
  "family.stack.data.runs":
    "PostgreSQL 16. Hvert system har egne data. Ingen systemer skriver i et annet systems data.",
  "family.stack.analysis": "Analyse",
  "family.stack.analysis.runs":
    "TORA regner i samme prosess. RITA kaller en egen analyse. Ingen påfunnede resultater i drift.",
  "family.stack.automation": "Automatisering",
  "family.stack.automation.runs":
    "Modeller går via Vercel-gatewayen. Svaret er en gjetning, ikke fakta.",
  "family.stack.ops": "Drift og test",
  "family.stack.ops.runs":
    "Kjører på Vercel. Tester mot Postgres 16. Ingen AWS SDK i dette systemet.",
  "family.link.identity.products": "Én innlogging. Produktene leser ikke hverandres brukerlister.",
  "family.link.identity.events":
    "Vellykket innlogging skrives i loggen. Det er en kvittering, ikke en oppgave å følge opp.",
  "family.link.tora.britt": "Bare når noen publiserer. Å lese markedet skaper ingen hendelse.",
  "family.link.rita.britt":
    "BRITT får selskapsnavn, hvor mange treff det ble og om automatisering var med. Ikke forslagene selv — de blir i RITA.",
  "family.link.irma.britt": "Avtale opprettet, åpnet, bekreftet eller trukket tilbake.",
  "family.link.tyra.britt":
    "En sak, en kundelenke eller en påminnelse i kø. En stoppet kø betyr ikke sendt.",
  "family.link.alva.britt": "En sak er registrert. Ingen diagnose følger før den er koblet inn.",
  "family.link.creditae.britt":
    "En motpart er registrert, dere har skrevet konklusjonen, eller byråets rapport kom inn eller stanset. Ingen påfunnet karakter følger.",
  "family.link.ekonomi.britt":
    "En utstedt faktura, en bokført innbetaling eller en Revolut-henting som ikke gikk.",
  "family.link.ekonomi.revolut":
    "Banktilkoblingens livssyklus. Vanlig fornyelse logges som drift, ikke som noe å følge opp.",
  "family.link.ekonomi.invoice": "Et utkast vises i loggen. Ingen bokføring før utstedelse.",
  "family.link.kansli.task": "En intern oppgave vises hos BRITT. Kansli eier fortsatt oppgaven.",
  "family.link.kansli.intake":
    "En søknad har kommet inn, eller en verkstedkonto er opprettet til demoen.",
  "family.link.britt.finding":
    "De viktigste treffene fra eksempelanalysen blir ting å følge opp. Resten blir i BRITT.",
  "family.link.britt.events": "Hver ting å følge opp skrives også i hendelseslisten.",
  "family.blocked.rita":
    "RITAs analyse må være koblet inn (på Vercel via URL, lokalt via programfilen) før analyser kan kjøre.",
  "family.blocked.alva":
    "Den veiledede diagnosen kobles inn når den er klar. Saken kan registreres allerede nå.",
  "family.blocked.irma":
    "IRMA blir hos oss: en enkel digital bekreftelse og en egen lenke. Ingen juridisk e-signatur ennå.",
  "family.blocked.britt":
    "Fortnox, Revolut og BRITTs profiler hvis eksempelanalysen skal bli hele produktet.",
  "family.blocked.ekonomi":
    "Stripe, Revolut og Swish når dere vil ta betalt den veien. Faktura på 10 dager virker uten dem.",
  "family.blocked.creditae":
    "CREDITAE går via plattformens kredittkanal. Produkter kaller ikke Creditsafe. Uten nøkkel hentes ingen rapport. Vurderingen er fortsatt deres.",
  "tyra.metaTitle": "TYRA — Pixdrift",
  "tyra.metaDescription": "Kunde, bil, hjul og hva som skal gjøres nå.",
  "tyra.heading": "Hvilket kjøretøy skal inn?",
  "tyra.lead":
    "TYRA holder kunde, bil og hjul samlet. Dekk selges her — ett klikk bokfører fakturaen i Ekonomi. Beløpene er deres egne tall. Ingen live-priser ennå.",
  "tyra.customers": "Kundekort",
  "tyra.integrations": "Integrasjoner",
  "tyra.signInTitle": "Logg inn for å åpne saker",
  "tyra.signInBody": "Samme innlogging som resten av Pixdrift. Ingen ekstra konto for verkstedet.",
  "tyra.notice":
    "Påminnelser legges i kø men sendes ikke ennå — det mangler en kobling til SMS og e-post. Ingen live-dekkpriser.",
  "ekonomi.metaTitle": "Ekonomi — Pixdrift",
  "ekonomi.metaDescription": "Fakturaer, merverdiavgift og hvordan pengene kom inn.",
  "ekonomi.heading": "Hva er bokført?",
  "ekonomi.lead":
    "Bokfør salg i kroner. Ett klikk utsteder fakturaen. TYRA-tilbud som ikke er bokført ligger i køen. Kunden kan betale med Swish, Stripe eller faktura på 10 dager. Koble Revolut én gang, så hentes kontoutskrifter og betalinger matches. Visma er neste tilkobling — den er ikke her ennå.",
  "ekonomi.signInTitle": "Logg inn for å se boken",
  "ekonomi.signInBody": "Regnskapet tilhører selskapet deres. Logg inn for å se det.",
  "ekonomi.notice":
    "Dere skriver kroner. Boken lagrer øre. Hvert bilag balanserer. Betalinger kjører bare på ekte når koblingene er på plass — ingenting simuleres uten at du har sagt ja.",
  "ekonomi.statements": "Kontoutskrifter",
  "ekonomi.invoices": "Fakturaer",
  "ekonomi.vouchers": "Bilag",
  "ekonomi.reports": "Rapporter / merverdiavgift",
  "ekonomi.connections": "Tilkoblinger",
  "tora.metaTitle": "TORA — Pixdrift",
  "tora.metaDescription": "Hvilke anskaffelser nettopp deres selskap kan ta.",
  "tora.lead":
    "TORA viser hvilke anskaffelser {name} kan gi tilbud på — og hvorfor nettopp dere. Her er hele vurderingen: krav, hull og neste steg.",
  "tora.noticeDemo":
    "Anskaffelsene er eksempler, ikke ekte kunngjøringer. Visningen er en betalt konto, så dere ser navn, beløp og krav. Selskapsfakta er eksempelselskapet til dere lagrer deres egen profil.",
  "tora.noticeSaved":
    "Anskaffelsene er eksempler, ikke ekte kunngjøringer. Visningen er en betalt konto, så dere ser navn, beløp og krav. Selskapsfakta er den lagrede profilen deres ({name}).",
  "tora.calendar": "Kalender",
  "tora.current": "Aktuelt",
  "tora.upcoming": "Kommende",
  "tora.watch": "Følg",
  "tora.publishedValue": "Publisert verdi",
  "tora.yourCompany": "Deres selskap",
  "tora.profileLead": "Uten lagret profil regner vi på eksempelselskapet i stedet for på dere.",
  "tora.frameworks": "Avtaler dere allerede er med på",
  "tora.references": "Referanser TORA regner med",
  "rita.metaTitle": "RITA — Pixdrift",
  "rita.metaDescription": "RITA leter etter skattebesparelser i bøkene deres.",
  "rita.lead":
    "RITA leter etter skattebesparelser i bøkene deres: fradrag, merverdiavgift, K10, pensjon og FoU. Det RITA finner er forslag å sjekke videre — ikke skatteråd.",
  "rita.noticeReady":
    "Analysen kjører. Deler av svaret kommer fra en modell og kan trenge et nytt blikk.",
  "rita.noticeRules": "Analysen kjører, men uten modell akkurat nå. Bare de faste reglene brukes.",
  "rita.noticeBlocked":
    "Analysen er ikke koblet inn ennå, så nye analyser blir stående blokkert. Vi viser aldri påfunnede resultater.",
  "rita.noticeExample":
    "Eksempelregnskapet er et innebygd eksempel — ikke noe en kunde har lastet opp.",
  "rita.signInTitle": "Logg inn for å be om en analyse",
  "rita.signInBody":
    "Analysen lagres i RITA. BRITT får noe å følge opp når en analyse blir ferdig eller stanses.",
  "britt.metaTitle": "BRITT — Pixdrift",
  "britt.metaDescription": "Det som har skjedd og trenger oppfølging.",
  "britt.lead":
    "BRITT samler slikt som trenger oppfølging. Tallene her er eksempler — ingen Fortnox- eller Revolut-koblinger ennå.",
  "britt.noticeDemo": "Tallene her er eksempler for huset, ikke Fortnox og ikke en livekasse.",
  "britt.noticeOwn": "Her følger dere deres egne observasjoner. Eksempeltall kjøres bare på huset.",
  "britt.signInTitle": "Logg inn for å se observasjoner",
  "britt.signInBody":
    "Observasjoner tilhører selskapet deres. Det som skjer i TORA, RITA og IRMA dukker opp her.",
  "irma.metaTitle": "IRMA — Pixdrift",
  "irma.metaDescription": "Send en avtale, se om den er lest og bekreftet.",
  "irma.heading": "Hvilken avtale skal ut?",
  "irma.lead":
    "Med IRMA sender dere avtaler digitalt: opprett, send en lenke, se når motparten har åpnet og bekreftet. Motparten trenger ingen konto. Det er en enkel digital bekreftelse, ikke en juridisk e-signatur. Dokumentarkiv finnes ikke ennå.",
  "irma.signInTitle": "Logg inn for å opprette avtaler",
  "irma.signInBody":
    "Lenken vises bare én gang — kopier den med en gang. Vi lagrer den ikke i lesbar form.",
  "creditae.vendorScore": "Byråets verdi",
  "creditae.vendorLimit": "Byråets grense",
  "creditae.vendorNotConclusion": "Det er byråets felt, ikke deres konklusjon.",
  "creditae.vendorWhyMissing": "Hvorfor rapporten mangler",
  "creditae.notes": "Notat",
  "creditae.yourAssessment": "Deres vurdering",
  "creditae.conclusion": "Konklusjon",
};
