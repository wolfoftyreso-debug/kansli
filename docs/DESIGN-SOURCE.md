# PIXDRIFT — designkälla (låst)

Det låsta paketet ligger i `docs/design/` (version 3.1). Tokens, regelbok,
launcher och diagramspråk kommer därifrån. Den här filen är kartan mot koden
som körs.

| Fält | Värde |
| --- | --- |
| Låst | 2026-08-26 |
| Paket | `docs/design/00-README.md` … `08-3D-MODELS.md` |
| Källa | Design workspace för wolfoftyreso-debug/kansli, införd här |
| Produkter som kör | Bara id:n i `@pixdrift/systems`. NORA, MOVA, SAGA, NOVA, CARINA, MAJA, MONA, LENA, ACADEMY och BEA finns inte i det här repot |
| Språk | Engelska är systemspråk. Översättningar i `src/lib/i18n`. Inte en LANGUAGE-produkt |
| Nästa paket | Inget `@pixdrift/design` förrän två ytor annars divergerar |

**Paketets 14-namnslista är inte en licens att hitta på produkter.** Kansli,
Ekonomi, TORA och CREDITAE stannar för att de finns i katalogen. TORA täcks
inte av MOVA här — MOVA finns inte.

**Referens-HTML** ligger i `docs/design/referens/` (Hem, Grafer, Illustrations,
Karta, Regelverk, tiguan-3d). 357 figurer, fordonsbibliotek och hela 3D-flottan
väntar på nästa dump. Inställningsytor BEA / COMPANY / LANGUAGE byggs inte som
appar. Ekonomi använder det mutade 2.5D-diagramspråket. Launcher-rutorna bär
illustrerade modeller för de nio katalogrummen.

**ALVA-schema** ligger i `docs/design/alva/`. Det är rummets grammatik, inte
ett andra utseende och inte diagnosmotorn. PIXDRIFT-chromet vinner i
fasaden. Se `docs/design/alva/README.md`.

---

## 1. Vad du ska göra med den här filen

Följ `docs/design/`. Nya rum, gästsidor och inloggning ska följa paketet.
Hitta inte på en fjärde yta. Hitta inte på produkter som saknas i
`@pixdrift/systems`.

Nedan är vad som redan kördes när paketet låstes, plus vad som rättats.

---

## 2. Tre ytor som redan divergerar

Samma tokens. Tre olika ramar. Claude Design ska slå ihop dem.

### A. Produktfasaden — den styrande ytan

Kod: `src/components/app/Facade.tsx`, `src/app/globals.css`,
`src/components/app/SignInGate.tsx`.

- Engelska är systemspråk. `html lang` följer `pd_locale`.
  Översättningar i `src/lib/i18n`. Inte en LANGUAGE-produkt.
- Ljust läge bara (`color-scheme: light`). Ingen mörk tema.
- Stel: `.pd-facade` tvingar `border-radius: 0` och tar bort skugga på
  `rounded-*` / `shadow-*` **utom** `rounded-full` (den nollas inte).
- Primär knapp är **svart rektangel** (`bg-ink text-paper`), inte accentblå.
- Sidospår 208 px (`w-52`), toppfält 36 px (`h-9`), innehåll `max-w-5xl`.
- Wordmark `PIXDRIFT` med `tracking-[0.18em]`.
- Rumsetikett i mono versaler (`.pd-label`).

Det här är ytan kunden jobbar i. **Lås mot den**, inte mot IdP.

### B. Marknadsidor — samma fasad, annan röst

Kod: `src/app/(site)/*`, `src/components/site/*`.

`(site)/layout.tsx` **monterar Facade**, inte Header/Footer. Header och Footer
finns i koden men **används inte**. PixelField är skriven för en startsida
som inte längre visar den.

Innehållet är ofta **engelska** (How it works, Applications, Company, Why,
Documentation, Systems-kort). Chrome är svenska (Logga in, rum, runtime).
Det är en spricka i rösten, inte i färgerna.

### C. IdP-inloggning — egen HTML, annan form

Kod: `packages/identity/src/server.ts` (inline CSS, inte Tailwind).

| IdP idag | Fasad idag |
| --- | --- |
| Bakgrund `#f6f3ee` | `--color-paper` `#fbfbf9` |
| Kort `#fffdf8`, kant `#e7e0d6` | `--color-surface` `#ffffff`, kant `#e6e5e0` |
| Text `#1c1917` / etikett `#57534e` | `--color-ink` `#101317` / `--color-ink-soft` |
| Kort radie **16 px**, fält/knapp **9 px** | **0 px** i fasaden |
| Knapp `#1f4b8f` (accent) | Knapp `#101317` (ink) |
| Teckensnitt `ui-sans-serif, system-ui` | Geist + Geist Mono |
| Markering: blå ruta 36×36, radie 10, vitt **P** | Wordmark-text, ingen PixelMark i fasaden |
| Kort `min(92vw, 360px)`, centrerat | Sidospår + `max-w-5xl` |

