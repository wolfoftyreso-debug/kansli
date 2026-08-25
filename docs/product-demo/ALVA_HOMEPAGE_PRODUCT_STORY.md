# ALVA_HOMEPAGE_PRODUCT_STORY — scroll-drivet produktnarrativ

Startsidan förklarar ALVA progressivt när man scrollar. Varje scen svarar på **en**
fråga, med **en** mening copy. Product truth först: varje scen renderas med en
verifierad ALVA-snapshot (compositad, aldrig fabricerad).

> Above-the-fold + första scroll ska snabbt svara: Vad är ALVA? Vem använder det?
> Vad matas in? Vad gör ALVA? Vad kommer ut? Visa produkten — inte företagshistorik.

## Hero (above the fold)
- **Fråga:** Vad är ALVA och vem använder det?
- **Budskap:** "Börja med kundens egna ord."
- **Scen:** Trovärdig verkstadskontext, tekniker använder ALVA naturligt (telefon i
  hand), ALVA-skärmen igenkännbar och läsbar. Ingen jättelik svävande telefon.
- **Snapshot:** `hero-complaint` (mobil).
- **Reduced motion:** statisk hjältebild + kort copy.

## Scenföljd

### Scen 1 — Kundanmärkning
- Fråga: Vad matas in? · Budskap: "Börja med kundens egna ord."
- ALVA-läge: `hero-complaint`. Kontext: tekniker vid fordon, telefon.
- Fokus: anmärkningstexten. Scroll → kortet lyfts/tonas in. Nästa: Scen 2.
- Desktop: order + framhävd anmärkning. Mobil: enkolumn, stor text.
- Reduced motion: statisk bild + bildtext.

### Scen 2 — En order, flera anmärkningar
- Fråga: Hur hänger order och diagnos ihop? · Budskap: "En arbetsorder. Flera anmärkningar."
- ALVA-läge: `multiple-complaints`. Kontext: servicerådgivare vid skärm.
- Fokus: två anmärkningsrader; andra tonas in. Nästa: Scen 3.
- Desktop: bred vy, båda anmärkningarna utan hopklippning. Mobil: staplade kort.
- Reduced motion: statisk bild med båda.

### Scen 3 — Starta diagnos
- Fråga: Vad gör ALVA med en anmärkning? · Budskap: "En anmärkning. Ett diagnosfall."
- ALVA-läge: `start-diagnosis`. Fokus: starta-diagnos. Övergång anmärkning→session. Nästa: Scen 4.
- Reduced motion: statisk bild av skapad session.

### Scen 4 — Guidat test
- Fråga: Hur vet teknikern vad som ska göras? · Budskap: "Testa innan du gissar."
- ALVA-läge: `guided-test`. Fokus: föreslaget test (kort glider in). Nästa: Scen 5.

### Scen 5 — Mätning blir bevis
- Fråga: Vad händer med det teknikern hittar? · Budskap: "Varje mätning blir bevis."
- ALVA-läge: `measurement-evidence`. Fokus: mätvärdet; bevis staplas. Nästa: Scen 6.

### Scen 6 — Grundorsak
- Fråga: Hur fastställs orsaken? · Budskap: "Se hur slutsatsen nåddes."
- ALVA-läge: `root-cause`. Fokus: fastställd grundorsak; resonemang synligt. Nästa: Scen 7.

### Scen 7 — Protokoll
- Fråga: Vad kommer ut? · Budskap: "Avsluta med en diagnos alla förstår."
- ALVA-läge: `protocol`. Lugn avslutning; rent protokoll, tydlig hierarki.

## Visa avsikt (spec §13) & kausalitet
Subtil fokus/finger-närhet antyder "de ska trycka här"; vid scroll: "nu hände
detta"; sedan "nu frågar ALVA om detta". Återhållsamma övergångar, ingen gimmick.

## Copy-princip
Copy stödjer bilden, ersätter den inte. Korta påståenden ("Testa innan du gissar."),
inga långa stycken, inga buzzwords, inga påståenden produkten inte stödjer.
Besökaren förstår ALVA även vid enbart ögonkast på texten.

## Responsivt & reduced-motion
Fungerar på desktop/laptop/tablet/mobil; mobil laddar inte onödigt stora
desktop-assets (image-varianter). Med rörelse avstängd berättar statiska bilder +
HTML-copy hela storyn (kritiskt innehåll aldrig enbart i animation).

## Planerad senare: 15–30 s ordlös produktsekvens
Tekniker → kundanmärkning → tryck → mätning → slutsats → protokoll, så tydlig att
ALVA förstås utan speaker och nästan utan text. Byggs som `ScrollSequence`/video
ovanpå samma verifierade snapshots när appen är tillgänglig.

## Planerat komponentsystem (spec §19)
`ProductScene · DeviceScene · ScreenComposite · WorkflowStory · ScrollSequence ·
UIFocus · StepTransition · BeforeAfterState · ProductCaption · InteractiveDemo ·
SnapshotAsset · DeviceMask` — byggs i ALVA:s designsystem, tar en **verifierad
SnapshotAsset** som indata (ALVA-UI compositas, aldrig fabriceras). Byggs efter att
capture-steget (build order 6–10) kan köras mot en riktig ALVA-instans.
