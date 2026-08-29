import { SYSTEM_MODULES, type SystemId } from "@pixdrift/systems";
import { MCP_DOC_LINKS } from "@/lib/mcp/catalog";

/** Leftover English room notes. Catalog rooms without a note are listed by name. */
export const LLMS_ROOM_NOTES: Partial<Record<SystemId, string>> = {
  kansli: "start and tasks",
  ekonomi: "book sales in kronor, invoice, VAT. Not Visma. Not Fortnox.",
  tora: "which procurements you can take",
  rita: "tax proposals, not tax advice",
  britt: "what happened and what to follow up",
  irma: "agreement link, simple confirmation",
  tyra: "customer, car, wheels. Tires book into Ekonomi.",
  alva: "intake. No diagnosis.",
};

/** Leftover platform machine lines. Documentation paths come from MCP_DOC_LINKS. */
export const LLMS_PLATFORM_MACHINES = [
  "POST /mcp — agent interface, the same services as REST",
  "GET /api/platform/health",
  "GET /api/platform/ops",
  "GET /api/platform/capabilities",
  "GET /api/platform/openapi",
  "/platform/drift",
  "/documentation",
] as const;

export const LLMS_NOT_HERE =
  "NORA, MOVA, SAGA, Stripe Checkout, Swish Handel, Visma, Fortnox, ChatGPT Apps.";

function machineKey(line: string): string {
  return line.split(" — ")[0] ?? line;
}

export function llmsTxtBody(): string {
  const rooms = SYSTEM_MODULES.map((system) => {
    const note = LLMS_ROOM_NOTES[system.id];
    return note ? `- ${system.name} — ${note}` : `- ${system.name}`;
  }).join("\n");

  const seen = new Set(LLMS_PLATFORM_MACHINES.map(machineKey));
  const machines = [
    ...LLMS_PLATFORM_MACHINES.map((line) => `- ${line}`),
    ...MCP_DOC_LINKS.filter((item) => !seen.has(item.href)).map((item) => `- ${item.href}`),
  ].join("\n");

  return `# PIXDRIFT

One system. One room per job. The same sign-in.

## Rooms
${rooms}

## Machines
${machines}

## Not here
${LLMS_NOT_HERE}
`;
}

export function GET() {
  return new Response(llmsTxtBody(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