Claude Design ska rita om IdP mot fasaden (stel, ink-knapp, paper/surface,
Geist). Hitta inte på en fjärde inloggning.

---

## 3. Tokens — kanoniska värden

Källa: `src/app/globals.css` `@theme`. Inga andra paletter får införas.

### Färg

| Token | Hex | Användning |
| --- | --- | --- |
| `--color-paper` | `#fbfbf9` | Sidbakgrund, fältbakgrund |
| `--color-surface` | `#ffffff` | Kort, sidospår, toppfält |
| `--color-ink` | `#101317` | Brödtext, aktiv rail, primär knapp |
| `--color-ink-soft` | `#363b42` | Hjälptext, inaktiv rail |
| `--color-muted` | `#6a7078` | Etiketter, tomt läge |
| `--color-faint` | `#9aa0a7` | Smulor, mono-meta, genomstruken uppgift |
| `--color-line` | `#e6e5e0` | Kant, hårstreck, tabellrad |
| `--color-line-strong` | `#cfcec8` | Starkare kant, outline-knapp på sajt |
| `--color-accent` | `#1f4b8f` | Fokusring, länkstatus, Ekonomi-toggler |
| `--color-accent-soft` | `#eaf0f8` | Notice, markerad uppgift, periodchip |
| `--color-status-operational` | `#2f6b46` | Status “Operational” / plus i kurva |
| `--color-status-development` | `#8a5a1a` | Status “Development” / minus i kurva |
| `--color-status-pilot` | `#1f4b8f` | Status “Pilot” (samma som accent) |

Inga andra statusfärger i tokens. TYRA använder ändå Tailwind-grönt / gult /
rött — se §4.

### Teckensnitt

| Token | Familj | Lastning |
| --- | --- | --- |
| `--font-sans` | Geist, sedan `ui-sans-serif, system-ui, sans-serif` | `next/font/google` → `--font-geist-sans` |
| `--font-mono` | Geist Mono, sedan `ui-monospace, monospace` | `--font-geist-mono` |

`--tracking-label`: `0.14em`.

Wordmark-spårning i chrome: `0.18em` (inte samma som label).

### Globala regler

- `body`: paper-bakgrund, ink-text, antialiased, `optimizeLegibility`.
- Fokus: `outline: 2px solid accent; outline-offset: 2px` på `:focus-visible`.
- Markering: accent-bakgrund, vit text.
- Kantfärg på `*`: line.
- `.pd-hr`: 1 px `border-top` line, ingen annan kant.
- `prefers-reduced-motion`: nollställ animation/transition; `scroll-behavior: auto`.
- TYRA-alias i `:root` pekar på samma tokens. `--tyra-radius: 0`.

### `.pd-label`

Mono. `0.72rem`. `letter-spacing: 0.14em`. Versaler. Färg muted.
Används till rum, runtime, smulor, sajt-ögonbryn, tabellhuvud.

---

## 4. Sprickor — läge efter låsningen

Paketet valde ett läge. Infört där det inte kräver påhittade rum.

1. **IdP** — samma paper/surface/ink som fasaden. Ingen radie. Ink-knapp.
   Wordmark-text, ingen blå P-ruta.
2. **Kansli TaskBoard-knapp** — ink-rektangel, samma som `Submit`.
3. **`rounded-full`** — noll på dokumentytor. Launcher-plattor (22 px) är
   undantaget på `/`. Ekonomi-kurvan är 2.5D (volym/platt); period- och
   serieknappar är fyrkanter, inte piller. Brand-accent `#1F4B8F` används
   inte i diagramkroppar.
4. **Rött** — en token `--color-status-blocked` / `--color-danger` `#8A2A33`.
   Destruktiv = kant, fylls vid hover. Blockerad = 2 px vänsterkant.
5. **TYRA status** — form + färg mot status-tokens, inte emerald/amber/zinc.
6. **H1-storlek** — `.pd-h1` är 28/600. Display 40/600 tabular. Rum som
   fortfarande använder `text-3xl`/`text-4xl` ska flyttas dit när sidan
   rörs.
7. **Röst** — körs på svenska. Paketet är engelska. LANGUAGE är inte byggt.
8. **Märke** — text-wordmark `PIXDRIFT`. Header/Footer/PixelMark förblir
   omonterade.
9. **Rörelse** — 120 ms ease-out på kant/bakgrund. `prefers-reduced-motion`
   stänger av.

---

## 5. Typ, rytm, röst

### Skala som används

