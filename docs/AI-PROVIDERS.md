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

Ett gemensamt namnschema betyder att en modul får sina nycklar utan att uppfinna
egna variabelnamn.

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
import { createModelRouter, providersFromEnv } from "@pixdrift/ai-core";

const ai = createModelRouter({ providers: providersFromEnv() }); // läser env-nycklarna ovan
const answer = await ai.complete({
  model: "anthropic:claude-3-5-sonnet-latest", // provider-prefix väljer/failar över
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

Byte av provider/modell blir en parameter, inte en kodändring. En `fakeProvider`
finns för test/dev utan nätverk.

## Rekommenderat: en gemensam AI-Gateway

I stället för att spreta tre providernycklar över varje produkt kan familjen
routa via **en AI-Gateway** (t.ex. Vercel AI Gateway): en nyckel
(`AI_GATEWAY_API_KEY`), enhetligt API, provider-failover och kostnads-/
användningsspårning på ett ställe. Det matchar "gemensam infrastruktur under
produkterna" och låter enskilda produkter byta modell utan kodändring. De
per-provider-nycklar som definieras ovan fungerar oavsett; gatewayen är en
konvergenspunkt när ni vill ha den.
