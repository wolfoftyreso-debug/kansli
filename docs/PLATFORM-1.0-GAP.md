# PIXDRIFT PLATFORM 1.0 — inventering och luckor

Datum: 2026-08-25 (datalagring: en Neon, `org_ref` + RLS, två-org-test).
Målbild: [`PLATFORM-1.0.md`](PLATFORM-1.0.md).
Metod: läst ur kod i det här repot. Inte ur önskelistor.

**Regel för celler:** PASS = körbar yta med bevis.
PARTIAL = något finns, men inte målbilden.
MISSING = finns inte.
N/A = produkten finns inte i `@pixdrift/systems`.

NORA, MOVA och SAGA är N/A i hela matrisen.
De nämns i målbilden. De finns inte i koden.

---

## 1. Produkter som faktiskt finns

Källa: `packages/systems/src/catalog.ts`.

| id | namn | status i katalog | schema | UI | API |
| --- | --- | --- | --- | --- | --- |
| identity | PIXDRIFT Identity | operational | `public` | `/idp` | `/idp` |
| kansli | Kansli | operational | `kansli` | `/kansli` | `/api/kansli` |
| ekonomi | Ekonomi | pilot | `ekonomi` | `/ekonomi` | `/api/ekonomi` |
| tora | TORA | pilot | `tora` | `/tora` | `/api/tora` |
| rita | RITA | pilot | `rita` | `/rita` | `/api/rita` |
| britt | BRITT | pilot | `britt` | `/britt` | `/api/britt` |
| irma | IRMA | pilot | `irma` | `/irma` | `/api/irma` |
| tyra | TYRA | pilot | `tyra` | `/tyra` | `/api/tyra` |
| alva | ALVA | deferred | `alva` | `/alva` | `/api/alva` |
| creditae | CREDITAE | pilot | `creditae` | `/creditae` | `/api/creditae` |
| maj | MAJ | pilot | `maj` | `/maj` | `/api/maj` |

Publik katalog (`src/lib/pixdrift/systems.ts`) saknar `kansli` medvetet.
Den har inte NORA, MOVA eller SAGA.

---

## 2. Plattformsmatris

| Produkt | AUTH | REST | MCP | SDK | WEBHOOK | DEVPORTAL | CHATGPT | SEO | DESIGN | BACKUP | MONITORING |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| identity | PASS | PARTIAL | PARTIAL | MISSING | MISSING | PARTIAL | MISSING | PARTIAL | PARTIAL | PARTIAL | PARTIAL |
| kansli | PASS | PARTIAL | PARTIAL | MISSING | MISSING | PARTIAL | MISSING | MISSING | PARTIAL | PARTIAL | PARTIAL |
| ekonomi | PASS | PARTIAL | PARTIAL | MISSING | MISSING | PARTIAL | MISSING | PARTIAL | PARTIAL | PARTIAL | PARTIAL |
| tora | PASS | PARTIAL | PARTIAL | MISSING | MISSING | PARTIAL | MISSING | PARTIAL | PARTIAL | PARTIAL | PARTIAL |
| rita | PASS | PARTIAL | PARTIAL | MISSING | MISSING | PARTIAL | MISSING | PARTIAL | PARTIAL | PARTIAL | PARTIAL |
| britt | PASS | PARTIAL | PARTIAL | MISSING | MISSING | PARTIAL | MISSING | PARTIAL | PARTIAL | PARTIAL | PARTIAL |
| irma | PASS | PARTIAL | PARTIAL | MISSING | MISSING | PARTIAL | MISSING | PARTIAL | PARTIAL | PARTIAL | PARTIAL |
| tyra | PASS | PARTIAL | PARTIAL | MISSING | MISSING | PARTIAL | MISSING | PARTIAL | PARTIAL | PARTIAL | PARTIAL |
| alva | PASS | PARTIAL | PARTIAL | MISSING | MISSING | PARTIAL | MISSING | PARTIAL | PARTIAL | PARTIAL | PARTIAL |
| creditae | PASS | PARTIAL | PARTIAL | MISSING | MISSING | PARTIAL | MISSING | PARTIAL | PARTIAL | PARTIAL | PARTIAL |
| maj | PASS | PARTIAL | PARTIAL | MISSING | MISSING | PARTIAL | MISSING | MISSING | PARTIAL | PARTIAL | PARTIAL |
| nora | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| mova | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| saga | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

