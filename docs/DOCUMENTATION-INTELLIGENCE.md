# ALVA Documentation Intelligence Layer

Reaktiv dokumentation, handbok och kontextuell hjälp för ALVA — en **strukturerad
källa** som renderas till webb, in-app-hjälp, AI-Q&A, klassrum, PDF och
översättningar, och som är reaktiv i **båda** riktningarna:

- **ALVA ändras → dokumentationen flaggas** (drift → `VERIFICATION_REQUIRED`/`OUTDATED`).
- **Dokumentationen hittar en lucka → utvecklingsbackloggen flaggas** (gap-rapport + UX-issue).

## PHASE 0 — vad som faktiskt finns (kontrollpunkten)

Första jobbet var att inventera, inte anta. Resultatet (maskinläsbart i
`packages/doc-intel/data/` och sammanfattat i `docs/ALVA-DOCUMENTATION-GAP-REPORT.md`):

> **ALVA-produkten finns inte i detta repo.** Repot (`kansli`) är plattformsnavet.
> Det enda ALVA-specifika här är en resursserver-**adapter**
> (`integrations/alva/src/pixdrift-auth.mjs`, ~120 rader) som verifierar Pixdrift-
> tokens mot JWKS. Ingen ALVA-UI, inga routes, inga arbetsordrar, ingen diagnos-
> kod finns här. Diagnosprodukten bor i eget (parkerat) repo.

Konsekvens: de efterfrågade ALVA-kapabiliteterna (fordon, arbetsordrar,
kundanmärkningar, diagnossessioner, protokoll, Academy, …) kan **inte** inventeras,
screenshottas eller dokumenteras mot verklig evidens härifrån. De är därför
registrerade som `NOT_PRESENT` (går ej att verifiera här) så att **okänd täckning
aldrig maskeras som komplett** — exakt den kontrollpunkt uppdraget efterfrågar.

Nuläge (auto-genererat): 44 kapabiliteter — 21 `IN_REPO`, 23 `NOT_PRESENT`,
0 `DOCUMENTED`, 18 `PARTIALLY_DOCUMENTED` (endast utvecklardokumentation), 26 `UNDOCUMENTED`.

## Vad som är byggt nu (grundat, testat)

`@pixdrift/doc-intel` — kärnan i intelligenslagret (inga antaganden, bara det som finns):

- **Content- & täckningsmodell** (`src/model.ts`, Zod): `CapabilityRecord`,
  `CoverageRecord`, med statusar `UNDOCUMENTED · DRAFT · PARTIALLY_DOCUMENTED ·
  DOCUMENTED · VERIFICATION_REQUIRED · OUTDATED · ARCHIVED`, `presence`
  (`IN_REPO/EXTERNAL_REPO/NOT_PRESENT`), `visibility` (public/authenticated/role),
  `confidence`, översättnings-/screenshotstatus.
- **Maskinläsbara register** (`data/capability-inventory.json`,
  `data/coverage-matrix.json`) — Product Capability Inventory + Documentation
  Coverage Matrix.
- **Gap/drift-motor** (`src/gaps.ts`): `computeGaps`, `whatIsUndocumented`
  (”Vad i ALVA är odokumenterat just nu?”), orphan-detektion, samt
  markdown-rendering. En kapabilitet **utan** täckningspost är per definition
  `UNDOCUMENTED` — okänt räknas aldrig som dokumenterat.
- **CLI**: `pnpm --filter @pixdrift/doc-intel gap-report` → skriver gap-rapporten.
- **Tester**: 9 fall (schemavalidering, ”no record = undocumented”, NOT_PRESENT-
  separation, saknad kontexthjälp, orphan-detektion, aldrig 100% när luckor finns).

Detta är det reaktiva styrskiktet. Alla människonära ytor nedan renderas från
innehåll som länkar tillbaka till dessa `capabilityId:n`.

## Målarkitektur (single source of truth)

En strukturerad källa, många utdata — aldrig tre separata manualer:

```
Documentation Content
        │
        ├─ Web Handbook (publik + autentiserad, rollmedveten)
        ├─ In-App Help (kontextuell: route/skärm/roll/tillstånd)
        ├─ Natural-Language Q&A (semantisk sökning, grundad i publicerat innehåll)
        ├─ Classroom / ALVA Academy (tränings­referenser)
        ├─ PDF (samma källa → handbok, teknikerguide, lärarguide, …)
        └─ Translations (stabila content-IDs, oberoende versionering)
```

