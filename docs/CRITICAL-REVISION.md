# Gigantisk kritisk revision — 2026-08-24

Referens: Volkswagen AG som kund. Sex parallella granskare + kod. Inget får
gå fritt. Allt som ser färdigt ut ska kunna skäras itu.

**Den här filen är inte en hyllning.** Den är en anläggningsrapport.

---

## Dom

Pixdrift är ett **ärligt nav med ofärdiga pärmar**. Arkitekturen (en IdP, en
BFF-session, schemaägarskap, append-only events, inference ≠ sanning) är
bättre än produktmognaden. Mission-copy är ofta starkare än runtime.

Att “bygga klart alla moduler” i den här branchen vore att ljuga. Det som
gick att slutföra utan påhittade motorer är gjort. Resten är namngiven skuld.

Familjen som driftad plattform efter den här vågen: **56 %**. Inte 100.
Inte nära 100.

---

## Vad som kritiserades och vad som byggdes

Sex specialiserade granskningar kördes samtidigt mot TYRA, IRMA, RITA, ALVA,
BRITT/TORA/Identity/Kansli och säkerhet/design/tester. De var eniga i
huvudsaken: **domänen är smartare än ytan, ytan säljer mer än den levererar.**

### Säkerhet — det pinsammaste felet

`GET /api/platform/events` krävde inloggning men **inte aktiv org**.
`events.list({ orgRef: undefined })` läste hela boken. UI:t scopade rätt. API:t
gjorde det inte. Det är ett konstitutionellt brott (art. 1 och 7), inte en
smaksak.

**Byggt:** `requireOrg` på events-API:t. Katalog-API:t kräver session.
Health i `APP_ENV=prod` svarar bara `{ ok, database }`. BFF-hemligheter
fail-closed när `APP_ENV=prod`. IRMA-throttle hashar hela token. Demo-lösen
visas bara när `PIXDRIFT_SEED_DEMO=true`. CSP i report-only. CORP
`same-origin`. IdP-login i ink-on-paper, inte indigo.

**Inte byggt, medvetet:** Redis-throttle, KMS, WAF, CSRF-token utöver SameSite,
`requirePermission` på produkt-API:er, HTTP-tester mot varje `route.ts`.

Säkerhetsställning: **65 → 70**. Fortfarande inte VW-bar.

### TYRA — CRM och lager fanns som tabeller, inte som produkt

`wheel_sets` lästes. Ingenting skrev. `buildCustomerCard` testades. Ingen sida
använde den. Offert var en checkbox. Hubben var tom utan inspektioner.

**Byggt:** hjulset vid `STORAGE_IN` och vid `STORE_WHEELS`/`VERIFY_STORAGE_LOCATION`
DONE; kundkort på `/tyra/kunder`; tidslinje på work card; `commercial_status`
QUOTE_DRAFT/QUOTE_READY när offertsteget rörs; `storage_code`-kolumn.

**Inte byggt:** live-pris, SMS SENT, inspektionsskrivning, pick-kö, Fortnox.

TYRA: **42 → 50**. Fortfarande en ärendemotor med CRM-skiva, inte ett
däckhotell-OS.

### IRMA — handslag, inte avtalshantering

En tabell. Tre demoklausuler. Länken dog efter 120 sekunder. “Signed” är ett
namn på en länk, inte en identifierad person.

**Byggt:** återutfärda token; dagar kvar på listan; JSON-export av underlaget;
DB-trigger mot ändring av signerat innehåll.

**Inte byggt:** BankID, OCR, PDF, e-post, Document OS.

IRMA: **52 → 60**. Handshake är hårdare. Affären “varje avtal” är inte här.

### RITA — motorn är skattjakt, UI:t var en JSON-tittare

`category` plockades ut och slängdes. Disclaimer från motorn visades inte.
Inget beloppsintervall ens när kuvertet hade öre.

**Byggt:** kategori, regel, disclaimer, limitations, preliminärt intervall med
“ej garanti”, fyndantal på listan.

**Inte byggt:** fejkad motor, HTTP-host, kund-upload, “du sparar X kr”.

RITA: **48 → 56**. På Vercel utan host är den fortfarande en blocked-form.

### ALVA — ett klagomålsfält med diagnoscopy