### Bevis per kolumn

**AUTH — PASS** för alla produkter i navet.
Samma OIDC + BFF-cookie. Ingen produkt har egen login.
Kod: `packages/identity`, `src/app/api/auth/*`, `src/lib/auth/*`.
Luckor mot målbilden (RBAC/ABAC, entitlements, feature flags,
service accounts) hör till Platform Core, inte till “har de inloggning?”.

**REST — PARTIAL.**
JSON-API under `/api/{system}` med `@pixdrift/api-core`.
OpenAPI 3.1 genereras ur Capability Graph:
`GET /api/platform/openapi`, HTML `/documentation/rest`.
Ingen publik `api.pixdrift.com/v1`. Inte alla REST-ytor sitter i grafen (se §4).

**MCP — PARTIAL.**
`POST /mcp`, protokoll `2026-07-28`, 37 verktyg i
`src/lib/mcp/tools.ts`. Alla anropar befintliga tjänster.
Inte alla REST-operationer har verktyg. Ingen L4-kö.
Rate limit och idempotens är per process.

**SDK — MISSING.**
Inga paket `@pixdrift/sdk-*`. OpenAPI finns som frö, ingen generator.

**WEBHOOK — MISSING.**
`platform.events` är intern append-only-logg.
Inga signerade utgående webhooks till kundsystem.
Kanalnamnet `webhook` finns i kontrakt, inte som driftad yta.

**DEVPORTAL — PARTIAL.**
`/documentation` och `/documentation/mcp/*` (genererat ur registret).
Explorer: `/platform/mcp` (inloggad).
Saknas: sandbox-tenant, API Explorer med körning mot sandbox,
webhook debugger, OAuth-appar, request replay, recipes, status,
changelog som data.

**CHATGPT — MISSING.**
Ingen Apps SDK, ingen app-manifest, ingen chatt-UI.
MCP kan anropas av en generisk klient. Det är inte en ChatGPT-app.

**SEO — PARTIAL** för produkter med `/systems/{slug}`.
**MISSING** för Kansli (ingen publiksida i katalogen).
Se §5. Ingen locale-URL, ingen intent-graf, ingen Search Console-loop.

**DESIGN — PARTIAL.**
Låst källa: `docs/design/` (3.1). Tokens, IdP, Kansli-knapp, status och
launcher på `/` följer paketet. Inte 2.5D-grafer, inte figurkatalog, inte
påhittade appar. Inget `@pixdrift/design`-paket. Se `docs/DESIGN-SOURCE.md`.

**BACKUP — PARTIAL.**
`scripts/backup-postgres.sh`, `pnpm db:restore-drill`, CI kör drill.
Neon PITR är leverantörskapacitet. Ingen daterad
produktions-restore. Ingen per-tjänst RPO/RTO-kontrakt.

**MONITORING — PARTIAL.**
`GET /api/platform/health`, `x-request-id`, event-logg,
MCP-metrics i processen, `/api/mcp/health`.
Live driftvy `/platform/drift` och `GET /api/platform/ops`:
scheman, tabellcount, händelser per system, identitet, beredskap,
reskontra, ärenden, köer, senaste fel, runtime-märken utan hemligheter.
Sök på request-id: `GET /api/platform/ops/debug?q=` och `pnpm ops:lookup`.
Sök är on-demand, inte i 15s-poll. Snapshot-poll skickar inte SMS.
Huset ser flottan. Verkstad ser sitt bolag.
Ingen OpenTelemetry-export, ingen Grafana, ingen PagerDuty,
ingen syntetisk bevakning av login/MCP/docs. Hemligheter dumpas inte.