| Roll | Klass | När |
| --- | --- | --- |
| H1 stor | `text-4xl font-semibold tracking-tight` | TYRA startsida, Ekonomi-siffra |
| H1 | `text-3xl font-semibold tracking-tight` | De flesta rum |
| H1 kompakt | `text-2xl font-semibold tracking-tight` | Kansli, anmälan, sajt-H1, systemprodukt |
| H2 | `text-lg font-semibold` | Sektioner, SignInGate-titel |
| H3 sajt | `text-xl font-semibold tracking-tight` | SystemCard, SectionHeading h2 |
| Bröd | `text-ink-soft` (16 px) | Rum-ingress |
| Hjälp | `text-sm text-ink-soft` | Fältetikett, Notice, EmptyState-variant |
| Meta | `text-sm text-muted` | Tomt läge, fotnoter |
| Tiny | `text-xs text-faint` / `font-mono text-xs text-faint` | Tid, referens, score |
| Statusrad | `text-xs font-medium uppercase tracking-wide text-accent` | IRMA/ALVA-kort |
| Sajt-bröd | `text-lg leading-relaxed text-ink` | Why, systemsektioner |
| Sajt-intro | `text-sm text-ink-soft` `max-w-2xl` | SectionHeading |

### Layouttal

| Mått | Värde |
| --- | --- |
| Sidospår | `w-52` (13 rem), `bg-surface`, `border-r border-line`. Dolt under `md` |
| Toppfält | `h-9`, `bg-surface`, `border-b`, `px-3` |
| Main | `max-w-5xl`, `gap-6`, `px-4 py-5`, `md:px-6` |
| Sajt-container | `max-w-5xl` (`Container`). Header/Footer-rester: `max-w-[1200px]` `px-6` |
| Gäst IRMA | `max-w-lg`, `px-5 py-10`, `sm:px-6 sm:py-16`, `gap-8` |
| Gäst TYRA | `max-w-xl`, `px-6 py-12`, `gap-8` |
| IdP-kort | `min(92vw, 360px)`, `padding: 2rem` |
| Kort inuti rum | `border border-line bg-surface` + `p-4` / `px-4 py-4` / `px-5 py-5` |
| Fält | `border border-line bg-paper px-3 py-2 text-sm`. Stor: `min-h-12 px-4 py-3 text-base` |
| Primär knapp | `bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft`. Stor: `min-h-12 w-full py-3 text-base` |
| Outline | `border border-line bg-paper px-3 py-2 text-sm` (Ekonomi “Öppna”) |
| Länk i löp | `underline decoration-line underline-offset-4` |
| Rutnät | `sm:grid-cols-2` för fältpar. Familjekort: `sm:grid-cols-2`. Systemkort: `sm:2 lg:3` med `gap-px bg-line` |
| Anmälan | `lg:grid-cols-[1fr_1.15fr]`, förtroende vänster, formulär höger |

### Röst (produkt)

Engelska är källan. Översättningar bevarar meningen, inte orden.
Korta meningar. Äkta om vad som saknas. Ingen jargong mot kunden.

- Pengar i UI: **kronor**. Boken: **öre**.
- Knapp **Boka sälj**, inte “skapa transaktion”.
- Status: Running / On the way / Not ready yet (`family.status.*`).
- Runtime i listen: `production` / `preview` / `local` (översätts i chrome).
- Inget varumärke för e-legitimation. IRMA: “enkel digital bekräftelse —
  inte en juridisk e-signatur.”
- Inte Visma, Fortnox, Stripe Checkout, Swish Handel som om de finns.
  Revolut får nämnas när anslutningen finns. Swish/Stripe som **vägar**,
  inte som byggda kassor.
- AI är gissning, inte sanning. RITA säger “förslag att kolla”.
- ALVA ställer ingen diagnos.

### Röst (marknad, engelska källor)

`src/lib/pixdrift/brand.ts`:

- Wordmark: `PIXDRIFT` / `Pixdrift`
- Taglines: “The layer between systems.” / “Built because it was missing.” /
  “Less software. More flow.”
- Bolag: Landvex. Kontor: Stockholm (Landvex AB), Houston (Landvex Inc.)
- Domän: pixdrift.com. Mejl: contact@pixdrift.com
- Canonical locale i brand-filen: `en`. Produkt-UI följer `pd_locale`
  (chrome-väljare). Engelska är systemspråk; översättningar i
  `src/lib/i18n`. LANGUAGE är inte en produkt.

Termer (`src/lib/pixdrift/terminology.ts`): System, inte app/solution.
Operator, inte user persona. Verification ≠ modellgissning.

### Rörelse

Nästan ingen. PixelField-connectors: 700 ms ease-out, delay 140 ms,
`prefers-reduced-motion` stänger av. Sajt-länkar: `transition-colors`.
TYRA-knappar: `transition-colors`. Fasad: ingen transition på rail.

---

## 6. Chrome — fasaden i detalj

### Sidospår (desktop `md+`)

