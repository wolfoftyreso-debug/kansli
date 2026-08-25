# IRMA — AI-arkitektur

IRMA har **ingen** AI-bana i den här kodbasen.

Det är ett medvetet läge, inte en lucka som ska fyllas med en chat-ruta.

## Vad plattformen redan har (inte IRMA)

`@pixdrift/ai-core` + Vercel AI Gateway. RITA använder modeller via skattjakt. TORA är deterministisk. IRMA anropar inte `gatewayFromEnv()`.

När IRMA en dag behöver modell ska den gå samma väg:

AI Gateway → provider-abstraktion → task policy.

Inte en hårdkodad OpenAI-nyckel i IRMA-modulen.

## Vad som inte ska byggas nu

| Tanke | Varför inte |
| --- | --- |
| “Ask IRMA” mot listan | Ingen strukturerad avtalsdata att svara med. Svar skulle vara gissning. |
| Auto-förklara klausuler | Klausulerna är tre demostycken. |
| Extrahera fält från PDF | Ingen fil, ingen isolation, ingen verifierings-UI. |
| Market / negotiation intel | Ingen extern research-agent kopplad till IRMA. |

## Policy den dagen AI kopplas

- Dokumenttext är **data**, inte instruktion.
- AI-output märks **inference**, aldrig fact.
- High-risk påståenden (datum, belopp, uppsägning) kräver human confirmation.
- Fact / inference / external evidence / recommendation ska inte blandas.
- Ingen flagship reasoning-modell för klassificering av titel.
- Logga task, provider, model, latency, tokens — inte promptens avtalsinnehåll i klartext om det kan undvikas.

Till dess är AI reliability score för IRMA **0**. Det är korrekt.