---

## 3. De sju lagren

| Lager | Betyg | Vad som finns | Vad som saknas |
| --- | --- | --- | --- |
| 1. Platform Core | PARTIAL | Identity, org, session, `noun:verb`-behörighet, API Core, events, request-id, `org_ref` + RLS när `app.org_ref` är satt, tunn SMS-kanal (`src/lib/platform/sms.ts`) för Ekonomi-sälj | ABAC/OPA, entitlements, billing, feature flags, notifieringskärna, hemlighetsvalv, OTel, per-tjänst SLO, sandbox-tenant |
| 2. Universal Integration | PARTIAL | REST + MCP mot samma `src/lib/{produkt}`. OpenAPI ur grafen. Revolut OAuth. | Publik `api.`-host, webhooks, SDK, service accounts, OAuth-appar för tredje part |
| 3. Developer Platform | PARTIAL | `/documentation`, MCP-docs, MCP-explorer | Sandbox, Try-it, recipes, changelog-data, status, request replay |
| 4. App / Agent | PARTIAL | MCP + klientinstruktioner i docs | ChatGPT Apps, Apps SDK-UI, produktappar |
| 5. Knowledge & Search | PARTIAL | `/systems`, `/documentation`, sitemap, robots, `llms.txt` ur `@pixdrift/systems` plus `MCP_DOC_LINKS`, JSON-LD ur brand plus `/systems/{slug}`, OG per publik HTML-sida, HTML noindex på apprum | Locale-URL, hreflang, knowledge, verktyg, intent-graf |
| 6. Design System | PARTIAL | CSS-tokens, gemensam sajtmall | Tokenpaket, komponentbibliotek, produkt-DNA-regler, a11y-svit |
| 7. Reliability | PARTIAL | CI, restore-drill, health | Reliability contract, Neon-restore-kvitto, syntetiska tester, incident |

---

## 4. Capability Graph — frö mot full täckning

Grafen i kod är **bara** de 37 MCP-verktygen.
Varje verktyg har redan `rest.method` + `rest.path`.
Det är medvetet: ingen parallell lista.

REST som **finns** men **inte** sitter i grafen — medvetet:

| REST | Produkt | Varför den saknas i grafen |
| --- | --- | --- |
| GET/POST `/api/ekonomi/connectors` | ekonomi | Connector-yta, inte MCP |
| GET `/api/ekonomi/reports` | ekonomi | Rapport-yta, inte MCP |
| Revolut connect/callback | ekonomi | OAuth-flöde, inte domänverktyg |
| GET/POST `/api/irma/l/:token` | irma | Gästlänk, medvetet utan agent |
| POST `/api/tyra/hub/link` | tyra | Hubblänk, gästtoken |
| POST `/api/tyra/suppliers/search` | tyra | Returnerar `NOT_CONFIGURED` |
| GET `/api/tyra/cron/reminders` | tyra | Cron, inte agentyta |
| GET `/api/maj/projects/:id` | maj | Detalj utan MCP — lista+kö räcker |
| GET `/api/platform/ops/alarms` | platform | Cron SMS, inte agentyta |
| GET `/api/platform/health` | platform | Publik health |
| GET `/api/platform/ai` | platform | Gateway-ping, inferens |
| `/api/auth/*` | identity | Browser-BFF, inte agent |

Agentbara GET-ytor och IRMA-revoke sitter i grafen.
Kvar är medvetet utan agent (gästlänk, cron, OAuth, connectors, rapporter).

---

## 5. SEO-matris per produkt

