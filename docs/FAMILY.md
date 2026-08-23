# Pixdrift-familjen — vad som finns i det här repot

Det här är driftskartan, inte målbilden. Målbilden ligger i
`PIXDRIFT-ARKITEKTUR.md`. Här står vad koden faktiskt gör.

## Princip

Systemen delar **identitet** och en **append-only händelselogg**. De delar
**aldrig tabeller**. RITA verifierar räkenskaper. TORA avgör om ett bolag får
lämna anbud. De är inte samma sak.

```
Browser
  → Next.js (en process)
       /idp                 Identity (OIDC)
       /kansli              Nav + uppgifter
       /tora /rita /britt /irma /alva
       /platform            Den här kartan
       /api/platform/*      health, me, systems, events
       /api/{system}/*
  → PostgreSQL
       public     users, orgs, clients, keys
       platform   events          (synk + revision)
       kansli     tasks
       tora       market_snapshots
       rita       analyses
       britt      observations
       irma       agreements
       alva       cases
```

## Systemen

### Identity — vem är du?

OIDC (Authorization Code + PKCE), JWKS, användare, organisation, medlemskap.
Kansli byter koden mot en httpOnly-cookie `kansli_session`. Produkter läser
sessionen. De har ingen egen inloggning.

Lyckad inloggning ger `identity.session.started` i loggen. BRITT lyssnar inte
på den — det är revision, inte en uppföljningsuppgift.

### Kansli — navet

Session, plattforms-API, intern uppgiftstavla. Äger `kansli.tasks`. När en
uppgift skapas publiceras `kansli.task.created`; BRITT skriver en observation.

### TORA — får vi lämna anbud?

Upphandlingsrätt, behörighet, rekommenderad åtgärd. Motorn körs i processen.
**GET `/api/tora/market` utvärderar bara.** **POST publicerar** en ögonblicksbild
och `tora.market.evaluated`. BRITT lyssnar. TORA skriver inte i BRITT.

### RITA — stämmer räkenskaperna?

Beställning → `HttpAnalysisEngine` mot Rust-motorn `skattjakt`. Utan
`RITA_ENGINE_URL` + `RITA_ENGINE_TOKEN` blir status `blocked`. Motorn fejkars
inte. RITA avgör inte anbudsrätt.

Händelser: `rita.analysis.requested`, sedan `completed` eller `blocked`.
BRITT lyssnar på de två sista.

### BRITT — vad ska någon följa upp?

Observationsinkorg. Egna anteckningar plus synk. BRITT är den enda som skriver
`britt.observations`. Den lär sig genom att lyssna:

| Händelse | Observation |
| --- | --- |
| `tora.market.evaluated` | TORA har utvärderat marknaden |
| `rita.analysis.completed` | RITA har ett fyndunderlag |
| `rita.analysis.blocked` | RITA kunde inte köra motorn |
| `irma.agreement.created` | Ett avtal väntar på motparten |
| `irma.agreement.viewed` | Motparten har öppnat länken |
| `alva.case.created` | Ett fall är registrerat |
| `kansli.task.created` | Intern uppgift |

Det är inte hela underrättelseprodukten från BRITT-repot.

### IRMA — underlag till någon utanför

Avtal + hashad magic link. Klartext-token visas en gång som `/irma/l/<token>`.
Motparten öppnar utan konto. Första öppning sätter `viewed` och
`irma.agreement.viewed`. Ingen e-signatur. Ingen fillagring.

### ALVA — fallet, inte diagnosen

Registrerar klagomål och ev. fordonsreferens. Status `open`. Diagnosmotorn
väntar på ALVA-repot. Inga fynd, inga protokoll.

## Vad som inte går att göra i det här repot

- Köra RITA:s Rust-motor (saknar host + token)
- Diagnostisera i ALVA (saknar repo)
- E-signera eller lagra filer i IRMA
- Köra BRITT som full underrättelseprodukt
