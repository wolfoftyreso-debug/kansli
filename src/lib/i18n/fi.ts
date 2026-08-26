import type { MessageKey } from "./en.ts";

export const FI: Record<MessageKey, string> = {
  "chrome.rooms": "Huoneet",
  "chrome.services": "Palvelut",
  "chrome.signIn": "Kirjaudu",
  "chrome.signOut": "Kirjaudu ulos",
  "chrome.signedOut": "ei kirjautunut",
  "chrome.switchOrg": "Vaihda yritys",
  "chrome.menu": "Valikko",
  "chrome.language": "Kieli",
  "chrome.orgs": "Yritykset",
  "chrome.skipToContent": "Siirry sisältöön",
  "chrome.roomsMobile": "Huoneet, mobiili",

  "runtime.production": "tuotanto",
  "runtime.preview": "esikatselu",
  "runtime.local": "paikallinen",

  "home.hello": "Hei",
  "home.helloNamed": "Hei, {name}",
  "home.roleAdmin": "Järjestelmänvalvoja",
  "home.roleOpen": "Avoin pinta",
  "home.programs": "Ohjelmat · {count} asennettu",
  "home.openKansli": "Avaa Kansli",
  "home.documentation": "Dokumentaatio",
  "home.metaDescription": "Yksi huone per työ. Sama kirjautuminen.",

  "service.platform": "Alusta",
  "service.ops": "Käyttö",
  "service.events": "Tapahtumat",
  "service.procurement": "Hankinta",
  "service.intake": "Uusi asiakas",
  "service.docs": "Dokumentaatio",

  "category.kansli": "Alku",
  "category.ekonomi": "Kirja",
  "category.tora": "Hankinta",
  "category.rita": "Vero",
  "category.britt": "Seuranta",
  "category.irma": "Sopimukset",
  "category.tyra": "Rengashotelli",
  "category.alva": "Diagnostiikka",
  "category.creditae": "Luotto",

  "idp.title": "Kirjaudu · Pixdrift",
  "idp.heading": "Kirjautuminen",
  "idp.email": "Sähköposti",
  "idp.password": "Salasana",
  "idp.submit": "Kirjaudu",
  "idp.noAccount": "Ei tiliä?",
  "idp.requestAccess": "Pyydä pääsy konsernihankinnan kautta",
  "idp.wrongCredentials": "Väärä sähköposti tai salasana.",
  "idp.tooManyAttempts": "Liian monta yritystä. Yritä hetken kuluttua uudelleen.",
  "idp.errorTitle": "Virhe",
  "idp.errorHeading": "Pyyntöä ei voi käsitellä",
  "idp.loginUnavailable": "Kirjautuminen ei ole juuri nyt käytettävissä",
  "idp.loginUnavailableBody":
    "Kirjautumista ei tavoitettu. Yritä hetken kuluttua uudelleen tai palaa {home}.",
  "idp.home": "etusivulle",
  "idp.pkceRequired": "PKCE (S256) vaaditaan",
  "idp.demo": "Demo: {email} / {password}",

  "common.missing": "puuttuu",
  "common.all": "Kaikki",
  "common.loading": "Ladataan…",
  "common.saving": "Tallennetaan…",
  "common.configured": "määritetty · {auth}",
  "common.missingKey": "avain puuttuu",

  "alva.metaTitle": "ALVA — Pixdrift",
  "alva.metaDescription": "Asiakkaan vika, muistiinpanot ja mittaukset. Diagnoosi tulee myöhemmin.",
  "alva.lead":
    "ALVA ottaa vastaan sen, mitä asiakas sanoi, mitä kirjasitte ja mitä mitattiin. Diagnoosi kytketään myöhemmin. Järjestelmä ei diagnoi itse.",
  "alva.notice":
    "Diagnoosia ei ole vielä kytketty. Voitte täyttää tyhjän pöytäkirjan omilla tiedoilla. Järjestelmä ei koskaan keksi mitään.",
  "alva.signInTitle": "Kirjaudu rekisteröidäksesi tapauksia",
  "alva.signInBody": "Tapaus tallennetaan ALVAAN. Kirjaudu rekisteröidäksesi.",
  "alva.newCase": "Uusi tapaus",
  "alva.complaint": "Asiakkaan kuvaus",
  "alva.vehicleRef": "Ajoneuvoviite (valinnainen)",
  "alva.area": "Alue (valinnainen, esim. jarrut)",
  "alva.mileage": "Mittarilukema km (valinnainen)",
  "alva.desiredOutcome": "Toivottu tulos (valinnainen)",
  "alva.register": "Rekisteröi tapaus",
  "alva.cases": "Tapaukset",
  "alva.empty": "Ei tapauksia vielä.",
  "alva.status.open": "Avoin",
  "alva.status.in_progress": "Käynnissä",
  "alva.status.closed": "Suljettu",
  "alva.detailMetaTitle": "Tapaus — ALVA — Pixdrift",
  "alva.detailSignInTitle": "Kirjaudu nähdäksesi tapauksen",
  "alva.detailSignInBody": "Tapaus kuuluu organisaatiolle.",
  "alva.detailNotice": "Täytätte tiedot itse. Järjestelmä ei tee omia johtopäätöksiä.",
  "alva.vehicleRefShort": "Ajoneuvoviite",
  "alva.areaShort": "Alue",
  "alva.mileageShort": "Mittarilukema",

  "creditae.metaTitle": "CREDITAE — Pixdrift",
  "creditae.metaDescription": "Vastapuolen luottoarvio. Teidän päätelmä, ei keksittyä arvosanaa.",
  "creditae.lead":
    "CREDITAE ottaa vastaan kenet arvioitte ja mihin itse päädyitte. Järjestelmä ei aseta luottoarvosanaa.",
  "creditae.noticeOn":
    "Luotto päällä. Toimiston raportti haetaan, kun kysely rekisteröidään. Päätelmä on yhä teidän.",
  "creditae.noticeOff":
    "Luotto pois. Luottotoimistoa ei ole kytketty. Arvio on teidän. Järjestelmä ei koskaan keksi arvosanaa.",
  "creditae.signInTitle": "Kirjaudu arvioidaksesi vastapuolen",
  "creditae.signInBody": "Kysely tallennetaan CREDITAEHEN. Kirjaudu rekisteröidäksesi.",
  "creditae.newInquiry": "Uusi kysely",
  "creditae.orgNumber": "Organisaationumero",
  "creditae.companyName": "Yrityksen nimi (valinnainen)",
  "creditae.reason": "Miksi arvioitte (valinnainen)",
  "creditae.register": "Rekisteröi kysely",
  "creditae.inquiries": "Kyselyt",
  "creditae.empty": "Ei kyselyitä vielä.",
  "creditae.status.open": "Avoin",
  "creditae.status.assessed": "Arvioitu",
  "creditae.assess.go": "Aja",
  "creditae.assess.watch": "Seuraa",
  "creditae.assess.stop": "Pysäytä",
  "creditae.vendor.blocked": "Luotto pois",
  "creditae.vendor.failed": "Ei raporttia",
  "creditae.vendor.fetched": "Raportti sisällä",
  "creditae.detailMetaTitle": "Kysely — CREDITAE — Pixdrift",
  "creditae.detailSignInTitle": "Kirjaudu nähdäksesi kyselyn",
  "creditae.detailSignInBody": "Kysely kuuluu organisaatiolle.",
  "creditae.detailNoticeOn": "Täytätte päätelmän itse. Toimiston kentät eivät ole teidän arvionne.",
  "creditae.detailNoticeOff": "Täytätte päätelmän itse. Järjestelmä ei aseta luottoarvosanaa.",
  "creditae.why": "Miksi",
  "creditae.bureau": "Luottotoimisto",
  "creditae.vendorName": "Nimi toimistolla",

  "kansli.metaTitle": "Kansli — Pixdrift",
  "kansli.metaDescription": "Aloitussivu. Tehtävät ja sisäänkäynti.",
  "kansli.lead":
    "Tästä se alkaa. Sama kirjautuminen kaikissa järjestelmissä ja tehtävätaulu sisäiseen työhön.",
  "kansli.signInTitle": "Kirjaudu Pixdriftillä",
  "kansli.signInBody": "Sama kirjautuminen kattaa TORAN, RITAN, BRITTIN, IRMAN ja ALVAN.",
  "kansli.firstCustomer": "Ensimmäinen asiakas — lista, ei päivämäärä",
  "kansli.groupProcurement": "Konsernihankinta",
  "kansli.family": "Perhe",
  "kansli.map": "Kartta",
  "kansli.mapLead": "Mitä kukin järjestelmä tekee ja miten ne liittyvät.",
  "kansli.recentEvents": "Viimeisimmät tapahtumat",
  "kansli.notice": "Kun tehtävä syntyy, BRITT saa seurattavaa. Kansli omistaa tehtävän yhä.",

  "tasks.summary": "Tehtävätaulu — {open} avointa, {done} valmista.",
  "tasks.titlePlaceholder": "Uusi tehtävä…",
  "tasks.titleAria": "Tehtävän otsikko",
  "tasks.ownerPlaceholder": "Vastuullinen",
  "tasks.ownerAria": "Vastuullinen",
  "tasks.add": "Lisää",
  "tasks.empty": "Ei tehtäviä vielä. Lisää ensimmäinen yllä.",
  "tasks.remove": "Poista",
  "tasks.markDone": 'Merkitse "{title}" valmiiksi',
  "tasks.removeNamed": 'Poista "{title}"',
  "tasks.fetchError": "Tehtäviä ei voitu ladata.",
  "tasks.saveError": "Tehtävää ei voitu tallentaa.",
  "tasks.updateError": "Tehtävää ei voitu päivittää.",
  "tasks.deleteError": "Tehtävää ei voitu poistaa.",
  "tasks.genericError": "Jokin meni pieleen.",
  "tasks.emptyTitle": "Otsikko ei voi olla tyhjä.",

  "platform.metaTitle": "Alusta — Pixdrift",
  "platform.metaDescription": "Mitä kukin järjestelmä tekee ja miten ne liittyvät.",
  "platform.heading": "Mitä kukin järjestelmä tekee",
  "platform.notice":
    "Jokainen järjestelmä tekee yhden työn. TORA ottaa hankinnat. RITA ottaa veron. Niitä ei sekoiteta.",
  "platform.systems": "Järjestelmät",
  "platform.howTheyConnect": "Miten ne liittyvät",
  "platform.moreSystems": "Lisää järjestelmiä",
  "platform.waiting": "Odottaa kytkentää",
  "platform.tech": "Tekniikka — sille, joka hoitaa käytön",
  "platform.gateway": "Malliväylä",
  "platform.gatewayLead":
    "Yksi avain antaa pääsyn yli 100 malliin. Muista: järjestelmän vastaukset ovat arvauksia, eivät faktoja.",
  "platform.gatewayHint": "Aseta {key} Secretsiin tai {oidc} Vercelissä.",

  "family.status.operational": "Käynnissä",
  "family.status.pilot": "Matkalla",
  "family.status.deferred": "Ei vielä valmis",
  "family.principle":
    "Sama kirjautuminen kaikissa järjestelmissä. Jokainen järjestelmä hoitaa omansa. TORA ottaa hankinnat. RITA ottaa veron. Niitä ei sekoiteta.",
  "family.incoming":
    "Lisää järjestelmiä on matkalla. Ne saavat saman kirjautumisen ja omat tietonsa. Nimet tulevat kun ne ovat valmiita — ei ennen.",
  "family.party.products": "kaikki tuotteet",
  "family.party.events": "tapahtumalista",
  "family.identity.mission": "Yksi kirjautuminen jokaiseen järjestelmään.",
  "family.kansli.mission": "Aloitussivu. Tehtävät ja sisäänkäynti.",
  "family.ekonomi.mission": "Laskut, ALV ja miten raha tuli sisään.",
  "family.tora.mission": "Mitkä hankinnat yrityksenne voi ottaa.",
  "family.rita.mission": "Etsii verosäästöjä kirjoistanne.",
  "family.britt.mission": "Se mikä tapahtui ja vaatii seurantaa.",
  "family.irma.mission": "Lähetä sopimus, näe onko se luettu ja vahvistettu.",
  "family.tyra.mission": "Asiakas, auto, pyörät ja mitä seuraavaksi.",
  "family.alva.mission": "Asiakkaan vika, muistiinpanot ja mittaukset. Diagnoosi tulee myöhemmin.",
  "family.creditae.mission": "Vastapuolen luottoarvio. Teidän päätelmä, ei keksittyä arvosanaa.",
  "family.identity.question": "Kuka olette, ja mitä yritystä se koskee?",
  "family.identity.does":
    "Kirjaudutte kerran. Sitten olette Kanslissa, TORASSA, RITASSA ja muissa.",
  "family.identity.doesNot":
    "Täällä ei lähetetä laskuja, eikä ylimääräistä koodia puhelimessa ole vielä.",
  "family.kansli.question": "Mistä aloitan, ja mitä teemme sisäisesti?",
  "family.kansli.does": "Kirjautuminen, sisäinen tehtävätaulu ja uusien asiakkaiden lomake.",
  "family.kansli.doesNot":
    "Kansli ei laske hankintaa, veroa eikä renkaita. Sen tekevät muut järjestelmät.",
  "family.ekonomi.question": "Mitä on kirjattu, mikä on erääntynyt, ja miten raha tuli sisään?",
  "family.ekonomi.does":
    "Kirjoittaa 10 päivän laskun, kirjaa öreissä, kytkee Stripen ja Revolutin, täsmäyttää saapuvat maksut kun pankki on kytketty.",
  "family.ekonomi.doesNot":
    "Ei Vismaa. Ei Fortnoxia. Ei keksittyä maksua. Kortit vaativat Stripen. Swish vaatii, että Swish on kytketty.",
  "family.tora.question": "Voimmeko tarjota tässä — ja mitä teemme nyt?",
  "family.tora.does":
    "Vertaa yritystä hankintoihin: vaatimukset, aukot, summat, päivämäärät ja seuraava askel.",
  "family.tora.doesNot": "Ei katso kirjoja. Sen tekee RITA.",
  "family.rita.question": "Mitkä vähennykset, ALV ja muut aukot ovat tilinpäätöksessä?",
  "family.rita.does":
    "Lukee tilinpäätöstä Ruotsin verosääntöjä vasten ja jättää ehdotuksia tarkistettavaksi. Ei veroneuvontaa.",
  "family.rita.doesNot":
    "Ei keksi tuloksia. Ei sano saatteko tarjota. Ei vielä asiakastiedostoa ladattavaksi.",
  "family.britt.question": "Mitä teidän pitää tehdä nyt, sen perusteella mikä jo tapahtui?",
  "family.britt.does":
    "Kerää asiat jotka pitää seurata. Yksi kerrallaan, seuraavan askeleen kanssa.",
  "family.britt.doesNot": "BRITT ei ole tapausjärjestelmä eikä keskustelu.",
  "family.irma.question": "Onko vastapuoli lukenut ja vahvistanut sopimuksen?",
  "family.irma.does": "Lähettää sopimuksen. Näyttää onko se avattu, allekirjoitettu vai hylätty.",
  "family.irma.doesNot": "IRMA ei ole sähköposti eikä arkisto kaikille asiakirjoille.",
  "family.tyra.question": "Mikä asiakas, mikä auto, mitkä pyörät — ja mikä on seuraava askel?",
  "family.tyra.does":
    "Pitää asiakkaan, ajoneuvon ja renkaat yhdessä. Näyttää milloin on aika vaihtaa tai noutaa.",
  "family.tyra.doesNot": "TYRA ei ole yleinen asiakasrekisteri muille aloille.",
  "family.alva.question": "Mitä asiakas sanoi, mitä mitattiin — ja mikä on seuraava askel?",
  "family.alva.does": "Ottaa vastaan sanotun ja mitatun. Näyttää muistiinpanon. Ei diagnoi itse.",
  "family.alva.doesNot": "ALVA ei diagnoi eikä anna neuvoa.",
  "family.creditae.question": "Kenet meidän pitää arvioida — ja mihin päädyitte?",
  "family.creditae.does":
    "Ottaa vastaan organisaationumeron ja arvionne. Hakee toimiston raportin alustan luottokanavan kautta kun se on kytketty. Aja, seuraa tai pysäytä.",
  "family.creditae.doesNot": "CREDITAE ei aseta luottoarvosanaa. Tuote ei kutsu Creditsafea.",
  "family.stack.language": "Kieli",
  "family.stack.language.runs":
    "TypeScript 5 koko järjestelmässä. SQL tietokannassa. RITAN analyysi ajetaan omana ohjelmana. ekonomi-ledger tarkistaa tositteet, ei kirjaa tuotannossa.",
  "family.stack.web": "Web",
  "family.stack.web.runs":
    "Next.js 16.3 App Router, React 19.2, Tailwind CSS 4. Yksi prosessi: sivusto, /idp, tuotteet ja API.",
  "family.stack.identity": "Identiteetti",
  "family.stack.identity.runs":
    "Oma kirjautuminen, avoimen standardin päälle. Yksi eväste pitää teidät kirjautuneina. Sama kirjautuminen kaikissa järjestelmissä.",
  "family.stack.data": "Data",
  "family.stack.data.runs":
    "PostgreSQL 16. Jokaisella järjestelmällä on omat tietonsa. Mikään järjestelmä ei kirjoita toisen tietoihin.",
  "family.stack.analysis": "Analyysi",
  "family.stack.analysis.runs":
    "TORA laskee samassa prosessissa. RITA kutsuu omaa analyysiä. Ei keksittyjä tuloksia tuotannossa.",
  "family.stack.automation": "Automaatio",
  "family.stack.automation.runs":
    "Mallit kulkevat Vercelin väylän kautta. Vastaus on arvaus, ei fakta.",
  "family.stack.ops": "Käyttö ja testi",
  "family.stack.ops.runs":
    "Ajetaan Vercelissä. Testit Postgres 16:ta vastaan. Ei AWS SDK:ta tässä järjestelmässä.",
  "family.link.identity.products":
    "Yksi kirjautuminen. Tuotteet eivät lue toistensa käyttäjälistoja.",
  "family.link.identity.events":
    "Onnistunut kirjautuminen kirjoitetaan lokiin. Se on kuitti, ei seurattava tehtävä.",
  "family.link.tora.britt": "Vain kun joku julkaisee. Markkinan lukeminen ei luo tapahtumaa.",
  "family.link.rita.britt":
    "BRITT saa yrityksen nimen, montako osumaa tuli ja oliko automaatio mukana. Ei itse ehdotuksia — ne jäävät RITAAN.",
  "family.link.irma.britt": "Sopimus luotu, avattu, vahvistettu tai peruttu.",
  "family.link.tyra.britt":
    "Tapaus, asiakaslinkki tai muistutus jonossa. Estetty jono ei tarkoita lähetettyä.",
  "family.link.alva.britt":
    "Tapaus on rekisteröity. Diagnoosi ei seuraa ennen kuin se on kytketty.",
  "family.link.creditae.britt":
    "Vastapuoli on rekisteröity, olette kirjoittaneet päätelmän, tai toimiston raportti saapui tai pysähtyi. Keksittyä arvosanaa ei seuraa.",
  "family.link.ekonomi.britt":
    "Annettu lasku, kirjattu saapuva maksu tai Revolut-haku joka ei mennyt läpi.",
  "family.link.ekonomi.revolut":
    "Pankkiyhteyden elinkaari. Tavallinen uusinta kirjataan käyttönä, ei seurattavana.",
  "family.link.ekonomi.invoice": "Luonnos näkyy lokissa. Ei kirjanpitoa ennen antoa.",
  "family.link.kansli.task": "Sisäinen tehtävä näkyy BRITTISSÄ. Kansli omistaa tehtävän yhä.",
  "family.link.kansli.intake": "Hakemus on tullut, tai korjaamotili luotiin demoa varten.",
  "family.link.britt.finding":
    "Esimerkkianalyysin tärkeimmät osumat muuttuvat seurattaviksi. Muu jää BRITTIIN.",
  "family.link.britt.events": "Jokainen seurattava kirjoitetaan myös tapahtumalistaan.",
  "family.blocked.rita":
    "RITAN analyysi pitää olla kytketty (Vercelissä URL:n kautta, paikallisesti ohjelmatiedoston kautta) ennen kuin analyyseja voi ajaa.",
  "family.blocked.alva":
    "Ohjattu diagnoosi kytketään kun se on valmis. Tapauksen voi rekisteröidä jo nyt.",
  "family.blocked.irma":
    "IRMA pysyy meillä: yksinkertainen digitaalinen vahvistus ja oma linkki. Ei vielä juridista sähköistä allekirjoitusta.",
  "family.blocked.britt":
    "Fortnox, Revolut ja BRITTIN profiilit jos esimerkkianalyysistä pitää tulla koko tuote.",
  "family.blocked.ekonomi":
    "Stripe, Revolut ja Swish kun haluatte periä sillä tavalla. 10 päivän lasku toimii ilman niitä.",
  "family.blocked.creditae":
    "CREDITAE kulkee alustan luottokanavan kautta. Tuotteet eivät kutsu Creditsafea. Ilman avainta raporttia ei haeta. Arvio on yhä teidän.",
  "tyra.metaTitle": "TYRA — Pixdrift",
  "tyra.metaDescription": "Asiakas, auto, pyörät ja mitä seuraavaksi.",
  "tyra.heading": "Mikä ajoneuvo tulee sisään?",
  "tyra.lead":
    "TYRA pitää asiakkaan, auton ja pyörät yhdessä. Renkaita myydään täällä — yksi klikkaus kirjaa laskun Ekonomiin. Summat ovat teidän omia lukuja. Ei vielä live-hintoja.",
  "tyra.customers": "Asiakaskortit",
  "tyra.integrations": "Integraatiot",
  "tyra.signInTitle": "Kirjaudu avataksesi tapauksia",
  "tyra.signInBody":
    "Sama kirjautuminen kuin muussa Pixdriftissä. Ei ylimääräistä tiliä korjaamolle.",
  "tyra.notice":
    "Muistutukset menevät jonoon mutta niitä ei vielä lähetetä — SMS- tai sähköpostiyhteyttä ei ole. Ei live-rengashintoja.",
  "ekonomi.metaTitle": "Ekonomi — Pixdrift",
  "ekonomi.metaDescription": "Laskut, ALV ja miten raha tuli sisään.",
  "ekonomi.heading": "Mitä on kirjattu?",
  "ekonomi.lead":
    "Kirjaa myynti kruunuina. Yksi klikkaus antaa laskun. TYRAN tarjoukset joita ei ole kirjattu ovat jonossa. Asiakas voi maksaa Swishillä, Stripellä tai 10 päivän laskulla. Kytke Revolut kerran, niin tiliotteet haetaan ja maksut täsmäytetään. Visma on seuraava yhteys — se ei ole täällä vielä.",
  "ekonomi.signInTitle": "Kirjaudu nähdäksesi kirjan",
  "ekonomi.signInBody": "Kirjat kuuluvat yrityksellenne. Kirjaudu nähdäksesi ne.",
  "ekonomi.notice":
    "Kirjoitatte kruunuja. Kirja tallentaa örejä. Jokainen tosite täsmää. Maksut kulkevat oikeasti vasta kun yhteydet ovat paikallaan — mitään ei simuloida ilman että olette sanoneet kyllä.",
  "ekonomi.statements": "Tiliotteet",
  "ekonomi.invoices": "Laskut",
  "ekonomi.vouchers": "Tositteet",
  "ekonomi.reports": "Raportit / ALV",
  "ekonomi.connections": "Yhteydet",
  "tora.metaTitle": "TORA — Pixdrift",
  "tora.metaDescription": "Mitkä hankinnat yrityksenne voi ottaa.",
  "tora.lead":
    "TORA näyttää mihin hankintoihin {name} voi tarjota — ja miksi juuri te. Tässä on koko arvio: vaatimukset, aukot ja seuraava askel.",
  "tora.noticeDemo":
    "Hankinnat ovat esimerkkejä, eivät oikeita ilmoituksia. Näkymä on maksullinen tili, joten näette nimet, summat ja vaatimukset. Yritystiedot ovat esimerkkiyritys kunnes tallennatte oman profiilin.",
  "tora.noticeSaved":
    "Hankinnat ovat esimerkkejä, eivät oikeita ilmoituksia. Näkymä on maksullinen tili, joten näette nimet, summat ja vaatimukset. Yritystiedot ovat tallennettu profiilinne ({name}).",
  "tora.calendar": "Kalenteri",
  "tora.current": "Nykyinen",
  "tora.upcoming": "Tulossa",
  "tora.watch": "Seuranta",
  "tora.publishedValue": "Julkaistu arvo",
  "tora.yourCompany": "Yrityksenne",
  "tora.profileLead": "Ilman tallennettua profiilia laskemme esimerkkiyrityksellä emmekä teillä.",
  "tora.frameworks": "Sopimukset joissa olette jo mukana",
  "tora.references": "Viitteet joihin TORA laskee",
  "rita.metaTitle": "RITA — Pixdrift",
  "rita.metaDescription": "RITA etsii verosäästöjä kirjoistanne.",
  "rita.lead":
    "RITA etsii verosäästöjä kirjoistanne: vähennykset, ALV, K10, eläke ja T&K. Mitä RITA löytää on ehdotuksia tarkistettavaksi — ei veroneuvontaa.",
  "rita.noticeReady":
    "Analyysi on käynnissä. Osa vastauksesta tulee mallista ja voi vaatia toisen katsomisen.",
  "rita.noticeRules":
    "Analyysi on käynnissä, mutta ilman mallia juuri nyt. Vain kiinteät säännöt ovat käytössä.",
  "rita.noticeBlocked":
    "Analyysia ei ole vielä kytketty, joten uudet analyysit jäävät estetyiksi. Emme koskaan näytä keksittyjä tuloksia.",
  "rita.noticeExample":
    "Esimerkkitilinpäätös on sisäänrakennettu esimerkki — ei asiakkaan lataama.",
  "rita.signInTitle": "Kirjaudu pyytääksesi analyysin",
  "rita.signInBody":
    "Analyysi tallennetaan RITAAN. BRITT saa seurattavaa kun analyysi valmistuu tai pysähtyy.",
  "britt.metaTitle": "BRITT — Pixdrift",
  "britt.metaDescription": "Se mikä tapahtui ja vaatii seurantaa.",
  "britt.lead":
    "BRITT kerää asiat jotka vaativat seurantaa. Luvut tässä ovat esimerkkejä — ei vielä Fortnox- tai Revolut-yhteyksiä.",
  "britt.noticeDemo": "Luvut tässä ovat esimerkkejä talolle, eivät Fortnoxia eivätkä live-kassaa.",
  "britt.noticeOwn": "Tässä seuraatte omia havaintojanne. Esimerkkiluvut ajetaan vain talolla.",
  "britt.signInTitle": "Kirjaudu nähdäksesi havainnot",
  "britt.signInBody":
    "Havainnot kuuluvat yrityksellenne. Se mitä tapahtuu TORASSA, RITASSA ja IRMASSA näkyy täällä.",
  "irma.metaTitle": "IRMA — Pixdrift",
  "irma.metaDescription": "Lähetä sopimus, näe onko se luettu ja vahvistettu.",
  "irma.heading": "Mikä sopimus lähtee?",
  "irma.lead":
    "IRMalla lähetätte sopimuksia digitaalisesti: luo, lähetä linkki, näe milloin vastapuoli on avannut ja vahvistanut. Vastapuoli ei tarvitse tiliä. Se on yksinkertainen digitaalinen vahvistus, ei juridinen sähköinen allekirjoitus. Asiakirja-arkistoa ei ole vielä.",
  "irma.signInTitle": "Kirjaudu luodaksesi sopimuksia",
  "irma.signInBody":
    "Linkki näytetään kerran — kopioikaa se heti. Emme tallenna sitä luettavassa muodossa.",
  "creditae.vendorScore": "Toimiston arvo",
  "creditae.vendorLimit": "Toimiston raja",
  "creditae.vendorNotConclusion": "Ne ovat toimiston kentät, eivät teidän päätelmänne.",
  "creditae.vendorWhyMissing": "Miksi raportti puuttuu",
  "creditae.notes": "Muistiinpano",
  "creditae.yourAssessment": "Teidän arvionne",
  "creditae.conclusion": "Päätelmä",
};