Publika sidor i dag: `/`, `/systems`, `/systems/{slug}`,
`/how-it-works`, `/applications`, `/documentation`,
`/documentation/mcp/*`, `/documentation/capabilities`,
`/why`, `/company`.
Sitemap: `src/app/sitemap.ts` (MCP-docsidor ur `MCP_DOC_LINKS` plus `/systems/{slug}`).
`llms.txt`: rum ur `@pixdrift/systems` plus MCP-docsidor ur `MCP_DOC_LINKS`.
Robots: tillåt `/`, blockera apprummen ur `@pixdrift/systems` plus `/platform` och `/api/`.
Locale: `html lang` från `pd_locale` (kanonisk `en`). Inga `/en/` `/sv/` `/de/`.
Ingen hreflang. Canonical per publik HTML-sida ur `PUBLIC_SITEMAP_PATHS` plus `/systems/{slug}`.

| Produkt | Kärnentiteter | Problemkluster | Roller | Bransch | Flöden | Integrationer | Språk | Befintliga sidor | Saknade sidor (målbild) | Teknisk SEO | Länkar | Kvalitetslucka |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| identity | SSO, OIDC, org | många logins | admin | tvärgående | logga in | alla produkter | en (en) | `/systems/identity` | privacy, security, locale | PARTIAL | svag mot docs | tunn på hur SSO funkar för en köpare |
| kansli | uppgifter, nav | — | — | — | skapa uppgift | — | — | ingen `/systems/kansli` | produktsida eller medvetet intern | MISSING | — | intern produkt, inte sökbar |
| ekonomi | faktura, moms, betalning | spridd ekonomi | ekonomi | tjänsteföretag | fakturera, matcha | Revolut (kod), Stripe/Swish (text) | en | `/systems/ekonomi` | knowledge, kalkylator, /sv /de | PARTIAL | svag | flera avsnitt `forthcoming` |
| tora | upphandling, behörighet | fel anbud | anbudsansvarig | offentlig sektor / leverantör | utvärdera marknad | — | en | `/systems/tora` | guide, jämförelse | PARTIAL | svag | bättre än de flesta, fortfarande produktblad |
| rita | skatteanalys, fynd | missade avdrag | revisor, vd | Sverige | beställ analys | motor `skattjakt` (eget repo) | en | `/systems/rita` | knowledge, disclaimer-djup | PARTIAL | svag | många `forthcoming` |
| britt | observation, fynd | uppföljning | chef | tvärgående | samla det som hänt | events in | en | `/systems/britt` | dashboard-story som knowledge | PARTIAL | svag | många `forthcoming` |
| irma | avtal, länk, signatur | “har de läst?” | jurist, vd | tvärgående | skicka, läs, bekräfta | — | en | `/systems/irma` | e-sign vs IRMA, DPA | PARTIAL | svag | många `forthcoming` |
| tyra | kund, bil, hjul | däckhotell-kaos | verkstad | däck / verkstad | ärende, hubb | leverantörssök `NOT_CONFIGURED` | en | `/systems/tyra` | däckhotell-kunskap, kalkylator | PARTIAL | svag | ärlig om vad som saknas |
| alva | ärende, fel, mätvärde | “vad sa kunden?” | verkstad | fordon | registrera fall | diagnosmotor **inte här** | en | `/systems/alva` | guided diagnostics **nej** förrän motorn finns | PARTIAL | svag | får inte sälja diagnos |
| creditae | förfrågan, bedömning | “vågar vi ge kredit?” | ekonomi, vd | tvärgående | registrera motpart, spara slutsats | Creditsafe via `credit.ts` | en | `/systems/creditae` | byråkoppling kanal, inte betyg | PARTIAL | svag | får inte sälja kreditbetyg |
| maj | projekt, beslut, release | “vad har hänt i sök?” | huset (alfa) | tvärgående | analysera, godkänn, publicera | Semrush via `webintel.ts` | en | ingen `/systems/maj` | intern alfa, inte säljbar sida | MISSING | — | rum, inte katalogblad |
| nora | — | — | — | — | — | — | — | — | — | N/A | — | inte i repot |
| mova | — | — | — | — | — | — | — | — | — | N/A | — | inte i repot |
| saga | — | — | — | — | — | — | — | — | — | N/A | — | inte i repot |

