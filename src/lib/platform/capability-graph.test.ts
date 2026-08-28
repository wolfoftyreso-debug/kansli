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
    expect(graph.capabilities.length).toBeGreaterThanOrEqual(14);
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
    expect(byId.list_office_tasks.interfaces.event).toBeNull();
    expect(byId.register_diagnostic_case.product).toBe("alva");
    expect(byId.register_credit_inquiry.product).toBe("creditae");
    expect(byId.register_credit_inquiry.interfaces.event).toBe("creditae.inquiry.created");
    expect(byId.list_search_projects.product).toBe("maj");
    expect(byId.run_search_analysis.interfaces.event).toBe("maj.action.proposed");
    expect(byId.decide_search_action.interfaces.event).toBe("maj.action.decided");
    expect(byId.list_search_actions.interfaces.event).toBeNull();
  });
});
