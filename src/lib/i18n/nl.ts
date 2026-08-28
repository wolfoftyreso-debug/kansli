import type { MessageKey } from "./en.ts";

export const NL: Record<MessageKey, string> = {
  "chrome.rooms": "Kamers",
  "chrome.services": "Diensten",
  "chrome.signIn": "Aanmelden",
  "chrome.signOut": "Afmelden",
  "chrome.signedOut": "niet aangemeld",
  "chrome.switchOrg": "Bedrijf wisselen",
  "chrome.menu": "Menu",
  "chrome.language": "Taal",
  "chrome.orgs": "Bedrijven",
  "chrome.skipToContent": "Naar inhoud",
  "chrome.roomsMobile": "Kamers, mobiel",

  "runtime.production": "productie",
  "runtime.preview": "voorbeeld",
  "runtime.local": "lokaal",

  "home.hello": "Hallo",
  "home.helloNamed": "Hallo, {name}",
  "home.roleAdmin": "Systeembeheerder",
  "home.roleOpen": "Open vlak",
  "home.programs": "Programma’s · {count} geïnstalleerd",
  "home.openKansli": "Kansli openen",
  "home.documentation": "Documentatie",
  "home.metaDescription": "Eén kamer per klus. Dezelfde aanmelding.",

  "service.platform": "Platform",
  "service.ops": "Bedrijf",
  "service.events": "Gebeurtenissen",
  "service.procurement": "Aanbesteding",
  "service.intake": "Nieuwe klant",
  "service.docs": "Documentatie",

  "category.kansli": "Start",
  "category.ekonomi": "Boek",
  "category.tora": "Aanbesteding",
  "category.rita": "Belasting",
  "category.britt": "Opvolging",
  "category.irma": "Overeenkomsten",
  "category.tyra": "Bandenhotel",
  "category.alva": "Diagnose",
  "category.creditae": "Krediet",
  "category.maj": "Zoeken",

  "idp.title": "Aanmelden · Pixdrift",
  "idp.heading": "Aanmelding",
  "idp.email": "E-mail",
  "idp.password": "Wachtwoord",
  "idp.submit": "Aanmelden",
  "idp.noAccount": "Geen account?",
  "idp.requestAccess": "Toegang vragen via groepsinkoop",
  "idp.wrongCredentials": "Verkeerd e-mailadres of wachtwoord.",
  "idp.tooManyAttempts": "Te veel pogingen. Probeer het zo weer.",
  "idp.errorTitle": "Fout",
  "idp.errorHeading": "Het verzoek kan niet worden verwerkt",
  "idp.loginUnavailable": "Aanmelden is nu niet beschikbaar",
  "idp.loginUnavailableBody":
    "We konden aanmelden niet bereiken. Probeer het zo weer, of ga terug naar {home}.",
  "idp.home": "de startpagina",
  "idp.pkceRequired": "PKCE (S256) is vereist",
  "idp.demo": "Demo: {email} / {password}",

  "common.missing": "ontbreekt",
  "common.all": "Alle",
  "common.loading": "Laden…",
  "common.saving": "Opslaan…",
  "common.configured": "geconfigureerd · {auth}",
  "common.missingKey": "sleutel ontbreekt",

  "alva.metaTitle": "ALVA — Pixdrift",
  "alva.metaDescription": "De storing van de klant, notities en metingen. Diagnose komt later.",
  "alva.lead":
    "ALVA neemt wat de klant zei, wat u noteerde en wat is gemeten. Diagnose wordt later aangesloten. Het systeem stelt zelf geen diagnose.",
  "alva.notice":
    "Diagnose is nog niet aangesloten. U kunt een leeg protocol vullen met eigen feiten. Het systeem verzint niets.",
  "alva.signInTitle": "Meld u aan om zaken te registreren",
  "alva.signInBody": "De zaak wordt in ALVA bewaard. Meld u aan om te registreren.",
  "alva.newCase": "Nieuwe zaak",
  "alva.complaint": "Beschrijving van de klant",
  "alva.vehicleRef": "Voertuigreferentie (optioneel)",
  "alva.area": "Gebied (optioneel, bijv. remmen)",
  "alva.mileage": "Kilometerstand km (optioneel)",
  "alva.desiredOutcome": "Gewenst resultaat (optioneel)",
  "alva.register": "Zaak registreren",
  "alva.cases": "Zaken",
  "alva.empty": "Nog geen zaken.",
  "alva.status.open": "Open",
  "alva.status.in_progress": "Bezig",
  "alva.status.closed": "Gesloten",
  "alva.detailMetaTitle": "Zaak — ALVA — Pixdrift",
  "alva.detailSignInTitle": "Meld u aan om de zaak te zien",
  "alva.detailSignInBody": "De zaak hoort bij de organisatie.",
  "alva.detailNotice": "U vult de feiten zelf in. Het systeem trekt geen eigen conclusies.",
  "alva.vehicleRefShort": "Voertuigreferentie",
  "alva.areaShort": "Gebied",
  "alva.mileageShort": "Kilometerstand",

  "creditae.metaTitle": "CREDITAE — Pixdrift",
  "creditae.metaDescription":
    "Kredietbeoordeling van een wederpartij. Uw conclusie, geen verzonnen score.",
  "creditae.lead":
    "CREDITAE neemt wie u beoordeelt en waar u zelf op uitkwam. Het systeem zet geen kredietscore.",
  "creditae.noticeOn":
    "Krediet aan. Het bureaurapport wordt opgehaald bij registratie. Uw conclusie blijft van u.",
  "creditae.noticeOff":
    "Krediet uit. Geen kredietbureau is aangesloten. De beoordeling is van u. Het systeem verzint nooit een score.",
  "creditae.signInTitle": "Meld u aan om een wederpartij te beoordelen",
  "creditae.signInBody": "De aanvraag wordt in CREDITAE bewaard. Meld u aan om te registreren.",
  "creditae.newInquiry": "Nieuwe aanvraag",
  "creditae.orgNumber": "Organisatienummer",
  "creditae.companyName": "Bedrijfsnaam (optioneel)",
  "creditae.reason": "Waarom u beoordeelt (optioneel)",
  "creditae.register": "Aanvraag registreren",
  "creditae.inquiries": "Aanvragen",
  "creditae.empty": "Nog geen aanvragen.",
  "creditae.status.open": "Open",
  "creditae.status.assessed": "Beoordeeld",
  "creditae.assess.go": "Door",
  "creditae.assess.watch": "Volgen",
  "creditae.assess.stop": "Stop",
  "creditae.vendor.blocked": "Krediet uit",
  "creditae.vendor.failed": "Geen rapport",
  "creditae.vendor.fetched": "Rapport binnen",
  "creditae.domain": "Website (optioneel)",
  "creditae.domainField": "Website",
  "creditae.web": "Webaanwezigheid",
  "creditae.webNoticeOn":
    "Webdata aan. De zichtbaarheid wordt bij de bron opgehaald wanneer u op de knop drukt. De cijfers zijn van de leverancier, letterlijk.",
  "creditae.webNoticeOff": "Webdata uit. Geen webdatabron is gekoppeld. Er wordt niets opgehaald.",
  "creditae.web.blocked": "Webdata uit",
  "creditae.web.failed": "Geen webdata",
  "creditae.web.fetched": "Webdata binnen",
  "creditae.webRank": "Rang van de leverancier",
  "creditae.webKeywords": "Organische zoekwoorden",
  "creditae.webTraffic": "Organisch verkeer, schatting van de leverancier",
  "creditae.webAds": "Betaalde zoekwoorden",
  "creditae.webFetch": "Webdata ophalen",
  "creditae.webWhyMissing": "Waarom de data ontbreekt",
  "creditae.webNotConclusion": "Dat zijn de cijfers van de leverancier, niet uw conclusie.",
  "creditae.detailMetaTitle": "Aanvraag — CREDITAE — Pixdrift",
  "creditae.detailSignInTitle": "Meld u aan om de aanvraag te zien",
  "creditae.detailSignInBody": "De aanvraag hoort bij de organisatie.",
  "creditae.detailNoticeOn": "U vult de conclusie zelf in. Bureauvelden zijn niet uw beoordeling.",
  "creditae.detailNoticeOff": "U vult de conclusie zelf in. Het systeem zet geen kredietscore.",
  "creditae.why": "Waarom",
  "creditae.bureau": "Kredietbureau",
  "creditae.vendorName": "Naam bij het bureau",

  "kansli.metaTitle": "Kansli — Pixdrift",
  "kansli.metaDescription": "De startpagina. Taken en de ingang.",
  "kansli.lead":
    "Hier begint het. Dezelfde aanmelding in elk systeem, en een takenbord voor intern werk.",
  "kansli.signInTitle": "Aanmelden met Pixdrift",
  "kansli.signInBody": "Dezelfde aanmelding geldt voor TORA, RITA, BRITT, IRMA en ALVA.",
  "kansli.firstCustomer": "Eerste klant — een lijst, geen datum",
  "kansli.groupProcurement": "Groepsinkoop",
  "kansli.family": "De familie",
  "kansli.map": "De kaart",
  "kansli.mapLead": "Wat elk systeem doet, en hoe ze samenhangen.",
  "kansli.recentEvents": "Recente gebeurtenissen",
  "kansli.notice":
    "Als een taak ontstaat, krijgt BRITT iets om op te volgen. Kansli blijft eigenaar van de taak.",

  "tasks.summary": "Takenbord — {open} open, {done} klaar.",
  "tasks.titlePlaceholder": "Nieuwe taak…",
  "tasks.titleAria": "Taaktitel",
  "tasks.ownerPlaceholder": "Verantwoordelijke",
  "tasks.ownerAria": "Verantwoordelijke",
  "tasks.add": "Toevoegen",
  "tasks.empty": "Nog geen taken. Voeg de eerste hierboven toe.",
  "tasks.remove": "Verwijderen",
  "tasks.markDone": 'Markeer "{title}" als klaar',
  "tasks.removeNamed": 'Verwijder "{title}"',
  "tasks.fetchError": "Taken konden niet worden geladen.",
  "tasks.saveError": "De taak kon niet worden opgeslagen.",
  "tasks.updateError": "De taak kon niet worden bijgewerkt.",
  "tasks.deleteError": "De taak kon niet worden verwijderd.",
  "tasks.genericError": "Er ging iets mis.",
  "tasks.emptyTitle": "De titel mag niet leeg zijn.",

  "platform.metaTitle": "Platform — Pixdrift",
  "platform.metaDescription": "Wat elk systeem doet, en hoe ze samenhangen.",
  "platform.heading": "Wat elk systeem doet",
  "platform.notice":
    "Elk systeem doet één klus. TORA neemt aanbestedingen. RITA neemt belasting. Ze worden niet gemengd.",
  "platform.systems": "De systemen",
  "platform.howTheyConnect": "Hoe ze samenhangen",
  "platform.moreSystems": "Meer systemen",
  "platform.waiting": "Wacht op aansluiting",
  "platform.tech": "Techniek — voor wie de bedrijfsvoering doet",
  "platform.gateway": "Modelgateway",
  "platform.gatewayLead":
    "Eén sleutel geeft toegang tot meer dan 100 modellen. Onthoud: antwoorden van het systeem zijn gissingen, geen feiten.",
  "platform.gatewayHint": "Zet {key} in Secrets of {oidc} op Vercel.",

  "family.status.operational": "Draait",
  "family.status.pilot": "Onderweg",
  "family.status.deferred": "Nog niet klaar",
  "family.principle":
    "Dezelfde aanmelding in elk systeem. Elk systeem doet het zijne. TORA neemt aanbestedingen. RITA neemt belasting. Ze worden niet gemengd.",
  "family.incoming":
    "Meer systemen zijn onderweg. Ze krijgen dezelfde aanmelding en eigen gegevens. Namen komen als ze klaar zijn — niet eerder.",
  "family.party.products": "alle producten",
  "family.party.events": "de gebeurtenissenlijst",
  "family.identity.mission": "Eén aanmelding voor elk systeem.",
  "family.kansli.mission": "De startpagina. Taken en de ingang.",
  "family.ekonomi.mission": "Facturen, btw en hoe het geld binnenkwam.",
  "family.tora.mission": "Welke aanbestedingen uw bedrijf kan nemen.",
  "family.rita.mission": "Zoekt belastingbesparingen in uw boeken.",
  "family.britt.mission": "Wat er gebeurde en opvolging nodig heeft.",
  "family.irma.mission": "Stuur een overeenkomst, zie of die is gelezen en bevestigd.",
  "family.tyra.mission": "Klant, auto, wielen en wat nu.",
  "family.alva.mission": "De storing van de klant, notities en metingen. Diagnose komt later.",
  "family.creditae.mission":
    "Kredietbeoordeling van een wederpartij. Uw conclusie, geen verzonnen score.",
  "family.identity.question": "Wie bent u, en voor welk bedrijf geldt het?",
  "family.identity.does":
    "U meldt zich één keer aan. Daarna bent u in Kansli, TORA, RITA en de andere.",
  "family.identity.doesNot":
    "Hier worden geen facturen verstuurd, en er is nog geen extra code in de telefoon.",
  "family.kansli.question": "Waar begin ik, en wat moeten we intern doen?",
  "family.kansli.does": "Aanmelding, een intern takenbord en het formulier voor nieuwe klanten.",
  "family.kansli.doesNot":
    "Kansli rekent niet aan aanbesteding, belasting of banden. Dat doen de andere systemen.",
  "family.ekonomi.question": "Wat is geboekt, wat is vervallen, en hoe kwam het geld binnen?",
  "family.ekonomi.does":
    "Schrijft een factuur van 10 dagen, boekt in öre, koppelt Stripe en Revolut, matcht inkomsten wanneer de bank is aangesloten.",
  "family.ekonomi.doesNot":
    "Niet Visma. Niet Fortnox. Geen verzonnen betaling. Kaarten vragen Stripe. Swish vraagt dat Swish is aangesloten.",
  "family.tora.question": "Kunnen we hier inschrijven — en wat moeten we nu doen?",
  "family.tora.does":
    "Vergelijkt het bedrijf met de aanbestedingen: eisen, gaten, bedragen, data en de volgende stap.",
  "family.tora.doesNot": "Kijkt niet in de boeken. Dat doet RITA.",
  "family.rita.question": "Welke aftrek, btw en andere gaten zitten in de jaarrekening?",
  "family.rita.does":
    "Leest de jaarrekening tegen Zweedse belastingregels en laat voorstellen om te controleren. Geen belastingadvies.",
  "family.rita.doesNot":
    "Verzint geen resultaten. Zegt niet of u mag inschrijven. Nog geen klantdossier om te uploaden.",
  "family.britt.question": "Wat moet u nu doen, op basis van wat al gebeurde?",
  "family.britt.does":
    "Verzamelt dingen die opgevolgd moeten worden. Eén ding tegelijk, met de volgende stap.",
  "family.britt.doesNot": "BRITT is geen zaakensysteem en geen chat.",
  "family.irma.question": "Heeft de wederpartij de overeenkomst gelezen en bevestigd?",
  "family.irma.does": "Stuurt de overeenkomst. Toont of die is geopend, ondertekend of afgewezen.",
  "family.irma.doesNot": "IRMA is geen e-mail en geen archief voor elk document.",
  "family.tyra.question": "Welke klant, welke auto, welke wielen — en wat is de volgende stap?",
  "family.tyra.does":
    "Houdt klant, voertuig en banden bijeen. Toont wanneer het tijd is om te wisselen of op te halen.",
  "family.tyra.doesNot": "TYRA is geen algemeen klantenregister voor andere vakken.",
  "family.alva.question": "Wat zei de klant, wat is gemeten — en wat is de volgende stap?",
  "family.alva.does": "Neemt wat is gezegd en gemeten. Toont de notitie. Stelt zelf geen diagnose.",
  "family.alva.doesNot": "ALVA stelt geen diagnose en geeft geen advies.",
  "family.creditae.question": "Wie moeten we beoordelen — en waar kwam u op uit?",
  "family.creditae.does":
    "Neemt een organisatienummer en uw beoordeling. Haalt het bureaurapport via het kredietkanaal van het platform wanneer dat is aangesloten. Door, volgen of stop.",
  "family.creditae.doesNot": "CREDITAE zet geen kredietscore. Het product belt Creditsafe niet.",
  "family.maj.mission":
    "Meten, analyseren, bijsturen. Zichtbaarheid in zoekmachines als beslissingen, niet als dashboards.",
  "family.maj.question": "Wat is er veranderd in de zoekresultaten — en wat moeten we doen?",
  "family.maj.does":
    "Neemt een domein, een markt en een doel. Volgt zoekdata via platformkanalen, weegt het bewijs en stelt een korte rij beslissingen voor met volledig herkomstspoor. Elke uitgevoerde wijziging wordt gepubliceerd als een genummerde release.",
  "family.maj.doesNot":
    "MAJ koopt nooit links, vervalst geen beoordelingen en raakt geen middelen van concurrenten aan. Het toont beslissingen, geen leveranciersstatistieken — de klant hoeft de databronnen nooit te begrijpen.",
  "family.stack.language": "Taal",
  "family.stack.language.runs":
    "TypeScript 5 in het hele systeem. SQL in de database. RITA’s analyse draait als eigen programma. ekonomi-ledger controleert boekstukken, post niet in productie.",
  "family.stack.web": "Web",
  "family.stack.web.runs":
    "Next.js 16.3 App Router, React 19.2, Tailwind CSS 4. Eén proces: site, /idp, producten en API.",
  "family.stack.identity": "Identiteit",
  "family.stack.identity.runs":
    "Eigen aanmelding, gebouwd op een open standaard. Eén cookie houdt u aangemeld. Dezelfde aanmelding in elk systeem.",
  "family.stack.data": "Gegevens",
  "family.stack.data.runs":
    "PostgreSQL 16. Elk systeem heeft eigen gegevens. Geen systeem schrijft in de gegevens van een ander.",
  "family.stack.analysis": "Analyse",
  "family.stack.analysis.runs":
    "TORA rekent in hetzelfde proces. RITA roept een eigen analyse. Geen verzonnen resultaten in productie.",
  "family.stack.automation": "Automatisering",
  "family.stack.automation.runs":
    "Modellen gaan via de Vercel-gateway. Het antwoord is een gissing, geen feit.",
  "family.stack.ops": "Bedrijf en test",
  "family.stack.ops.runs":
    "Draait op Vercel. Tests tegen Postgres 16. Geen AWS SDK in dit systeem.",
  "family.link.identity.products":
    "Eén aanmelding. Producten lezen elkaars gebruikerslijsten niet.",
  "family.link.identity.events":
    "Een geslaagde aanmelding wordt in het logboek geschreven. Het is een bewijs, geen taak om op te volgen.",
  "family.link.tora.britt":
    "Alleen wanneer iemand publiceert. De markt lezen maakt geen gebeurtenis.",
  "family.link.rita.britt":
    "BRITT krijgt de bedrijfsnaam, hoeveel treffers het gaf en of automatisering meedeed. Niet de voorstellen zelf — die blijven in RITA.",
  "family.link.irma.britt": "Overeenkomst aangemaakt, geopend, bevestigd of ingetrokken.",
  "family.link.tyra.britt":
    "Een zaak, een klantlink of een herinnering in de wachtrij. Een geblokkeerde wachtrij betekent niet verzonden.",
  "family.link.alva.britt":
    "Een zaak is geregistreerd. Geen diagnose volgt tot die is aangesloten.",
  "family.link.creditae.britt":
    "Een wederpartij is geregistreerd, u heeft uw conclusie geschreven, of het bureaurapport kwam binnen of stopte. Geen verzonnen score volgt.",
  "family.link.ekonomi.britt":
    "Een uitgeschreven factuur, een geboekte inkomst of een Revolut-ophaling die niet doorging.",
  "family.link.ekonomi.revolut":
    "De levenscyclus van de bankkoppeling. Gewone verlenging wordt als bedrijf gelogd, niet als iets om op te volgen.",
  "family.link.ekonomi.invoice":
    "Een concept verschijnt in het logboek. Geen boekhouding tot uitgifte.",
  "family.link.kansli.task":
    "Een interne taak verschijnt bij BRITT. Kansli blijft eigenaar van de taak.",
  "family.link.kansli.intake":
    "Er is een aanvraag binnengekomen, of er is een werkplaatsaccount voor de demo aangemaakt.",
  "family.link.britt.finding":
    "De belangrijkste treffers van de voorbeeldanalyse worden dingen om op te volgen. De rest blijft in BRITT.",
  "family.link.britt.events":
    "Elk ding om op te volgen wordt ook in de gebeurtenissenlijst geschreven.",
  "family.blocked.rita":
    "RITA’s analyse moet zijn aangesloten (op Vercel via URL, lokaal via het programmabestand) voordat analyses kunnen draaien.",
  "family.blocked.alva":
    "De begeleide diagnose wordt aangesloten wanneer die klaar is. De zaak kan al worden geregistreerd.",
  "family.blocked.irma":
    "IRMA blijft bij ons: een eenvoudige digitale bevestiging en een eigen link. Nog geen juridische e-handtekening.",
  "family.blocked.britt":
    "Fortnox, Revolut en BRITT’s profielen als de voorbeeldanalyse het hele product moet worden.",
  "family.blocked.ekonomi":
    "Stripe, Revolut en Swish wanneer u zo wilt innen. Een factuur van 10 dagen werkt zonder hen.",
  "family.blocked.creditae":
    "CREDITAE gaat via het kredietkanaal van het platform. Producten bellen Creditsafe niet. Zonder sleutel wordt geen rapport opgehaald. De beoordeling blijft van u.",
  "family.blocked.maj":
    "MAJ leest zoekdata via platformkanalen. Bronnen zonder gegevens blijven dicht en worden verbindingsbeslissingen. Het systeem verzint geen cijfers.",
  "tyra.metaTitle": "TYRA — Pixdrift",
  "tyra.metaDescription": "Klant, auto, wielen en wat nu.",
  "tyra.heading": "Welk voertuig komt binnen?",
  "tyra.lead":
    "TYRA houdt klant, auto en wielen bijeen. Banden worden hier verkocht — één klik boekt de factuur in Ekonomi. Bedragen zijn uw eigen cijfers. Nog geen live-prijzen.",
  "tyra.customers": "Klantkaarten",
  "tyra.integrations": "Integraties",
  "tyra.signInTitle": "Meld u aan om zaken te openen",
  "tyra.signInBody":
    "Dezelfde aanmelding als de rest van Pixdrift. Geen extra account voor de werkplaats.",
  "tyra.notice":
    "Herinneringen gaan in de wachtrij maar worden nog niet verstuurd — er is geen sms- of e-mailkoppeling. Geen live-bandenprijzen.",
  "ekonomi.metaTitle": "Ekonomi — Pixdrift",
  "ekonomi.metaDescription": "Facturen, btw en hoe het geld binnenkwam.",
  "ekonomi.heading": "Wat is geboekt?",
  "ekonomi.lead":
    "Boek verkoop in kronen. Eén klik schrijft de factuur uit. TYRA-offertes die niet zijn geboekt liggen in de wachtrij. De klant kan betalen met Swish, Stripe of een factuur van 10 dagen. Koppel Revolut één keer, dan worden afschriften opgehaald en betalingen gematcht. Visma is de volgende koppeling — die is er nog niet.",
  "ekonomi.signInTitle": "Meld u aan om het boek te zien",
  "ekonomi.signInBody": "De boeken horen bij uw bedrijf. Meld u aan om ze te zien.",
  "ekonomi.notice":
    "U schrijft kronen. Het boek bewaart öre. Elk boekstuk sluit. Betalingen lopen alleen echt wanneer de koppelingen er zijn — niets wordt gesimuleerd zonder dat u ja zei.",
  "ekonomi.statements": "Afschriften",
  "ekonomi.invoices": "Facturen",
  "ekonomi.vouchers": "Boekstukken",
  "ekonomi.reports": "Rapporten / btw",
  "ekonomi.connections": "Koppelingen",
  "tora.metaTitle": "TORA — Pixdrift",
  "tora.metaDescription": "Welke aanbestedingen uw bedrijf kan nemen.",
  "tora.lead":
    "TORA toont op welke aanbestedingen {name} kan inschrijven — en waarom juist u. Hier is de hele beoordeling: eisen, gaten en de volgende stap.",
  "tora.noticeDemo":
    "De aanbestedingen zijn voorbeelden, geen echte bekendmakingen. De weergave is een betaald account, dus u ziet namen, bedragen en eisen. Bedrijfsfeiten zijn het voorbeeldbedrijf tot u uw eigen profiel opslaat.",
  "tora.noticeSaved":
    "De aanbestedingen zijn voorbeelden, geen echte bekendmakingen. De weergave is een betaald account, dus u ziet namen, bedragen en eisen. Bedrijfsfeiten zijn uw opgeslagen profiel ({name}).",
  "tora.calendar": "Kalender",
  "tora.current": "Actueel",
  "tora.upcoming": "Komend",
  "tora.watch": "Volgen",
  "tora.publishedValue": "Gepubliceerde waarde",
  "tora.yourCompany": "Uw bedrijf",
  "tora.profileLead":
    "Zonder opgeslagen profiel rekenen we op het voorbeeldbedrijf in plaats van op u.",
  "tora.frameworks": "Overeenkomsten waar u al op zit",
  "tora.references": "Referenties waar TORA mee rekent",
  "rita.metaTitle": "RITA — Pixdrift",
  "rita.metaDescription": "RITA zoekt belastingbesparingen in uw boeken.",
  "rita.lead":
    "RITA zoekt belastingbesparingen in uw boeken: aftrek, btw, K10, pensioen en R&D. Wat RITA vindt zijn voorstellen om verder te controleren — geen belastingadvies.",
  "rita.noticeReady":
    "De analyse draait. Delen van het antwoord komen van een model en kunnen een tweede blik nodig hebben.",
  "rita.noticeRules":
    "De analyse draait, maar zonder model nu. Alleen de vaste regels worden gebruikt.",
  "rita.noticeBlocked":
    "De analyse is nog niet aangesloten, dus nieuwe analyses blijven geblokkeerd. We tonen nooit verzonnen resultaten.",
  "rita.noticeExample":
    "De voorbeeldrekening is een ingebouwd voorbeeld — niet iets dat een klant heeft geüpload.",
  "rita.signInTitle": "Meld u aan om een analyse te vragen",
  "rita.signInBody":
    "De analyse wordt in RITA bewaard. BRITT krijgt iets om op te volgen wanneer een analyse klaar is of stopt.",
  "britt.metaTitle": "BRITT — Pixdrift",
  "britt.metaDescription": "Wat er gebeurde en opvolging nodig heeft.",
  "britt.lead":
    "BRITT verzamelt dingen die opvolging nodig hebben. De cijfers hier zijn voorbeelden — nog geen Fortnox- of Revolut-koppelingen.",
  "britt.noticeDemo":
    "De cijfers hier zijn voorbeelden voor het huis, niet Fortnox en geen live-kassa.",
  "britt.noticeOwn":
    "Hier volgt u uw eigen waarnemingen. Voorbeeldcijfers draaien alleen op het huis.",
  "britt.signInTitle": "Meld u aan om waarnemingen te zien",
  "britt.signInBody":
    "Waarnemingen horen bij uw bedrijf. Wat in TORA, RITA en IRMA gebeurt, verschijnt hier.",
  "irma.metaTitle": "IRMA — Pixdrift",
  "irma.metaDescription": "Stuur een overeenkomst, zie of die is gelezen en bevestigd.",
  "irma.heading": "Welke overeenkomst moet eruit?",
  "irma.lead":
    "Met IRMA stuurt u overeenkomsten digitaal: aanmaken, een link sturen, zien wanneer de wederpartij heeft geopend en bevestigd. De wederpartij heeft geen account nodig. Het is een eenvoudige digitale bevestiging, geen juridische e-handtekening. Er is nog geen documentarchief.",
  "irma.signInTitle": "Meld u aan om overeenkomsten aan te maken",
  "irma.signInBody":
    "De link wordt één keer getoond — kopieer die meteen. We bewaren die niet in leesbare vorm.",
  "creditae.vendorScore": "Bureauwaarde",
  "creditae.vendorLimit": "Bureaugrens",
  "creditae.vendorNotConclusion": "Dat zijn de velden van het bureau, niet uw conclusie.",
  "creditae.vendorWhyMissing": "Waarom het rapport ontbreekt",
  "creditae.notes": "Notitie",
  "creditae.yourAssessment": "Uw beoordeling",
  "creditae.conclusion": "Conclusie",
  "maj.metaTitle": "MAJ — Pixdrift",
  "maj.metaDescription":
    "Meten, analyseren, bijstellen. Zoekzichtbaarheid als beslissingen, geen cijfers.",
  "maj.heading": "Wat is er veranderd in zoeken?",
  "maj.lead":
    "MAJ meet, analyseert en stelt bij. U geeft een domein, een markt en een doel — het systeem ontdekt de rest en komt terug met een paar beslissingen. Bewijs zit achter elke beslissing.",
  "maj.signInTitle": "Meld u aan om uw projecten te zien",
  "maj.signInBody": "Projecten horen bij de organisatie. Dezelfde aanmelding als in elke kamer.",
  "maj.alpha":
    "MAJ is in interne alfa. De kamer opent voor klanten wanneer het systeem op onze eigen domeinen heeft gewerkt — wij gebruiken hetzelfde product dat u krijgt.",
  "maj.alphaShort": "MAJ is in interne alfa.",
  "maj.addSite": "Website toevoegen",
  "maj.domain": "Domein",
  "maj.market": "Markt",
  "maj.languageField": "Taal",
  "maj.goal": "Wat wilt u bereiken?",
  "maj.goal.customers": "Meer klanten winnen",
  "maj.goal.rank": "Hoger ranken",
  "maj.goal.competitors": "Mijn concurrenten verslaan",
  "maj.goal.authority": "Onderwerpsautoriteit opbouwen",
  "maj.goal.all": "Alles hierboven",
  "maj.market.SE": "Zweden",
  "maj.market.NO": "Noorwegen",
  "maj.market.DK": "Denemarken",
  "maj.market.FI": "Finland",
  "maj.market.DE": "Duitsland",
  "maj.language.sv": "Zweeds",
  "maj.language.no": "Noors",
  "maj.language.da": "Deens",
  "maj.language.fi": "Fins",
  "maj.language.de": "Duits",
  "maj.language.en": "Engels",
  "maj.submit": "Analyseer mijn website",
  "maj.submitHint":
    "Het systeem vindt zelf concurrenten, posities en kansen. Het vraagt alleen als informatie echt ontbreekt.",
  "maj.sources": "Databronnen",
  "maj.sourcesHint":
    "Bronnen zonder gegevens blijven uit en verzinnen geen cijfers. Leveranciers zijn kanalen.",
  "maj.cap.on": "aan",
  "maj.cap.off": "uit",
  "maj.projects": "Projecten",
  "maj.noProjects": "Nog geen projecten. Voeg hierboven een website toe.",
  "maj.unitsBooked": "{n} eenheden geboekt",
  "maj.queueNone": "Geen beslissingen in de wacht",
  "maj.queueCount": "{n} beslissingen vragen uw aandacht",
  "maj.empty":
    "Nog geen beslissingen. Start een analyse: het systeem weegt het bewijs en stelt de volgende stap voor.",
  "maj.proposed": "Voorgesteld",
  "maj.approvedWait": "Goedgekeurd — wacht op uitvoering",
  "maj.impact": "Verwacht effect",
  "maj.risk": "Risico",
  "maj.confidence": "Zekerheid",
  "maj.approve": "Goedkeuren",
  "maj.decline": "Afwijzen",
  "maj.complete": "Markeer als gedaan — publiceer release",
  "maj.showWhy": "Toon waarom",
  "maj.showPrompt": "Genereer implementatiebrief",
  "maj.analyzeAgain": "Opnieuw analyseren",
  "maj.releases": "Search Updates",
  "maj.releasesEmpty":
    "Nog geen releases. Elke afgeronde beslissing wordt als versie gepubliceerd.",
  "maj.posture": "Concurrentiehouding",
  "maj.postureLabel": "Houding",
  "maj.save": "Opslaan",
  "maj.hedgeNote":
    "HEDGE maximaliseert wettige concurrentierespons: gaten, vergelijkingen, betere bronnen, digitale PR. Nooit valse reviews, klikfraude, negatieve links of misleidende pagina’s.",
  "maj.signals": "Signalen",
  "maj.signalsEmpty": "Nog geen signalen. Koppel bronnen en het systeem begint te meten.",
  "maj.signalsCount": "{n} signalen met herkomst. Laatste: {kind} van {source}, {when}.",
  "maj.impact.low": "Laag",
  "maj.impact.medium": "Gemiddeld",
  "maj.impact.high": "Hoog",
  "maj.cap.webintel": "Zoekzichtbaarheid",
  "maj.cap.search-console": "Search Console",
  "maj.cap.analytics": "Analytics",
  "maj.cap.crawler": "Technische crawl",
};
