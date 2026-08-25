# När kan första kunden rulla ut?

**Inte ett datum.** Ett datum skulle vara en lögn. Här är grindarna.

## Svaret utan kalender

**En första kund kan rulla ut nu** — om kunden är en verkstad (eller en dokumentkedja) som **skriver under vad produkten inte är**.

**Koncernupphandling är ett formulär.** `/upphandling` samlar stack, miljö och kontakt, skapar konto när owner-URL finns, utfärdar faktura med tio dagars betalning och lägger ett möte klockan 10:00 tio kalenderdagar senare. Anpassning mot kundens miljö görs när stacken är känd.

**Alla sex system samtidigt, till en kund som kräver sanning i varje ruta**, är **inte** klara. Det är inte en tidsfråga i den här branchen. Det är tre saker som inte finns i det här huset:

1. **ALVA-diagnosmotorn** (bor i ALVA-repot). Utan den är ALVA ett intag.
2. **RITA som HTTP-tjänst** om produktionen är Vercel. Binären körs inte i Functions.
3. **TYRA-sändning** om kunden kräver att påminnelser är `SENT`. TYRA lägger i kö.
   Ekonomi kan skicka sälj-SMS via 46elks när telefonen är kopplad och ni sagt ja.

Det går inte att koda bort 1–3 genom att sitta längre i kansli-repot. Det går att koda bort allt annat som blockerade en **ärlig** första kund. Det är gjort i den här branchen.

## Vad första kunden får idag (sanning)

| System | Första kund | Vad kunden måste acceptera |
|---|---|---|
| Identitet + Kansli | Ja | Demo-lösen bara i preview/dev. Produktion vägrar starta med `PIXDRIFT_SEED_DEMO`. |
| IRMA | Ja, L0–L1 | Inte BankID. Inte kvalificerad e-signatur. Handshake är koden. |
| TYRA | Ja, verkstadspilot | Ärende, kund, lagerplats, mätning. Däck bokas som faktura i Ekonomi från ärendet. Utkast är andra valet. **Inget SMS från TYRA. Inga live-däckpriser.** |
| TORA | Ja, med org-profil | **Demo-marknad** (seed). Inte TED/HILMA. |
| BRITT | Ja, inkorg | Öppen / klar. Inte ärendehantering. |
| RITA | Bara om motorn finns | Utan `RITA_ENGINE_BINARY` eller `RITA_ENGINE_URL`: stäng av. |
| ALVA | Nej som diagnos | Intag + protokolltom (status, anteckning, kontroller, mätvärden). Diagnos = annat repo. |
| Ekonomi | Ja som bok, nej som PSP | Boka sälj i kronor, ett klick. TYRA-offert blir faktura. Faktura 10 dagar + verifikat + moms-CSV + säljbräda. Stripe/Revolut/Swish bara med nyckel. SMS vid sälj via 46elks när ni sagt ja. Inte Visma. Inte Fortnox. |

## Vad som byggdes så att svaret inte bara är papper

- TYRA: verifierad mönsterdjupsmätning + offertutkast + **lagerplats** + kunduppgifter + anteckning + avbryt. Offertutkast stänger `CREATE_QUOTE`.
- TORA: orgens företagsprofil (inklusive registreringar). Motorn är inte längre alltid Exempelbolaget.
- Skrivvägar kräver `arende:write` / `document:upload` / `scan:run` / `profile:write`. IRMA återutfärda/återkalla likaså.
- BRITT: observation kan markeras klar.
- Kansli `/kansli/beredskap` läser runtime-grindarna. Inte ett datum.

## Drift som fortfarande är er, inte kod

- Neon med PITR. Ett **daterat** restore-kvitto i `DEPLOYMENT.md`.
- DNS + secrets i Vercel. `APP_ENV=production` eller `VERCEL_ENV=production`. Preview är aldrig produktion, även om `NODE_ENV=production`.
- Hemligheter minst 32 tecken. Inga `kansli-dev*`. Ingen `COOKIE_SECURE=false`. Ingen `PIXDRIFT_SEED_DEMO`. Utan `DATABASE_URL` startar inte processen.
- Kunden skriver under: ingen BankID, inga live-priser, ingen ALVA-diagnos, ingen TED, ingen Visma.

När de tre sakerna är klara är **första kunden inte ett datum — den är en signatur**.
