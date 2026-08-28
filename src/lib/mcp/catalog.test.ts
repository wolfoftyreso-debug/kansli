import { describe, expect, it } from "vitest";
import { buildPixdriftRegistry } from "./tools";
import { registerMcpResources } from "./resources";

describe("MCP catalog contract", () => {
  const registry = buildPixdriftRegistry();
  registerMcpResources(registry);
  const catalog = registry.catalog();

  it("registers task-oriented tools with required metadata", () => {
    expect(catalog.tools.length).toBeGreaterThanOrEqual(10);
    const names = catalog.tools.map((tool) => tool.name);
    expect(names).toContain("create_office_task");
    expect(names).toContain("list_ledger_invoices");
    expect(names).toContain("list_agreements");
    expect(names).toContain("list_vehicle_cases");
    expect(names).toContain("list_diagnostic_cases");
    expect(names).toContain("list_credit_inquiries");
    expect(names).toContain("list_findings");
    expect(names).toContain("run_operational_analysis");
    expect(names).not.toContain("query_database");
    expect(names).not.toContain("execute_sql");
    for (const tool of catalog.tools) {
      expect(tool.description.length).toBeGreaterThan(20);
      expect(tool.inputSchema).toBeTruthy();
      expect(tool.outputSchema).toBeTruthy();
      expect(tool.version).toBeTruthy();
      expect([0, 1, 2, 3, 4]).toContain(tool.risk);
      expect(tool.tenantScope === "org" || tool.tenantScope === "none").toBe(true);
    }
  });

  it("keeps high-risk tools behind approval and ships none at level 4", () => {
    expect(catalog.tools.filter((tool) => tool.risk >= 4)).toEqual([]);
    expect(catalog.tools.every((tool) => tool.approvalRequired === false)).toBe(true);
  });

  it("exposes resources from the same registry", () => {
    expect(catalog.resources.map((item) => item.uri)).toContain("pixdrift://catalog/tools");
  });
});
