# PIXDRIFT PLATFORM 1.0 — konstitution

Fryst 2026-08-25. Detta är målbilden för plattformen.

Den ersätter inte
[`ARCHITECTURE-CONSTITUTION.md`](ARCHITECTURE-CONSTITUTION.md)
(data, audit, restore, AI ≠ sanning, L0–L4).
Den säger *vad plattformen ska bli* när de artiklarna hålls.

Läs först vad som faktiskt finns:
[`PLATFORM-1.0-GAP.md`](PLATFORM-1.0-GAP.md).
Bygg inte nästa lager förrän matrisen säger att underlaget finns.

## Vad vi bygger

**En plattform. Flera produkter. Flera ytor. En sanning.**

Produkterna förblir egna produkter.
Underlaget ska ärvas, inte uppfinnas om.

Vi bygger inte:

- en ny sajt vid sidan av den som finns
- en ny auth vid sidan av Identity
- en ny API-kärna vid sidan av `@pixdrift/api-core`
- en MCP-server som har egen affärslogik
- en SEO-fabrik som spottar ur sig tunna sidor
- fyra handskrivna SDK:er som driver isär kontrakten

## Första princip

```
Domain capability
  ├── REST
  ├── MCP
  ├── SDK
  ├── Event
  ├── Webhook
  └── App / agent action
```

Samma tjänst i `src/lib/{produkt}`.
Aldrig samma affärsregel i två kodvägar.

Produkter som **finns i det här repot** är bara de i `@pixdrift/systems`:

Identity · Kansli · Ekonomi · TORA · RITA · BRITT · IRMA · TYRA · ALVA · CREDITAE

NORA, MOVA och SAGA finns inte här.
De får inte beskrivas som färdiga ytor.

## Sju lager

1. **Platform Core** — identitet, tenant, org, användare, behörighet,
   entitlements, billing-hooks, audit, API Core, events, notifieringar,
   feature flags, lokalisering, hemligheter, observabilitet, backup.
2. **Universal Integration Layer** — REST/OpenAPI, MCP, webhooks, events,
   SDK:er, OAuth, service accounts. Samma operation, flera ytor.
3. **Developer Platform** — dokumentation, explorers, sandbox, tokens,
   OAuth-appar, loggar, recipes, changelog, status.
4. **App / Agent Distribution** — ChatGPT Apps via Apps SDK på MCP,
   plus installation för Cursor, Codex, Claude och generiska MCP-klienter.
5. **Public Knowledge & Search** — crawlbara produktsidor, kunskap,
   arbetsflöden, glossary, jämförelser, verktyg. API:t är maskinyta.
   Google läser HTML, inte JSON.
6. **Design System** — gemensamma tokens och mönster.
   Ungefär 90–95 % plattform, 5–10 % produkt-DNA.
7. **Reliability** — preview, staging, produktion, SLO, RPO/RTO,
   PITR, restore-övning, incident, rollback.

## Capability Graph är sanningen

Mitt i konstruktionen ligger ett maskinläsbart register:

```
Product → Domain → Capability
  ├── REST
  ├── MCP
  ├── Webhook / event
  ├── Permission
  ├── SDK
  ├── Documentation
  ├── DevPortal
  ├── ChatGPT action
  ├── Search intents
  └── Tests
```

Grafen ska **härledas** ur det som redan är registrerat
(MCP-verktyg, REST-bindning, `@pixdrift/systems`).
Den får inte bli en andra handskriven katalog.

Kod: `src/lib/platform/capability-graph.ts`.
HTML: `/documentation/capabilities`.
JSON: `GET /api/platform/capabilities`.

När en yta ska visas — dokumentation, MCP discovery, senare OpenAPI,
SDK och SEO — läs grafen. Kopiera inte listan för hand.

## ChatGPT är appar, inte gamla plugins

```
Pixdrift MCP Core
  ├── ALVA MCP
  ├── TYRA MCP
  ├── … produkter som faktiskt finns
        ↓
  OpenAI Apps SDK
        ↓
  ChatGPT Apps
```

En app får ha UI i samtalet.
Skrivoperationer behåller riskklass och bekräftelse (L0–L4).
Bygg ingen app där produkten inte ger värde i ett samtal.
ALVA:s diagnosmotor finns inte i det här repot — bygg inte
“ALVA for ChatGPT” som låtsas ställa diagnos.

## Developer Portal

Extern utvecklare ska kunna göra första anropet på en kvart.
Det kräver sandbox, tillfälliga tokens och “Try it”.
Det finns inte än. Se gap-matrisen.

Befintlig yta att växa ur: `/documentation` och `/documentation/mcp`.
Bygg inte `developer.pixdrift` som en andra app förrän den här
ytan är den uppenbara grunden.

## SDK:er

Mål: TypeScript, Python, Go, .NET.
Väg: kontrakt → OpenAPI / JSON Schema → generering → tunn ergonomi.
Ingen handskriven dubblett per språk.

## Integrationer är recipes, inte bara endpoints

Ett recipe svarar på ett riktigt jobb:
problem, arkitektur, behörighet, dataflöde, fungerande kod,
fel, test, produktionscheck.

Påstå inte att Fortnox, Visma eller ChatGPT Apps är i drift
bara för att namnet finns i en lista.

## Öppet API ≠ Google

`/api/...` är maskinyta.
Sökmotorer ska ha stabil HTML.
`llms.txt` är för AI-ekosystemet, inte en Google-rankingmetod.

Publicera inte en sida som inte har eget värde.
Inga doorway-sidor. Inga maskinöversatta skal.

## Sökintents är en graf, inte en kalkylarksrad

Product · Problem · Role · Industry · Workflow · Intent ·
Feature · Integration · Competitor · Geography · Language · Query · Page

Systemet ska föreslå *åtgärd* (förstärk, slå ihop, översätt, gör inget).
Det ska inte skriva 50 inlägg.

## Design

Ett system. Produkten får en liten karaktär ovanpå.
Ingen produkt får se ut som ett annat bolag.

## Tillit

Bolag, adress, integritet, villkor, DPA, säkerhet, underbiträden,
ansvarig utlämning, status, tillgänglighet.
Bara uppgifter som finns i auktoritativ konfiguration.
Hitta inte på certifikat.

## Tillförlitlighet

Backup räknas när återställning är övad.
I isolerad miljö. Aldrig mot produktionsdata.

## Vad nästa agent inte ska göra

Skriv inte ännu en jättelång generell prompt.
Öppna [`PLATFORM-1.0-GAP.md`](PLATFORM-1.0-GAP.md).
Flytta en lucka i taget.
Återanvänd det som redan finns.
Bygg inte en parallell lösning.
