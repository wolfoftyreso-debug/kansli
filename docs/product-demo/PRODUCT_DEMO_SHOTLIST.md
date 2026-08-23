# PRODUCT_DEMO_SHOTLIST — ALVA hero-shots

De minsta antal scener en ny besökare behöver för att förstå ALVA. Grundad i
entitetsmodellen och `DEMO_FIXTURE_SPEC.md`. **Maskinläsbar källa:**
`packages/doc-intel/data/demo-shotlist.json` (denna fil är den läsbara vyn).

> Ingen bild är fångad ännu — ALVA-appen/sandboxen finns inte i detta repo. Varje
> shot är `BLOCKED_NO_APP` tills en verifierad snapshot kan tas. Status följs i
> `ALVA-DEMO-GAP-REPORT.md`.

## Story (spec §2/§8)

`Kund rapporterar problem → ALVA skapar strukturerad diagnos → tekniker guidas
genom test → mätningar + bevis bygger fallet → grundorsak fastställs → tydligt
protokoll`. En arbetsorder kan ha **flera** anmärkningar; varje anmärkning är sitt
**eget** diagnosfall.

## Shots

| # | id | Budskap (copy) | Route | Krävt läge | Viewports | Fixture | UI-region | Besökaren förstår |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `hero-complaint` | Börja med kundens egna ord. | `/work-orders/:id` | Anmärkning i klartext, ej omvandlad | D/T/M | `…complaint-1` | Anmärkningskort | ALVA börjar med vad kunden rapporterade |
| 2 | `multiple-complaints` | En arbetsorder. Flera anmärkningar. | `/work-orders/:id` | ≥2 anmärkningar synliga | D/T | `wo-1001` | Anmärkningslista | Order ≠ ett enda diagnosfall |
| 3 | `start-diagnosis` | En anmärkning. Ett diagnosfall. | `/complaints/:id/diagnosis` | Session skapad för EN anmärkning | D/M | `…session` | Sessionsrubrik | Varje anmärkning äger sitt fall |
| 4 | `guided-test` | Testa innan du gissar. | `/complaints/:id/diagnosis` | ALVA föreslår nästa test | D/M | `…session` | Nästa-test-kort | ALVA vägleder rätt test i rätt ordning |
| 5 | `measurement-evidence` | Varje mätning blir bevis. | `/complaints/:id/diagnosis` | Mätning + foto knutet till steg | D/M | `…measurement-1` | Mätvärde + bevis | Mätningar/foton blir spårbara bevis |
| 6 | `root-cause` | Se hur slutsatsen nåddes. | `/complaints/:id/diagnosis` | Resonemang → fastställd grundorsak | D/T | `…session` | Resonemang→orsak | Slutsatsen är härledd, ej gissad |
| 7 | `protocol` | Avsluta med en diagnos alla förstår. | `/complaints/:id/protocol` | Färdigt protokoll, delbart | D/T/M | `…protocol` | Protokollsammanfattning | ALVA ger ett tydligt protokoll |

Viewports: D=Desktop, T=Tablet, M=Mobile. Fångas i ALVA:s verkliga responsiva
layout — desktop-skärmar skalas aldrig blint in i mobilramar.

## Per shot: syfte, kontext, fokus, scroll

Fullständiga fält (humanContext, device, focusPoint, scrollTransition,
desktop/mobile/reduced-motion-behandling, expectedUnderstanding) finns i
`demo-shotlist.json`. Kortfattat:

- **1 hero-complaint** — Tekniker vid fordonet, telefon i hand. Fokus: anmärkningstext.
- **2 multiple-complaints** — Servicerådgivare vid skärm. Fokus: två anmärkningsrader (andra tonas in).
- **3 start-diagnosis** — Tekniker mot fordon. Fokus: starta-diagnos. Övergång anmärkning→session.
- **4 guided-test** — Telefon på arbetsbänk. Fokus: föreslaget test.
- **5 measurement-evidence** — Handhållen telefon med mätvärde. Bevis staplas.
- **6 root-cause** — Diagnosstation/skärm. Bevis→slutsats, resonemang synligt (ej svartlåda).
- **7 protocol** — Lugn avslutning; rent protokoll, tydlig hierarki.

## QA-grind (spec §6)
Varje kandidat måste passera QA innan `VERIFIED`. Avvisas vid: loading, skelett,
oväntad toast, debug-UI, trasig bild, platshållare, PII, dålig radbrytning,
klippta kontroller, oavsiktliga scrollbars, fel fixture, inkonsekvent läge,
ofärdigt UI, trasig responsivitet. Exponerar en shot en verklig UX-brist:
**dölj den inte** — skapa UX-issue, åtgärda ALVA, fånga om.
