import type { MessageKey } from "./en.ts";

export const SV: Record<MessageKey, string> = {
  "chrome.rooms": "Rum",
  "chrome.services": "Tjänster",
  "chrome.signIn": "Logga in",
  "chrome.signOut": "Logga ut",
  "chrome.signedOut": "inte inloggad",
  "chrome.switchOrg": "Byt bolag",
  "chrome.menu": "Meny",
  "chrome.language": "Språk",
  "chrome.orgs": "Bolag",
  "chrome.skipToContent": "Hoppa till innehållet",
  "chrome.roomsMobile": "Rum, mobil",

  "runtime.production": "produktion",
  "runtime.preview": "förhandsvisning",
  "runtime.local": "lokal",

  "home.hello": "Hej",
  "home.helloNamed": "Hej, {name}",
  "home.roleAdmin": "Systemadministratör",
  "home.roleOpen": "Öppen yta",
  "home.programs": "Program · {count} installerade",
  "home.openKansli": "Öppna Kansli",
  "home.documentation": "Dokumentation",
  "home.metaDescription": "Ett rum per jobb. Samma inloggning.",

  "service.platform": "Plattform",
  "service.ops": "Drift",
  "service.events": "Händelser",
  "service.procurement": "Upphandling",
  "service.intake": "Ny kund",
  "service.docs": "Dokumentation",

  "category.kansli": "Start",
  "category.ekonomi": "Bok",
  "category.tora": "Upphandling",
  "category.rita": "Skatt",
  "category.britt": "Uppföljning",
  "category.irma": "Avtal",
  "category.tyra": "Däckhotell",
  "category.alva": "Diagnos",
  "category.creditae": "Kredit",

  "idp.title": "Logga in · Pixdrift",
  "idp.heading": "Inloggning",
  "idp.email": "E-post",
  "idp.password": "Lösenord",
  "idp.submit": "Logga in",
  "idp.noAccount": "Inget konto?",
  "idp.requestAccess": "Begär åtkomst via koncernupphandling",
  "idp.wrongCredentials": "Fel e-post eller lösenord.",
  "idp.tooManyAttempts": "För många försök. Försök igen om en stund.",
  "idp.errorTitle": "Fel",
  "idp.errorHeading": "Begäran kan inte behandlas",
  "idp.loginUnavailable": "Inloggningen går inte just nu",
  "idp.loginUnavailableBody":
    "Vi kunde inte nå inloggningen. Prova igen om en stund, eller gå tillbaka till {home}.",
  "idp.home": "startsida",
  "idp.pkceRequired": "PKCE (S256) krävs",
  "idp.demo": "Demo: {email} / {password}",

  "common.missing": "saknas",
  "common.all": "Alla",
  "common.loading": "Laddar…",
  "common.saving": "Sparar…",
  "common.configured": "konfigurerad · {auth}",
  "common.missingKey": "saknar nyckel",

  "alva.metaTitle": "ALVA — Pixdrift",
  "alva.metaDescription": "Kundens fel, anteckningar och mätvärden. Diagnosen kommer senare.",
  "alva.lead":
    "ALVA tar emot vad kunden sa, vad ni antecknade och vad som mättes. Diagnosen kopplas in senare. Systemet ställer ingen diagnos själv.",
  "alva.notice":
    "Diagnosen är inte inkopplad än. Ni kan fylla i ett tomt protokoll med egna uppgifter. Systemet hittar aldrig på något.",
  "alva.signInTitle": "Logga in för att registrera ärenden",
  "alva.signInBody": "Ärendet sparas i ALVA. Logga in för att registrera.",
  "alva.newCase": "Nytt fall",
  "alva.complaint": "Kundens beskrivning",
  "alva.vehicleRef": "Fordonsreferens (valfritt)",
  "alva.area": "Område (valfritt, t.ex. bromsar)",
  "alva.mileage": "Mätarställning km (valfritt)",
  "alva.desiredOutcome": "Önskat utfall (valfritt)",
  "alva.register": "Registrera fall",
  "alva.cases": "Fall",
  "alva.empty": "Inga fall ännu.",
  "alva.status.open": "Öppet",
  "alva.status.in_progress": "Pågår",
  "alva.status.closed": "Stängt",
  "alva.detailMetaTitle": "Fall — ALVA — Pixdrift",
  "alva.detailSignInTitle": "Logga in för att se ärendet",
  "alva.detailSignInBody": "Ärendet tillhör organisationen.",
  "alva.detailNotice": "Här fyller ni i fakta själva. Systemet drar inga egna slutsatser.",
  "alva.vehicleRefShort": "Fordonsreferens",
  "alva.areaShort": "Område",
  "alva.mileageShort": "Mätarställning",

  "creditae.metaTitle": "CREDITAE — Pixdrift",
  "creditae.metaDescription": "Kreditbedömning av motpart. Er slutsats, inget påhittat betyg.",
  "creditae.lead":
    "CREDITAE tar emot vem ni ska bedöma och vad ni själva kom fram till. Systemet sätter inget kreditbetyg.",
  "creditae.noticeOn":
    "Kredit på. Byråns rapport hämtas när förfrågan registreras. Er slutsats är fortfarande er.",
  "creditae.noticeOff":
    "Kredit av. Ingen kreditupplysningsbyrå är inkopplad. Bedömningen är er. Systemet hittar aldrig på ett betyg.",
  "creditae.signInTitle": "Logga in för att bedöma en motpart",
  "creditae.signInBody": "Förfrågan sparas i CREDITAE. Logga in för att registrera.",
  "creditae.newInquiry": "Ny förfrågan",
  "creditae.orgNumber": "Organisationsnummer",
  "creditae.companyName": "Bolagsnamn (valfritt)",
  "creditae.reason": "Varför ni bedömer (valfritt)",
  "creditae.register": "Registrera förfrågan",
  "creditae.inquiries": "Förfrågningar",
  "creditae.empty": "Inga förfrågningar ännu.",
  "creditae.status.open": "Öppen",
  "creditae.status.assessed": "Bedömd",
  "creditae.assess.go": "Kör",
  "creditae.assess.watch": "Bevaka",
  "creditae.assess.stop": "Stanna",
  "creditae.vendor.blocked": "Kredit av",
  "creditae.vendor.failed": "Ingen rapport",
  "creditae.vendor.fetched": "Rapport inne",
  "creditae.domain": "Webbplats (frivilligt)",
  "creditae.domainField": "Webbplats",
  "creditae.web": "Webbnärvaro",
  "creditae.webNoticeOn":
    "Webbdata på. Synligheten hämtas från källan när du trycker på knappen. Siffrorna är leverantörens, ordagrant.",
  "creditae.webNoticeOff": "Webbdata av. Ingen webbdatakälla är kopplad. Inget hämtas.",
  "creditae.web.blocked": "Webbdata av",
  "creditae.web.failed": "Ingen webbdata",
  "creditae.web.fetched": "Webbdata inne",
  "creditae.webRank": "Leverantörens rank",
  "creditae.webKeywords": "Organiska sökord",
  "creditae.webTraffic": "Organisk trafik, leverantörens skattning",
  "creditae.webAds": "Betalda sökord",
  "creditae.webFetch": "Hämta webbdata",
  "creditae.webWhyMissing": "Varför datan saknas",
  "creditae.webNotConclusion": "Det är leverantörens siffror, inte er slutsats.",
  "creditae.detailMetaTitle": "Förfrågan — CREDITAE — Pixdrift",
  "creditae.detailSignInTitle": "Logga in för att se förfrågan",
  "creditae.detailSignInBody": "Förfrågan tillhör organisationen.",
  "creditae.detailNoticeOn": "Här fyller ni i slutsatsen själva. Byråns fält är inte er bedömning.",
  "creditae.detailNoticeOff":
    "Här fyller ni i slutsatsen själva. Systemet sätter inget kreditbetyg.",
  "creditae.why": "Varför",
  "creditae.bureau": "Kreditbyrån",
  "creditae.vendorName": "Namn hos byrån",

  "kansli.metaTitle": "Kansli — Pixdrift",
  "kansli.metaDescription": "Startsidan. Uppgifter och vägen in.",
  "kansli.lead":
    "Här börjar allt. Samma inloggning i alla system, och en egen uppgiftstavla för det interna.",
  "kansli.signInTitle": "Logga in med Pixdrift",
  "kansli.signInBody": "Samma inloggning gäller TORA, RITA, BRITT, IRMA och ALVA.",
  "kansli.firstCustomer": "Första kunden — checklista, inte datum",
  "kansli.groupProcurement": "Koncernupphandling",
  "kansli.family": "Familjen",
  "kansli.map": "Kartan",
  "kansli.mapLead": "Vad varje system gör, och hur de hänger ihop.",
  "kansli.recentEvents": "Senaste händelser",
  "kansli.notice":
    "När en uppgift skapas får BRITT en sak att följa upp. Kansli äger fortfarande uppgiften.",

  "tasks.summary": "Uppgiftstavla — {open} öppna, {done} klara.",
  "tasks.titlePlaceholder": "Ny uppgift…",
  "tasks.titleAria": "Uppgiftens titel",
  "tasks.ownerPlaceholder": "Ansvarig",
  "tasks.ownerAria": "Ansvarig",
  "tasks.add": "Lägg till",
  "tasks.empty": "Inga uppgifter ännu. Lägg till den första ovan.",
  "tasks.remove": "Ta bort",
  "tasks.markDone": 'Markera "{title}" som klar',
  "tasks.removeNamed": 'Ta bort "{title}"',
  "tasks.fetchError": "Kunde inte hämta uppgifter.",
  "tasks.saveError": "Kunde inte spara uppgiften.",
  "tasks.updateError": "Kunde inte uppdatera uppgiften.",
  "tasks.deleteError": "Kunde inte ta bort uppgiften.",
  "tasks.genericError": "Något gick fel.",
  "tasks.emptyTitle": "Titeln får inte vara tom.",

  "platform.metaTitle": "Plattform — Pixdrift",
  "platform.metaDescription": "Vad varje system gör, och hur de hänger ihop.",
  "platform.heading": "Vad varje system gör",
  "platform.notice":
    "Varje system gör ett jobb. TORA tar upphandlingar. RITA tar skatt. De blandas inte.",
  "platform.systems": "Systemen",
  "platform.howTheyConnect": "Hur de hänger ihop",
  "platform.moreSystems": "Fler system",
  "platform.waiting": "Väntar på att kopplas in",
  "platform.tech": "Teknik — för den som sköter driften",
  "platform.gateway": "Modellgateway",
  "platform.gatewayLead":
    "En nyckel ger tillgång till över 100 modeller. Kom ihåg: systemets svar är gissningar, inte fakta.",
  "platform.gatewayHint": "Sätt {key} i Secrets eller {oidc} på Vercel.",

  "family.status.operational": "Igång",
  "family.status.pilot": "På väg",
  "family.status.deferred": "Inte klart än",
  "family.principle":
    "Samma inloggning i alla system. Varje system sköter sitt. TORA tar upphandlingar. RITA tar skatt. De blandas inte.",
  "family.incoming":
    "Fler system är på väg. De får samma inloggning och egna uppgifter. Namn kommer när de är redo — inte före.",
  "family.party.products": "alla produkter",
  "family.party.events": "händelselistan",
  "family.identity.mission": "En inloggning till alla system.",
  "family.kansli.mission": "Startsidan. Uppgifter och vägen in.",
  "family.ekonomi.mission": "Fakturor, moms och hur pengarna kom in.",
  "family.tora.mission": "Vilka upphandlingar just ert bolag kan ta.",
  "family.rita.mission": "Letar skattebesparingar i era böcker.",
  "family.britt.mission": "Det som hänt och behöver följas upp.",
  "family.irma.mission": "Skicka ett avtal, se om det är läst och bekräftat.",
  "family.tyra.mission": "Kund, bil, hjul och vad som ska göras härnäst.",
  "family.alva.mission": "Kundens fel, anteckningar och mätvärden. Diagnosen kommer senare.",
  "family.creditae.mission": "Kreditbedömning av motpart. Er slutsats, inget påhittat betyg.",
  "family.identity.question": "Vem är du, och vilket bolag gäller det?",
  "family.identity.does":
    "Du loggar in en gång. Sedan är du inne i Kansli, TORA, RITA och de andra.",
  "family.identity.doesNot":
    "Här skickas inga fakturor och här finns ingen extra kod i mobilen än.",
  "family.kansli.question": "Var börjar jag, och vad ska vi göra internt?",
  "family.kansli.does": "Inloggning, intern uppgiftstavla och formuläret för nya kunder.",
  "family.kansli.doesNot":
    "Kansli räknar inte på upphandling, skatt eller däck. Det gör de andra systemen.",
  "family.ekonomi.question": "Vad är bokat, vad är förfallet, och hur kom pengarna in?",
  "family.ekonomi.does":
    "Skriver faktura på 10 dagar, bokför i öre, kopplar Stripe och Revolut, matchar inbetalningar när banken är ansluten.",
  "family.ekonomi.doesNot":
    "Inte Visma. Inte Fortnox. Ingen påhittad inbetalning. Kort kräver Stripe. Swish kräver att Swish är inkopplat.",
  "family.tora.question": "Kan vi lämna anbud här — och vad ska vi göra nu?",
  "family.tora.does":
    "Jämför bolaget mot upphandlingarna: krav, luckor, belopp, datum och nästa steg.",
  "family.tora.doesNot": "Tittar inte i räkenskaperna. Det gör RITA.",
  "family.rita.question": "Vilka avdrag, moms och andra luckor sitter i bokslutet?",
  "family.rita.does":
    "Läser bokslutet mot svenska skatteregler och lämnar förslag att kolla. Inte skatteråd.",
  "family.rita.doesNot":
    "Hittar inte på resultat. Säger inte om ni får lämna anbud. Ingen kundfil att ladda upp än.",
  "family.britt.question": "Vad behöver ni göra nu, utifrån det som redan hänt?",
  "family.britt.does": "Samlar saker som måste följas upp. En sak i taget, med nästa steg.",
  "family.britt.doesNot": "BRITT är inte ett ärendesystem och inte en chatt.",
  "family.irma.question": "Har motparten läst och bekräftat avtalet?",
  "family.irma.does": "Skickar avtalet. Visar om det är öppnat, signerat eller avvisat.",
  "family.irma.doesNot": "IRMA är inte e-post och inte ett arkiv för alla dokument.",
  "family.tyra.question": "Vilken kund, vilken bil, vilka hjul — och vad är nästa steg?",
  "family.tyra.does":
    "Håller ihop kund, fordon och däck. Visar när det är dags att byta eller hämta.",
  "family.tyra.doesNot": "TYRA är inte ett allmänt kundregister för andra branscher.",
  "family.alva.question": "Vad sa kunden, vad mättes — och vad är nästa steg?",
  "family.alva.does":
    "Tar emot vad som sagts och mätts. Visar anteckningen. Ställer ingen diagnos själv.",
  "family.alva.doesNot": "ALVA ställer ingen diagnos och ger inget råd.",
  "family.creditae.question": "Vem ska vi bedöma — och vad kom ni fram till?",
  "family.creditae.does":
    "Tar emot organisationsnummer och er bedömning. Hämtar byråns rapport via plattformens kreditkanal när den är kopplad. Kör, bevaka eller stanna.",
  "family.creditae.doesNot":
    "CREDITAE sätter inget kreditbetyg. Produkten anropar inte Creditsafe.",
  "family.stack.language": "Språk",
  "family.stack.language.runs":
    "TypeScript 5 i hela systemet. SQL i databasen. RITA:s analys körs som ett eget program. ekonomi-ledger kontrollerar verifikat, postar inte i drift.",
  "family.stack.web": "Webb",
  "family.stack.web.runs":
    "Next.js 16.3 App Router, React 19.2, Tailwind CSS 4. En process: sajt, /idp, produkter och API.",
  "family.stack.identity": "Identitet",
  "family.stack.identity.runs":
    "Egen inloggning, byggd på öppen standard. En cookie håller er inloggade. Samma inloggning i alla system.",
  "family.stack.data": "Data",
  "family.stack.data.runs":
    "PostgreSQL 16. Varje system har sin egen data. Inget system skriver i ett annat systems uppgifter.",
  "family.stack.analysis": "Analys",
  "family.stack.analysis.runs":
    "TORA räknar i samma process. RITA anropar en egen analys. Inga påhittade resultat i drift.",
  "family.stack.automation": "Automation",
  "family.stack.automation.runs":
    "Modeller går via Vercel-gateway. Svaret är en gissning, inte fakta.",
  "family.stack.ops": "Drift och test",
  "family.stack.ops.runs":
    "Körs på Vercel. Tester mot Postgres 16. Ingen AWS SDK i det här systemet.",
  "family.link.identity.products":
    "En inloggning. Produkterna läser inte varandras användarlistor.",
  "family.link.identity.events":
    "Lyckad inloggning skrivs i loggen. Det är ett kvitto, inte en uppgift att följa upp.",
  "family.link.tora.britt": "Bara när någon publicerar. Att läsa marknaden skapar ingen händelse.",
  "family.link.rita.britt":
    "BRITT får bolagsnamn, hur många träffar det blev och om automation var med. Inte själva förslagen — de stannar i RITA.",
  "family.link.irma.britt": "Avtal skapat, öppnat, bekräftat eller återkallat.",
  "family.link.tyra.britt":
    "Ärende, kundlänk eller påminnelse i kö. Stoppad kö betyder inte skickat.",
  "family.link.alva.britt":
    "Ett ärende är registrerat. Ingen diagnos följer förrän den är inkopplad.",
  "family.link.creditae.britt":
    "En motpart är registrerad, ni har skrivit er slutsats, eller byråns rapport kom in eller stannade. Inget påhittat betyg följer.",
  "family.link.ekonomi.britt":
    "Utfärdad faktura, bokad inbetalning eller en Revolut-hämtning som inte gick.",
  "family.link.ekonomi.revolut":
    "Bankanslutningens livscykel. Vanlig förnyelse loggas som drift, inte som något att följa upp.",
  "family.link.ekonomi.invoice": "Utkast syns i loggen. Ingen bokföring förrän utfärdande.",
  "family.link.kansli.task": "Intern uppgift syns hos BRITT. Kansli äger fortfarande uppgiften.",
  "family.link.kansli.intake":
    "En anmälan har kommit in, eller ett verkstadskonto skapats inför demon.",
  "family.link.britt.finding":
    "De viktigaste träffarna från exempelanalysen blir saker att följa upp. Resten stannar i BRITT.",
  "family.link.britt.events": "Varje sak att följa upp skrivs också i händelselistan.",
  "family.blocked.rita":
    "RITA:s analys måste vara inkopplad (på Vercel via URL, lokalt via programfilen) innan analyser kan köras.",
  "family.blocked.alva":
    "Den guidade diagnosen kopplas när den är klar. Ärendet kan registreras redan nu.",
  "family.blocked.irma":
    "IRMA stannar hos oss: enkel digital bekräftelse och en egen länk. Ingen juridisk e-signatur än.",
  "family.blocked.britt":
    "Fortnox, Revolut och BRITT:s profiler om exempelanalysen ska bli hela produkten.",
  "family.blocked.ekonomi":
    "Stripe, Revolut och Swish när ni vill ta betalt den vägen. Faktura på 10 dagar fungerar utan dem.",
  "family.blocked.creditae":
    "CREDITAE går via plattformens kreditkanal. Produkter anropar inte Creditsafe. Utan nyckel hämtas ingen rapport. Bedömningen är fortfarande er.",
  "tyra.metaTitle": "TYRA — Pixdrift",
  "tyra.metaDescription": "Kund, bil, hjul och vad som ska göras härnäst.",
  "tyra.heading": "Vilket fordon ska in?",
  "tyra.lead":
    "TYRA håller ihop kund, bil och hjul. Däck säljs här — ett klick bokar fakturan i Ekonomi. Beloppen är era egna siffror. Inga live-priser än.",
  "tyra.customers": "Kundkort",
  "tyra.integrations": "Integrationer",
  "tyra.signInTitle": "Logga in för att öppna ärenden",
  "tyra.signInBody": "Samma inloggning som resten av Pixdrift. Inget extra konto för verkstaden.",
  "tyra.notice":
    "Påminnelser läggs i kö men skickas inte än — det saknas en koppling till SMS och e-post. Inga live-däckpriser.",
  "ekonomi.metaTitle": "Ekonomi — Pixdrift",
  "ekonomi.metaDescription": "Fakturor, moms och hur pengarna kom in.",
  "ekonomi.heading": "Vad är bokat?",
  "ekonomi.lead":
    "Boka sälj i kronor. Ett klick utfärdar fakturan. TYRA-offerter som inte är bokade ligger i kön. Kunden kan betala med Swish, Stripe eller faktura på 10 dagar. Anslut Revolut en gång, så hämtas kontoutdrag och betalningar matchas. Visma är nästa anslutning — den finns inte här än.",
  "ekonomi.signInTitle": "Logga in för att se boken",
  "ekonomi.signInBody": "Ekonomin tillhör ert företag. Logga in för att se den.",
  "ekonomi.notice":
    "Ni skriver kronor. Boken sparar öre. Varje verifikat balanserar. Betalningar körs bara på riktigt när kopplingarna är på plats — inget simuleras utan att du sagt ja.",
  "ekonomi.statements": "Kontoutdrag",
  "ekonomi.invoices": "Fakturor",
  "ekonomi.vouchers": "Verifikat",
  "ekonomi.reports": "Rapporter / moms",
  "ekonomi.connections": "Anslutningar",
  "tora.metaTitle": "TORA — Pixdrift",
  "tora.metaDescription": "Vilka upphandlingar just ert bolag kan ta.",
  "tora.lead":
    "TORA visar vilka upphandlingar {name} kan lämna anbud på — och varför just ni. Här är hela bedömningen: krav, luckor och nästa steg.",
  "tora.noticeDemo":
    "Upphandlingarna är exempel, inte riktiga annonser. Visningen är ett betalkonto, så ni ser namn, belopp och krav. Bolagsfakta är exempelbolaget tills ni sparar er egen profil.",
  "tora.noticeSaved":
    "Upphandlingarna är exempel, inte riktiga annonser. Visningen är ett betalkonto, så ni ser namn, belopp och krav. Bolagsfakta är er sparade profil ({name}).",
  "tora.calendar": "Kalender",
  "tora.current": "Aktuellt",
  "tora.upcoming": "Kommande",
  "tora.watch": "Bevakning",
  "tora.publishedValue": "Publicerat värde",
  "tora.yourCompany": "Ert bolag",
  "tora.profileLead": "Utan sparad profil räknar vi på exempelbolaget i stället för på er.",
  "tora.frameworks": "Avtal ni redan är med på",
  "tora.references": "Referenser TORA räknar med",
  "rita.metaTitle": "RITA — Pixdrift",
  "rita.metaDescription": "RITA letar skattebesparingar i era böcker.",
  "rita.lead":
    "RITA letar skattebesparingar i era böcker: avdrag, moms, K10, pension och FoU. Det RITA hittar är förslag att kolla vidare — inte skatteråd.",
  "rita.noticeReady":
    "Analysen är igång. Delar av svaret kommer från en modell och kan behöva dubbelkollas.",
  "rita.noticeRules":
    "Analysen är igång, men utan modellstöd just nu. Bara de fasta reglerna används.",
  "rita.noticeBlocked":
    "Analysen är inte inkopplad än, så nya analyser stannar som blockerade. Vi visar aldrig påhittade resultat.",
  "rita.noticeExample": "Exempelbokslutet är ett inbyggt exempel — inte något en kund laddat upp.",
  "rita.signInTitle": "Logga in för att begära analys",
  "rita.signInBody":
    "Analysen sparas i RITA. BRITT får något att följa upp när en analys blir klar eller stoppas.",
  "britt.metaTitle": "BRITT — Pixdrift",
  "britt.metaDescription": "Det som hänt och behöver följas upp.",
  "britt.lead":
    "BRITT samlar sådant som behöver följas upp. Siffrorna här är exempel — inga kopplingar till Fortnox eller Revolut än.",
  "britt.noticeDemo": "Siffrorna här är exempel för huset, inte Fortnox och inte en livekassa.",
  "britt.noticeOwn": "Här följer ni era egna observationer. Exempelsiffror körs bara på huset.",
  "britt.signInTitle": "Logga in för att se observationer",
  "britt.signInBody":
    "Observationer tillhör ert företag. Det som händer i TORA, RITA och IRMA dyker upp här.",
  "irma.metaTitle": "IRMA — Pixdrift",
  "irma.metaDescription": "Skicka ett avtal, se om det är läst och bekräftat.",
  "irma.heading": "Vilket avtal ska ut?",
  "irma.lead":
    "Med IRMA skickar ni avtal digitalt: skapa, skicka en länk, se när motparten öppnat och bekräftat. Motparten behöver inget konto. Det är en enkel digital bekräftelse, inte en juridisk e-signatur. Dokumentarkiv finns inte än.",
  "irma.signInTitle": "Logga in för att skapa avtal",
  "irma.signInBody":
    "Länken visas bara en gång — kopiera den direkt. Vi sparar den inte i läsbar form.",
  "creditae.vendorScore": "Byråns värde",
  "creditae.vendorLimit": "Byråns gräns",
  "creditae.vendorNotConclusion": "Det är byråns fält, inte er slutsats.",
  "creditae.vendorWhyMissing": "Varför rapporten saknas",
  "creditae.notes": "Anteckning",
  "creditae.yourAssessment": "Er bedömning",
  "creditae.conclusion": "Slutsats",
};