1. Wordmark-länk `PIXDRIFT` → `/kansli` om inloggad, annars `/`.
   `border-b`, `px-3 py-2`, `text-xs font-semibold tracking-[0.18em]`.
2. Nav **Rum**: produkter ur `SYSTEM_MODULES` **utom** identity.
3. Nav **Tjänster** längst ner, `border-t`: Plattform, Händelser,
   Upphandling, Ny kund, Dokumentation.

Rail-länk:

- Aktiv: `border-l-2 border-ink bg-ink px-3 py-1.5 text-sm font-medium text-paper`
- Inaktiv: `border-l-2 border-transparent` + `text-ink-soft`, hover
  `bg-paper text-ink`

Aktiv = längsta matchande href (`activeFacadeHref`).

### Toppfält

Vänster: wordmark (bara mobil) + `.pd-label` med rumsnamn.

Höger:

- `.pd-label`: orgnamn (eller e-post / “inte inloggad”) · runtime
- **Byt bolag** (`<details>`) bara om `memberships.length > 1`. Meny
  `w-56`, `border border-line bg-surface`, nuvarande org `font-medium`.
- **Logga ut** (POST `/api/auth/logout`) eller **Logga in**
  (`/api/auth/login?next=…`)
- **Meny** (`<details>`, bara under `md`): alla rum + tjänster, `w-52`

Inga ikoner. Ingen sök. Ingen avatar. Ingen notis-klocka.

### Rum i listen

Från `src/lib/platform/facade.ts` + `packages/systems/src/catalog.ts`:

**Produkter**

| id | Label i listen | href |
| --- | --- | --- |
| kansli | Kansli | `/kansli` |
| ekonomi | Ekonomi | `/ekonomi` |
| tora | TORA | `/tora` |
| rita | RITA | `/rita` |
| britt | BRITT | `/britt` |
| irma | IRMA | `/irma` |
| tyra | TYRA | `/tyra` |
| alva | ALVA | `/alva` |
| creditae | CREDITAE | `/creditae` |

**Tjänster**

| id | Label | href |
| --- | --- | --- |
| platform | Plattform | `/platform` |
| drift | Drift | `/platform/drift` |
| events | Händelser | `/platform/events` |
| upphandling | Upphandling | `/kansli/upphandling` |
| intake | Ny kund | `/upphandling` |
| docs | Dokumentation | `/documentation` |

Identity är inloggningen, inte ett rum.

### Smulor

`ProductCrumb`: `.pd-label.pd-crumb.text-faint`.
`PIXDRIFT / Rum / Undersida`. Länkar understrukna, underline-offset
`0.22em`. Hover → ink.

`SystemLink`: samma underline i löptext, bara om rummet finns.

### Hoppa till innehållet

Bara på `(site)`-layout: `sr-only` tills fokus, då
`border-line-strong bg-surface px-4 py-2 text-sm`.

---

## 7. Gemensamma produktkomponenter

Alla i `src/components/app/SignInGate.tsx` utom där annat står.

### SignInGate

Kant line, yta surface, `px-4 py-4`. H2 `text-lg font-semibold`.
Bröd `text-sm text-ink-soft`. Knapp `inline-flex bg-ink px-4 py-2
text-sm font-medium text-paper hover:bg-ink-soft` — text **Logga in**.

### EmptyState

`text-sm text-muted`. Ingen ram.

### Notice

`border border-line bg-accent-soft px-3 py-2 text-sm text-ink-soft`.
Inte en toast. Inte röd. Inte ikon.

### Field

Etikett `text-sm text-ink-soft`. Obligatoriskt får ` *`.
Input/textarea: `border border-line bg-paper`. Standard `px-3 py-2
text-sm`. `large`: `min-h-12 px-4 py-3 text-base`. Textarea 3 rader.
Typer: text, email, tel.

### CheckField

Checkbox + `text-sm text-ink-soft`, `items-start gap-2`.

### Submit

Ink-rektangel, `self-start`. `large`: full bredd, `min-h-12`.

### Kortmönster i rum

Klasser skriver ofta `rounded-xl` / `rounded-2xl`. Fasaden nollar dem.
Rita **rektanglar**. Kant line. Yta surface. Innehåll paper på rader
inuti (Ekonomi SalesDesk).

### Tabell (startsida `/`)

`border-collapse`, rader `border-b border-line`. Huvud `.pd-label`.
Kolumner: Rum · Läge · Jobb (Jobb dold under `sm`).

### SpecTable (sajt)

`dl` med hårstreck. Mobil: stacked. `sm`: etikett 12 rem + värde.
Etikett `.pd-label`, värde ink.

### StatusIndicator (sajt)

2×2 px kvadrat + `.pd-label` i statusfärgen. Text:
Operational / Development / Pilot (engelska, från publik katalog).

### PixelMark (oanvänd i chrome)

