import { requireOrg, type Actor } from "@pixdrift/api-core";
import { SYSTEM_MODULES } from "@pixdrift/systems";
import { ToolRegistry, type McpRuntime, type ToolDefinition, page } from "@pixdrift/mcp-core";
import { addTask, listTasks } from "@/lib/kansli/tasks";
import { listInvoices } from "@/lib/ekonomi/invoices";
import { evaluateMarket, persistSnapshot } from "@/lib/tora/persist";
import { resolveCompany } from "@/lib/tora/profile";
import { listAnalyses, requestAnalysis } from "@/lib/rita/analyses";
import { listObservations } from "@/lib/britt/observations";
import { createAgreement } from "@/lib/irma/agreements";
import { createCase as createTyraCase, parseIntent, parseOperations } from "@/lib/tyra/cases";
import { createCase as createAlvaCase } from "@/lib/alva/cases";
import { createInquiry as createCreditaeInquiry } from "@/lib/creditae/inquiries";
import { majIsOpen } from "@/lib/maj/access";
import { listActions, runAnalysis } from "@/lib/maj/engine";
import { getProject, listProjects } from "@/lib/maj/projects";
import { decideAction } from "@/lib/maj/releases";
import { needStore } from "./runtime";

function orgOf(ctx: McpRuntime): Actor & { orgRef: string } {
  return requireOrg(ctx.actor);
}

function readFlags(readOnly: boolean) {
  return {
    readOnly,
    destructive: false,
    financial: false,
    pii: !readOnly,
    customerCommunication: false,
    adminOnly: false,
  };
}

function base(
  def: Omit<ToolDefinition, "timeoutMs" | "version" | "deprecated" | "examples" | "flags"> &
    Partial<Pick<ToolDefinition, "timeoutMs" | "version" | "deprecated" | "examples" | "flags">>,
): ToolDefinition {
  return {
    timeoutMs: 15_000,
    version: "1.0.0",
    deprecated: false,
    examples: [{}],
    flags: readFlags(def.sideEffects === "none"),
    ...def,
  };
}

