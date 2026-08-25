export interface McpMetricSnapshot {
  mcp_requests_total: number;
  mcp_tool_calls_total: number;
  mcp_tool_errors_total: number;
  mcp_auth_failures_total: number;
  mcp_authorization_denials_total: number;
  mcp_rate_limit_total: number;
  mcp_schema_validation_failures_total: number;
  mcp_approval_required_total: number;
  mcp_tenant_violations_total: number;
  by_tool: Record<string, { calls: number; errors: number; duration_ms_sum: number }>;
}

const counters: McpMetricSnapshot = {
  mcp_requests_total: 0,
  mcp_tool_calls_total: 0,
  mcp_tool_errors_total: 0,
  mcp_auth_failures_total: 0,
  mcp_authorization_denials_total: 0,
  mcp_rate_limit_total: 0,
  mcp_schema_validation_failures_total: 0,
  mcp_approval_required_total: 0,
  mcp_tenant_violations_total: 0,
  by_tool: {},
};

export function metricsSnapshot(): McpMetricSnapshot {
  return structuredClone(counters);
}

export function resetMetrics(): void {
  counters.mcp_requests_total = 0;
  counters.mcp_tool_calls_total = 0;
  counters.mcp_tool_errors_total = 0;
  counters.mcp_auth_failures_total = 0;
  counters.mcp_authorization_denials_total = 0;
  counters.mcp_rate_limit_total = 0;
  counters.mcp_schema_validation_failures_total = 0;
  counters.mcp_approval_required_total = 0;
  counters.mcp_tenant_violations_total = 0;
  counters.by_tool = {};
}

function toolBucket(name: string) {
  const current = counters.by_tool[name] ?? { calls: 0, errors: 0, duration_ms_sum: 0 };
  counters.by_tool[name] = current;
  return current;
}

export function noteRequest(): void {
  counters.mcp_requests_total += 1;
}

export function noteAuthFailure(): void {
  counters.mcp_auth_failures_total += 1;
}

export function noteAuthzDenial(): void {
  counters.mcp_authorization_denials_total += 1;
}

export function noteRateLimit(): void {
  counters.mcp_rate_limit_total += 1;
}

export function noteSchemaFailure(): void {
  counters.mcp_schema_validation_failures_total += 1;
}

export function noteApprovalRequired(): void {
  counters.mcp_approval_required_total += 1;
}

export function noteTenantViolation(): void {
  counters.mcp_tenant_violations_total += 1;
}

export function noteTool(name: string, durationMs: number, error: boolean): void {
  counters.mcp_tool_calls_total += 1;
  if (error) counters.mcp_tool_errors_total += 1;
  const bucket = toolBucket(name);
  bucket.calls += 1;
  bucket.duration_ms_sum += durationMs;
  if (error) bucket.errors += 1;
}

export function mcpLog(fields: Record<string, unknown>): void {
  const line = {
    ts: new Date().toISOString(),
    channel: "mcp",
    ...fields,
  };
  console.info(JSON.stringify(line));
}