4×4 fält, 2×2 kärna fylld, en driven ruta nere till höger.
`currentColor` = ink. Storlek default 24, Header/Footer använde 22.
Inte pixel art. Inte en app-ikon med glow.

### PixelFlow

Tre block: från → PIXDRIFT (PixelMark 16 + accent-label) → till.
Pilar `→`, roterade 90° på mobil. Kanter `line-strong` / `accent/40`.

### PixelField (inte monterad)

34×16 rutnät, enhet 14 px. Två ink-block. Accent-connectors i gapet.
Faint grid i line.

---

## 8. Alla system — rum, jobb, skärmar

Sanning: `packages/systems/src/catalog.ts` + `src/lib/platform/family.ts`.
Publik katalog `src/lib/pixdrift/systems.ts` är **marknad**, saknar Kansli,
har engelska statusord. **Rita inte NORA/MOVA/SAGA.**

Status i listen: operational = Igång, pilot = På väg, deferred = Inte
klart än.

### 8.1 Identity — `/idp`

| | |
| --- | --- |
| Status | operational |
| Jobb | En inloggning till alla system |
| Fråga | Vem är du, och vilket bolag gäller det? |
| Gör | Logga in en gång. Cookie. OIDC. |
| Gör inte | Skickar inga fakturor. Ingen extra kod i mobilen. Ingen e-legitimation. |

**Skärm:** e-post + lösenord. Titel “Pixdrift-inloggning”. Fel `#9f1239`.
Hint-länk till `/upphandling`. Demo-hint bara när demo är seedad.
Se §2C för färger som ska slås ihop med fasaden.

Ingen produkt-rail på den här sidan. Det är en egen HTML-sida.

### 8.2 Kansli — `/kansli`

| | |
| --- | --- |
| Status | operational |
| Jobb | Startsidan. Uppgifter och vägen in |
| H1 | Kansli (`text-2xl`) |
| Ingress | Här börjar allt. Samma inloggning, egen uppgiftstavla. |

**Inloggad:**

1. Sessionskort: namn, e-post, org · roller · tier. Mono-rad:
   Postgres · Gateway · RITA. Länkar: Beredskap, Koncernupphandling.
2. Familjen: rutnät 2 kolumner, kort per rum (inte identity, inte kansli)
   + kortet Kartan → `/platform`.
3. Senaste händelser (om det finns).
4. TaskBoard: formulär (titel, ägare, accent-knapp **Lägg till** — spricka),
   lista med checkbox, genomstruken när klar, **Ta bort**. Tomt: streckad
   ram `p-8 text-center`. Markerad uppgift: `border-line-strong bg-accent-soft`.

**Utloggad:** SignInGate “Logga in med Pixdrift”.

**`/kansli/beredskap`** — checklista första kunden. Tillstånd: Klar /
Blockerad / Öppen. Alla i ink / ink-soft. Ingen färgkod utöver det.

**`/kansli/upphandling`** — husets inkorg. Bara hus-session. Verkstad som
öppnar ett hus-id får 404.

**`/kansli/upphandling/[id]`** — en anmälan.

### 8.3 Ekonomi — `/ekonomi`

| | |
| --- | --- |
| Status | pilot |
| Jobb | Fakturor, moms och hur pengarna kom in |
| H1 | Vad är bokat? (`text-3xl`) |

**Startsida:** SalesBoard (kurva) + SalesDesk (boka) + Notice om rails +
säljvarning (checkbox + telefon).

**SalesBoard**

- Tom: `0,00 kr`, text att kurvan fylls när faktura är utfärdad.
- Siffra `text-4xl tabular-nums`. Ändring: grön operational / brun
  development / muted.
- Toggler Sålt | Inbetalt: piller, aktiv `bg-ink text-paper`.
- Periodchips: piller, aktiv `bg-accent-soft text-accent`.
- Sparkline + dual range (`.ek-brush`): kvadratisk ram, thumbs 14×3.1 rem,
  accent-kant, `border-radius: 2px` på thumb (enda tillåtna radien i
  komponenten).

**SalesDesk**

- Sektion `border border-line bg-surface`.
- Formulär Nytt sälj på paper. Knapp **Boka sälj**.
- Fakturorader: status versaler muted, nummer + kund, belopp · förfaller,
  **Utfärda** eller outline **Öppna**.
- TYRA-offerter i kön, bokas till kundpris inkl. 25 % moms.

**Undersidor**

| Route | H1 |
| --- | --- |
| `/ekonomi/fakturor` | Fakturor |
| `/ekonomi/fakturor/[id]` | En faktura |
| `/ekonomi/kontoutdrag` | Kontoutdrag |
| `/ekonomi/anslutningar` | Anslutningar |
| `/ekonomi/anslutningar/revolut` | Revolut |
| `/ekonomi/rapporter` | Rapporter |
| `/ekonomi/verifikat` | Verifikat |

