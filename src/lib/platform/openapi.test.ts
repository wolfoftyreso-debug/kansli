import { describe, expect, it } from "vitest";
import { buildPixdriftRegistry } from "@/lib/mcp/tools";
import { buildCapabilityGraph } from "./capability-graph";
import { buildOpenApiDocument, listOpenApiOperations, openApiPath } from "./openapi";

describe("OpenAPI seed", () => {
  it("is derived from the capability graph, not a parallel list", () => {
    const graph = buildCapabilityGraph();
    const spec = buildOpenApiDocument();
    const tools = buildPixdriftRegistry().listTools();
    const operations = listOpenApiOperations();
    expect(spec.openapi).toBe("3.1.0");
    expect(spec["x-source"]).toBe("capability-graph");
    expect(spec["x-generated-from"]).toBe("src/lib/mcp/tools.ts");
    expect(spec.info.version).toBe(graph.version);
    expect(operations).toHaveLength(graph.capabilities.length);
    expect(operations).toHaveLength(tools.length);
    expect(operations.map((item) => item.capabilityId).sort()).toEqual(
      tools.map((tool) => tool.name).sort(),
    );
  });

  it("converts Express-style params and keeps REST method plus MCP id", () => {
    expect(openApiPath("/api/kansli/tasks/:id")).toBe("/api/kansli/tasks/{id}");
    expect(openApiPath("/api/maj/projects/:id/actions")).toBe("/api/maj/projects/{id}/actions");
    const spec = buildOpenApiDocument();
    expect(spec.paths["/api/platform/ops"]?.get?.operationId).toBe("get_ops_snapshot");
    expect(spec.paths["/api/platform/ops/debug"]?.get?.operationId).toBe("lookup_ops_debug");
    expect(spec.paths["/api/kansli/tasks/{id}"]?.patch?.operationId).toBe("toggle_office_task");
    expect(spec.paths["/api/kansli/tasks/{id}"]?.delete?.operationId).toBe("delete_office_task");
    expect(spec.paths["/api/kansli/tasks/{id}"]?.delete?.["x-event"]).toBe("kansli.task.updated");
    expect(spec.paths["/api/ekonomi/invoices/{id}"]?.get?.operationId).toBe("get_ledger_invoice");
    expect(spec.paths["/api/tyra/cases/{id}"]?.get?.operationId).toBe("get_vehicle_case");
    expect(spec.paths["/api/tyra/reminders"]?.get?.operationId).toBe("list_vehicle_reminders");
    expect(spec.paths["/api/rita/analyses/{id}"]?.get?.operationId).toBe("get_tax_analysis");
    expect(spec.paths["/api/irma/agreements/{id}"]?.get?.operationId).toBe("get_agreement");
    expect(spec.paths["/api/irma/agreements/{id}"]?.post?.operationId).toBe("revoke_agreement");
    expect(spec.paths["/api/irma/agreements/{id}"]?.post?.["x-event"]).toBe(
      "irma.agreement.cancelled",
    );
    expect(spec.paths["/api/tora/opportunities/{id}"]?.get?.operationId).toBe(
      "get_procurement_opportunity",
    );
    expect(spec.paths["/api/tora/calendar"]?.get?.operationId).toBe("list_procurement_calendar");
    expect(spec.paths["/api/irma/agreements"]?.get?.operationId).toBe("list_agreements");
    expect(spec.paths["/api/britt/findings"]?.post?.operationId).toBe("run_operational_analysis");
  });

  it("does not invent products or a second catalog", () => {
    const spec = buildOpenApiDocument();
    const ids = Object.values(spec.paths)
      .flatMap((item) => Object.values(item).map((operation) => operation.operationId))
      .join(" ");
    expect(ids).not.toMatch(/nora|mova|saga/i);
    expect(spec.tags.map((item) => item.name).join(" ")).not.toMatch(/nora|mova|saga/i);
    expect(spec.info.description).toMatch(/not a handwritten catalog/i);
    for (const path of Object.keys(spec.paths)) {
      expect(path.startsWith("/api/")).toBe(true);
    }
  });
});
