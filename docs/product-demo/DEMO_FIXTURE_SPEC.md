# DEMO_FIXTURE_SPEC — deterministisk demo-fixture för ALVA

En enda, reproducerbar och **syntetisk** verkstadsscenario som används identiskt
för screenshots, webbdemo, dokumentation, utbildning, säljdemo och test. Aldrig
okontrollerad produkt-/kunddata.

> Fixturen konsumeras av ALVA-appen (som bor i eget repo). Detta är
> **specifikationen**; de faktiska seed-posterna skapas i ALVA:s
> demo-/sandbox-miljö enligt nedan och märks internt tydligt som syntetiska.

## Fixture-id

`demo.workshop.wo-1001` — allt nedan hänger under detta id (stabila referenser
som shot-listan pekar på via `fixtureRef`).

## Scenario (uppfyller entitetsmodellen)

`Fordon → Arbetsorder → Kundanmärkning → Diagnossession → Diagnosprotokoll`, och
**en arbetsorder med två oberoende anmärkningar** (motbevisar "1 order = 1 diagnos").

### Fordon
- Märke/modell: Volvo V70 2.4D (2009), synthetic
- Reg.nr: `DMO 123` (syntetiskt, ej giltigt kundfordon)
- Mätarställning: 184 200 km
- Ägare/tenant: `Exempelbolaget AB` (befintlig demo-tenant)

### Arbetsorder `WO-1001`
- Verkstad: Exempelbolagets verkstad
- Tekniker: `Demo Demosson` (befintlig demo-användare)
- Innehåller **två** kundanmärkningar:

#### Kundanmärkning 1 — `complaint-1`
- Kundens ord: "Bilen drar åt höger när jag bromsar hårt."
- Egen diagnossession `complaint-1.session`:
  - Guidat test: bromskraftsmätning vänster/höger fram
  - Mätning `measurement-1`: bromskraft H 2,1 kN vs V 3,4 kN (avvikelse)
  - Bevis: foto av höger bromsok (kärvande kolv)
  - Grundorsak: kärvande bromsok höger fram
  - Protokoll `complaint-1.protocol`: åtgärd = renovera/byt bromsok HF

#### Kundanmärkning 2 — `complaint-2`
- Kundens ord: "Motorlampan tänds ibland och det rycker vid gas."
- Egen diagnossession `complaint-2.session`:
  - OBD-avläsning: `P0303` (misständning cylinder 3)
  - Mätning: spolresistans cyl 3 avviker; kompression OK
  - Bevis: skärmdump av felkod + mätvärde
  - Grundorsak: defekt tändspole cylinder 3
  - Protokoll `complaint-2.protocol`: åtgärd = byt tändspole cyl 3

## Determinism & krav
- Fasta id:n, fasta värden, fast tidslinje (inga slumpade timestamps i demo-läge).
- Inga skelett/spinners i fångat läge (fixturen laddas färdig innan capture).
- Ingen PII: syntetiska namn/reg.nr; kundens "ord" är påhittade men trovärdiga.
- Samma fixture ger samma UI varje gång → stabila snapshots och stabil visuell QA.

## Reproducerbarhet
Fixturen ska kunna seedas/återställas med ett kommando i ALVA:s sandbox (t.ex.
`alva demo:seed --fixture wo-1001`). Exakt mekanism definieras i ALVA-repot; denna
spec är kontraktet capture-pipelinen förlitar sig på.