**Keyword-möjligheter (förslag, inte publicerade sidor):**
förstärk TORA upphandling, TYRA däckhotell, IRMA avtalslänk,
Ekonomi faktura+moms. Skapa inte “500 sökord”-sidor.
Skapa inte ALVA “guided diagnostics” förrän motorn är inkopplad.

**Tekniska SEO-fel (hela sajten):**

- ingen hreflang, inga locale-URL:er
- sitemap saknade MCP-dokumentation (rättas i samma ändring)
- JSON-LD ur brand plus `/systems/{slug}`. Ingen knowledge- eller FAQ-generator
- `/llms.txt` är ärlig maskintext ur `@pixdrift/systems` plus `MCP_DOC_LINKS`, inte ett sökhack
- ingen knowledge-, tools-, comparisons-yta
- `/company` har bolagsnamn och städer, inte org.nr, DPA, privacy, terms
- statusyta är `planned` i `platform.ts`

---

## 6. Developer experience — 15-minutersprovet

Mål: kall extern utvecklare gör första anropet på en kvart.

| Steg | Resultat | Friktion |
| --- | --- | --- |
| Hitta plattformen | PARTIAL | `/documentation` och `/documentation/mcp` finns. Ingen `developers.pixdrift.com`. |
| Skapa sandbox | MISSING | Ingen isolering. Demo-org kräver `PIXDRIFT_SEED_DEMO`. |
| Autentisera | PARTIAL | Session-cookie eller Bearer mot IdP. Ingen self-serve token-knapp. Klienthemligheter är env. |
| Läsa docs | PARTIAL | MCP-docs, OpenAPI och REST-HTML genereras ur grafen. Ingen Try-it mot sandbox. |
| Första REST-anrop | PARTIAL | Går mot `/api/...` med session. Ingen Try-it mot sandbox. |
| Koppla MCP | PARTIAL | `POST /mcp` + `/documentation/mcp/clients`. Inga färdiga Cursor/ChatGPT-installationspaket med OAuth. |
| Första tool | PARTIAL | Inloggad explorer `/platform/mcp`. Extern klient måste bära token själv. |
| Inspektera trace | PARTIAL | `x-request-id` syns. Sök i `/platform/drift` och `pnpm ops:lookup`. Ingen trace-backend. |
| Webhook | MISSING | Finns inte. |
| SDK | MISSING | Finns inte. |

**Mätt friktion:** en främmande utvecklare kan *läsa* MCP-kontraktet
och anropa `POST /mcp` om hen redan har en org och en token.
Hen kan inte skapa en testmiljö, inte klicka Run, inte prenumerera
på en webhook. Det är mer än noll och långt från 15 minuter.

---

## 7. ChatGPT-prov

Inte kört. Ingen app är byggd.
MCP-health och `server/discover` är inte samma sak som
“NORA for ChatGPT” med bokningskort.

---

## 8. Sökprov (publik sajt)

| Check | Resultat | Bevis |
| --- | --- | --- |
| Crawlbar HTML | PARTIAL | App Router-sidor. Docs är serverrenderade. |
| Indexerbar | PARTIAL | robots tillåter sajt, blockerar apprum + `/platform` + `/api/`. HTML `noindex` på samma rum plus gästlänk, bekräftelse och leftover 404 |
| Canonical | PARTIAL | per-sida ur `PUBLIC_SITEMAP_PATHS` plus `/systems/{slug}`. Inga locale-URL:er |
| hreflang | MISSING | — |
| Sitemap | PARTIAL | MCP-docsidor ur `MCP_DOC_LINKS` plus `/systems/{slug}` |
| Robots | PASS | `src/app/robots.ts` |
| Structured data | PARTIAL | Organization + WebSite ur brand, SoftwareApplication ur `/systems/{slug}` |
| Metadata / OG | PARTIAL | per-sida title/description/url ur samma publika ytor. Ingen OG-bild |
| Interna länkar | PARTIAL | nav + systems. Ingen intent-graf |
| HTTP-status | PARTIAL | inte syntetiskt bevakat |
| Prestanda | MISSING | ingen Lighthouse-gate |
| Mobil | PARTIAL | layout finns, ingen bevakad svit |
| Locale | PARTIAL | `html lang` från `pd_locale`. Inga locale-URL:er |

