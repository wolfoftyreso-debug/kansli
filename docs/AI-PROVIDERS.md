# AI-providers (reasoning-/intelligence-lagret)

Gemini, OpenAI (ChatGPT) och Anthropic (Claude) konsumeras av produkternas
reasoning-lager (ALVA:s ai-orkester, BRITT, RITA, m.fl.) — **inte** av navet
eller IdP:n. Detta dokument fastställer hur nycklarna hanteras gemensamt.

## Kanoniska hemlighetsnamn (samma i hela familjen)

| Provider | Env-variabel | Konsumenter idag |
| --- | --- | --- |
| Anthropic (Claude) | `ANTHROPIC_API_KEY` | ALVA (ai-orkester), BRITT, RITA |
| OpenAI (ChatGPT) | `OPENAI_API_KEY` | (ny reasoning-kod) |
| Google (Gemini) | `GEMINI_API_KEY` | ALVA (ai-orkester) |
| Moonshot (Kimi) | `MOONSHOT_API_KEY` (+ valfri `MOONSHOT_BASE_URL`) | via AI Core (provider `kimi`, OpenAI-kompatibel) |

Ett gemensamt namnschema betyder att en modul får sina nycklar utan att uppfinna
egna variabelnamn.

## Tyngsta modellen per provider (falldown, Claude först)

Varje provider kör sin **tyngsta/mest kapabla modell** som standard (aktuellt
2026-08-22). Kedjan failar över **Claude först**, sedan ner till de övriga:

| Ordning | Provider | Tyngsta modell (default) | Override |
| --- | --- | --- | --- |
| 1 | Anthropic (Claude) | `claude-fable-5` | `ANTHROPIC_MODEL` |
| 2 | OpenAI | `gpt-5.6-sol` | `OPENAI_MODEL` |
| 3 | Google (Gemini) | `gemini-3.1-pro-preview` | `GEMINI_MODEL` |
| 4 | Moonshot (Kimi) | `kimi-k3` | `MOONSHOT_MODEL` / `KIMI_MODEL` |
| 5 | AI-Gateway | `anthropic/claude-fable-5` | `AI_GATEWAY_MODEL` |

Falldown-ordningen är `DEFAULT_FAILOVER_ORDER`. Endast providers med satt nyckel
byggs — kedjan består alltså av dem du konfigurerat, i ordningen ovan. Modell-
id:n är env-överstyrbara så drift kan pinna/höja utan kodändring. Orkestrering
(välja modell per uppgift) läggs ovanpå detta senare — basen är: tyngsta modell,
Claude först, resten som fallback.

## Hantering — nyckeln är en hemlighet

Konstitutionen art. 8 + "kundens data är kronjuveler":

- **Aldrig i git, Terraform-variabler, loggar eller image-lager.** Bara i en
  managed secrets store, refererad av konfiguration.
- **Cloud Agent:** lägg värdena i **Secrets-panelen** (persisterar mellan körningar,
  injiceras som env-variabler).
- **Drift (per produkt):** lägg dem i respektive tjänsts miljö (t.ex. Vercel/ECS
  env eller AWS Secrets Manager). Rotera regelbundet.
- `.env.example` innehåller endast **namn**, aldrig värden.

## Guardrails (art. 9 + 10)

- **AI är aldrig source of truth:** `Fact ≠ Inference ≠ Recommendation ≠ Action`.
  Modellutdata får aldrig skriva ett faktum, belopp eller status utan
  deterministisk kontroll (RITA: "modellen föreslår, regelmotorn avgör, koden
  räknar"; ALVA: evidenspaket; TORA: `RÄTTIGHET` kräver `LegalBasis`).
- **Automation har uttrycklig nivå (L0–L4).** Ett AI-anrop höjer inte
  automationsnivån; L3/L4 kräver behörighet/godkännande.

## Gemensam åtkomst via `@pixdrift/ai-core`

Produkter anropar inte providers direkt — de går via **AI Core**, ett enhetligt
modell-API med failover och provenance:

```ts
import { createDefaultRouter } from "@pixdrift/ai-core";

// Alla konfigurerade providers på sin tyngsta modell, Claude först, falldown
// till de övriga. Utelämna `model` (eller skicka "auto"/"flagship") för att
// köra varje providers flaggskepp när kedjan failar över.
const ai = createDefaultRouter(); // läser env-nycklarna ovan
const answer = await ai.complete({
  purpose: "rita.finding.summary",
  promptVersion: "2026-08-22",
  messages: [
    { role: "system", content: "Sammanfatta ett fynd. Aldrig ett belopp från modellen." },
    { role: "user", content: evidencePacket },
  ],
});
// answer.kind === "inference" — behandla aldrig som fakta. answer bär provider,
// model, promptVersion, usage och latency för audit.
```

Vill du styra en enskild modell: `model: "openai:o-custom"` (provider-prefix
väljer/pinns utan failover), eller sätt `*_MODEL`-env. En `fakeProvider` finns
för test/dev utan nätverk.

## Rekommenderat: en gemensam AI-Gateway

I stället för att spreta tre providernycklar över varje produkt kan familjen
routa via **Vercel AI Gateway**: en credential, enhetligt API över **100+
modeller**, provider-failover och kostnads-/användningsspårning på ett ställe.
Det matchar "gemensam infrastruktur under produkterna" och låter enskilda
produkter byta modell utan kodändring. Per-provider-nycklarna ovan fungerar
oavsett; gatewayen är en konvergenspunkt när ni vill ha den.

### Lägg in token (Cloud Agent)

Lägg **en** av dessa i **Secrets-panelen** (persisterar mellan körningar,
injiceras som env):

- `AI_GATEWAY_API_KEY` — statisk gateway-nyckel (enklast för Cloud Agent/CI), **eller**
- `VERCEL_OIDC_TOKEN` — OIDC-token från `vercel env pull` (kortlivad, auto-förnyas på Vercel).

AI Core löser auth i den ordningen (nyckel först, sedan OIDC), precis som
gatewayen själv. Valfritt:

- `AI_GATEWAY_BASE_URL` (default `https://ai-gateway.vercel.sh/v1`)
- `AI_GATEWAY_MODEL` — pinna en specifik `provider/model`-slug (t.ex. `openai/gpt-5.4`).

### Modell-slugs och katalog

Gateway-modeller anges som `provider/model` med **punkt** för version
(`anthropic/claude-opus-4.6`, `openai/gpt-5.4`) — aldrig bindestreck i
versionsnumret. Katalogen ändras ofta; hårdkoda inte en slug utan lista den
faktiska katalogen först:

```bash
pnpm --filter @pixdrift/ai-core models   # kräver token; skriver ut alla slugs
```

Programmatiskt: `gatewayFromEnv().listModels()` eller `provider.listModels()`.
Gatewayen ligger sist i `DEFAULT_FAILOVER_ORDER` (Claude-först direkt-providers
prioriteras); vill du göra gatewayen primär, sätt bara gateway-credentialen och
utelämna direkt-nycklarna, eller ange egen `order`.
