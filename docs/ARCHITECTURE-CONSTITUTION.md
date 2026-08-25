# Pixdrift Architecture Constitution

Kort och nästan juridiskt. Detta dokument styr **alla** repon i familjen. En
agent (Cursor/Codex) eller människa **ska läsa detta innan något görs** i något
repo, och ett förslag som bryter mot en artikel måste antingen avvisas eller
åtföljas av ett uttryckligt, granskat undantag.

Plattformens målbild (ytor, Capability Graph, vad som *inte* ska
byggas parallellt) står i [`PLATFORM-1.0.md`](PLATFORM-1.0.md).
Luckorna mot den målbilden står i [`PLATFORM-1.0-GAP.md`](PLATFORM-1.0-GAP.md).

Grundhållningen: **Applikationen får gå sönder. Kundens data får inte gå sönder.**
Bygg en liten, hårt kontrollerad gemensam kärna där varje produkt fortfarande
utvecklas självständigt. Undvik en monolit där ett fel i en produkt riskerar
allt annat.

## Artiklar

1. **Data ownership must always be explicit.**
2. **Product modules may not directly modify another module's data.**
3. **User data must always have a tested recovery path.** (Backup är inte backup
   förrän restore är testad.)
4. **Infrastructure complexity requires documented justification.**
5. **Managed AWS services are preferred over self-hosted equivalents.**
6. **No new datastore without architectural approval.** (PostgreSQL bär tills det
   bevisligen inte räcker; Redis = cache, S3 = filer, SQS = async.)
7. **All critical actions are auditable.** (Gemensam audit trail från dag ett.)
8. **All external integrations are isolated behind connectors.**
9. **AI output is never authoritative business data.** (Fact ≠ Inference ≠
   Recommendation ≠ Action — får aldrig flyta ihop.)
10. **Automation must have an explicit permission level.** (L0 Observe · L1
    Recommend · L2 Prepare · L3 Execute-with-approval · L4 Autonomous. Standard
    lågt; autonomi förtjänas.)
11. **Every migration must have a rollback or recovery strategy.**
12. **Unknown behavior must be investigated, never guessed.** (`UNKNOWN` är en
    legitim status — fråga hellre än att chansa.)

## Tre saker som aldrig blandas ihop

- **Identity Profile** — objektiva uppgifter (vem, tekniskt): namn, e-post,
  organisation, roll, behörighet, språk, land.
- **Experience Profile** — hur systemet bör kommunicera (detaljnivå, teknisk/
  ekonomisk nivå, kommunikationsstil, arbetssätt). Explicit, versionerad,
  redigerbar, förklarbar, reversibel — aldrig en permanent psykologisk dom.
- **Business Context** — vad användaren faktiskt arbetar med (bolag, bransch,
  avdelning, ansvar, KPI:er, system, projekt, mål, problem).

## Gränssnitt, inte delade tabeller

Gemensam plattform betyder inte att alla läser/skriver samma tabeller. Varje
domän äger sin data; andra får information via **definierade kontrakt** (t.ex.
`GET /platform/users/{id}/experience-profile`) eller **events** (`user.profile.updated`,
`organization.created`, `membership.added`, `subscription.changed`). Då kan
implementationen bytas utan att familjen går sönder.