Samma chrome. Samma Field/Submit. Pengar med `formatSek` (svenska kronor).

### 8.4 TORA — `/tora`

| | |
| --- | --- |
| Status | pilot |
| Jobb | Vilka upphandlingar just ert bolag kan ta |
| H1 | TORA |

Notice: upphandlingarna är **exempel**, inte riktiga annonser.

**Delar:** CompanyBriefingCard (pd-label “Ert bolag”, fakta i 2 kolumner),
profilformulär, OpportunityCard-lista, publicera-marknad, snapshots.

**OpportunityCard:** verdict i `text-xs font-medium text-accent`, score
mono faint, titel länk, köpare ink-soft, varför muted, deadline/värde
mono faint, max 4 krav, “Nästa steg”.

**`/tora/[id]`** — en möjlighet.

**`/tora/calendar`** — kalender.

### 8.5 RITA — `/rita`

| | |
| --- | --- |
| Status | pilot |
| Jobb | Letar skattebesparingar i era böcker |
| H1 | RITA |

Notice: analys igång / utan AI / inte inkopplad. Aldrig påhittade resultat.
Exempelbokslut är inbyggt.

Formulär: org.nr (Luhn, `?fel=orgnr` → Notice). Lista analyser med
statusetikett. **`/rita/[id]`** — en analys.

### 8.6 BRITT — `/britt`

| | |
| --- | --- |
| Status | pilot |
| Jobb | Det som hänt och behöver följas upp |
| H1 | BRITT |

Filter: öppna / klara / alla / mina. Observationskort. Findings.
Demonstrationsanalys **bara på huset**. Verkstad ser inte exempelsiffror.

Inte ett ärendesystem. Inte en chatt.

### 8.7 IRMA — `/irma`

| | |
| --- | --- |
| Status | pilot |
| Jobb | Skicka ett avtal, se om det är läst och bekräftat |
| H1 | (lista + formulär) |

**Inloggad:** formulär nytt avtal. Filter all / waiting / signed / expired /
cancelled. Kort: status accent versaler, titel `text-lg font-medium`,
motpart ink-soft, tid muted. **`/irma/[id]`** — ett avtal + kopiera länk.

**Gäst `/irma/l/[token]`** — ingen fasad. GuestFrame.
Uppläsning är native `<audio controls>` mot egen API-väg, bara när tal är kopplat.

- pd-label “IRMA”
- Steg: Läs / Bekräfta / Klart. Streck `h-1.5 rounded-full` ink / line-strong
  (piller överlever — gästsidan har inte `.pd-facade`)
- Kvittens: cirkel 56 px ink med ✓, H2 Bekräftat, text att det inte är
  juridisk e-signatur
- Samma Field/Submit (ink-knapp)

### 8.8 TYRA — `/tyra`

| | |
| --- | --- |
| Status | pilot |
| Jobb | Kund, bil, hjul och vad som ska göras härnäst |
| H1 | Vilket fordon ska in? (`text-4xl`) |

**Startsida:** formulär kund / regnr / märke / modell / telefon + ärendelista
som TaskRow.

**`/tyra/cases/[id]`** — WorkCard (titel `text-3xl`, block “Nästa”),
StatusBanner, steg, inspektion, **Boka sälj** (bokar i Ekonomi från
ärendet), offerutkast sekundärt, kundhub-länk, påminnelse.

**TYRA-kit** (`src/components/tyra/*`):

| Del | Utseende |
| --- | --- |
| Button primary | ink på paper, `--tyra-radius` 0 |
| Button secondary | kant + surface |
| Button tertiary | genomskinlig |
| Button destructive | `bg-red-600 text-white` — spricka |
| Size | md `px-4 py-2 text-sm` · lg `px-5 py-3` · xl `px-6 py-4 text-lg` |
| Card | kant + surface, pad sm/md/lg = p-4/p-5/p-6 |
| StatusBadge | piller, 8 px prick: emerald / amber / red / zinc |
| StatusBanner | kant + 10 % färgad yta |
| WorkCard | “Arbetskort” xs muted, nästa-panel på `--tyra-panel` |
| TaskRow / FieldRow | samma kant, headline semibold |

**`/tyra/kunder`**, **`/tyra/integrations`** — samma chrome.

**Gäst `/tyra/hub/[token]`** — ingen fasad. `max-w-xl`. pd-label **Kundhub**
(inte ordet Tyra). Kundnamn som H1. Fordon som hjälptext. Neutral banner.
Inget konto. `robots: noindex`.

### 8.9 ALVA — `/alva`

| | |
| --- | --- |
| Status | deferred |
| Jobb | Kundens fel, anteckningar och mätvärden. Diagnosen kommer senare |
| H1 | ALVA |