Innehållsentiteter (att införa när ALVA-repo finns): `DocumentationArticle`,
`Section`, `Step`, `Media`, `Snapshot`, `Annotation`, `Translation`, `Version`,
`CapabilityLink`, `RoleVisibility`. Artiklar bär metadata (slug, roller,
visibility, appVersion, verifiedCommit, relatedRoutes/keywords/aliases, status).

### Reaktiva platshållare
`{{product.name}}`, `{{ui.button.startDiagnosis}}`, `{{diagnosis.customerComplaint.label}}`
m.fl. — deterministisk, versionsmedveten upplösning från kontrollerade ALVA-källor.
Aldrig godtycklig kod i platshållare.

### Snapshot-pipeline (lokaliseringssäker)
`Real UI → snapshot → identifiera område → crop → maskera känslig/testdata →
ta bort UI-brus → markera fokus → nummer/pilar som separata overlays →
kvalitetsgrind → publicera`. **Text och markeringar bränns inte in** i bas-
skärmdumpen: samma bild återanvänds för sv/en/de/pl medan overlays + instruktioner
lokaliseras. Kvalitetsgrind avvisar loading-skelett, toasts, fel-modaler, PII,
klippt innehåll, fel tema/version → annars `REGENERATE`.

### Rollmedveten publicering
Publik handbok (footer-länk) = endast säkert att exponera. Administrativa/interna/
tenant-/lärarspecifika instruktioner kräver autentisering; visibility upprätthålls
**server-side**. Lärarens facit får aldrig läcka publikt.

### ALVA-entitetsmodell (måste dokumenteras korrekt)
`Fordon → Arbetsorder → Kundanmärkning → Diagnossession → Diagnosprotokoll`.
En arbetsorder är **inte** lika med ett diagnosfall: en arbetsorder kan ha flera
kundanmärkningar, och varje kundanmärkning äger sitt eget diagnosflöde. Dokumentation
får aldrig lära ut ”1 arbetsorder = 1 diagnos” (utom när ordern råkar ha exakt en
anmärkning). Detta är kodat som en `knownGap` på `alva.product.work-orders`.

## Vad som krävs för att bygga vidare (blockerare)

Allt innehålls-, snapshot-, PDF-, översättnings- och semantisk-sök-arbete kräver
**verklig ALVA-evidens**, som inte finns här:

1. **Åtkomst till ALVA-produktens repo** (koppla in det, eller ge agenten en gren)
   → då kan Capability Inventory fyllas från riktiga routes/komponenter/scheman.
2. **En körbar ALVA-instans** (+ deterministiska dokumentations-fixtures: syntetiska
   organisationer, regnr, arbetsordrar, anmärkningar) → då kan snapshot-pipelinen
   köras mot verkliga UI-tillstånd, aldrig kunddata.

Utan (1) och (2) skulle en handbok byggas ”från antaganden” — vilket uppdraget
uttryckligen förbjuder. Kärnan ovan är därför medvetet byggd så att den fungerar
och växer i takt med att verklig evidens kopplas in.

## Första vertikala skivan (när ALVA-repo finns)

Central diagnos-workflow (”Hur startar jag en diagnos?” / ”Lägg till ytterligare
en kundanmärkning på samma arbetsorder”): strukturerad artikel med steg + reaktiva
platshållare, kontextuell hjälp, semantisk retrieval, riktig auto-snapshot med
crop + separat annoteringslager, public/private-visibility, översättningsklar text,
webb- + PDF-rendering, versionsmetadata och `CapabilityLink` tillbaka till
`alva.product.diagnosis-sessions`. Sedan breddas täckningen kapabilitet för
kapabilitet, styrt av gap-rapporten.

## Dubbelriktad reaktivitet

- **Drift (ALVA → docs):** när en route/komponent/etikett/schema/feature-flag ändras
  ska berörda artiklar/steg/snapshots flaggas `VERIFICATION_REQUIRED`/`OUTDATED` via
  beroendekedjan `Component/Route → Article → Step → Snapshot`. Publicera aldrig tyst
  potentiellt felaktiga instruktioner.
- **Gap (docs → backlog):** `computeGaps` producerar underhållsuppgifter (odokumenterat,
  screenshots att regenerera, föråldrade översättningar, routes utan kontexthjälp,
  dokumenterade kontroller som inte längre finns). Dokumentationsarbetet fungerar
  dessutom som UX-revision: svårförklarade flöden blir separata UX-issues, inte
  bortdöljd dokumentation.
