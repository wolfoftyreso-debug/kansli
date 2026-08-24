# Pixdrift-familjen — vad som finns i det här repot

Det här är driftskartan, inte målbilden. Målbilden ligger i
`PIXDRIFT-ARKITEKTUR.md`. Här står vad koden faktiskt gör. Id, schema, API
och event-ägande är `@pixdrift/systems` — den här filen är den svenska
beskrivningen, inte en andra id-lista.

## Princip

Systemen delar **identitet** och en **append-only händelselogg**. De delar
**aldrig tabeller**. RITA verifierar räkenskaper. TORA avgör om ett bolag får
lämna anbud. De är inte samma sak.

```
Browser
  → Next.js (en process)
       /idp                 Identity (OIDC)
       /kansli              Nav + uppgifter
       /tora /rita /britt /irma /tyra /alva
       /platform            Den här kartan
       /api/platform/*      health, me, systems, events
       /api/{system}/*
  → PostgreSQL
       public     users, orgs, clients, keys
       platform   events          (synk + revision)
       kansli     tasks
       tora       market_snapshots
       rita       analyses
       britt      observations, findings, metric_snapshots, analysis_runs
       irma       agreements
       tyra       customers, vehicles, tire_cases, customer_hub_links
       alva       cases
```

## Systemen

### Identity — vem är du?

OIDC (Authorization Code + PKCE), JWKS, användare, organisation, medlemskap.
Kansli byter koden mot en httpOnly-cookie `kansli_session`. Produkter läser
sessionen. De har ingen egen inloggning.

Lyckad inloggning ger `identity.session.started` i loggen. BRITT lyssnar inte
på den — det är revision, inte en uppföljningsuppgift.

### AI Gateway

Kansli läser `AI_GATEWAY_API_KEY` eller `VERCEL_OIDC_TOKEN` via
`@pixdrift/ai-core`. `GET /api/platform/ai` listar modeller. `POST` pingar med
`openai/gpt-4.1-nano`. Health visar bara om credentialen finns. Svaret
är inferens.

### Kansli — navet

Session, plattforms-API, intern uppgiftstavla. Äger `kansli.tasks`. När en
uppgift skapas publiceras `kansli.task.created`; BRITT skriver en observation.

### TORA — får vi lämna anbud?

Upphandlingsrätt, behörighet, rekommenderad åtgärd. Motorn körs i processen.
**GET `/api/tora/market` utvärderar bara.** Detalj och kalender läser samma
motor. **POST publicerar** en ögonblicksbild och `tora.market.evaluated`.
BRITT lyssnar. TORA skriver inte i BRITT.

### RITA — stämmer räkenskaperna?

Beställning → `HttpAnalysisEngine` eller `SubprocessAnalysisEngine` mot
Rust-motorn `skattjakt`. Subprocessen får bara en allowlist (Anthropic +
`SKATTJAKT_*`), aldrig databaslösen. Utan `ANTHROPIC_API_KEY` kör motorn
bara regelverket. `company.id` och dokument-id är UUID. Motorn kräver minst
ett dokument på disk och ett organisationsnummer som klarar checksumman.
Lokalt kan formuläret skicka `exempel-bokslut.txt`. Utan host eller
`RITA_ENGINE_BINARY` blir status `blocked`. Motorn fejkars inte. RITA
avgör inte anbudsrätt. Kunduppladdning via Blob är inte kopplad.

Händelser: `rita.analysis.requested`, sedan `completed` eller `blocked`.
`completed` bär `companyName`, `findingCount` och `modelConfigured`. BRITT
lyssnar på de två sista och skriver en observation från händelsen — den läser
inte `rita.analyses`. Fynd i UI läses ur `result.opportunities`.

### BRITT — vad ska någon följa upp?

Observationsinkorg plus en deterministisk demonstrationsanalys (omsättning
mot plan, likviditet, kundkoncentration). BRITT är den enda som skriver
`britt.observations` och `britt.findings`. Den lär sig genom att lyssna:

| Händelse | Observation |
| --- | --- |
| `tora.market.evaluated` | TORA har utvärderat marknaden |
| `rita.analysis.completed` | RITA har ett fyndunderlag |
| `rita.analysis.blocked` | RITA kunde inte köra motorn |
| `irma.agreement.created` | Ett avtal väntar på motparten |
| `irma.agreement.viewed` | Motparten har öppnat länken |
| `irma.agreement.signed` | Motparten har bekräftat underlaget |
| `irma.agreement.cancelled` | Länken är återkallad |
| `tyra.case.created` | Ett däckärende är skapat |
| `tyra.case.completed` | Alla obligatoriska steg är klara |
| `tyra.hub.link.issued` | En kundhub-länk är utfärdad |
| `alva.case.created` | Ett fall är registrerat |
| `kansli.task.created` | Intern uppgift |
| `britt.finding.recorded` (high) | Ett högt fynd från analysen |

Det är inte hela underrättelseprodukten från BRITT-repot. Inga Fortnox- eller
Revolut-kopplingar.

### IRMA — underlag till någon utanför

Avtal med klausuler + hashad magic link (14 dagar, kan återkallas).
Klartext-token visas en gång i en httpOnly-cookie, inte i query-strängen.
Motparten öppnar `/irma/l/<token>` utan konto. Första öppning sätter
`viewed` och `irma.agreement.viewed`. Bekräftelse (nivå 1) sätter `signed`,
en SHA-256-artefakt och `irma.agreement.signed`. Nivå 0 är informationsunderlag
utan bekräftelse. Innehålls- och artefakthash kan räknas om. Inte BankID.
Inte kvalificerad e-signatur. Ingen fillagring. Ingen OCR. Nivå 2–5 finns inte.

### TYRA — däckärendet, inte hela verkstads-OS

Öppnar ett ärende mot `tyra.*` med PIXDRIFT-session. Stegen kompileras av
`resolveWorkflow` från de åtgärder som valts. Hub-token hashas; kunden öppnar
`/tyra/hub/<token>` utan konto. Ingen NextAuth. Ingen live-pris. Ingen cron.
Port från TYRA-repot, slice 1. Se `docs/tyra/README.md`.

### ALVA — fallet, inte diagnosen

Registrerar klagomål och ev. fordonsreferens. Status `open`. Diagnosmotorn
väntar på ALVA-repot. Inga fynd, inga protokoll.

## Vad som inte går att göra i det här repot

- Köra RITA:s Rust-motor på Vercel utan HTTP-host. Lokalt: `RITA_ENGINE_BINARY`
  plus demonstrationsbokslutet.
- Diagnostisera i ALVA (saknar repo)
- Kvalificerat e-signera (finns inte i navet; byggs inte mot BankID eller
  extern e-signleverantör)
- Lagra filer i IRMA (ingen object store än; läggs i detta system om det behövs)
- Köra BRITT som full underrättelseprodukt mot livebokföring