Notice: diagnosen är inte inkopplad. Systemet hittar aldrig på något.
Status: schema-tecken plus ord (`□` öppet, `○` pågår, `✓` stängt).

Formulär Nytt fall. Lista: status accent versaler, klagomål som länk,
fordonsref mono faint, tid faint.

**`/alva/[id]`** — ett fall.

### 8.10 CREDITAE — `/creditae`

| | |
| --- | --- |
| Status | pilot |
| Jobb | Kreditbedömning av motpart. Er slutsats, inget påhittat betyg |
| H1 | CREDITAE |

Notice: Kredit på/av. Systemet hittar aldrig på ett betyg. Byråns fält är inte
er slutsats.

Formulär Ny förfrågan. Lista: slutsats eller status accent versaler, namn
eller orgnr som länk, orgnr mono faint, tid faint.

**`/creditae/[id]`** — en förfrågan.

### 8.11 Tjänsterum (inte produkter)

| Route | H1 / jobb |
| --- | --- |
| `/` | Systemet — tabell över rum. “Inget visningslager ovanpå — det här är ytan.” |
| `/platform` | Vad varje system gör. Princip + Notice + stack + länkar + blockerat |
| `/platform/drift` | Sambandscentral: notiser, reskontra, ärenden, 24h-kurva, SMS-rutter. Tabeller under |
| `/platform/events` | Händelselista |
| `/platform/mcp` | MCP-yta i fasaden |
| `/upphandling` | Underlag för demo och uppföljningsmöte. Två kolumner. Formulär POST |
| `/upphandling/bekraftelse` | Mötet är lagt. Möteskort. Lösenord bara efter submit-kaka |

### 8.12 Marknadsidor (engelska, i fasaden)

| Route | Eyebrow / titel |
| --- | --- |
| `/systems` | System / Vad varje system gör. Kort-grid `gap-px bg-line` |
| `/systems/[slug]` | System NN / namn. SpecTable + sektioner 01–10. Forthcoming = pd-label |
| `/how-it-works` | How it works + PixelFlow + steg 01–06 |
| `/applications` | Applications / Where the in-between matters. Fem sektorer |
| `/documentation` | Documentation is part of the product. MCP-box + area-lista |
| `/documentation/mcp` + undersidor | McpDocNav: Overview, Capability Graph, Authentication, Connecting a client, Tools, Systems, Errors. Aktiv = `font-medium text-ink`, resten underline |
| `/documentation/capabilities` | Capability Graph |
| `/why` | Philosophy / Why PIXDRIFT exists. `text-lg leading-relaxed` |
| `/company` | Company / PIXDRIFT is developed by Landvex. SpecTable + character-par |

Publik katalog-sluggar (marknad, **saknar kansli**): identity, alva, rita,
tora, irma, britt, tyra, ekonomi, creditae.

---

## 9. Skärminventering (50 `page.tsx`)

Rita minst startsidan för varje rad. Gästsidor utan rail.

**Produkt / tjänst**

- `/` `/kansli` `/kansli/beredskap` `/kansli/upphandling` `/kansli/upphandling/[id]`
- `/ekonomi` `/ekonomi/fakturor` `/ekonomi/fakturor/[id]` `/ekonomi/kontoutdrag`
  `/ekonomi/anslutningar` `/ekonomi/anslutningar/revolut` `/ekonomi/rapporter`
  `/ekonomi/verifikat`
- `/tora` `/tora/[id]` `/tora/calendar`
- `/rita` `/rita/[id]`
- `/britt`
- `/irma` `/irma/[id]` `/irma/l/[token]` *(gäst)*
- `/tyra` `/tyra/cases/[id]` `/tyra/kunder` `/tyra/integrations`
  `/tyra/hub/[token]` *(gäst)*
- `/alva` `/alva/[id]`
- `/creditae` `/creditae/[id]`
- `/upphandling` `/upphandling/bekraftelse`
- `/platform` `/platform/events` `/platform/mcp`

**Marknad (samma fasad)**

- `/systems` `/systems/[slug]`
- `/how-it-works` `/applications` `/why` `/company`
- `/documentation` `/documentation/capabilities`
- `/documentation/mcp` `/documentation/mcp/authentication`
  `/documentation/mcp/tools` `/documentation/mcp/clients`
  `/documentation/mcp/systems` `/documentation/mcp/errors`

**Utanför fasaden**

- `/idp` — Identity-login (inline HTML)

---

## 10. Märke, tomt, fel, gäst

### Märke

- Produktchrome: texten `PIXDRIFT`, spårning 0.18em, ingen ikon.
- IdP: blå 36 px-ruta med **P**.
- Oanvänd: PixelMark (pixel + drift).
- Välj **ett** i Claude Design. Rekommendation: text-wordmark i chrome,
  PixelMark bara om du medvetet tar tillbaka den överallt.

### Tomt läge