---

## 9. Integrationer — ärlig status

| Integration | Status | Bevis |
| --- | --- | --- |
| PIXDRIFT Identity (OIDC) | production i navet | `/idp`, auth-client |
| Revolut Business | experimental / kod finns | `/api/integrations/revolut/*` |
| Stripe | planned | nämns i ekonomi-docs, ingen webhook-yta |
| Swish | planned | copy, ingen connector |
| Fortnox | planned | nämns som problem, ingen connector |
| Visma | planned | samma |
| 46elks | PARTIAL | Tunn kanal `src/lib/platform/sms.ts`. Ekonomi-sälj-SMS går där. Inte en Notifications Core. |
| ElevenLabs | PARTIAL | Tunn kanal `src/lib/platform/tts.ts`. IRMA-uppläsning går där. |
| Creditsafe | PARTIAL | Tunn kanal `src/lib/platform/credit.ts`. CREDITAE hämtar rapport där. Inte ett betyg. |
| Semrush | PARTIAL | Tunn kanal `src/lib/platform/webintel.ts`. MAJ hämtar översikt, keywords och backlinks där. CREDITAE webbnärvaro på knapp. Inte en dashboard. |
| Resend / Mapbox | secrets namngivna | `docs/INTEGRATIONS.md` — kärna inte byggd |
| Apollo.io | planned | BRITT-connector namngiven, inte driftad |
| ChatGPT Apps | missing | — |
| Claude / Cursor / Codex som *app* | missing | MCP kan användas, ingen paketering |
| Slack / Teams / Microsoft 365 / Google | missing | — |
| DMS / däckleverantör | missing | TYRA search = `NOT_CONFIGURED` |

---

## 10. Tillit och bolag

`src/lib/pixdrift/brand.ts`: Landvex AB (Stockholm), Landvex Inc. (Houston),
`contact@pixdrift.com`.

Saknas som sidor: privacy, terms, DPA, subprocessors, security portal,
responsible disclosure, status, accessibility statement, release history.

Påstå inte ISO/SOC. De finns inte i repot.

---

## 11. Rekommenderad ordning (efter den här fasen)

Ändra bara om ny kod motbevisar tabellen.

1. Håll Capability Graph som enda katalog. Fyll REST-luckor som *ska* vara agentbara.
2. OpenAPI ur grafen — frö i `GET /api/platform/openapi`. Inte en handskriven spec. SDK/Try-it väntar.
3. Developer Portal: sandbox + Try-it på *befintlig* `/documentation`.
4. SDK-generering ur kontraktet.
5. ChatGPT Apps bara där MCP redan har ett ärligt läsverktyg och ev. säker skrivning.
6. Design tokens som paket när två ytor annars divergerar.
7. Publik sökgrund: locale-URL, hreflang, structured data, trust-sidor.
   Innehåll därefter, med kvalitetsgrind.
8. Reliability contract per tjänst + daterad Neon-restore.
9. Extension SDK sist.

---

## 12. Vad den här fasen medvetet *inte* byggde

- ChatGPT Apps / Apps SDK-UI
- SDK-generatorer
- SEO-motor / intent-pipeline / Search Console-import
- Sandbox-tenants
- Webhook-produkt
- Integrationsmarketplace
- Plugin-runtime
- Andra DevPortal-app

Det är nästa *kodflyttar*, var och en mot en cell i matrisen.