Navet registrerade `complaint` + `vehicle_ref`. Ingen detaljsida. Dokumenten
pratar om fem lager. Schemat hade ett.

**Byggt:** intagsfält (område, mätarställning, önskat utfall), `getCase`,
`/alva/[id]`, rikare event-payload **utan** diagnos.

**Inte byggt:** session, protokoll, mätvärden, fynd, AI-diagnos.

ALVA: **18 → 26**. Fortfarande deferred. Det är rätt.

### BRITT — ticker, inte uppföljning

`subject_ref` sparades och visades aldrig. `kansli.task.updated` publicerades
och ignorerades.

**Byggt:** djuplänkar, gruppering per uppdrag, lyssning på task.updated
inklusive radering.

**Inte byggt:** Fortnox, status/done på observationer, LLM-sammanfattning.

BRITT: **38 → 46**.

### TORA — 19 motorer mot Exempelbolaget

Inte rört i den här vågen. Org-profil mot seedad demo är nästa ärliga 10 %.
Att låtsas “live marknad” vore att ljuga.

TORA: **58**. Oförändrat.

### Kansli / Identity

TaskBoard var indigo/zink i ett Geist-hus. Fixat till tokens.
Identity-login var lila. Fixat. Demo-hint gated.

Kansli: **72 → 76**. Identity: **78 → 82**.

---

## Hårdaste anmärkningarna som fortfarande gäller

1. **Mission vs runtime.** Katalogtexten lovar skattejakt, avtalshantering,
   däckhotell, guidad diagnos. Runtime är skivor. Det är dokumenterat — och
   ändå för lätt att sälja som färdigt.
2. **`signed` är semantiskt gift.** IRMA L1 är en hashad bekräftelse. Ordet
   “Bekräftat” är medvetet. Ordet “signed” i databasen är en fälla.
3. **TYRA-hubben är fortfarande tom** utan inspektionsskrivning. Lager finns
   nu som rad. Kunden ser fortfarande ingen mönsterdjupssanning.
4. **RITA på Vercel är en tegelsten** utan HTTP-host. UI-förbättringen syns
   bara när motorn faktiskt kör.
5. **TORA utvärderar alltid Exempelbolaget.** Motorn är allvarlig.
   Integration lagret är en demo-karusell.
6. **Permissions är teater.** `requirePermission` finns. Produkt-API:er
   använder den inte.
7. **Inga HTTP-tester mot `route.ts`.** Domäntester är täta. Ytan är inte
   bevisad. Events-läckan hade fångats av en enda org-isolationstest.
8. **Backup är CI-verklig och prod-falsk** tills någon skriver en daterad
   Neon-restore i `DEPLOYMENT.md`.
9. **Throttle är per instans.** Vercel Fluid gör in-memory till teater.
10. **IdP-nyckel i Postgres.** Dokumenterat. Inte KMS. Pilot-ok. VW-nej.
11. **GET = viewed i IRMA.** Bots och prefetch ljuger om “öppnat”.
12. **ALVA i navet på samma rad som IRMA.** `deferred` syns i copy, inte i
    AppShell-vikten.

---

## Vad som medvetet inte “byggdes klart”

| Begäran | Varför nej |
| --- | --- |
| Fullständig ALVA-diagnos | Motorn finns inte i det här repot |
| TYRA live-pris / SMS SENT | Ingen adapter, konstitution art. 8–9 |
| IRMA BankID / Document OS | Doktrin + IRMA-arkitektur |
| RITA-garanti / fejkad motor | Skattjakt-disclaimer + resolve-engine |
| BRITT Fortnox | FAMILY.md, art. 8 |
| TORA live TED/HILMA | Ingen connector |
| Redis / KMS / WAF | Inte kod i det här huset utan beslut |

Att leverera de raderna som “klara” vore att fuska för Volkswagen.

---

## Nästa tiondel (samma regel)

1. Neon-restore i produktion, daterad.
2. RITA HTTP-host om RITA ska synas på Vercel.
3. TYRA manuell inspektion → hubben får innehåll.
4. TORA `company_profiles` per org, annars stämpel “Exempelbolaget”.
5. `requirePermission` på skrivande API:er.
6. Observation-status i BRITT (`open`/`done`).
7. ALVA-repot — eller ALVA stannar deferred.

Gör inte: fler fonter, fler produkter, fler demo-live-vägar.