`EmptyState` eller en mening `text-sm text-muted`. Streckad ram bara på
Kansli-tavlan. Ekonomi-kurva har eget tomt kort med 0,00 kr.

### Fel

- Notice (accent-soft) för affärsfel: fel org.nr, motor av, saknad kaka.
- IdP: röd text `#9f1239` under fält.
- 404: Next default / `notFound()` — ingen egen illustrationsida.
- Inga toast. Inga modaler. Inga skelett-loaders utöver “Laddar…” på tavlan.

### Gäst vs inloggad

| | Inloggad | Gäst |
| --- | --- | --- |
| Chrome | Facade rail + toppfält | Ingen rail |
| Bredd | `max-w-5xl` | IRMA `max-w-lg`, TYRA `max-w-xl` |
| Tokens | samma paper/ink | samma |
| Knapp | ink | ink (IRMA Submit) |
| Index | ja | `noindex` på token-sidor |

Anmälan `/upphandling` **har** fasad (även utloggad). Det är “Ny kund” i
listen, inte en gästhub.

---

## 11. Det du inte får rita

- NORA, MOVA, SAGA, eller andra namn som inte finns i katalogen.
- E-legitimation-varumärken. QR-login. Bank-app-flöde.
- Kvalificerad e-signatur, penn-signatur, certifikat-UI.
- Visma/Fortnox som inkopplade. Stripe Checkout. Swish Handel.
- Andra betalningar än det som står: faktura 10 dagar, Swish/Stripe som
  väg, Revolut som bankhämtning.
- Andra databaser, andra tenants, sandbox-bolag i UI.
- Chat-bubblor, AI-avatarer, glow, gradient, glass, drop-shadow i rummen.
- Mörkt tema.
- Ikon-rail, hamburger-animation, floating action button.
- En andra DevPortal. En andra design-paket-yta innan den här filen är låst.
- Engelska knappar i produktum (“Sign in”, “Submit”) — chrome är Logga in /
  Logga ut / Boka sälj / Utfärda / Registrera fall.

---

## 12. Claude Design — instruktion att klistra in

> Du ritar PIXDRIFT. En gemensam design för alla rum i filen
> `DESIGN-SOURCE.md`.
>
> Lås mot **produktfasaden**: ljust paper `#fbfbf9`, yta `#ffffff`, ink
> `#101317`, en accent `#1f4b8f`, hårstreck `#e6e5e0`. Geist + Geist Mono.
> Stela rektanglar. Ingen skugga. Primär knapp är svart, inte blå.
> Sidospår 208 px, toppfält 36 px, innehåll max 64 rem.
>
> Ett rum per jobb. Samma chrome. Svenska korta meningar.
>
> System som ska ritas: Identity (login), Kansli, Ekonomi, TORA, RITA,
> BRITT, IRMA (inloggad + gäst), TYRA (verkstad + kundhub), ALVA,
> Plattform, Händelser, Ny kund / bekräftelse, Dokumentation.
>
> Slå ihop IdP med fasaden. Slå ihop Kansli-knappen med ink-Submit.
> Bestäm om piller (`rounded-full`) får finnas. Bestäm om rött får finnas.
> Hitta inte på NORA/MOVA/SAGA. Hitta inte på e-legitimation eller Visma.
>
> Leverera: tokens, chrome, knappar/fält/notice, ett skärmset per rum,
> gästram, tomt/fel. Sedan är den filen krav för allt som tillkommer.

---

## 13. Kodkarta (så implementationen kan låsas)

| Vad | Var |
| --- | --- |
| Tokens | `src/app/globals.css` |
| Fasad | `src/components/app/Facade.tsx` |
| Listen | `src/lib/platform/facade.ts` |
| Produkter | `packages/systems/src/catalog.ts` |
| Familjetext | `src/lib/platform/family.ts` |
| Fält/knapp/notice | `src/components/app/SignInGate.tsx` |
| Smulor | `src/components/app/ProductCrumb.tsx` |
| Skal | `src/components/app/AppShell.tsx` |
| IdP HTML | `packages/identity/src/server.ts` |
| IRMA gäst | `src/app/irma/guest-chrome.tsx` |
| TYRA kit | `src/components/tyra/*` |
| Ekonomi kurva | `src/components/ekonomi/SalesBoard.tsx` |
| Ekonomi disk | `src/components/ekonomi/SalesDesk.tsx` |
| Sajt-delar | `src/components/site/*` (Header/Footer omonterade) |
| Brand | `src/lib/pixdrift/brand.ts` |
| Publik katalog | `src/lib/pixdrift/systems.ts` (inte produktlistan) |
| Lucka DESIGN | `docs/PLATFORM-1.0-GAP.md` — PARTIAL |

Låst paket: `docs/design/`. DESIGN-cellen i gap-matrisen är PARTIAL tills
grafer, figurer och resterande H1 följer paketet.
