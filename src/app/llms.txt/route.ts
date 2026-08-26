export function GET() {
  const body = `# PIXDRIFT

Ett system. Ett rum per jobb. Samma inloggning.

## Rum
- Kansli — start och uppgifter
- Ekonomi — boka sälj i kronor, faktura, moms. Inte Visma. Inte Fortnox.
- TORA — vilka upphandlingar ni kan ta
- RITA — skatteförslag, inte skatteråd
- BRITT — det som hänt och ska följas upp
- IRMA — avtalslänk, enkel bekräftelse
- TYRA — kund, bil, hjul. Däck bokas i Ekonomi.
- ALVA — intag. Ingen diagnos.

## Maskiner
- POST /mcp — agentgränssnitt, samma tjänster som REST
- GET /api/platform/health
- GET /api/platform/ops
- GET /api/platform/capabilities
- /platform/drift
- /documentation
- /documentation/mcp
- /documentation/capabilities

## Inte här
NORA, MOVA, SAGA, Stripe Checkout, Swish Handel, Visma, Fortnox, ChatGPT Apps.
`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
