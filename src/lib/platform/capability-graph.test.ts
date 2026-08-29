import { describe, expect, it } from "vitest";
import { SYSTEM_IDS } from "@pixdrift/systems";
import { buildPixdriftRegistry } from "@/lib/mcp/tools";
import { buildCapabilityGraph } from "./capability-graph";

describe("capability graph seed", () => {
  it("is derived from the MCP registry, not a parallel list", () => {
    const graph = buildCapabilityGraph();
    const tools = buildPixdriftRegistry().listTools();
    expect(graph.source).toBe("mcp-registry");
    expect(graph.capabilities.map((item) => item.id).sort()).toEqual(
      tools.map((tool) => tool.name).sort(),
    );
    expect(graph.capabilities).toHaveLength(tools.length);
    expect(graph.capabilities.length).toBe(37);
  });

  it("keeps REST bindings on every registered tool", () => {
    const graph = buildCapabilityGraph();
    for (const capability of graph.capabilities) {
      expect(capability.interfaces.mcp).toBe(capability.id);
      expect(capability.interfaces.rest).toEqual(
        expect.objectContaining({
          method: expect.any(String),
          path: expect.stringMatching(/^\/api\//),
        }),
      );
      expect(capability.interfaces.sdk).toBeNull();
      expect(capability.interfaces.webhook).toBeNull();
      expect(capability.interfaces.chatgpt).toBe(false);
      expect(capability.observability.slo).toBeNull();
    }
  });

  it("does not invent products that are not in @pixdrift/systems", () => {
    const graph = buildCapabilityGraph();
    expect(graph.products).toEqual([...SYSTEM_IDS]);
    for (const capability of graph.capabilities) {
      expect((SYSTEM_IDS as readonly string[]).includes(capability.product)).toBe(true);
    }
    const ids = graph.capabilities.map((item) => item.id).join(" ");
    expect(ids).not.toMatch(/nora|mova|saga/i);
  });

  it("maps write tools to the event the domain service already publishes", () => {
    const graph = buildCapabilityGraph();
    const byId = Object.fromEntries(graph.capabilities.map((item) => [item.id, item]));
    expect(byId.create_office_task.interfaces.event).toBe("kansli.task.created");
    expect(byId.toggle_office_task.interfaces.event).toBe("kansli.task.updated");
    expect(byId.delete_office_task.interfaces.event).toBe("kansli.task.updated");
    expect(byId.delete_office_task.interfaces.rest).toEqual({
      method: "DELETE",
      path: "/api/kansli/tasks/:id",
    });
    expect(byId.list_office_tasks.interfaces.event).toBeNull();
    expect(byId.get_ops_snapshot.product).toBe("kansli");
    expect(byId.get_ops_snapshot.interfaces.event).toBeNull();
    expect(byId.get_ops_snapshot.interfaces.rest).toEqual({
      method: "GET",
      path: "/api/platform/ops",
    });
    expect(byId.lookup_ops_debug.product).toBe("kansli");
    expect(byId.lookup_ops_debug.interfaces.event).toBeNull();
    expect(byId.lookup_ops_debug.interfaces.rest).toEqual({
      method: "GET",
      path: "/api/platform/ops/debug",
    });
    expect(byId.get_ledger_invoice.product).toBe("ekonomi");
    expect(byId.get_ledger_invoice.interfaces.event).toBeNull();
    expect(byId.get_ledger_invoice.interfaces.rest).toEqual({
      method: "GET",
      path: "/api/ekonomi/invoices/:id",
    });
    expect(byId.register_diagnostic_case.product).toBe("alva");
    expect(byId.register_credit_inquiry.product).toBe("creditae");
    expect(byId.register_credit_inquiry.interfaces.event).toBe("creditae.inquiry.created");
    expect(byId.list_search_projects.product).toBe("maj");
    expect(byId.run_search_analysis.interfaces.event).toBe("maj.action.proposed");
    expect(byId.decide_search_action.interfaces.event).toBe("maj.action.decided");
    expect(byId.list_search_actions.interfaces.event).toBeNull();
    expect(byId.list_agreements.product).toBe("irma");
    expect(byId.list_agreements.interfaces.event).toBeNull();
    expect(byId.list_agreements.interfaces.rest).toEqual({
      method: "GET",
      path: "/api/irma/agreements",
    });
    expect(byId.get_agreement.product).toBe("irma");
    expect(byId.get_agreement.interfaces.event).toBeNull();
    expect(byId.get_agreement.interfaces.rest).toEqual({
      method: "GET",
      path: "/api/irma/agreements/:id",
    });
    expect(byId.revoke_agreement.product).toBe("irma");
    expect(byId.revoke_agreement.interfaces.event).toBe("irma.agreement.cancelled");
    expect(byId.revoke_agreement.interfaces.rest).toEqual({
      method: "POST",
      path: "/api/irma/agreements/:id",
    });
    expect(byId.list_vehicle_cases.product).toBe("tyra");
    expect(byId.list_vehicle_cases.interfaces.event).toBeNull();
    expect(byId.list_vehicle_cases.interfaces.rest).toEqual({
      method: "GET",
      path: "/api/tyra/cases",
    });
    expect(byId.get_vehicle_case.product).toBe("tyra");
    expect(byId.get_vehicle_case.interfaces.event).toBeNull();
    expect(byId.get_vehicle_case.interfaces.rest).toEqual({
      method: "GET",
      path: "/api/tyra/cases/:id",
    });
    expect(byId.list_vehicle_reminders.product).toBe("tyra");
    expect(byId.list_vehicle_reminders.interfaces.event).toBeNull();
    expect(byId.list_vehicle_reminders.interfaces.rest).toEqual({
      method: "GET",
      path: "/api/tyra/reminders",
    });
    expect(byId.get_tax_analysis.product).toBe("rita");
    expect(byId.get_tax_analysis.interfaces.event).toBeNull();
    expect(byId.get_tax_analysis.interfaces.rest).toEqual({
      method: "GET",
      path: "/api/rita/analyses/:id",
    });
    expect(byId.get_procurement_opportunity.product).toBe("tora");
    expect(byId.get_procurement_opportunity.interfaces.event).toBeNull();
    expect(byId.get_procurement_opportunity.interfaces.rest).toEqual({
      method: "GET",
      path: "/api/tora/opportunities/:id",
    });
    expect(byId.list_procurement_calendar.product).toBe("tora");
    expect(byId.list_procurement_calendar.interfaces.event).toBeNull();
    expect(byId.list_procurement_calendar.interfaces.rest).toEqual({
      method: "GET",
      path: "/api/tora/calendar",
    });
    expect(byId.list_diagnostic_cases.product).toBe("alva");
    expect(byId.list_diagnostic_cases.interfaces.event).toBeNull();
    expect(byId.list_diagnostic_cases.interfaces.rest).toEqual({
      method: "GET",
      path: "/api/alva/cases",
    });
    expect(byId.list_credit_inquiries.product).toBe("creditae");
    expect(byId.list_credit_inquiries.interfaces.event).toBeNull();
    expect(byId.list_credit_inquiries.interfaces.rest).toEqual({
      method: "GET",
      path: "/api/creditae/inquiries",
    });
    expect(byId.list_findings.product).toBe("britt");
    expect(byId.list_findings.interfaces.event).toBeNull();
    expect(byId.list_findings.interfaces.rest).toEqual({
      method: "GET",
      path: "/api/britt/findings",
    });
    expect(byId.run_operational_analysis.product).toBe("britt");
    expect(byId.run_operational_analysis.interfaces.event).toBe("britt.finding.recorded");
    expect(byId.run_operational_analysis.interfaces.rest).toEqual({
      method: "POST",
      path: "/api/britt/findings",
    });
  });
});
