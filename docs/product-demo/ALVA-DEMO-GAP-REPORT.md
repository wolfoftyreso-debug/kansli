# ALVA Product Demo — Gap Report

> Auto-genererad av `@pixdrift/doc-intel`. En scen får aldrig publiceras ovanpå
> ett overifierat (eller obefintligt) UI-tillstånd. Bild-AI får aldrig hitta på
> ALVA-gränssnittet — verifierade snapshots från den riktiga appen är källan.

Genererad: 2026-08-23T00:22:07.637Z

> Planerad hero-shotlist för ALVA:s publika startsida. Scenerna är grundade i ALVA:s entitetsmodell (Fordon -> Arbetsorder -> Kundanmärkning -> Diagnossession -> Diagnosprotokoll). Ingen bild är fångad: ALVA-produkten/sandboxen finns inte i detta repo, så varje scen är BLOCKED_NO_APP tills verifierade snapshots kan tas.

## Sammanfattning

| Mått | Antal |
| --- | ---: |
| Scener | 7 |
| VERIFIED | 0 |
| CAPTURED | 0 |
| QA_REJECTED | 0 |
| PLANNED | 0 |
| BLOCKED_NO_APP | 7 |

## Scener

| # | id | Budskap | Status | Assets | Blockering |
| ---: | --- | --- | --- | ---: | --- |
| 1 | `hero-complaint` | Börja med kundens egna ord. | BLOCKED_NO_APP | 0 | ALVA-produkten/sandboxen finns inte i detta repo — verifierad snapshot kan inte fångas här |
| 2 | `multiple-complaints` | En arbetsorder. Flera anmärkningar. | BLOCKED_NO_APP | 0 | ALVA-produkten/sandboxen finns inte i detta repo — verifierad snapshot kan inte fångas här |
| 3 | `start-diagnosis` | En anmärkning. Ett diagnosfall. | BLOCKED_NO_APP | 0 | ALVA-produkten/sandboxen finns inte i detta repo — verifierad snapshot kan inte fångas här |
| 4 | `guided-test` | Testa innan du gissar. | BLOCKED_NO_APP | 0 | ALVA-produkten/sandboxen finns inte i detta repo — verifierad snapshot kan inte fångas här |
| 5 | `measurement-evidence` | Varje mätning blir bevis. | BLOCKED_NO_APP | 0 | ALVA-produkten/sandboxen finns inte i detta repo — verifierad snapshot kan inte fångas här |
| 6 | `root-cause` | Se hur slutsatsen nåddes. | BLOCKED_NO_APP | 0 | ALVA-produkten/sandboxen finns inte i detta repo — verifierad snapshot kan inte fångas här |
| 7 | `protocol` | Avsluta med en diagnos alla förstår. | BLOCKED_NO_APP | 0 | ALVA-produkten/sandboxen finns inte i detta repo — verifierad snapshot kan inte fångas här |

## Kan inte demonstreras (underliggande funktionalitet saknas här)

- `hero-complaint` — Vad matas in i ALVA? — _ALVA-produkten/sandboxen finns inte i detta repo — verifierad snapshot kan inte fångas här_
- `multiple-complaints` — Hur hänger en arbetsorder och en diagnos ihop? — _ALVA-produkten/sandboxen finns inte i detta repo — verifierad snapshot kan inte fångas här_
- `start-diagnosis` — Vad gör ALVA med en anmärkning? — _ALVA-produkten/sandboxen finns inte i detta repo — verifierad snapshot kan inte fångas här_
- `guided-test` — Hur vet teknikern vad som ska göras? — _ALVA-produkten/sandboxen finns inte i detta repo — verifierad snapshot kan inte fångas här_
- `measurement-evidence` — Vad händer med det teknikern hittar? — _ALVA-produkten/sandboxen finns inte i detta repo — verifierad snapshot kan inte fångas här_
- `root-cause` — Hur fastställs orsaken? — _ALVA-produkten/sandboxen finns inte i detta repo — verifierad snapshot kan inte fångas här_
- `protocol` — Vad kommer ut ur ALVA? — _ALVA-produkten/sandboxen finns inte i detta repo — verifierad snapshot kan inte fångas här_

---

_För att gå vidare krävs åtkomst till ALVA-produktens repo + en körbar
sandbox/demo-instans med deterministiska fixtures (se `docs/product-demo/`).
Först då kan verkliga snapshots fångas, QA-granskas och compositas — aldrig
fabriceras._
