export function GET() {
  const body = `# PIXDRIFT

One system. One room per job. The same sign-in.

## Rooms
- Kansli — start and tasks
- Ekonomi — book sales in kronor, invoice, VAT. Not Visma. Not Fortnox.
- TORA — which procurements you can take
- RITA — tax proposals, not tax advice
- BRITT — what happened and what to follow up
- IRMA — agreement link, simple confirmation
- TYRA — customer, car, wheels. Tires book into Ekonomi.
- ALVA — intake. No diagnosis.

## Machines
- POST /mcp — agent interface, the same services as REST
- GET /api/platform/health
- GET /api/platform/ops
- GET /api/platform/capabilities
- GET /api/platform/openapi
- /platform/drift
- /documentation
- /documentation/mcp
- /documentation/capabilities
- /documentation/rest

## Not here
NORA, MOVA, SAGA, Stripe Checkout, Swish Handel, Visma, Fortnox, ChatGPT Apps.
`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
