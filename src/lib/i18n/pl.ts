import type { MessageKey } from "./en.ts";

export const PL: Record<MessageKey, string> = {
  "chrome.rooms": "Pokoje",
  "chrome.services": "Usługi",
  "chrome.signIn": "Zaloguj się",
  "chrome.signOut": "Wyloguj się",
  "chrome.signedOut": "nie zalogowano",
  "chrome.switchOrg": "Zmień firmę",
  "chrome.menu": "Menu",
  "chrome.language": "Język",
  "chrome.orgs": "Firmy",
  "chrome.skipToContent": "Przejdź do treści",
  "chrome.roomsMobile": "Pokoje, telefon",

  "runtime.production": "produkcja",
  "runtime.preview": "podgląd",
  "runtime.local": "lokalnie",

  "home.hello": "Cześć",
  "home.helloNamed": "Cześć, {name}",
  "home.roleAdmin": "Administrator systemu",
  "home.roleOpen": "Powierzchnia otwarta",
  "home.programs": "Programy · {count} zainstalowane",
  "home.openKansli": "Otwórz Kansli",
  "home.documentation": "Dokumentacja",
  "home.metaDescription": "Jeden pokój na zadanie. To samo logowanie.",

  "service.platform": "Platforma",
  "service.ops": "Eksploatacja",
  "service.events": "Zdarzenia",
  "service.procurement": "Zamówienia",
  "service.intake": "Nowy klient",
  "service.docs": "Dokumentacja",

  "category.kansli": "Start",
  "category.ekonomi": "Księga",
  "category.tora": "Zamówienia",
  "category.rita": "Podatek",
  "category.britt": "Monitoring",
  "category.irma": "Umowy",
  "category.tyra": "Hotel opon",
  "category.alva": "Diagnostyka",
  "category.creditae": "Kredyt",
  "category.maj": "Wyszukiwanie",

  "idp.title": "Zaloguj się · Pixdrift",
  "idp.heading": "Logowanie",
  "idp.email": "E-mail",
  "idp.password": "Hasło",
  "idp.submit": "Zaloguj się",
  "idp.noAccount": "Nie masz konta?",
  "idp.requestAccess": "Poproś o dostęp przez zamówienie grupowe",
  "idp.wrongCredentials": "Błędny e-mail lub hasło.",
  "idp.tooManyAttempts": "Zbyt wiele prób. Spróbuj za chwilę.",
  "idp.errorTitle": "Błąd",
  "idp.errorHeading": "Żądania nie można przetworzyć",
  "idp.loginUnavailable": "Logowanie jest teraz niedostępne",
  "idp.loginUnavailableBody":
    "Nie udało się dotrzeć do logowania. Spróbuj za chwilę albo wróć na {home}.",
  "idp.home": "stronę główną",
  "idp.pkceRequired": "Wymagane jest PKCE (S256)",
  "idp.demo": "Demo: {email} / {password}",

  "common.missing": "brak",
  "common.all": "Wszystkie",
  "common.loading": "Wczytywanie…",
  "common.saving": "Zapisywanie…",
  "common.configured": "skonfigurowano · {auth}",
  "common.missingKey": "brak klucza",

  "alva.metaTitle": "ALVA — Pixdrift",
  "alva.metaDescription": "Usterka klienta, notatki i pomiary. Diagnoza przyjdzie później.",
  "alva.lead":
    "ALVA przyjmuje to, co powiedział klient, co zanotowaliście i co zmierzono. Diagnoza będzie podłączona później. System sam nie stawia diagnozy.",
  "alva.notice":
    "Diagnoza nie jest jeszcze podłączona. Możecie wypełnić pusty protokół własnymi faktami. System nigdy nic nie wymyśla.",
  "alva.signInTitle": "Zaloguj się, aby zarejestrować sprawy",
  "alva.signInBody": "Sprawa jest zapisywana w ALVA. Zaloguj się, aby zarejestrować.",
  "alva.newCase": "Nowa sprawa",
  "alva.complaint": "Opis klienta",
  "alva.vehicleRef": "Odniesienie pojazdu (opcjonalnie)",
  "alva.area": "Obszar (opcjonalnie, np. hamulce)",
  "alva.mileage": "Licznik km (opcjonalnie)",
  "alva.desiredOutcome": "Oczekiwany wynik (opcjonalnie)",
  "alva.register": "Zarejestruj sprawę",
  "alva.cases": "Sprawy",
  "alva.empty": "Brak spraw.",
  "alva.status.open": "Otwarte",
  "alva.status.in_progress": "W toku",
  "alva.status.closed": "Zamknięte",
  "alva.detailMetaTitle": "Sprawa — ALVA — Pixdrift",
  "alva.detailSignInTitle": "Zaloguj się, aby zobaczyć sprawę",
  "alva.detailSignInBody": "Sprawa należy do organizacji.",
  "alva.detailNotice": "Fakty wpisujecie sami. System nie wyciąga własnych wniosków.",
  "alva.vehicleRefShort": "Odniesienie pojazdu",
  "alva.areaShort": "Obszar",
  "alva.mileageShort": "Licznik",

  "creditae.metaTitle": "CREDITAE — Pixdrift",
  "creditae.metaDescription": "Ocena kredytowa kontrahenta. Wasz wniosek, bez wymyślonej oceny.",
  "creditae.lead":
    "CREDITAE przyjmuje, kogo oceniacie i do czego sami doszliście. System nie nadaje oceny kredytowej.",
  "creditae.noticeOn":
    "Kredyt włączony. Raport biura jest pobierany przy rejestracji zapytania. Wniosek nadal należy do was.",
  "creditae.noticeOff":
    "Kredyt wyłączony. Żadne biuro kredytowe nie jest podłączone. Ocena należy do was. System nigdy nie wymyśla oceny.",
  "creditae.signInTitle": "Zaloguj się, aby ocenić kontrahenta",
  "creditae.signInBody": "Zapytanie jest zapisywane w CREDITAE. Zaloguj się, aby zarejestrować.",
  "creditae.newInquiry": "Nowe zapytanie",
  "creditae.orgNumber": "Numer organizacji",
  "creditae.companyName": "Nazwa firmy (opcjonalnie)",
  "creditae.reason": "Dlaczego oceniacie (opcjonalnie)",
  "creditae.register": "Zarejestruj zapytanie",
  "creditae.inquiries": "Zapytania",
  "creditae.empty": "Brak zapytań.",
  "creditae.status.open": "Otwarte",
  "creditae.status.assessed": "Ocenione",
  "creditae.assess.go": "Jedź",
  "creditae.assess.watch": "Obserwuj",
  "creditae.assess.stop": "Zatrzymaj",
  "creditae.vendor.blocked": "Kredyt wyłączony",
  "creditae.vendor.failed": "Brak raportu",
  "creditae.vendor.fetched": "Raport w środku",
  "creditae.domain": "Strona internetowa (opcjonalnie)",
  "creditae.domainField": "Strona internetowa",
  "creditae.web": "Obecność w sieci",
  "creditae.webNoticeOn":
    "Dane z sieci włączone. Widoczność jest pobierana ze źródła po naciśnięciu przycisku. Liczby są dostawcy, dosłownie.",
  "creditae.webNoticeOff":
    "Dane z sieci wyłączone. Żadne źródło danych nie jest podłączone. Nic nie jest pobierane.",
  "creditae.web.blocked": "Dane z sieci wyłączone",
  "creditae.web.failed": "Brak danych z sieci",
  "creditae.web.fetched": "Dane z sieci pobrane",
  "creditae.webRank": "Ranking dostawcy",
  "creditae.webKeywords": "Organiczne słowa kluczowe",
  "creditae.webTraffic": "Ruch organiczny, szacunek dostawcy",
  "creditae.webAds": "Płatne słowa kluczowe",
  "creditae.webFetch": "Pobierz dane z sieci",
  "creditae.webWhyMissing": "Dlaczego danych brakuje",
  "creditae.webNotConclusion": "To liczby dostawcy, nie wasz wniosek.",
  "creditae.detailMetaTitle": "Zapytanie — CREDITAE — Pixdrift",
  "creditae.detailSignInTitle": "Zaloguj się, aby zobaczyć zapytanie",
  "creditae.detailSignInBody": "Zapytanie należy do organizacji.",
  "creditae.detailNoticeOn": "Wniosek wpisujecie sami. Pola biura to nie wasza ocena.",
  "creditae.detailNoticeOff": "Wniosek wpisujecie sami. System nie nadaje oceny kredytowej.",
  "creditae.why": "Dlaczego",
  "creditae.bureau": "Biuro kredytowe",
  "creditae.vendorName": "Nazwa w biurze",

  "kansli.metaTitle": "Kansli — Pixdrift",
  "kansli.metaDescription": "Strona startowa. Zadania i wejście.",
  "kansli.lead":
    "Tu się zaczyna. To samo logowanie w każdym systemie i tablica zadań do pracy wewnętrznej.",
  "kansli.signInTitle": "Zaloguj się przez Pixdrift",
  "kansli.signInBody": "To samo logowanie obejmuje TORA, RITA, BRITT, IRMA i ALVA.",
  "kansli.firstCustomer": "Pierwszy klient — lista, nie data",
  "kansli.groupProcurement": "Zamówienie grupowe",
  "kansli.family": "Rodzina",
  "kansli.map": "Mapa",
  "kansli.mapLead": "Co robi każdy system i jak się łączą.",
  "kansli.recentEvents": "Ostatnie zdarzenia",
  "kansli.notice":
    "Gdy powstaje zadanie, BRITT dostaje coś do monitorowania. Kansli nadal jest właścicielem zadania.",

  "tasks.summary": "Tablica zadań — {open} otwarte, {done} ukończone.",
  "tasks.titlePlaceholder": "Nowe zadanie…",
  "tasks.titleAria": "Tytuł zadania",
  "tasks.ownerPlaceholder": "Odpowiedzialny",
  "tasks.ownerAria": "Odpowiedzialny",
  "tasks.add": "Dodaj",
  "tasks.empty": "Brak zadań. Dodaj pierwsze powyżej.",
  "tasks.remove": "Usuń",
  "tasks.markDone": 'Oznacz "{title}" jako ukończone',
  "tasks.removeNamed": 'Usuń "{title}"',
  "tasks.fetchError": "Nie udało się wczytać zadań.",
  "tasks.saveError": "Nie udało się zapisać zadania.",
  "tasks.updateError": "Nie udało się zaktualizować zadania.",
  "tasks.deleteError": "Nie udało się usunąć zadania.",
  "tasks.genericError": "Coś poszło nie tak.",
  "tasks.emptyTitle": "Tytuł nie może być pusty.",

  "platform.metaTitle": "Platforma — Pixdrift",
  "platform.metaDescription": "Co robi każdy system i jak się łączą.",
  "platform.heading": "Co robi każdy system",
  "platform.notice":
    "Każdy system wykonuje jedną pracę. TORA bierze zamówienia. RITA bierze podatek. Nie miesza się ich.",
  "platform.systems": "Systemy",
  "platform.howTheyConnect": "Jak się łączą",
  "platform.moreSystems": "Więcej systemów",
  "platform.waiting": "Czeka na podłączenie",
  "platform.tech": "Technologia — dla tego, kto prowadzi eksploatację",
  "platform.gateway": "Bramka modeli",
  "platform.gatewayLead":
    "Jeden klucz daje dostęp do ponad 100 modeli. Pamiętaj: odpowiedzi systemu to zgadywanie, nie fakty.",
  "platform.gatewayHint": "Ustaw {key} w Secrets albo {oidc} na Vercel.",

  "family.status.operational": "Działa",
  "family.status.pilot": "W drodze",
  "family.status.deferred": "Jeszcze niegotowe",
  "family.principle":
    "To samo logowanie w każdym systemie. Każdy system robi swoje. TORA bierze zamówienia. RITA bierze podatek. Nie miesza się ich.",
  "family.incoming":
    "Kolejne systemy są w drodze. Dostaną to samo logowanie i własne zapisy. Nazwy pojawią się, gdy będą gotowe — nie wcześniej.",
  "family.party.products": "wszystkie produkty",
  "family.party.events": "lista zdarzeń",
  "family.identity.mission": "Jedno logowanie do każdego systemu.",
  "family.kansli.mission": "Strona startowa. Zadania i wejście.",
  "family.ekonomi.mission": "Faktury, VAT i skąd weszły pieniądze.",
  "family.tora.mission": "Które zamówienia może wziąć wasza firma.",
  "family.rita.mission": "Szuka oszczędności podatkowych w waszych księgach.",
  "family.britt.mission": "To, co się stało i wymaga monitorowania.",
  "family.irma.mission": "Wyślij umowę, zobacz czy jest przeczytana i potwierdzona.",
  "family.tyra.mission": "Klient, auto, koła i co dalej.",
  "family.alva.mission": "Usterka klienta, notatki i pomiary. Diagnoza przyjdzie później.",
  "family.creditae.mission": "Ocena kredytowa kontrahenta. Wasz wniosek, bez wymyślonej oceny.",
  "family.identity.question": "Kim jesteś i której firmy to dotyczy?",
  "family.identity.does": "Logujesz się raz. Potem jesteś w Kansli, TORA, RITA i pozostałych.",
  "family.identity.doesNot":
    "Stąd nie wychodzą faktury i nie ma jeszcze dodatkowego kodu w telefonie.",
  "family.kansli.question": "Gdzie zaczynam i co mamy zrobić wewnątrz?",
  "family.kansli.does": "Logowanie, wewnętrzna tablica zadań i formularz nowych klientów.",
  "family.kansli.doesNot": "Kansli nie liczy zamówień, podatku ani opon. To robią inne systemy.",
  "family.ekonomi.question":
    "Co jest zaksięgowane, co jest przeterminowane i skąd weszły pieniądze?",
  "family.ekonomi.does":
    "Wystawia fakturę na 10 dni, księguje w öre, łączy Stripe i Revolut, dopasowuje wpłaty gdy bank jest podłączony.",
  "family.ekonomi.doesNot":
    "To nie Visma. To nie Fortnox. Żadnej wymyślonej wpłaty. Karty wymagają Stripe. Swish wymaga podłączenia Swish.",
  "family.tora.question": "Czy możemy złożyć ofertę tutaj — i co teraz zrobić?",
  "family.tora.does":
    "Porównuje firmę z zamówieniami: wymagania, luki, kwoty, daty i następny krok.",
  "family.tora.doesNot": "Nie zagląda do ksiąg. To robi RITA.",
  "family.rita.question": "Jakie odliczenia, VAT i inne luki siedzą w sprawozdaniu?",
  "family.rita.does":
    "Czyta sprawozdanie wobec szwedzkich przepisów podatkowych i zostawia propozycje do sprawdzenia. To nie porada podatkowa.",
  "family.rita.doesNot":
    "Nie wymyśla wyników. Nie mówi czy wolno składać ofertę. Nie ma jeszcze pliku klienta do wgrania.",
  "family.britt.question": "Co trzeba zrobić teraz, na podstawie tego co już się stało?",
  "family.britt.does": "Zbiera sprawy do monitorowania. Jedna rzecz na raz, z następnym krokiem.",
  "family.britt.doesNot": "BRITT nie jest systemem spraw i nie jest czatem.",
  "family.irma.question": "Czy kontrahent przeczytał i potwierdził umowę?",
  "family.irma.does": "Wysyła umowę. Pokazuje czy jest otwarta, podpisana czy odrzucona.",
  "family.irma.doesNot": "IRMA nie jest pocztą i nie jest archiwum wszystkich dokumentów.",
  "family.tyra.question": "Który klient, które auto, które koła — i jaki jest następny krok?",
  "family.tyra.does":
    "Trzyma razem klienta, pojazd i opony. Pokazuje kiedy czas na wymianę lub odbiór.",
  "family.tyra.doesNot": "TYRA nie jest ogólnym rejestrem klientów dla innych branż.",
  "family.alva.question": "Co powiedział klient, co zmierzono — i jaki jest następny krok?",
  "family.alva.does":
    "Przyjmuje to co powiedziano i zmierzono. Pokazuje notatkę. Nie stawia diagnozy sam.",
  "family.alva.doesNot": "ALVA nie stawia diagnozy i nie daje rady.",
  "family.creditae.question": "Kogo mamy ocenić — i do czego doszliście?",
  "family.creditae.does":
    "Przyjmuje numer organizacji i waszą ocenę. Pobiera raport biura przez kanał kredytowy platformy gdy jest podłączony. Jedź, obserwuj albo stań.",
  "family.creditae.doesNot": "CREDITAE nie stawia oceny kredytowej. Produkt nie woła Creditsafe.",
  "family.maj.mission":
    "Mierz, analizuj, koryguj. Widoczność w wyszukiwarce jako decyzje, nie pulpity.",
  "family.maj.question": "Co zmieniło się w wyszukiwarce — i co powinniśmy z tym zrobić?",
  "family.maj.does":
    "Przyjmuje domenę, rynek i cel. Obserwuje dane wyszukiwania przez kanały platformy, waży dowody i proponuje krótką kolejkę decyzji z pełnym śladem pochodzenia. Każda wykonana zmiana jest publikowana jako wersjonowane wydanie.",
  "family.maj.doesNot":
    "MAJ nigdy nie kupuje linków, nie fałszuje opinii i nie dotyka zasobów konkurencji. Pokazuje decyzje, nie metryki dostawców — klient nigdy nie musi rozumieć źródeł danych.",
  "family.stack.language": "Język",
  "family.stack.language.runs":
    "TypeScript 5 w całym systemie. SQL w bazie. Analiza RITA działa jako osobny program. ekonomi-ledger sprawdza dowody, nie księguje na produkcji.",
  "family.stack.web": "Sieć",
  "family.stack.web.runs":
    "Next.js 16.3 App Router, React 19.2, Tailwind CSS 4. Jeden proces: witryna, /idp, produkty i API.",
  "family.stack.identity": "Tożsamość",
  "family.stack.identity.runs":
    "Własne logowanie, na otwartym standardzie. Jedno ciasteczko utrzymuje sesję. To samo logowanie w każdym systemie.",
  "family.stack.data": "Dane",
  "family.stack.data.runs":
    "PostgreSQL 16. Każdy system ma własne dane. Żaden system nie zapisuje w danych innego.",
  "family.stack.analysis": "Analiza",
  "family.stack.analysis.runs":
    "TORA liczy w tym samym procesie. RITA woła własną analizę. Żadnych wymyślonych wyników na produkcji.",
  "family.stack.automation": "Automatyzacja",
  "family.stack.automation.runs":
    "Modele idą przez bramę Vercel. Odpowiedź to zgadywanie, nie fakt.",
  "family.stack.ops": "Eksploatacja i test",
  "family.stack.ops.runs":
    "Działa na Vercel. Testy wobec Postgres 16. Brak AWS SDK w tym systemie.",
  "family.link.identity.products":
    "Jedno logowanie. Produkty nie czytają swoich list użytkowników.",
  "family.link.identity.events":
    "Udane logowanie jest zapisane w dzienniku. To pokwitowanie, nie zadanie do monitorowania.",
  "family.link.tora.britt": "Tylko gdy ktoś publikuje. Czytanie rynku nie tworzy zdarzenia.",
  "family.link.rita.britt":
    "BRITT dostaje nazwę firmy, ile było trafień i czy była automatyzacja. Nie same propozycje — te zostają w RITA.",
  "family.link.irma.britt": "Umowa utworzona, otwarta, potwierdzona albo wycofana.",
  "family.link.tyra.britt":
    "Sprawa, link klienta albo przypomnienie w kolejce. Zablokowana kolejka nie znaczy wysłane.",
  "family.link.alva.britt":
    "Sprawa jest zarejestrowana. Diagnoza nie idzie dalej dopóki nie jest podłączona.",
  "family.link.creditae.britt":
    "Kontrahent jest zarejestrowany, napisaliście wniosek, albo raport biura wszedł albo stanął. Nie idzie za tym wymyślona ocena.",
  "family.link.ekonomi.britt":
    "Wystawiona faktura, zaksięgowana wpłata albo pobranie Revolut które nie przeszło.",
  "family.link.ekonomi.revolut":
    "Cykl życia połączenia bankowego. Zwykłe odnowienie logowane jest jako eksploatacja, nie jako coś do monitorowania.",
  "family.link.ekonomi.invoice": "Szkic pojawia się w dzienniku. Brak księgowania do wystawienia.",
  "family.link.kansli.task":
    "Wewnętrzne zadanie pojawia się w BRITT. Kansli nadal jest właścicielem zadania.",
  "family.link.kansli.intake": "Wpłynął wniosek albo utworzono konto warsztatu na potrzeby dema.",
  "family.link.britt.finding":
    "Najważniejsze trafienia z przykładowej analizy stają się sprawami do monitorowania. Reszta zostaje w BRITT.",
  "family.link.britt.events": "Każda sprawa do monitorowania jest też zapisana na liście zdarzeń.",
  "family.blocked.rita":
    "Analiza RITA musi być podłączona (na Vercel przez URL, lokalnie przez plik programu) zanim analizy mogą działać.",
  "family.blocked.alva":
    "Prowadzona diagnoza zostanie podłączona gdy będzie gotowa. Sprawę można już rejestrować.",
  "family.blocked.irma":
    "IRMA zostaje u nas: proste potwierdzenie cyfrowe i własny link. Jeszcze bez prawnego e-podpisu.",
  "family.blocked.britt":
    "Fortnox, Revolut i profile BRITT jeśli przykładowa analiza ma stać się całym produktem.",
  "family.blocked.ekonomi":
    "Stripe, Revolut i Swish gdy chcecie przyjmować płatność tą drogą. Faktura na 10 dni działa bez nich.",
  "family.blocked.creditae":
    "CREDITAE idzie przez kanał kredytowy platformy. Produkty nie wołają Creditsafe. Bez klucza raport nie jest pobierany. Ocena nadal jest wasza.",
  "tyra.metaTitle": "TYRA — Pixdrift",
  "tyra.metaDescription": "Klient, auto, koła i co dalej.",
  "tyra.heading": "Który pojazd wjeżdża?",
  "tyra.lead":
    "TYRA trzyma razem klienta, auto i koła. Opony sprzedaje się tutaj — jedno kliknięcie księguje fakturę w Ekonomi. Kwoty to wasze własne liczby. Jeszcze bez cen na żywo.",
  "tyra.customers": "Karty klientów",
  "tyra.integrations": "Integracje",
  "tyra.signInTitle": "Zaloguj się aby otworzyć sprawy",
  "tyra.signInBody": "To samo logowanie co reszta Pixdrift. Bez dodatkowego konta dla warsztatu.",
  "tyra.notice":
    "Przypomnienia idą do kolejki ale jeszcze nie są wysyłane — brak połączenia SMS i e-mail. Brak cen opon na żywo.",
  "ekonomi.metaTitle": "Ekonomi — Pixdrift",
  "ekonomi.metaDescription": "Faktury, VAT i skąd weszły pieniądze.",
  "ekonomi.heading": "Co jest zaksięgowane?",
  "ekonomi.lead":
    "Księgujcie sprzedaż w koronach. Jedno kliknięcie wystawia fakturę. Oferty TYRA które nie są zaksięgowane siedzą w kolejce. Klient może zapłacić Swish, Stripe albo fakturą na 10 dni. Połączcie Revolut raz, a wyciągi są pobierane i wpłaty dopasowywane. Visma to następne połączenie — jeszcze go tu nie ma.",
  "ekonomi.signInTitle": "Zaloguj się aby zobaczyć księgi",
  "ekonomi.signInBody": "Księgi należą do waszej firmy. Zalogujcie się aby je zobaczyć.",
  "ekonomi.notice":
    "Piszecie korony. Księga zapisuje öre. Każdy dowód się bilansuje. Płatności idą naprawdę tylko gdy połączenia są na miejscu — nic nie jest symulowane bez waszej zgody.",
  "ekonomi.statements": "Wyciągi",
  "ekonomi.invoices": "Faktury",
  "ekonomi.vouchers": "Dowody",
  "ekonomi.reports": "Raporty / VAT",
  "ekonomi.connections": "Połączenia",
  "tora.metaTitle": "TORA — Pixdrift",
  "tora.metaDescription": "Które zamówienia może wziąć wasza firma.",
  "tora.lead":
    "TORA pokazuje które zamówienia {name} może wziąć — i dlaczego właśnie wy. Tu jest cała ocena: wymagania, luki i następny krok.",
  "tora.noticeDemo":
    "Zamówienia są przykładami, nie prawdziwymi ogłoszeniami. Widok to konto płatne, więc widać nazwy, kwoty i wymagania. Dane firmy to firma przykładowa dopóki nie zapiszecie własnego profilu.",
  "tora.noticeSaved":
    "Zamówienia są przykładami, nie prawdziwymi ogłoszeniami. Widok to konto płatne, więc widać nazwy, kwoty i wymagania. Dane firmy to wasz zapisany profil ({name}).",
  "tora.calendar": "Kalendarz",
  "tora.current": "Bieżące",
  "tora.upcoming": "Nadchodzące",
  "tora.watch": "Obserwacja",
  "tora.publishedValue": "Opublikowana wartość",
  "tora.yourCompany": "Wasza firma",
  "tora.profileLead": "Bez zapisanego profilu liczymy na firmie przykładowej zamiast na was.",
  "tora.frameworks": "Umowy w których już jesteście",
  "tora.references": "Referencje które TORA liczy",
  "rita.metaTitle": "RITA — Pixdrift",
  "rita.metaDescription": "RITA szuka oszczędności podatkowych w waszych księgach.",
  "rita.lead":
    "RITA szuka oszczędności podatkowych w waszych księgach: odliczenia, VAT, K10, emerytura i B+R. To co RITA znajdzie to propozycje do dalszego sprawdzenia — nie porada podatkowa.",
  "rita.noticeReady":
    "Analiza działa. Część odpowiedzi pochodzi z modelu i może wymagać drugiego spojrzenia.",
  "rita.noticeRules": "Analiza działa, ale bez modelu na razie. Używane są tylko stałe reguły.",
  "rita.noticeBlocked":
    "Analiza nie jest jeszcze podłączona, więc nowe analizy zostają zablokowane. Nigdy nie pokazujemy wymyślonych wyników.",
  "rita.noticeExample":
    "Przykładowe sprawozdanie jest wbudowanym przykładem — nie czymś co wgrał klient.",
  "rita.signInTitle": "Zaloguj się aby zlecić analizę",
  "rita.signInBody":
    "Analiza jest zapisana w RITA. BRITT dostaje coś do monitorowania gdy analiza się skończy albo zatrzyma.",
  "britt.metaTitle": "BRITT — Pixdrift",
  "britt.metaDescription": "To, co się stało i wymaga monitorowania.",
  "britt.lead":
    "BRITT zbiera sprawy do monitorowania. Liczby tutaj są przykładami — jeszcze bez połączeń Fortnox ani Revolut.",
  "britt.noticeDemo": "Liczby tutaj są przykładami dla domu, nie Fortnox i nie kasą na żywo.",
  "britt.noticeOwn":
    "Tutaj śledzicie własne obserwacje. Przykładowe liczby działają tylko na domu.",
  "britt.signInTitle": "Zaloguj się aby zobaczyć obserwacje",
  "britt.signInBody":
    "Obserwacje należą do waszej firmy. To co dzieje się w TORA, RITA i IRMA pojawia się tutaj.",
  "irma.metaTitle": "IRMA — Pixdrift",
  "irma.metaDescription": "Wyślij umowę, zobacz czy jest przeczytana i potwierdzona.",
  "irma.heading": "Która umowa ma wyjść?",
  "irma.lead":
    "Z IRMA wysyłacie umowy cyfrowo: utwórz, wyślij link, zobacz kiedy kontrahent otworzył i potwierdził. Kontrahent nie potrzebuje konta. To proste potwierdzenie cyfrowe, nie prawny e-podpis. Nie ma jeszcze archiwum dokumentów.",
  "irma.signInTitle": "Zaloguj się aby tworzyć umowy",
  "irma.signInBody":
    "Link pokazuje się raz — skopiujcie go od razu. Nie zapisujemy go w czytelnej formie.",
  "creditae.vendorScore": "Wartość biura",
  "creditae.vendorLimit": "Limit biura",
  "creditae.vendorNotConclusion": "To pola biura, nie wasz wniosek.",
  "creditae.vendorWhyMissing": "Dlaczego brakuje raportu",
  "creditae.notes": "Notatka",
  "creditae.yourAssessment": "Wasza ocena",
  "creditae.conclusion": "Wniosek",
};
