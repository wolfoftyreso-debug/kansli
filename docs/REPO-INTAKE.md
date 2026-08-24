# Repo-intag — pipeline och klassificering

Familjen byggs **repo för repo**, inte "flytta allt". Varje repo passerar samma
pipeline innan det räknas som integrerat. Ingenting raderas för att det "ser
gammalt ut" — allt klassificeras.

## Pipeline

```
REPO IN
   ↓ Inventory                 (stack, datalager, auth, tenant, integritet)
   ↓ Architecture mapping
   ↓ Dependency mapping
   ↓ Identify shared functionality
   ↓ Identify product-specific functionality
   ↓ Identify duplicated functionality
   ↓ Security review
   ↓ Data ownership review
   ↓ Migration proposal
   ↓ Tests
   ↓ Integration                (mot Shared Platform via kontrakt/adapter)
   ↓ Verification
REPO ACCEPTED
```

## Klassificering (per komponent/funktion)

| Status | Innebörd |
| --- | --- |
| `KEEP` | Stannar oförändrad i produkten |
| `MOVE` | Flyttas till shared platform |
| `MERGE` | Slås ihop med befintlig delad funktion |
| `REWRITE` | Behålls i syfte men skrivs om |
| `DEPRECATE` | Fasas ut, med plan |
| `DELETE` | Tas bort (endast efter uttrycklig granskning) |
| `UNKNOWN` | Oklart — **måste utredas, aldrig gissas** |

`UNKNOWN` är en fullt legitim status och ska föredras framför en chansning.

## Status per repo (uppdateras löpande)

| Repo | Steg | Anteckning |
| --- | --- | --- |
| `kansli` | ACCEPTED (nav) | Plattform + produktmoduler i samma Next-process. Kontrakt: `@pixdrift/systems` |
| `RITA` | Verification (i navet) | Analys + fynd i `src/`. Rust-motor via HTTP/binär. Fristående repo: adapter klar |
| `TORA` | Verification (i navet) | Motor i `@pixdrift/tora`. Marknad/detalj/kalender i `src/` |
| `BRITT` | Verification (i navet) | Demo-intel + observationer i `src/`. Fortnox/Revolut saknas |
| `IRMA` | Verification (i navet) | Avtal + hashad bekräftelse i `src/`. Inte kvalificerad e-sign |
| `ALVA` | Parkerad | Fallregistrering i navet. Diagnosmotor väntar på ALVA-repot |
