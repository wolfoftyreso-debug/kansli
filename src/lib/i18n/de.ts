import type { MessageKey } from "./en.ts";

export const DE: Record<MessageKey, string> = {
  "chrome.rooms": "Räume",
  "chrome.services": "Dienste",
  "chrome.signIn": "Anmelden",
  "chrome.signOut": "Abmelden",
  "chrome.signedOut": "nicht angemeldet",
  "chrome.switchOrg": "Firma wechseln",
  "chrome.menu": "Menü",
  "chrome.language": "Sprache",
  "chrome.orgs": "Firmen",
  "chrome.skipToContent": "Zum Inhalt springen",
  "chrome.roomsMobile": "Räume, mobil",

  "runtime.production": "produktion",
  "runtime.preview": "vorschau",
  "runtime.local": "lokal",

  "home.hello": "Hallo",
  "home.helloNamed": "Hallo, {name}",
  "home.roleAdmin": "Systemadministrator",
  "home.roleOpen": "Offene Fläche",
  "home.programs": "Programme · {count} installiert",
  "home.openKansli": "Kansli öffnen",
  "home.documentation": "Dokumentation",
  "home.metaDescription": "Ein Raum pro Aufgabe. Dieselbe Anmeldung.",

  "service.platform": "Plattform",
  "service.ops": "Betrieb",
  "service.events": "Ereignisse",
  "service.procurement": "Vergabe",
  "service.intake": "Neuer Kunde",
  "service.docs": "Dokumentation",

  "category.kansli": "Start",
  "category.ekonomi": "Buch",
  "category.tora": "Vergabe",
  "category.rita": "Steuer",
  "category.britt": "Nachverfolgung",
  "category.irma": "Verträge",
  "category.tyra": "Reifenhotel",
  "category.alva": "Diagnose",
  "category.creditae": "Kredit",

  "idp.title": "Anmelden · Pixdrift",
  "idp.heading": "Anmeldung",
  "idp.email": "E-Mail",
  "idp.password": "Passwort",
  "idp.submit": "Anmelden",
  "idp.noAccount": "Kein Konto?",
  "idp.requestAccess": "Zugang über den Konzernauftrag anfordern",
  "idp.wrongCredentials": "Falsche E-Mail oder falsches Passwort.",
  "idp.tooManyAttempts": "Zu viele Versuche. Versuchen Sie es in einem Moment erneut.",
  "idp.errorTitle": "Fehler",
  "idp.errorHeading": "Die Anfrage kann nicht verarbeitet werden",
  "idp.loginUnavailable": "Die Anmeldung ist gerade nicht erreichbar",
  "idp.loginUnavailableBody":
    "Wir konnten die Anmeldung nicht erreichen. Versuchen Sie es in einem Moment erneut oder gehen Sie zurück zur {home}.",
  "idp.home": "Startseite",
  "idp.pkceRequired": "PKCE (S256) ist erforderlich",
  "idp.demo": "Demo: {email} / {password}",

  "common.missing": "fehlt",
  "common.all": "Alle",
  "common.loading": "Laden…",
  "common.saving": "Speichern…",
  "common.configured": "konfiguriert · {auth}",
  "common.missingKey": "Schlüssel fehlt",

  "alva.metaTitle": "ALVA — Pixdrift",
  "alva.metaDescription": "Kundenfehler, Notizen und Messwerte. Die Diagnose kommt später.",
  "alva.lead":
    "ALVA nimmt auf, was der Kunde gesagt hat, was Sie notiert und was gemessen wurde. Die Diagnose wird später angeschlossen. Das System stellt keine eigene Diagnose.",
  "alva.notice":
    "Die Diagnose ist noch nicht angeschlossen. Sie können ein leeres Protokoll mit eigenen Fakten füllen. Das System erfindet nichts.",
  "alva.signInTitle": "Anmelden, um Fälle zu erfassen",
  "alva.signInBody": "Der Fall wird in ALVA gespeichert. Melden Sie sich an, um zu erfassen.",
  "alva.newCase": "Neuer Fall",
  "alva.complaint": "Beschreibung des Kunden",
  "alva.vehicleRef": "Fahrzeugreferenz (optional)",
  "alva.area": "Bereich (optional, z. B. Bremsen)",
  "alva.mileage": "Kilometerstand km (optional)",
  "alva.desiredOutcome": "Gewünschtes Ergebnis (optional)",
  "alva.register": "Fall erfassen",
  "alva.cases": "Fälle",
  "alva.empty": "Noch keine Fälle.",
  "alva.status.open": "Offen",
  "alva.status.in_progress": "Läuft",
  "alva.status.closed": "Geschlossen",
  "alva.detailMetaTitle": "Fall — ALVA — Pixdrift",
  "alva.detailSignInTitle": "Anmelden, um den Fall zu sehen",
  "alva.detailSignInBody": "Der Fall gehört zur Organisation.",
  "alva.detailNotice": "Die Fakten tragen Sie selbst ein. Das System zieht keine eigenen Schlüsse.",
  "alva.vehicleRefShort": "Fahrzeugreferenz",
  "alva.areaShort": "Bereich",
  "alva.mileageShort": "Kilometerstand",

  "creditae.metaTitle": "CREDITAE — Pixdrift",
  "creditae.metaDescription":
    "Kreditbeurteilung eines Gegenparts. Ihr Schluss, keine erfundene Note.",
  "creditae.lead":
    "CREDITAE nimmt auf, wen Sie beurteilen und wozu Sie selbst gekommen sind. Das System setzt keine Kreditnote.",
  "creditae.noticeOn":
    "Kredit an. Der Bürobericht wird geholt, wenn die Anfrage erfasst wird. Ihr Schluss bleibt Ihrer.",
  "creditae.noticeOff":
    "Kredit aus. Kein Kreditbüro ist angeschlossen. Die Beurteilung ist Ihre. Das System erfindet keine Note.",
  "creditae.signInTitle": "Anmelden, um einen Gegenpart zu beurteilen",
  "creditae.signInBody":
    "Die Anfrage wird in CREDITAE gespeichert. Melden Sie sich an, um zu erfassen.",
  "creditae.newInquiry": "Neue Anfrage",
  "creditae.orgNumber": "Organisationsnummer",
  "creditae.companyName": "Firmenname (optional)",
  "creditae.reason": "Warum Sie beurteilen (optional)",
  "creditae.register": "Anfrage erfassen",
  "creditae.inquiries": "Anfragen",
  "creditae.empty": "Noch keine Anfragen.",
  "creditae.status.open": "Offen",
  "creditae.status.assessed": "Beurteilt",
  "creditae.assess.go": "Fahren",
  "creditae.assess.watch": "Beobachten",
  "creditae.assess.stop": "Halten",
  "creditae.vendor.blocked": "Kredit aus",
  "creditae.vendor.failed": "Kein Bericht",
  "creditae.vendor.fetched": "Bericht da",
  "creditae.detailMetaTitle": "Anfrage — CREDITAE — Pixdrift",
  "creditae.detailSignInTitle": "Anmelden, um die Anfrage zu sehen",
  "creditae.detailSignInBody": "Die Anfrage gehört zur Organisation.",
  "creditae.detailNoticeOn":
    "Den Schluss tragen Sie selbst ein. Bürofelder sind nicht Ihre Beurteilung.",
  "creditae.detailNoticeOff":
    "Den Schluss tragen Sie selbst ein. Das System setzt keine Kreditnote.",
  "creditae.why": "Warum",
  "creditae.bureau": "Kreditbüro",
  "creditae.vendorName": "Name beim Büro",

  "kansli.metaTitle": "Kansli — Pixdrift",
  "kansli.metaDescription": "Die Startseite. Aufgaben und der Weg hinein.",
  "kansli.lead":
    "Hier beginnt alles. Dieselbe Anmeldung in jedem System und eine Aufgabenwand für interne Arbeit.",
  "kansli.signInTitle": "Mit Pixdrift anmelden",
  "kansli.signInBody": "Dieselbe Anmeldung gilt für TORA, RITA, BRITT, IRMA und ALVA.",
  "kansli.firstCustomer": "Erster Kunde — eine Checkliste, kein Datum",
  "kansli.groupProcurement": "Konzernvergabe",
  "kansli.family": "Die Familie",
  "kansli.map": "Die Karte",
  "kansli.mapLead": "Was jedes System tut und wie sie zusammenhängen.",
  "kansli.recentEvents": "Letzte Ereignisse",
  "kansli.notice":
    "Wenn eine Aufgabe entsteht, bekommt BRITT etwas nachzuverfolgen. Kansli bleibt Eigentümer der Aufgabe.",

  "tasks.summary": "Aufgabenwand — {open} offen, {done} erledigt.",
  "tasks.titlePlaceholder": "Neue Aufgabe…",
  "tasks.titleAria": "Aufgabentitel",
  "tasks.ownerPlaceholder": "Verantwortlich",
  "tasks.ownerAria": "Verantwortlich",
  "tasks.add": "Hinzufügen",
  "tasks.empty": "Noch keine Aufgaben. Fügen Sie die erste oben hinzu.",
  "tasks.remove": "Entfernen",
  "tasks.markDone": '"{title}" als erledigt markieren',
  "tasks.removeNamed": '"{title}" entfernen',
  "tasks.fetchError": "Aufgaben konnten nicht geladen werden.",
  "tasks.saveError": "Die Aufgabe konnte nicht gespeichert werden.",
  "tasks.updateError": "Die Aufgabe konnte nicht aktualisiert werden.",
  "tasks.deleteError": "Die Aufgabe konnte nicht entfernt werden.",
  "tasks.genericError": "Etwas ist schiefgegangen.",
  "tasks.emptyTitle": "Der Titel darf nicht leer sein.",

  "platform.metaTitle": "Plattform — Pixdrift",
  "platform.metaDescription": "Was jedes System tut und wie sie zusammenhängen.",
  "platform.heading": "Was jedes System tut",
  "platform.notice":
    "Jedes System macht einen Job. TORA nimmt Vergaben. RITA nimmt Steuer. Sie werden nicht vermischt.",
  "platform.systems": "Die Systeme",
  "platform.howTheyConnect": "Wie sie zusammenhängen",
  "platform.moreSystems": "Weitere Systeme",
  "platform.waiting": "Wartet auf den Anschluss",
  "platform.tech": "Technik — für den, der den Betrieb führt",
  "platform.gateway": "Modellgateway",
  "platform.gatewayLead":
    "Ein Schlüssel gibt Zugang zu mehr als 100 Modellen. Denken Sie daran: Antworten des Systems sind Vermutungen, keine Fakten.",
  "platform.gatewayHint": "Setzen Sie {key} in Secrets oder {oidc} auf Vercel.",

  "family.status.operational": "Läuft",
  "family.status.pilot": "Unterwegs",
  "family.status.deferred": "Noch nicht fertig",
  "family.principle":
    "Dieselbe Anmeldung in jedem System. Jedes System macht das Seine. TORA nimmt Vergaben. RITA nimmt Steuer. Sie werden nicht vermischt.",
  "family.incoming":
    "Weitere Systeme sind unterwegs. Sie bekommen dieselbe Anmeldung und eigene Daten. Namen kommen, wenn sie bereit sind — nicht vorher.",
  "family.party.products": "alle Produkte",
  "family.party.events": "die Ereignisliste",
  "family.identity.mission": "Eine Anmeldung für jedes System.",
  "family.kansli.mission": "Die Startseite. Aufgaben und der Weg hinein.",
  "family.ekonomi.mission": "Rechnungen, MwSt und wie das Geld hereinkam.",
  "family.tora.mission": "Welche Vergaben Ihre Firma nehmen kann.",
  "family.rita.mission": "Sucht Steuerersparnisse in Ihren Büchern.",
  "family.britt.mission": "Was geschehen ist und nachverfolgt werden muss.",
  "family.irma.mission": "Einen Vertrag senden, sehen ob er gelesen und bestätigt ist.",
  "family.tyra.mission": "Kunde, Auto, Räder und was als Nächstes zu tun ist.",
  "family.alva.mission": "Kundenfehler, Notizen und Messwerte. Die Diagnose kommt später.",
  "family.creditae.mission":
    "Kreditbeurteilung eines Gegenparts. Ihr Schluss, keine erfundene Note.",
  "family.identity.question": "Wer sind Sie, und für welche Firma gilt es?",
  "family.identity.does":
    "Sie melden sich einmal an. Dann sind Sie in Kansli, TORA, RITA und den anderen.",
  "family.identity.doesNot":
    "Hier werden keine Rechnungen gesendet, und es gibt noch keinen extra Mobilcode.",
  "family.kansli.question": "Wo fange ich an, und was sollen wir intern tun?",
  "family.kansli.does": "Anmeldung, eine interne Aufgabenliste und das Formular für neue Kunden.",
  "family.kansli.doesNot":
    "Kansli rechnet nicht Vergabe, Steuer oder Reifen. Das tun die anderen Systeme.",
  "family.ekonomi.question": "Was ist gebucht, was ist überfällig, und wie kam das Geld herein?",
  "family.ekonomi.does":
    "Schreibt eine 10-Tage-Rechnung, bucht in Öre, verbindet Stripe und Revolut, gleicht Zahlungseingänge ab wenn die Bank verbunden ist.",
  "family.ekonomi.doesNot":
    "Nicht Visma. Nicht Fortnox. Keine erfundene Zahlung. Karten brauchen Stripe. Swish braucht, dass Swish verdrahtet ist.",
  "family.tora.question": "Können wir hier bieten — und was sollen wir jetzt tun?",
  "family.tora.does":
    "Vergleicht die Firma mit den Vergaben: Anforderungen, Lücken, Beträge, Daten und den nächsten Schritt.",
  "family.tora.doesNot": "Schaut nicht in die Bücher. Das tut RITA.",
  "family.rita.question": "Welche Abzüge, MwSt und andere Lücken sitzen im Abschluss?",
  "family.rita.does":
    "Liest den Abschluss gegen schwedische Steuerregeln und lässt Vorschläge zum Prüfen. Keine Steuerberatung.",
  "family.rita.doesNot":
    "Erfindet keine Ergebnisse. Sagt nicht, ob Sie bieten dürfen. Noch keine Kundendatei zum Hochladen.",
  "family.britt.question": "Was müssen Sie jetzt tun, ausgehend von dem was schon geschehen ist?",
  "family.britt.does":
    "Sammelt Dinge die nachverfolgt werden müssen. Eine Sache nach der anderen, mit dem nächsten Schritt.",
  "family.britt.doesNot": "BRITT ist kein Fallsystem und kein Chat.",
  "family.irma.question": "Hat der Gegenpart den Vertrag gelesen und bestätigt?",
  "family.irma.does":
    "Sendet den Vertrag. Zeigt ob er geöffnet, unterschrieben oder abgelehnt ist.",
  "family.irma.doesNot": "IRMA ist keine E-Mail und kein Archiv für jedes Dokument.",
  "family.tyra.question":
    "Welcher Kunde, welches Auto, welche Räder — und was ist der nächste Schritt?",
  "family.tyra.does":
    "Hält Kunde, Fahrzeug und Reifen zusammen. Zeigt wann es Zeit zum Wechseln oder Abholen ist.",
  "family.tyra.doesNot": "TYRA ist kein allgemeines Kundenregister für andere Gewerbe.",
  "family.alva.question":
    "Was hat der Kunde gesagt, was wurde gemessen — und was ist der nächste Schritt?",
  "family.alva.does":
    "Nimmt was gesagt und gemessen wurde. Zeigt die Notiz. Stellt selbst keine Diagnose.",
  "family.alva.doesNot": "ALVA stellt keine Diagnose und gibt keinen Rat.",
  "family.creditae.question": "Wen sollen wir beurteilen — und wozu sind Sie gekommen?",
  "family.creditae.does":
    "Nimmt eine Organisationsnummer und Ihre Beurteilung. Holt den Bürobericht über den Kreditkanal der Plattform wenn er verdrahtet ist. Los, beobachten oder stoppen.",
  "family.creditae.doesNot":
    "CREDITAE setzt keine Kreditnote. Das Produkt ruft Creditsafe nicht an.",
  "family.stack.language": "Sprache",
  "family.stack.language.runs":
    "TypeScript 5 im ganzen System. SQL in der Datenbank. RITAs Analyse läuft als eigenes Programm. ekonomi-ledger prüft Belege, bucht nicht in Produktion.",
  "family.stack.web": "Web",
  "family.stack.web.runs":
    "Next.js 16.3 App Router, React 19.2, Tailwind CSS 4. Ein Prozess: Site, /idp, Produkte und API.",
  "family.stack.identity": "Identität",
  "family.stack.identity.runs":
    "Eigene Anmeldung, auf offenem Standard. Ein Cookie hält Sie angemeldet. Dieselbe Anmeldung in jedem System.",
  "family.stack.data": "Daten",
  "family.stack.data.runs":
    "PostgreSQL 16. Jedes System hat eigene Daten. Kein System schreibt in die Daten eines anderen.",
  "family.stack.analysis": "Analyse",
  "family.stack.analysis.runs":
    "TORA rechnet im selben Prozess. RITA ruft eine eigene Analyse. Keine erfundenen Ergebnisse in Produktion.",
  "family.stack.automation": "Automation",
  "family.stack.automation.runs":
    "Modelle gehen über das Vercel-Gateway. Die Antwort ist eine Vermutung, kein Fakt.",
  "family.stack.ops": "Betrieb und Test",
  "family.stack.ops.runs":
    "Läuft auf Vercel. Tests gegen Postgres 16. Kein AWS SDK in diesem System.",
  "family.link.identity.products":
    "Eine Anmeldung. Produkte lesen nicht gegenseitig die Benutzerlisten.",
  "family.link.identity.events":
    "Eine gelungene Anmeldung wird ins Protokoll geschrieben. Das ist eine Quittung, keine Aufgabe zum Nachverfolgen.",
  "family.link.tora.britt":
    "Nur wenn jemand veröffentlicht. Das Lesen des Marktes erzeugt kein Ereignis.",
  "family.link.rita.britt":
    "BRITT bekommt den Firmennamen, wie viele Treffer es gab und ob Automation dabei war. Nicht die Vorschläge selbst — die bleiben in RITA.",
  "family.link.irma.britt": "Vertrag erstellt, geöffnet, bestätigt oder zurückgezogen.",
  "family.link.tyra.britt":
    "Ein Fall, ein Kundenlink oder eine Erinnerung in der Warteschlange. Eine blockierte Warteschlange heißt nicht gesendet.",
  "family.link.alva.britt":
    "Ein Fall ist registriert. Keine Diagnose folgt bis sie verdrahtet ist.",
  "family.link.creditae.britt":
    "Ein Gegenpart ist registriert, Sie haben Ihren Schluss geschrieben, oder der Bürobericht kam oder blieb stehen. Keine erfundene Note folgt.",
  "family.link.ekonomi.britt":
    "Eine ausgestellte Rechnung, eine gebuchte Einzahlung oder ein Revolut-Abruf der nicht durchging.",
  "family.link.ekonomi.revolut":
    "Lebenszyklus der Bankverbindung. Gewöhnliche Erneuerung wird als Betrieb protokolliert, nicht als etwas zum Nachverfolgen.",
  "family.link.ekonomi.invoice":
    "Ein Entwurf erscheint im Protokoll. Keine Buchhaltung bis zur Ausstellung.",
  "family.link.kansli.task":
    "Eine interne Aufgabe erscheint bei BRITT. Kansli besitzt die Aufgabe weiter.",
  "family.link.kansli.intake":
    "Eine Anmeldung ist eingegangen, oder ein Werkstattkonto wurde für die Demo angelegt.",
  "family.link.britt.finding":
    "Die wichtigsten Treffer der Beispielanalyse werden Dinge zum Nachverfolgen. Der Rest bleibt in BRITT.",
  "family.link.britt.events":
    "Jedes Ding zum Nachverfolgen wird auch in die Ereignisliste geschrieben.",
  "family.blocked.rita":
    "RITAs Analyse muss verdrahtet sein (auf Vercel per URL, lokal per Programmdatei) bevor Analysen laufen können.",
  "family.blocked.alva":
    "Die geführte Diagnose wird verdrahtet wenn sie fertig ist. Der Fall kann schon registriert werden.",
  "family.blocked.irma":
    "IRMA bleibt bei uns: eine einfache digitale Bestätigung und ein eigener Link. Noch keine rechtliche E-Signatur.",
  "family.blocked.britt":
    "Fortnox, Revolut und BRITTs Profile wenn die Beispielanalyse das ganze Produkt werden soll.",
  "family.blocked.ekonomi":
    "Stripe, Revolut und Swish wenn Sie so bezahlt werden wollen. Eine 10-Tage-Rechnung funktioniert ohne sie.",
  "family.blocked.creditae":
    "CREDITAE geht über den Kreditkanal der Plattform. Produkte rufen Creditsafe nicht an. Ohne Schlüssel wird kein Bericht geholt. Die Beurteilung bleibt Ihre.",
  "tyra.metaTitle": "TYRA — Pixdrift",
  "tyra.metaDescription": "Kunde, Auto, Räder und was als Nächstes zu tun ist.",
  "tyra.heading": "Welches Fahrzeug kommt herein?",
  "tyra.lead":
    "TYRA hält Kunde, Auto und Räder zusammen. Reifen werden hier verkauft — ein Klick bucht die Rechnung in Ekonomi. Beträge sind Ihre eigenen Zahlen. Noch keine Live-Preise.",
  "tyra.customers": "Kundenkarten",
  "tyra.integrations": "Integrationen",
  "tyra.signInTitle": "Anmelden um Fälle zu öffnen",
  "tyra.signInBody":
    "Dieselbe Anmeldung wie der Rest von Pixdrift. Kein extra Konto für die Werkstatt.",
  "tyra.notice":
    "Erinnerungen gehen in die Warteschlange, werden aber noch nicht gesendet — es fehlt eine SMS- und E-Mail-Verbindung. Keine Live-Reifenpreise.",
  "ekonomi.metaTitle": "Ekonomi — Pixdrift",
  "ekonomi.metaDescription": "Rechnungen, MwSt und wie das Geld hereinkam.",
  "ekonomi.heading": "Was ist gebucht?",
  "ekonomi.lead":
    "Buchen Sie Verkauf in Kronen. Ein Klick stellt die Rechnung aus. TYRA-Angebote die nicht gebucht sind sitzen in der Warteschlange. Der Kunde kann mit Swish, Stripe oder einer 10-Tage-Rechnung zahlen. Verbinden Sie Revolut einmal, dann werden Auszüge geholt und Zahlungen abgeglichen. Visma ist die nächste Verbindung — sie ist noch nicht hier.",
  "ekonomi.signInTitle": "Anmelden um das Buch zu sehen",
  "ekonomi.signInBody": "Die Bücher gehören Ihrer Firma. Melden Sie sich an um sie zu sehen.",
  "ekonomi.notice":
    "Sie schreiben Kronen. Das Buch speichert Öre. Jeder Beleg bilanziert. Zahlungen laufen nur wirklich wenn die Verbindungen stehen — nichts wird simuliert ohne dass Sie ja gesagt haben.",
  "ekonomi.statements": "Auszüge",
  "ekonomi.invoices": "Rechnungen",
  "ekonomi.vouchers": "Belege",
  "ekonomi.reports": "Berichte / MwSt",
  "ekonomi.connections": "Verbindungen",
  "tora.metaTitle": "TORA — Pixdrift",
  "tora.metaDescription": "Welche Vergaben Ihre Firma nehmen kann.",
  "tora.lead":
    "TORA zeigt welche Vergaben {name} bieten kann — und warum gerade Sie. Hier ist die ganze Beurteilung: Anforderungen, Lücken und der nächste Schritt.",
  "tora.noticeDemo":
    "Die Vergaben sind Beispiele, keine echten Bekanntmachungen. Die Ansicht ist ein bezahltes Konto, Sie sehen also Namen, Beträge und Anforderungen. Firmendaten sind die Beispielfirma bis Sie Ihr eigenes Profil speichern.",
  "tora.noticeSaved":
    "Die Vergaben sind Beispiele, keine echten Bekanntmachungen. Die Ansicht ist ein bezahltes Konto, Sie sehen also Namen, Beträge und Anforderungen. Firmendaten sind Ihr gespeichertes Profil ({name}).",
  "tora.calendar": "Kalender",
  "tora.current": "Aktuell",
  "tora.upcoming": "Kommend",
  "tora.watch": "Beobachten",
  "tora.publishedValue": "Veröffentlichter Wert",
  "tora.yourCompany": "Ihre Firma",
  "tora.profileLead":
    "Ohne gespeichertes Profil rechnen wir mit der Beispielfirma statt mit Ihnen.",
  "rita.metaTitle": "RITA — Pixdrift",
  "rita.metaDescription": "RITA sucht Steuerersparnisse in Ihren Büchern.",
  "rita.lead":
    "RITA sucht Steuerersparnisse in Ihren Büchern: Abzüge, MwSt, K10, Pension und FuE. Was RITA findet sind Vorschläge zum Weiterprüfen — keine Steuerberatung.",
  "rita.noticeReady":
    "Die Analyse läuft. Teile der Antwort kommen von einem Modell und können einen zweiten Blick brauchen.",
  "rita.noticeRules":
    "Die Analyse läuft, aber ohne Modell gerade. Nur die festen Regeln werden verwendet.",
  "rita.noticeBlocked":
    "Die Analyse ist noch nicht verdrahtet, neue Analysen bleiben also blockiert. Wir zeigen nie erfundene Ergebnisse.",
  "rita.noticeExample":
    "Der Beispielabschluss ist ein eingebautes Beispiel — nichts was ein Kunde hochgeladen hat.",
  "rita.signInTitle": "Anmelden um eine Analyse anzufragen",
  "rita.signInBody":
    "Die Analyse wird in RITA gespeichert. BRITT bekommt etwas zum Nachverfolgen wenn eine Analyse fertig wird oder stoppt.",
  "britt.metaTitle": "BRITT — Pixdrift",
  "britt.metaDescription": "Was geschehen ist und nachverfolgt werden muss.",
  "britt.lead":
    "BRITT sammelt Dinge die nachverfolgt werden müssen. Die Zahlen hier sind Beispiele — noch keine Fortnox- oder Revolut-Verbindungen.",
  "britt.noticeDemo":
    "Die Zahlen hier sind Beispiele für das Haus, nicht Fortnox und keine Live-Kasse.",
  "britt.noticeOwn":
    "Hier verfolgen Sie Ihre eigenen Beobachtungen. Beispielzahlen laufen nur auf dem Haus.",
  "britt.signInTitle": "Anmelden um Beobachtungen zu sehen",
  "britt.signInBody":
    "Beobachtungen gehören Ihrer Firma. Was in TORA, RITA und IRMA geschieht erscheint hier.",
  "irma.metaTitle": "IRMA — Pixdrift",
  "irma.metaDescription": "Einen Vertrag senden, sehen ob er gelesen und bestätigt ist.",
  "irma.heading": "Welcher Vertrag soll raus?",
  "irma.lead":
    "Mit IRMA senden Sie Verträge digital: erstellen, einen Link senden, sehen wann der Gegenpart geöffnet und bestätigt hat. Der Gegenpart braucht kein Konto. Es ist eine einfache digitale Bestätigung, keine rechtliche E-Signatur. Es gibt noch kein Dokumentarchiv.",
  "irma.signInTitle": "Anmelden um Verträge zu erstellen",
  "irma.signInBody":
    "Der Link wird einmal gezeigt — kopieren Sie ihn sofort. Wir speichern ihn nicht in lesbarer Form.",
  "creditae.vendorScore": "Büro-Wert",
  "creditae.vendorLimit": "Büro-Grenze",
  "creditae.vendorNotConclusion": "Das sind die Felder des Büros, nicht Ihr Schluss.",
  "creditae.vendorWhyMissing": "Warum der Bericht fehlt",
  "creditae.notes": "Notiz",
  "creditae.yourAssessment": "Ihre Beurteilung",
  "creditae.conclusion": "Schluss",
};
