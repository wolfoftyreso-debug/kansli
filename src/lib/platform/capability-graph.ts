/**
 * PIXDRIFT Capability Graph — seed.
 *
 * Derived from the MCP registry. Not a second handwritten catalog.
 * A capability that is not registered as an MCP tool is not in this graph.
 * REST-only routes that should become capabilities later are listed in
 * docs/PLATFORM-1.0-GAP.md §4, not copied here.
 */

import { SYSTEM_MODULES, type SystemId } from "@pixdrift/systems";
import { buildPixdriftRegistry } from "@/lib/mcp/tools";
import { systems as marketing } from "@/lib/pixdrift/systems";

export type CapabilityProduct = SystemId | "platform";

export interface CapabilityInterfaces {
  rest: { method: string; path: string } | null;
  mcp: string | null;
  sdk: null;
  webhook: null;
  event: string | null;
  chatgpt: false;
}

export interface CapabilityNode {
  product: CapabilityProduct;
  domain: string;
  id: string;
  title: string;
  interfaces: CapabilityInterfaces;
  permissions: string[];
  risk: number;
  documentation: { slug: string };
  observability: { slo: null; requestId: true };
  seo: { intents: string[] };
  owner: CapabilityProduct;
  version: string;
}

export interface CapabilityGraph {
  version: "1.0-seed";
  source: "mcp-registry";
  generatedFrom: "src/lib/mcp/tools.ts";
  products: readonly CapabilityProduct[];
  capabilities: CapabilityNode[];
}

/** Domain events published by the *service* the tool already calls. */
const DOMAIN_EVENTS: Record<string, string> = {
  create_office_task: "kansli.task.created",
  toggle_office_task: "kansli.task.updated",
  delete_office_task: "kansli.task.updated",
  persist_procurement_snapshot: "tora.market.evaluated",
  request_tax_analysis: "rita.analysis.requested",
  create_agreement: "irma.agreement.created",
  revoke_agreement: "irma.agreement.cancelled",
  create_vehicle_case: "tyra.case.created",
  register_diagnostic_case: "alva.case.created",
  register_credit_inquiry: "creditae.inquiry.created",
  run_search_analysis: "maj.action.proposed",
  decide_search_action: "maj.action.decided",
  run_operational_analysis: "britt.finding.recorded",
};

/** Conservative intents from existing public product copy. Not a keyword farm. */
const PRODUCT_INTENTS: Partial<Record<CapabilityProduct, string[]>> = {
  identity: ["single sign-on", "identity provider", "inloggning"],
  ekonomi: ["fakturering", "moms", "invoicing"],
  tora: ["offentlig upphandling", "public procurement eligibility"],
  rita: ["skatteanalys", "tax analysis"],
  britt: ["uppföljning", "operational follow-up"],
  irma: ["avtalshantering", "agreement acknowledgement"],
  tyra: ["däckhotell", "tyre hotel"],
  alva: ["diagnosärende", "vehicle diagnostic case registration"],
  creditae: ["kreditbedömning", "counterpart credit assessment"],
  maj: ["search visibility", "search intelligence"],
};

const MARKETED = new Set(marketing.map((item) => item.slug));

function documentationSlug(product: CapabilityProduct, toolName: string): string {
  if (product !== "platform" && MARKETED.has(product)) {
    return `/systems/${product}`;
  }
  return `/documentation/mcp/tools#${toolName}`;
}

export function buildCapabilityGraph(): CapabilityGraph {
  const tools = buildPixdriftRegistry().listTools();
  const capabilities = tools.map((tool) => {
    const product = (tool.system === "platform" ? "kansli" : tool.system) as CapabilityProduct;
    return {
      product,
      domain: tool.domain,
      id: tool.name,
      title: tool.title,
      interfaces: {
        rest: tool.rest ?? null,
        mcp: tool.name,
        sdk: null,
        webhook: null,
        event: DOMAIN_EVENTS[tool.name] ?? null,
        chatgpt: false as const,
      },
      permissions: tool.permission ? [tool.permission] : [],
      risk: tool.risk,
      documentation: { slug: documentationSlug(product, tool.name) },
      observability: { slo: null, requestId: true as const },
      seo: { intents: PRODUCT_INTENTS[product] ?? [] },
      owner: product,
      version: tool.version,
    };
  });

  return {
    version: "1.0-seed",
    source: "mcp-registry",
    generatedFrom: "src/lib/mcp/tools.ts",
    products: SYSTEM_MODULES.map((module) => module.id),
    capabilities,
  };
}

export function capabilitiesForProduct(product: CapabilityProduct): CapabilityNode[] {
  return buildCapabilityGraph().capabilities.filter((item) => item.product === product);
}