export function buildPixdriftRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  registry.registerTool(
    base({
      name: "get_who_am_i",
      title: "Who am I",
      description:
        "Returns the authenticated principal and active organisation from the token or session.",
      system: "identity",
      domain: "identity",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      outputSchema: { type: "object" },
      permission: null,
      tenantScope: "none",
      sideEffects: "none",
      risk: 1,
      approvalRequired: false,
      idempotent: true,
      rateClass: "read",
      whenToUse: "You need to know which person and company the current credentials belong to.",
      whenNotToUse: "You need data from another system.",
      rest: { method: "GET", path: "/api/platform/me" },
      handler: async (ctx) => {
        const actor = ctx.actor;
        if (!actor) return { authenticated: false };
        return {
          authenticated: true,
          sub: actor.sub,
          email: actor.email || null,
          name: actor.name,
          orgRef: actor.orgRef,
          orgName: actor.orgName,
          tier: actor.tier,
          permissions: actor.permissions,
        };
      },
    }),
  );

  registry.registerTool(
    base({
      name: "list_platform_systems",
      title: "List systems",
      description:
        "Lists the Pixdrift systems that exist in this repository. Does not invent missing products.",
      system: "kansli",
      domain: "platform",
      inputSchema: {
        type: "object",
        properties: { limit: { type: "integer" }, cursor: { type: "string" } },
        additionalProperties: false,
      },
      outputSchema: { type: "object" },
      permission: null,
      tenantScope: "none",
      sideEffects: "none",
      risk: 1,
      approvalRequired: false,
      idempotent: true,
      rateClass: "read",
      whenToUse: "You need the live system catalog.",
      whenNotToUse: "You need operational data inside a product.",
      rest: { method: "GET", path: "/api/platform/systems" },
      handler: async (_ctx, input) => {
        const rows = SYSTEM_MODULES.map((item) => ({
          id: item.id,
          name: item.name,
          purpose: item.purpose,
          status: item.status,
          basePath: item.basePath,
          apiBase: item.apiBase,
        }));
        return page(rows, input);
      },
    }),
  );

  registry.registerTool(
    base({
      name: "list_office_tasks",
      title: "List office tasks",
      description: "Lists Kansli tasks for the authenticated organisation.",
      system: "kansli",
      domain: "office",
      inputSchema: {
        type: "object",
        properties: { limit: { type: "integer" }, cursor: { type: "string" } },
        additionalProperties: false,
      },
      outputSchema: { type: "object" },
      permission: null,
      tenantScope: "org",
      sideEffects: "none",
      risk: 1,
      approvalRequired: false,
      idempotent: true,
      rateClass: "read",
      whenToUse: "You need the current office task list.",
      whenNotToUse: "You want to create a task — use create_office_task.",
      rest: { method: "GET", path: "/api/kansli/tasks" },
      handler: async (ctx, input) => {
        const actor = orgOf(ctx);
        const { pool } = needStore(ctx);
        const tasks = await listTasks(pool, actor.orgRef);
        return page(
          tasks.map((item) => ({
            id: item.id,
            title: item.title,
            owner: item.owner,
            done: item.done,
            createdAt: item.createdAt,
          })),
          input,
        );
      },
    }),
  );

  registry.registerTool(
    base({
      name: "create_office_task",
      title: "Create office task",
      description:
        "Creates a Kansli task for the authenticated organisation. Uses the same addTask service as POST /api/kansli/tasks.",
      system: "kansli",
      domain: "office",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          owner: { type: "string" },
          idempotency_key: { type: "string" },
        },
        required: ["title"],
        additionalProperties: false,
      },
      outputSchema: { type: "object" },
      permission: "task:write",
      tenantScope: "org",
      sideEffects: "write",
      risk: 2,
      approvalRequired: false,
      idempotent: true,
      rateClass: "write",
      whenToUse: "A real office task should be stored.",
      whenNotToUse: "You only want to read existing tasks.",
      rest: { method: "POST", path: "/api/kansli/tasks" },
      flags: readFlags(false),
      handler: async (ctx, input) => {
        const actor = orgOf(ctx);
        const { pool, events } = needStore(ctx);
        const title = String(input.title);
        const task = await addTask(pool, {
          orgRef: actor.orgRef,
          title,
          owner: String(input.owner ?? "").trim() || actor.name,
          createdBy: actor.sub,
        });
        await events.publish({
          system: "kansli",
          kind: "kansli.task.created",
          orgRef: actor.orgRef,
          actorKind: "integration",
          actorRef: actor.sub,
          subjectRef: `kansli:task:${task.id}`,
          requestId: ctx.requestId,
          payload: { title: task.title, via: "mcp" },
        });
        return { id: task.id, title: task.title, owner: task.owner, done: task.done };
      },
    }),
  );

  registry.registerTool(
    base({
      name: "list_family_events",
      title: "List family events",
      description: "Lists recent append-only platform events for the authenticated organisation.",
      system: "kansli",
      domain: "platform",
      inputSchema: {
        type: "object",
        properties: { limit: { type: "integer" }, cursor: { type: "string" } },
        additionalProperties: false,
      },
      outputSchema: { type: "object" },
      permission: null,
      tenantScope: "org",
      sideEffects: "none",
      risk: 1,
      approvalRequired: false,
      idempotent: true,
      rateClass: "read",
      whenToUse: "You need an audit trail of what already happened.",
      whenNotToUse: "You need to change data.",
      rest: { method: "GET", path: "/api/platform/events" },
      handler: async (ctx, input) => {
        const actor = orgOf(ctx);
        const { events } = needStore(ctx);
        const rows = await events.list({ orgRef: actor.orgRef, limit: 50, order: "desc" });
        return page(
          rows.map((item) => ({
            id: item.id,
            kind: item.kind,
            system: item.system,
            occurredAt: item.occurredAt,
            subjectRef: item.subjectRef,
            requestId: item.requestId,
          })),
          input,
        );
      },
    }),
  );

  registry.registerTool(
    base({
      name: "list_ledger_invoices",
      title: "List invoices",
      description:
        "Lists invoices for the authenticated organisation. Returns identity fields only, not journal lines.",
      system: "ekonomi",
      domain: "ledger",
      inputSchema: {
        type: "object",
        properties: { limit: { type: "integer" }, cursor: { type: "string" } },
        additionalProperties: false,
      },
      outputSchema: { type: "object" },
      permission: null,
      tenantScope: "org",
      sideEffects: "none",
      risk: 1,
      approvalRequired: false,
      idempotent: true,
      rateClass: "read",
      whenToUse: "You need open or booked invoices.",
      whenNotToUse: "You need to issue or pay an invoice.",
      rest: { method: "GET", path: "/api/ekonomi/invoices" },
      flags: { ...readFlags(true), pii: true },
      handler: async (ctx, input) => {
        const actor = orgOf(ctx);
        const { pool } = needStore(ctx);
        const invoices = await listInvoices(pool, actor.orgRef);
        return page(
          invoices.map((item) => ({
            id: item.id,
            number: item.number,
            status: item.status,
            customerName: item.customerName,
            currency: item.currency,
            grossOre: item.grossOre,
            dueAt: item.dueAt,
          })),
          input,
        );
      },
    }),
  );

  registry.registerTool(
    base({
      name: "evaluate_procurement_market",
      title: "Evaluate procurement market",
      description:
        "Runs TORA's evaluateMarket for the authenticated organisation. Does not persist a snapshot.",
      system: "tora",
      domain: "procurement",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      outputSchema: { type: "object" },
      permission: null,
      tenantScope: "org",
      sideEffects: "none",
      risk: 1,
      approvalRequired: false,
      idempotent: true,
      rateClass: "read",
      whenToUse: "You need which procurements this company can bid on.",
      whenNotToUse: "You want to store a snapshot — use persist_procurement_snapshot.",
      rest: { method: "GET", path: "/api/tora/market" },
      handler: async (ctx) => {
        const actor = orgOf(ctx);
        const store = ctx.pool ? needStore(ctx) : null;
        const company = store ? await resolveCompany(store.pool, actor.orgRef) : undefined;
        const result = evaluateMarket(actor.tier, company);
        return {
          company: result.company,
          tier: result.tier,
          openNow: result.market.summary.openNowCount,
          upcoming: result.market.summary.upcomingCount,
          headline: result.market.summary.headline,
        };
      },
    }),
  );

  registry.registerTool(
    base({
      name: "persist_procurement_snapshot",
      title: "Persist procurement snapshot",
      description:
        "Stores a TORA market snapshot using persistSnapshot — the same service as the TORA UI.",
      system: "tora",
      domain: "procurement",
      inputSchema: {
        type: "object",
        properties: { idempotency_key: { type: "string" } },
        additionalProperties: false,
      },
      outputSchema: { type: "object" },
      permission: "profile:write",
      tenantScope: "org",
      sideEffects: "write",
      risk: 3,
      approvalRequired: false,
      idempotent: true,
      rateClass: "heavy",
      whenToUse: "The evaluated market should be stored.",
      whenNotToUse: "You only want to inspect the current evaluation.",
      rest: { method: "POST", path: "/api/tora/market" },
      flags: readFlags(false),
      handler: async (ctx) => {
        const actor = orgOf(ctx);
        const { pool, events } = needStore(ctx);
        const stored = await persistSnapshot({
          pool,
          events,
          orgRef: actor.orgRef,
          tier: actor.tier,
          actorRef: actor.sub,
          requestId: ctx.requestId,
        });
        return { id: stored.id, company: stored.company, tier: stored.tier };
      },
    }),
  );

  registry.registerTool(
    base({
      name: "list_tax_analyses",
      title: "List tax analyses",
      description: "Lists RITA analyses for the authenticated organisation.",
      system: "rita",
      domain: "tax",
      inputSchema: {
        type: "object",
        properties: {
          status: { type: "string" },
          limit: { type: "integer" },
          cursor: { type: "string" },
        },
        additionalProperties: false,
      },
      outputSchema: { type: "object" },
      permission: null,
      tenantScope: "org",
      sideEffects: "none",
      risk: 1,
      approvalRequired: false,
      idempotent: true,
      rateClass: "read",
      whenToUse: "You need existing RITA analyses.",
      whenNotToUse: "You want to start a new analysis — use request_tax_analysis.",
      rest: { method: "GET", path: "/api/rita/analyses" },
      handler: async (ctx, input) => {
        const actor = orgOf(ctx);
        const { pool } = needStore(ctx);
        const status = typeof input.status === "string" ? input.status : undefined;
        const rows = await listAnalyses(pool, actor.orgRef, { status });
        return page(
          rows.map((item) => ({
            id: item.id,
            companyName: item.companyName,
            status: item.status,
            blockedReason: item.blockedReason,
            createdAt: item.createdAt,
          })),
          input,
        );
      },
    }),
  );

  registry.registerTool(
    base({
      name: "request_tax_analysis",
      title: "Request tax analysis",
      description:
        "Starts a RITA analysis via requestAnalysis. Findings stay findings — not tax advice.",
      system: "rita",
      domain: "tax",
      inputSchema: {
        type: "object",
        properties: {
          companyName: { type: "string" },
          orgNumber: { type: "string" },
          useDemoDocument: { type: "boolean" },
          idempotency_key: { type: "string" },
        },
        required: ["companyName", "orgNumber"],
        additionalProperties: false,
      },
      outputSchema: { type: "object" },
      permission: "scan:run",
      tenantScope: "org",
      sideEffects: "write",
      risk: 3,
      approvalRequired: false,
      idempotent: true,
      rateClass: "heavy",
      whenToUse: "A new tax analysis should actually start.",
      whenNotToUse: "You only want to read previous analyses.",
      rest: { method: "POST", path: "/api/rita/analyses" },
      flags: readFlags(false),
      handler: async (ctx, input) => {
        const actor = orgOf(ctx);
        const { pool, events } = needStore(ctx);
        const analysis = await requestAnalysis({
          pool,
          events,
          orgRef: actor.orgRef,
          actorRef: actor.sub,
          companyName: String(input.companyName),
          orgNumber: String(input.orgNumber),
          requestId: ctx.requestId,
          useDemoDocument: input.useDemoDocument === true,
        });
        return {
          id: analysis.id,
          status: analysis.status,
          companyName: analysis.companyName,
          blockedReason: analysis.blockedReason,
        };
      },
    }),
  );

  registry.registerTool(
    base({
      name: "list_followups",
      title: "List follow-ups",
      description:
        "Lists BRITT observations that need follow-up for the authenticated organisation.",
      system: "britt",
      domain: "followup",
      inputSchema: {
        type: "object",
        properties: {
          status: { type: "string" },
          limit: { type: "integer" },
          cursor: { type: "string" },
        },
        additionalProperties: false,
      },
      outputSchema: { type: "object" },
      permission: null,
      tenantScope: "org",
      sideEffects: "none",
      risk: 1,
      approvalRequired: false,
      idempotent: true,
      rateClass: "read",
      whenToUse: "You need what BRITT has already recorded.",
      whenNotToUse: "You need to invent a finding.",
      rest: { method: "GET", path: "/api/britt/observations" },
      handler: async (ctx, input) => {
        const actor = orgOf(ctx);
        const { pool } = needStore(ctx);
        const status =
          input.status === "open" || input.status === "done" || input.status === "all"
            ? input.status
            : "open";
        const rows = await listObservations(pool, actor.orgRef, { status });
        return page(
          rows.map((item) => ({
            id: item.id,
            title: item.title,
            severity: item.severity,
            status: item.status,
            sourceSystem: item.sourceSystem,
            createdAt: item.createdAt,
          })),
          input,
        );
      },
    }),
  );

  registry.registerTool(
    base({
      name: "create_agreement",
      title: "Create agreement",
      description:
        "Creates an IRMA agreement using createAgreement. The counterparty gets a link, not an account.",
      system: "irma",
      domain: "agreements",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          counterparty: { type: "string" },
          body: { type: "string" },
          idempotency_key: { type: "string" },
        },
        required: ["title", "counterparty"],
        additionalProperties: false,
      },
      outputSchema: { type: "object" },
      permission: "document:upload",
      tenantScope: "org",
      sideEffects: "write",
      risk: 3,
      approvalRequired: false,
      idempotent: true,
      rateClass: "heavy",
      whenToUse: "An agreement should actually be created.",
      whenNotToUse: "You only want to inspect existing agreements.",
      rest: { method: "POST", path: "/api/irma/agreements" },
      flags: { ...readFlags(false), pii: true },
      handler: async (ctx, input) => {
        const actor = orgOf(ctx);
        const { pool, events } = needStore(ctx);
        const created = await createAgreement({
          pool,
          events,
          orgRef: actor.orgRef,
          actorRef: actor.sub,
          title: String(input.title),
          counterparty: String(input.counterparty),
          body: typeof input.body === "string" ? input.body : undefined,
          requestId: ctx.requestId,
        });
        return {
          id: created.id,
          title: created.title,
          counterparty: created.counterparty,
          status: created.status,
        };
      },
    }),
  );

  registry.registerTool(
    base({
      name: "create_vehicle_case",
      title: "Create vehicle case",
      description: "Creates a TYRA case via createCase. Same validation as POST /api/tyra/cases.",
      system: "tyra",
      domain: "workshop",
      inputSchema: {
        type: "object",
        properties: {
          customerName: { type: "string" },
          registrationNumber: { type: "string" },
          operations: { type: "array", items: { type: "string" } },
          make: { type: "string" },
          model: { type: "string" },
          intent: { type: "string" },
          idempotency_key: { type: "string" },
        },
        required: ["customerName", "registrationNumber", "operations"],
        additionalProperties: false,
      },
      outputSchema: { type: "object" },
      permission: "arende:write",
      tenantScope: "org",
      sideEffects: "write",
      risk: 3,
      approvalRequired: false,
      idempotent: true,
      rateClass: "heavy",
      whenToUse: "A workshop case should be stored.",
      whenNotToUse: "You only want to inspect existing cases.",
      rest: { method: "POST", path: "/api/tyra/cases" },
      flags: { ...readFlags(false), pii: true },
      handler: async (ctx, input) => {
        const actor = orgOf(ctx);
        const { pool, events } = needStore(ctx);
        const operations = parseOperations(input.operations);
        const created = await createTyraCase({
          pool,
          events,
          orgRef: actor.orgRef,
          actorRef: actor.sub,
          customerName: String(input.customerName),
          registrationNumber: String(input.registrationNumber),
          make: typeof input.make === "string" ? input.make : undefined,
          model: typeof input.model === "string" ? input.model : undefined,
          intent: parseIntent(typeof input.intent === "string" ? input.intent : undefined),
          operations,
          requestId: ctx.requestId,
        });
        return created;
      },
    }),
  );

  registry.registerTool(
    base({
      name: "register_diagnostic_case",
      title: "Register diagnostic case",
      description:
        "Registers an ALVA case from what the customer said. Does not diagnose. Same createCase service as REST.",
      system: "alva",
      domain: "diagnostics",
      inputSchema: {
        type: "object",
        properties: {
          complaint: { type: "string" },
          vehicleRef: { type: "string" },
          area: { type: "string" },
          mileageKm: { type: "number" },
          desiredOutcome: { type: "string" },
          idempotency_key: { type: "string" },
        },
        required: ["complaint"],
        additionalProperties: false,
      },
      outputSchema: { type: "object" },
      permission: null,
      tenantScope: "org",
      sideEffects: "write",
      risk: 2,
      approvalRequired: false,
      idempotent: true,
      rateClass: "write",
      whenToUse: "Customer words, notes or measurements should be stored.",
      whenNotToUse: "You want a diagnosis — ALVA does not invent one.",
      rest: { method: "POST", path: "/api/alva/cases" },
      flags: { ...readFlags(false), pii: true },
      handler: async (ctx, input) => {
        const actor = orgOf(ctx);
        const { pool, events } = needStore(ctx);
        const created = await createAlvaCase({
          pool,
          events,
          orgRef: actor.orgRef,
          actorRef: actor.sub,
          complaint: String(input.complaint),
          vehicleRef: typeof input.vehicleRef === "string" ? input.vehicleRef : undefined,
          area: typeof input.area === "string" ? input.area : undefined,
          mileageKm: typeof input.mileageKm === "number" ? input.mileageKm : undefined,
          desiredOutcome:
            typeof input.desiredOutcome === "string" ? input.desiredOutcome : undefined,
          requestId: ctx.requestId,
        });
        return {
          id: created.id,
          status: created.status,
          complaint: created.complaint,
        };
      },
    }),
  );

  registry.registerTool(
    base({
      name: "register_credit_inquiry",
      title: "Register credit inquiry",
      description:
        "Registers a CREDITAE counterpart by organisation number. May attach a Creditsafe report through the platform credit channel. Does not invent a score or set the user's assessment. Same createInquiry service as REST.",
      system: "creditae",
      domain: "credit",
      inputSchema: {
        type: "object",
        properties: {
          subjectOrgNumber: { type: "string" },
          subjectName: { type: "string" },
          reason: { type: "string" },
          idempotency_key: { type: "string" },
        },
        required: ["subjectOrgNumber"],
        additionalProperties: false,
      },
      outputSchema: { type: "object" },
      permission: "arende:write",
      tenantScope: "org",
      sideEffects: "write",
      risk: 2,
      approvalRequired: false,
      idempotent: true,
      rateClass: "write",
      whenToUse: "A counterpart should be assessed before credit or an agreement.",
      whenNotToUse:
        "You want CREDITAE to decide Kör/Bevaka/Stanna — that is the user's assessment, not the bureau field.",
      rest: { method: "POST", path: "/api/creditae/inquiries" },
      flags: { ...readFlags(false), pii: true },
      handler: async (ctx, input) => {
        const actor = orgOf(ctx);
        const { pool, events } = needStore(ctx);
        const created = await createCreditaeInquiry({
          pool,
          events,
          orgRef: actor.orgRef,
          actorRef: actor.sub,
          subjectOrgNumber: String(input.subjectOrgNumber),
          subjectName: typeof input.subjectName === "string" ? input.subjectName : undefined,
          reason: typeof input.reason === "string" ? input.reason : undefined,
          requestId: ctx.requestId,
        });
        return {
          id: created.id,
          status: created.status,
          subjectOrgNumber: created.subjectOrgNumber,
        };
      },
    }),
  );

  registry.registerTool(
    base({
      name: "list_search_projects",
      title: "List search projects",
      description:
        "Lists MAJ search projects for the house organisation. House alpha only. Same listProjects service as GET /api/maj/projects.",
      system: "maj",
      domain: "search",
      inputSchema: {
        type: "object",
        properties: { limit: { type: "integer" }, cursor: { type: "string" } },
        additionalProperties: false,
      },
      outputSchema: { type: "object" },
      permission: null,
      tenantScope: "org",
      sideEffects: "none",
      risk: 1,
      approvalRequired: false,
      idempotent: true,
      rateClass: "read",
      whenToUse: "You need the current MAJ project list.",
      whenNotToUse: "You want vendor metrics — MAJ shows decisions, not dashboards.",
      rest: { method: "GET", path: "/api/maj/projects" },
      handler: async (ctx, input) => {
        const actor = orgOf(ctx);
        if (!majIsOpen(actor.orgRef)) return { blocked: true, reason: "MAJ is house alpha." };
        const { pool } = needStore(ctx);
        const projects = await listProjects(pool, actor.orgRef);
        return page(
          projects.map((item) => ({
            id: item.id,
            domain: item.domain,
            market: item.market,
            language: item.language,
            goal: item.goal,
            posture: item.posture,
            status: item.status,
          })),
          input,
        );
      },
    }),
  );

  registry.registerTool(
    base({
      name: "list_search_actions",
      title: "List search actions",
      description:
        "Lists the MAJ action queue for one project. Evidence sits on each decision. Same listActions service as GET /api/maj/projects/:id/actions.",
      system: "maj",
      domain: "search",
      inputSchema: {
        type: "object",
        properties: {
          projectId: { type: "string" },
          limit: { type: "integer" },
          cursor: { type: "string" },
        },
        required: ["projectId"],
        additionalProperties: false,
      },
      outputSchema: { type: "object" },
      permission: null,
      tenantScope: "org",
      sideEffects: "none",
      risk: 1,
      approvalRequired: false,
      idempotent: true,
      rateClass: "read",
      whenToUse: "You need the open and settled decisions for a search project.",
      whenNotToUse: "You want to approve a decision — use decide_search_action.",
      rest: { method: "GET", path: "/api/maj/projects/:id/actions" },
      handler: async (ctx, input) => {
        const actor = orgOf(ctx);
        if (!majIsOpen(actor.orgRef)) return { blocked: true, reason: "MAJ is house alpha." };
        const { pool } = needStore(ctx);
        const projectId = String(input.projectId);
        const project = await getProject(pool, actor.orgRef, projectId);
        if (!project) return { projectId, actions: [] };
        const actions = await listActions(pool, actor.orgRef, project.id);
        return page(
          actions.map((item) => ({
            id: item.id,
            kind: item.kind,
            title: item.title,
            state: item.state,
            risk: item.risk,
            expectedImpact: item.expectedImpact,
            confidence: item.confidence,
          })),
          input,
        );
      },
    }),
  );

  registry.registerTool(
    base({
      name: "run_search_analysis",
      title: "Run search analysis",
      description:
        "Runs one MAJ analysis for a project. Books usage before every vendor call. Same runAnalysis service as POST /api/maj/projects/:id/analyze. Does not execute changes.",
      system: "maj",
      domain: "search",
      inputSchema: {
        type: "object",
        properties: { projectId: { type: "string" }, idempotency_key: { type: "string" } },
        required: ["projectId"],
        additionalProperties: false,
      },
      outputSchema: { type: "object" },
      permission: "arende:write",
      tenantScope: "org",
      sideEffects: "write",
      risk: 2,
      approvalRequired: false,
      idempotent: true,
      rateClass: "write",
      whenToUse: "The project needs a fresh measurement and a short decision queue.",
      whenNotToUse: "You want to approve or complete a decision — that is a separate tool.",
      rest: { method: "POST", path: "/api/maj/projects/:id/analyze" },
      handler: async (ctx, input) => {
        const actor = orgOf(ctx);
        if (!majIsOpen(actor.orgRef)) return { blocked: true, reason: "MAJ is house alpha." };
        const { pool, events } = needStore(ctx);
        const project = await getProject(pool, actor.orgRef, String(input.projectId));
        if (!project) return { error: "not_found" };
        const analysis = await runAnalysis({
          pool,
          events,
          orgRef: actor.orgRef,
          actorRef: actor.sub,
          project,
          requestId: ctx.requestId,
        });
        return { projectId: project.id, ...analysis };
      },
    }),
  );

  registry.registerTool(
    base({
      name: "decide_search_action",
      title: "Decide search action",
      description:
        "Approves or declines a proposed MAJ decision. Nothing executes without this. Same decideAction service as POST /api/maj/actions/:id/decide.",
      system: "maj",
      domain: "search",
      inputSchema: {
        type: "object",
        properties: {
          actionId: { type: "string" },
          decision: { type: "string" },
          idempotency_key: { type: "string" },
        },
        required: ["actionId", "decision"],
        additionalProperties: false,
      },
      outputSchema: { type: "object" },
      permission: "arende:write",
      tenantScope: "org",
      sideEffects: "write",
      risk: 2,
      approvalRequired: false,
      idempotent: true,
      rateClass: "write",
      whenToUse: "A human has accepted or declined a proposed search decision.",
      whenNotToUse: "You want the system to execute the change — MAJ never does that itself.",
      rest: { method: "POST", path: "/api/maj/actions/:id/decide" },
      flags: { ...readFlags(false), pii: false },
      handler: async (ctx, input) => {
        const actor = orgOf(ctx);
        if (!majIsOpen(actor.orgRef)) return { blocked: true, reason: "MAJ is house alpha." };
        const { pool, events } = needStore(ctx);
        const decision = String(input.decision);
        if (decision !== "approved" && decision !== "declined") {
          return { error: "invalid_decision" };
        }
        await decideAction({
          pool,
          events,
          orgRef: actor.orgRef,
          actorRef: actor.sub,
          actionId: String(input.actionId),
          decision,
          requestId: ctx.requestId,
        });
        return { actionId: String(input.actionId), decision };
      },
    }),
  );

  return registry;
}

let cached: ToolRegistry | null = null;

export function pixdriftRegistry(): ToolRegistry {
  if (!cached) cached = buildPixdriftRegistry();
  return cached;
}
