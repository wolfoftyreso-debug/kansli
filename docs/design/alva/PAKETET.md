# ALVA — komplett paket

Allt som är ALVA: källkod, historik och dokumentation.

    HEAD      cdb276b
    commits   671
    filer     380 (varav 20 symlänkar)

## Innehåll

| Katalog | Vad |
| --- | --- |
| `app/` | Klienten — publika webbplatsen, portalen, felsökningsverktyget |
| `services/gemensam/` | Domänen: händelseschema, kvalitetsgrind, hashkedja, försegling, tidsstämpel, personuppgifter, tiospråkssystem |
| `services/plattform/` | API: auth, händelser, delning, fakturering |
| `services/ai-orkester/` | AI-gateway (Anthropic + Gemini) |
| `server/` | Kombinerad server: hela produkten i en process |
| `infra/` | Terraform + `postgres-init.sql` + systemd |
| `deploy/` | Driftsättningsanvisningar |
| `docs/` | Dokumentation, designschema och revisionshistorik |
| `.git/` | Full historik — repot går att klona ur paketet |

## Inte med

- **`node_modules/`** — återskapas exakt ur låsfilerna med `npm ci`
- **`app/dist/`** — byggutfall
- **Hemligheter** — inga nycklar, `.env`-filer eller Terraform-tillstånd.
  Genomsökt: inga träffar på kända nyckelmönster
- **Värdapplikationens rester** — konditoributikens branding och antikvor
  är borttagna ur källkoden (commit `cdb276b`)

## Om konditori-referenserna som FINNS kvar

Tre filer nämner den gamla värdapplikationen, med avsikt:

- `app/src/felsokning/__tests__/alva-yta.test.ts` — **testet som låser** att
  ytan aldrig ärver en antikva. Det är skyddet, inte skräpet.
- `app/src/alva/system.ts` — kommentaren som förklarar varför ALVA
  deklarerar sitt eget snitt.
- `AGENTS.md` — notis om att gamla commits nämner en konditoributik.

Att ta bort förklaringen till ett skydd är att bjuda in felet på nytt.

## Kom igång

```sh
unzip alva-komplett.zip && cd alva

cd app && npm ci
npx vitest run                 # 1008 test
npm run typkontroll
VITE_PLATTFORM_URL=/api VITE_AI_ORKESTER_URL=/ai npm run build

cd ../services/plattform && npm ci
bash integrationstest.sh       # 231 kontroller mot riktig Postgres

cd ../.. && bash server/rokprov.sh
```

Symlänkarna i `services/plattform/` och `services/ai-orkester/` pekar in i
`services/gemensam/` — samma domänmodul delas av klient och server. De är
bevarade i paketet (packa upp med ett verktyg som bevarar symlänkar).

## Läs först

- `README.md` · `AGENTS.md` · `docs/VAD-AR-ALVA.txt`
- `docs/CURRENT_STATE.md` — vad systemet faktiskt är
- `docs/TECHNICAL_RISKS.md` — 16 risker, två kritiska
- `docs/CODEBASE_CLASSIFICATION.md` · `docs/MIGRATION_PLAN.md`
- `docs/ALVA-DESIGNSCHEMA.md` — designschemat
