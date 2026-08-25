# ALVA Product Demo & Visual Storytelling

Motorn för ALVA:s publika startsida — en **produktdemonstration**, inte ett
screenshot-galleri. Målet: en besökare ska förstå ALVA genom att **titta**,
inte läsa.

## Ofrånkomlig princip (FINAL RULE)

> Bild-AI får **aldrig** hitta på ALVA-gränssnittet. Det riktiga UI:t är källan.
> Människa, hand, verkstad, telefon och komposition får vara renderade — men
> **ALVA-skärmen compositas från verifierade snapshots** av den riktiga appen.

Pipeline: `Real ALVA UI → verifierad snapshot → device-perspektiv → skärmmask →
komposition → ljus/reflex → färdig scen`. UI:t förblir hjälten och läsbart.

## Nuvarande blockering (product truth först)

ALVA-**produkten och dess sandbox finns inte i detta repo** (endast auth-adaptern,
se `docs/ALVA-DOCUMENTATION-GAP-REPORT.md`). Därför kan inga verifierade snapshots
fångas härifrån, och inga scener kompositas. Det som byggts nu är därför medvetet
**allt utom fabricerat UI**:

- **Grundad plan/spec** (denna mapp): `PRODUCT_DEMO_SHOTLIST.md`,
  `ALVA_HOMEPAGE_PRODUCT_STORY.md`, `DEMO_FIXTURE_SPEC.md`.
- **Maskinläsbar demo-motor** i `@pixdrift/doc-intel`: shot-list, asset-manifest
  (tomt tills verklig capture), QA-grind (avvisningsskäl) och demo-gap-motor.
- **Demo-gap-rapport** (auto-genererad): `ALVA-DEMO-GAP-REPORT.md` — flaggar varje
  hero-scen som `BLOCKED_NO_APP` (kan inte demonstreras här).

Generera rapporten: `pnpm --filter @pixdrift/doc-intel demo-gap-report`.

## Vad som krävs för att gå vidare

1. Åtkomst till **ALVA-produktens repo**.
2. En körbar **sandbox/demo-instans** + deterministiska fixtures (se
   `DEMO_FIXTURE_SPEC.md`).

Då kan build order (nedan) köras: capture → QA → ev. UI-fix → recapture →
manifest → storyboard → kompositioner → `ProductScene`-komponenter → scroll-
narrativ → isolerad interaktiv demo → responsivt → visuell QA → prestanda.

## Build order (spec §27) — status

| # | Steg | Status |
| ---: | --- | --- |
| 1–3 | Inspektera ALVA, inventera flöden, välj story | Klart (story/shotlist specad) |
| 4 | Deterministisk demo-fixture | Specad (`DEMO_FIXTURE_SPEC.md`) |
| 5 | Shot list | Klart (`PRODUCT_DEMO_SHOTLIST.md` + json) |
| 6–10 | Capture, QA, fix, recapture, manifest | **Blockerad** (ingen ALVA-app här) |
| 11 | Storyboard | Klart (`ALVA_HOMEPAGE_PRODUCT_STORY.md`) |
| 12–23 | Kompositioner, komponenter, scroll, demo, QA, perf | Blockerad tills snapshots finns |

## Reaktivitet

Demo-motorn delar `@pixdrift/doc-intel`s kapabilitetsinventering: varje scen är
länkad till ett `capabilityId`. Saknas produkten (eller en verifierad asset) är
scenen `BLOCKED_NO_APP`. När ALVA-appen kopplas in och snapshots verifieras
promotas scenen automatiskt (PLANNED → CAPTURED → VERIFIED) i gap-rapporten.
