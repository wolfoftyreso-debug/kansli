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
| `kansli` | ACCEPTED (nav) | Plattformspaket + IdP bor här tills vidare |
| `RITA` | Integration → Verification | Adapter + in-repo-patch klar; väntar på skrivåtkomst |
| `TORA` | Integration | OIDC-native; konfig + bevisat token-kontrakt |
| `BRITT` | Integration | Adapter byggd + testad; in-repo-patch återstår |
| `IRMA` | Integration | Adapter byggd + testad; Magic Links interna |
| `ALVA` | Parkerad | Adapter/patch vilande på användarens begäran |
