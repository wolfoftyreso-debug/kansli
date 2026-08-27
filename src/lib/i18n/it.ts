import type { MessageKey } from "./en.ts";

export const IT: Record<MessageKey, string> = {
  "chrome.rooms": "Stanze",
  "chrome.services": "Servizi",
  "chrome.signIn": "Accedi",
  "chrome.signOut": "Esci",
  "chrome.signedOut": "non connesso",
  "chrome.switchOrg": "Cambia azienda",
  "chrome.menu": "Menu",
  "chrome.language": "Lingua",
  "chrome.orgs": "Aziende",
  "chrome.skipToContent": "Vai al contenuto",
  "chrome.roomsMobile": "Stanze, mobile",

  "runtime.production": "produzione",
  "runtime.preview": "anteprima",
  "runtime.local": "locale",

  "home.hello": "Ciao",
  "home.helloNamed": "Ciao, {name}",
  "home.roleAdmin": "Amministratore di sistema",
  "home.roleOpen": "Superficie aperta",
  "home.programs": "Programmi · {count} installati",
  "home.openKansli": "Apri Kansli",
  "home.documentation": "Documentazione",
  "home.metaDescription": "Una stanza per lavoro. Lo stesso accesso.",

  "service.platform": "Piattaforma",
  "service.ops": "Esercizio",
  "service.events": "Eventi",
  "service.procurement": "Appalti",
  "service.intake": "Nuovo cliente",
  "service.docs": "Documentazione",

  "category.kansli": "Avvio",
  "category.ekonomi": "Libro",
  "category.tora": "Appalti",
  "category.rita": "Imposta",
  "category.britt": "Follow-up",
  "category.irma": "Accordi",
  "category.tyra": "Hotel pneumatici",
  "category.alva": "Diagnosi",
  "category.creditae": "Credito",
  "category.maj": "Ricerca",

  "idp.title": "Accedi · Pixdrift",
  "idp.heading": "Accesso",
  "idp.email": "E-mail",
  "idp.password": "Password",
  "idp.submit": "Accedi",
  "idp.noAccount": "Nessun account?",
  "idp.requestAccess": "Chiedi accesso tramite l’appalto di gruppo",
  "idp.wrongCredentials": "E-mail o password errati.",
  "idp.tooManyAttempts": "Troppi tentativi. Riprova tra un momento.",
  "idp.errorTitle": "Errore",
  "idp.errorHeading": "La richiesta non può essere elaborata",
  "idp.loginUnavailable": "L’accesso non è disponibile ora",
  "idp.loginUnavailableBody":
    "Non siamo riusciti a raggiungere l’accesso. Riprova tra un momento o torna alla {home}.",
  "idp.home": "pagina iniziale",
  "idp.pkceRequired": "PKCE (S256) è richiesto",
  "idp.demo": "Demo: {email} / {password}",

  "common.missing": "manca",
  "common.all": "Tutti",
  "common.loading": "Caricamento…",
  "common.saving": "Salvataggio…",
  "common.configured": "configurato · {auth}",
  "common.missingKey": "chiave mancante",

  "alva.metaTitle": "ALVA — Pixdrift",
  "alva.metaDescription": "Il guasto del cliente, note e misure. La diagnosi arriva dopo.",
  "alva.lead":
    "ALVA prende ciò che ha detto il cliente, ciò che avete annotato e ciò che è stato misurato. La diagnosi sarà collegata dopo. Il sistema non diagnostica da solo.",
  "alva.notice":
    "La diagnosi non è ancora collegata. Potete compilare un protocollo vuoto con i vostri fatti. Il sistema non inventa nulla.",
  "alva.signInTitle": "Accedi per registrare i casi",
  "alva.signInBody": "Il caso è salvato in ALVA. Accedi per registrare.",
  "alva.newCase": "Nuovo caso",
  "alva.complaint": "Descrizione del cliente",
  "alva.vehicleRef": "Riferimento veicolo (facoltativo)",
  "alva.area": "Area (facoltativo, es. freni)",
  "alva.mileage": "Chilometraggio km (facoltativo)",
  "alva.desiredOutcome": "Esito desiderato (facoltativo)",
  "alva.register": "Registra caso",
  "alva.cases": "Casi",
  "alva.empty": "Nessun caso ancora.",
  "alva.status.open": "Aperto",
  "alva.status.in_progress": "In corso",
  "alva.status.closed": "Chiuso",
  "alva.detailMetaTitle": "Caso — ALVA — Pixdrift",
  "alva.detailSignInTitle": "Accedi per vedere il caso",
  "alva.detailSignInBody": "Il caso appartiene all’organizzazione.",
  "alva.detailNotice": "I fatti li compilate voi. Il sistema non trae conclusioni proprie.",
  "alva.vehicleRefShort": "Riferimento veicolo",
  "alva.areaShort": "Area",
  "alva.mileageShort": "Chilometraggio",

  "creditae.metaTitle": "CREDITAE — Pixdrift",
  "creditae.metaDescription":
    "Valutazione creditizia di una controparte. La vostra conclusione, nessun voto inventato.",
  "creditae.lead":
    "CREDITAE prende chi valuterete e a cosa siete arrivati. Il sistema non assegna un voto di credito.",
  "creditae.noticeOn":
    "Credito attivo. Il rapporto dell’agenzia viene preso alla registrazione. La conclusione resta vostra.",
  "creditae.noticeOff":
    "Credito spento. Nessuna agenzia di credito è collegata. La valutazione è vostra. Il sistema non inventa mai un voto.",
  "creditae.signInTitle": "Accedi per valutare una controparte",
  "creditae.signInBody": "La richiesta è salvata in CREDITAE. Accedi per registrare.",
  "creditae.newInquiry": "Nuova richiesta",
  "creditae.orgNumber": "Numero dell’organizzazione",
  "creditae.companyName": "Nome azienda (facoltativo)",
  "creditae.reason": "Perché valutate (facoltativo)",
  "creditae.register": "Registra richiesta",
  "creditae.inquiries": "Richieste",
  "creditae.empty": "Nessuna richiesta ancora.",
  "creditae.status.open": "Aperta",
  "creditae.status.assessed": "Valutata",
  "creditae.assess.go": "Vai",
  "creditae.assess.watch": "Osserva",
  "creditae.assess.stop": "Ferma",
  "creditae.vendor.blocked": "Credito spento",
  "creditae.vendor.failed": "Nessun rapporto",
  "creditae.vendor.fetched": "Rapporto dentro",
  "creditae.domain": "Sito web (facoltativo)",
  "creditae.domainField": "Sito web",
  "creditae.web": "Presenza web",
  "creditae.webNoticeOn":
    "Dati web attivi. La visibilità viene recuperata dalla fonte quando premete il pulsante. I numeri sono del fornitore, alla lettera.",
  "creditae.webNoticeOff":
    "Dati web spenti. Nessuna fonte di dati web è collegata. Non viene recuperato nulla.",
  "creditae.web.blocked": "Dati web spenti",
  "creditae.web.failed": "Nessun dato web",
  "creditae.web.fetched": "Dati web dentro",
  "creditae.webRank": "Rango del fornitore",
  "creditae.webKeywords": "Parole chiave organiche",
  "creditae.webTraffic": "Traffico organico, stima del fornitore",
  "creditae.webAds": "Parole chiave a pagamento",
  "creditae.webFetch": "Recupera dati web",
  "creditae.webWhyMissing": "Perché i dati mancano",
  "creditae.webNotConclusion": "Sono i numeri del fornitore, non la vostra conclusione.",
  "creditae.detailMetaTitle": "Richiesta — CREDITAE — Pixdrift",
  "creditae.detailSignInTitle": "Accedi per vedere la richiesta",
  "creditae.detailSignInBody": "La richiesta appartiene all’organizzazione.",
  "creditae.detailNoticeOn":
    "La conclusione la compilate voi. I campi dell’agenzia non sono la vostra valutazione.",
  "creditae.detailNoticeOff":
    "La conclusione la compilate voi. Il sistema non assegna un voto di credito.",
  "creditae.why": "Perché",
  "creditae.bureau": "Agenzia di credito",
  "creditae.vendorName": "Nome presso l’agenzia",

  "kansli.metaTitle": "Kansli — Pixdrift",
  "kansli.metaDescription": "La pagina iniziale. Compiti e l’ingresso.",
  "kansli.lead":
    "Qui inizia tutto. Lo stesso accesso in ogni sistema e una bacheca per il lavoro interno.",
  "kansli.signInTitle": "Accedi con Pixdrift",
  "kansli.signInBody": "Lo stesso accesso copre TORA, RITA, BRITT, IRMA e ALVA.",
  "kansli.firstCustomer": "Primo cliente — una lista, non una data",
  "kansli.groupProcurement": "Appalto di gruppo",
  "kansli.family": "La famiglia",
  "kansli.map": "La mappa",
  "kansli.mapLead": "Cosa fa ogni sistema e come si collegano.",
  "kansli.recentEvents": "Eventi recenti",
  "kansli.notice":
    "Quando nasce un compito, BRITT riceve qualcosa da seguire. Kansli resta proprietario del compito.",

  "tasks.summary": "Bacheca compiti — {open} aperti, {done} fatti.",
  "tasks.titlePlaceholder": "Nuovo compito…",
  "tasks.titleAria": "Titolo del compito",
  "tasks.ownerPlaceholder": "Responsabile",
  "tasks.ownerAria": "Responsabile",
  "tasks.add": "Aggiungi",
  "tasks.empty": "Nessun compito ancora. Aggiungi il primo sopra.",
  "tasks.remove": "Rimuovi",
  "tasks.markDone": 'Segna "{title}" come fatto',
  "tasks.removeNamed": 'Rimuovi "{title}"',
  "tasks.fetchError": "Impossibile caricare i compiti.",
  "tasks.saveError": "Impossibile salvare il compito.",
  "tasks.updateError": "Impossibile aggiornare il compito.",
  "tasks.deleteError": "Impossibile rimuovere il compito.",
  "tasks.genericError": "Qualcosa è andato storto.",
  "tasks.emptyTitle": "Il titolo non può essere vuoto.",

  "platform.metaTitle": "Piattaforma — Pixdrift",
  "platform.metaDescription": "Cosa fa ogni sistema e come si collegano.",
  "platform.heading": "Cosa fa ogni sistema",
  "platform.notice":
    "Ogni sistema fa un lavoro. TORA prende gli appalti. RITA prende l’imposta. Non si mescolano.",
  "platform.systems": "I sistemi",
  "platform.howTheyConnect": "Come si collegano",
  "platform.moreSystems": "Altri sistemi",
  "platform.waiting": "In attesa di collegamento",
  "platform.tech": "Tecnica — per chi gestisce l’esercizio",
  "platform.gateway": "Gateway modelli",
  "platform.gatewayLead":
    "Una chiave dà accesso a più di 100 modelli. Ricorda: le risposte del sistema sono ipotesi, non fatti.",
  "platform.gatewayHint": "Imposta {key} in Secrets o {oidc} su Vercel.",

  "family.status.operational": "In funzione",
  "family.status.pilot": "In arrivo",
  "family.status.deferred": "Non ancora pronto",
  "family.principle":
    "Lo stesso accesso in ogni sistema. Ogni sistema fa il suo. TORA prende gli appalti. RITA prende l’imposta. Non si mescolano.",
  "family.incoming":
    "Altri sistemi sono in arrivo. Avranno lo stesso accesso e i propri dati. I nomi arrivano quando sono pronti — non prima.",
  "family.party.products": "tutti i prodotti",
  "family.party.events": "l’elenco eventi",
  "family.identity.mission": "Un accesso per ogni sistema.",
  "family.kansli.mission": "La pagina iniziale. Compiti e l’ingresso.",
  "family.ekonomi.mission": "Fatture, IVA e come è arrivato il denaro.",
  "family.tora.mission": "Quali appalti può prendere la vostra azienda.",
  "family.rita.mission": "Cerca risparmi fiscali nei vostri libri.",
  "family.britt.mission": "Ciò che è successo e va seguito.",
  "family.irma.mission": "Invia un accordo, vedi se è letto e confermato.",
  "family.tyra.mission": "Cliente, auto, ruote e il passo successivo.",
  "family.alva.mission": "Il guasto del cliente, note e misure. La diagnosi arriva dopo.",
  "family.creditae.mission":
    "Valutazione creditizia di una controparte. La vostra conclusione, nessun voto inventato.",
  "family.identity.question": "Chi siete, e a quale azienda si applica?",
  "family.identity.does": "Accedete una volta. Poi siete in Kansli, TORA, RITA e gli altri.",
  "family.identity.doesNot":
    "Qui non si inviano fatture e non c’è ancora un codice extra sul telefono.",
  "family.kansli.question": "Da dove comincio, e cosa dobbiamo fare internamente?",
  "family.kansli.does": "Accesso, una bacheca interna e il modulo per i nuovi clienti.",
  "family.kansli.doesNot":
    "Kansli non calcola appalti, imposta o pneumatici. Lo fanno gli altri sistemi.",
  "family.ekonomi.question": "Cosa è registrato, cosa è scaduto, e come è arrivato il denaro?",
  "family.ekonomi.does":
    "Scrive una fattura a 10 giorni, registra in öre, collega Stripe e Revolut, abbina gli incassi quando la banca è collegata.",
  "family.ekonomi.doesNot":
    "Non Visma. Non Fortnox. Nessun pagamento inventato. Le carte richiedono Stripe. Swish richiede che Swish sia collegato.",
  "family.tora.question": "Possiamo offrire qui — e cosa dobbiamo fare ora?",
  "family.tora.does":
    "Confronta l’azienda con gli appalti: requisiti, lacune, importi, date e il passo successivo.",
  "family.tora.doesNot": "Non guarda i libri. Lo fa RITA.",
  "family.rita.question": "Quali detrazioni, IVA e altre lacune stanno nei conti annuali?",
  "family.rita.does":
    "Legge i conti annuali rispetto alle norme fiscali svedesi e lascia proposte da controllare. Non è consulenza fiscale.",
  "family.rita.doesNot":
    "Non inventa risultati. Non dice se potete offrire. Nessun file cliente da caricare ancora.",
  "family.britt.question": "Cosa dovete fare ora, in base a ciò che è già successo?",
  "family.britt.does":
    "Raccoglie ciò che deve essere seguito. Una cosa alla volta, con il passo successivo.",
  "family.britt.doesNot": "BRITT non è un sistema di casi e non è una chat.",
  "family.irma.question": "La controparte ha letto e confermato l’accordo?",
  "family.irma.does": "Invia l’accordo. Mostra se è aperto, firmato o rifiutato.",
  "family.irma.doesNot": "IRMA non è e-mail e non è un archivio di ogni documento.",
  "family.tyra.question": "Quale cliente, quale auto, quali ruote — e qual è il passo successivo?",
  "family.tyra.does":
    "Tiene insieme cliente, veicolo e pneumatici. Mostra quando è ora di cambiare o ritirare.",
  "family.tyra.doesNot": "TYRA non è un registro clienti generale per altri mestieri.",
  "family.alva.question":
    "Cosa ha detto il cliente, cosa è stato misurato — e qual è il passo successivo?",
  "family.alva.does":
    "Prende ciò che è stato detto e misurato. Mostra la nota. Non diagnostica da solo.",
  "family.alva.doesNot": "ALVA non diagnostica e non dà consigli.",
  "family.creditae.question": "Chi dobbiamo valutare — e a cosa siete arrivati?",
  "family.creditae.does":
    "Prende un numero dell’organizzazione e la vostra valutazione. Recupera il rapporto dell’agenzia tramite il canale credito della piattaforma quando è collegato. Vai, osserva o ferma.",
  "family.creditae.doesNot":
    "CREDITAE non assegna un voto di credito. Il prodotto non chiama Creditsafe.",
  "family.maj.mission":
    "Misurare, analizzare, correggere. Visibilità nella ricerca come decisioni, non cruscotti.",
  "family.maj.question": "Cosa è cambiato nella ricerca — e cosa dovremmo fare?",
  "family.maj.does":
    "Prende un dominio, un mercato e un obiettivo. Osserva i dati di ricerca attraverso i canali della piattaforma, pesa le evidenze e propone una breve coda di decisioni con tracciabilità completa. Ogni modifica eseguita viene pubblicata come release numerata.",
  "family.maj.doesNot":
    "MAJ non compra mai link, non falsifica recensioni e non tocca le risorse dei concorrenti. Mostra decisioni, non metriche dei fornitori — il cliente non deve mai capire le fonti dei dati.",
  "family.stack.language": "Lingua",
  "family.stack.language.runs":
    "TypeScript 5 in tutto il sistema. SQL nel database. L’analisi di RITA gira come programma proprio. ekonomi-ledger controlla le registrazioni, non registra in produzione.",
  "family.stack.web": "Web",
  "family.stack.web.runs":
    "Next.js 16.3 App Router, React 19.2, Tailwind CSS 4. Un processo: sito, /idp, prodotti e API.",
  "family.stack.identity": "Identità",
  "family.stack.identity.runs":
    "Accesso proprio, su uno standard aperto. Un cookie vi tiene connessi. Lo stesso accesso in ogni sistema.",
  "family.stack.data": "Dati",
  "family.stack.data.runs":
    "PostgreSQL 16. Ogni sistema ha i propri dati. Nessun sistema scrive nei dati di un altro.",
  "family.stack.analysis": "Analisi",
  "family.stack.analysis.runs":
    "TORA calcola nello stesso processo. RITA chiama un’analisi propria. Nessun risultato inventato in produzione.",
  "family.stack.automation": "Automazione",
  "family.stack.automation.runs":
    "I modelli passano dal gateway Vercel. La risposta è un’ipotesi, non un fatto.",
  "family.stack.ops": "Esercizio e test",
  "family.stack.ops.runs":
    "Gira su Vercel. Test contro Postgres 16. Nessun AWS SDK in questo sistema.",
  "family.link.identity.products":
    "Un accesso. I prodotti non leggono le liste utenti degli altri.",
  "family.link.identity.events":
    "Un accesso riuscito viene scritto nel registro. È una ricevuta, non un compito da seguire.",
  "family.link.tora.britt": "Solo quando qualcuno pubblica. Leggere il mercato non crea un evento.",
  "family.link.rita.britt":
    "BRITT riceve il nome dell’azienda, quanti risultati ha prodotto e se l’automazione c’era. Non le proposte stesse — restano in RITA.",
  "family.link.irma.britt": "Accordo creato, aperto, confermato o ritirato.",
  "family.link.tyra.britt":
    "Un caso, un link cliente o un promemoria in coda. Una coda bloccata non significa inviato.",
  "family.link.alva.britt": "Un caso è registrato. Nessuna diagnosi segue finché non è collegata.",
  "family.link.creditae.britt":
    "Una controparte è registrata, avete scritto la conclusione, o il rapporto dell’agenzia è arrivato o si è fermato. Nessun voto inventato segue.",
  "family.link.ekonomi.britt":
    "Una fattura emessa, un incasso registrato o un recupero Revolut che non è andato a buon fine.",
  "family.link.ekonomi.revolut":
    "Il ciclo di vita del collegamento bancario. Un rinnovo ordinario è registrato come esercizio, non come qualcosa da seguire.",
  "family.link.ekonomi.invoice":
    "Una bozza compare nel registro. Nessuna contabilità fino all’emissione.",
  "family.link.kansli.task":
    "Un compito interno compare in BRITT. Kansli resta proprietario del compito.",
  "family.link.kansli.intake":
    "È arrivata una domanda, o è stato creato un account officina per la demo.",
  "family.link.britt.finding":
    "I risultati più importanti dell’analisi di esempio diventano cose da seguire. Il resto resta in BRITT.",
  "family.link.britt.events": "Ogni cosa da seguire viene scritta anche nell’elenco eventi.",
  "family.blocked.rita":
    "L’analisi di RITA deve essere collegata (su Vercel via URL, in locale via il file del programma) prima che le analisi possano girare.",
  "family.blocked.alva":
    "La diagnosi guidata viene collegata quando è pronta. Il caso può già essere registrato.",
  "family.blocked.irma":
    "IRMA resta da noi: una conferma digitale semplice e un proprio link. Non ancora una firma elettronica giuridica.",
  "family.blocked.britt":
    "Fortnox, Revolut e i profili di BRITT se l’analisi di esempio deve diventare tutto il prodotto.",
  "family.blocked.ekonomi":
    "Stripe, Revolut e Swish quando volete incassare così. Una fattura a 10 giorni funziona senza di loro.",
  "family.blocked.creditae":
    "CREDITAE passa dal canale credito della piattaforma. I prodotti non chiamano Creditsafe. Senza chiave non si recupera alcun rapporto. La valutazione resta vostra.",
  "tyra.metaTitle": "TYRA — Pixdrift",
  "tyra.metaDescription": "Cliente, auto, ruote e il passo successivo.",
  "tyra.heading": "Quale veicolo entra?",
  "tyra.lead":
    "TYRA tiene insieme cliente, auto e ruote. I pneumatici si vendono qui — un clic registra la fattura in Ekonomi. Gli importi sono le vostre cifre. Non ancora prezzi in tempo reale.",
  "tyra.customers": "Schede cliente",
  "tyra.integrations": "Integrazioni",
  "tyra.signInTitle": "Accedi per aprire i casi",
  "tyra.signInBody":
    "Lo stesso accesso del resto di Pixdrift. Nessun account extra per l’officina.",
  "tyra.notice":
    "I promemoria vanno in coda ma non vengono ancora inviati — manca un collegamento SMS o e-mail. Nessun prezzo pneumatici in tempo reale.",
  "ekonomi.metaTitle": "Ekonomi — Pixdrift",
  "ekonomi.metaDescription": "Fatture, IVA e come è arrivato il denaro.",
  "ekonomi.heading": "Cosa è registrato?",
  "ekonomi.lead":
    "Registrate le vendite in corone. Un clic emette la fattura. I preventivi TYRA non registrati restano in coda. Il cliente può pagare con Swish, Stripe o una fattura a 10 giorni. Collegate Revolut una volta e i movimenti vengono recuperati e i pagamenti abbinati. Visma è il prossimo collegamento — non è ancora qui.",
  "ekonomi.signInTitle": "Accedi per vedere il libro",
  "ekonomi.signInBody": "I libri appartengono alla vostra azienda. Accedi per vederli.",
  "ekonomi.notice":
    "Scrivete corone. Il libro conserva öre. Ogni registrazione quadra. I pagamenti girano sul serio solo quando i collegamenti ci sono — nulla è simulato senza che abbiate detto sì.",
  "ekonomi.statements": "Movimenti",
  "ekonomi.invoices": "Fatture",
  "ekonomi.vouchers": "Registrazioni",
  "ekonomi.reports": "Rapporti / IVA",
  "ekonomi.connections": "Collegamenti",
  "tora.metaTitle": "TORA — Pixdrift",
  "tora.metaDescription": "Quali appalti può prendere la vostra azienda.",
  "tora.lead":
    "TORA mostra a quali appalti {name} può offrire — e perché proprio voi. Ecco tutta la valutazione: requisiti, lacune e il passo successivo.",
  "tora.noticeDemo":
    "Gli appalti sono esempi, non avvisi veri. La vista è un account a pagamento, quindi vedete nomi, importi e requisiti. I dati aziendali sono l’azienda di esempio finché non salvate il vostro profilo.",
  "tora.noticeSaved":
    "Gli appalti sono esempi, non avvisi veri. La vista è un account a pagamento, quindi vedete nomi, importi e requisiti. I dati aziendali sono il vostro profilo salvato ({name}).",
  "tora.calendar": "Calendario",
  "tora.current": "In corso",
  "tora.upcoming": "In arrivo",
  "tora.watch": "Osserva",
  "tora.publishedValue": "Valore pubblicato",
  "tora.yourCompany": "La vostra azienda",
  "tora.profileLead":
    "Senza profilo salvato calcoliamo sull’azienda di esempio invece che su di voi.",
  "tora.frameworks": "Accordi di cui fate già parte",
  "tora.references": "Referenze con cui TORA conta",
  "rita.metaTitle": "RITA — Pixdrift",
  "rita.metaDescription": "RITA cerca risparmi fiscali nei vostri libri.",
  "rita.lead":
    "RITA cerca risparmi fiscali nei vostri libri: detrazioni, IVA, K10, pensione e R&S. Ciò che RITA trova sono proposte da controllare — non consulenza fiscale.",
  "rita.noticeReady":
    "L’analisi è in corso. Parti della risposta arrivano da un modello e possono chiedere un secondo sguardo.",
  "rita.noticeRules":
    "L’analisi è in corso, ma senza modello per ora. Si usano solo le regole fisse.",
  "rita.noticeBlocked":
    "L’analisi non è ancora collegata, quindi le nuove analisi restano bloccate. Non mostriamo mai risultati inventati.",
  "rita.noticeExample":
    "I conti di esempio sono un esempio integrato — non qualcosa caricato da un cliente.",
  "rita.signInTitle": "Accedi per chiedere un’analisi",
  "rita.signInBody":
    "L’analisi è salvata in RITA. BRITT riceve qualcosa da seguire quando un’analisi finisce o si ferma.",
  "britt.metaTitle": "BRITT — Pixdrift",
  "britt.metaDescription": "Ciò che è successo e va seguito.",
  "britt.lead":
    "BRITT raccoglie ciò che va seguito. Le cifre qui sono esempi — ancora nessun collegamento Fortnox o Revolut.",
  "britt.noticeDemo":
    "Le cifre qui sono esempi per la casa, non Fortnox e non una cassa in tempo reale.",
  "britt.noticeOwn":
    "Qui seguite le vostre osservazioni. Le cifre di esempio girano solo sulla casa.",
  "britt.signInTitle": "Accedi per vedere le osservazioni",
  "britt.signInBody":
    "Le osservazioni appartengono alla vostra azienda. Ciò che succede in TORA, RITA e IRMA compare qui.",
  "irma.metaTitle": "IRMA — Pixdrift",
  "irma.metaDescription": "Invia un accordo, vedi se è letto e confermato.",
  "irma.heading": "Quale accordo deve uscire?",
  "irma.lead":
    "Con IRMA inviate accordi in digitale: create, mandate un link, vedete quando la controparte ha aperto e confermato. Alla controparte non serve un account. È una conferma digitale semplice, non una firma elettronica giuridica. Non c’è ancora un archivio documenti.",
  "irma.signInTitle": "Accedi per creare accordi",
  "irma.signInBody":
    "Il link viene mostrato una volta — copiatelo subito. Non lo conserviamo in forma leggibile.",
  "creditae.vendorScore": "Valore dell’agenzia",
  "creditae.vendorLimit": "Limite dell’agenzia",
  "creditae.vendorNotConclusion": "Sono i campi dell’agenzia, non la vostra conclusione.",
  "creditae.vendorWhyMissing": "Perché manca il rapporto",
  "creditae.notes": "Nota",
  "creditae.yourAssessment": "La vostra valutazione",
  "creditae.conclusion": "Conclusione",
};
