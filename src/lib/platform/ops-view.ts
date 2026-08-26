/**
 * Client-safe ops types and number helpers.
 * Do not import `ops.ts` from a Client Component — that file loads Postgres.
 */

import type { OpsErrorRow, OpsQueues, OpsRuntimeDebug } from "./ops-debug-view";

export type OpsScope = "house" | "org";

export type OpsTableMeasure = {
  schema: string;
  table: string;
  tenancy: "org_ref" | "house_org_ref" | "none" | "identity" | "unknown";
  system: string | null;
  rows: number | null;
  expected: boolean;
};

export type OpsSchemaMeasure = {
  schema: string;
  present: boolean;
  grant: "readwrite" | "append" | "identity";
  migrations: { version: number; name: string }[];
};

export type OpsEventMeasure = {
  system: string;
  count: number;
  lastAt: string | null;
};

export type OpsPoint = {
  at: string;
  count: number;
};

export type OpsRecent = {
  id: string;
  at: string;
  system: string;
  kind: string;
  headline: string | null;
};

export type OpsReadinessGate = {
  id: string;
  title: string;
  state: "ready" | "open" | "blocked";
  detail: string;
};

export type OpsSmsKind = "overdue" | "support" | "sms_failed" | "readiness";

export type OpsNoticeLevel = "larm" | "varning" | "info";

export type OpsNotice = {
  id: string;
  level: OpsNoticeLevel;
  title: string;
  detail: string;
  href: string | null;
  hrefLabel: string | null;
};

export type OpsLedgerOpen = {
  id: string;
  number: string;
  customerName: string;
  openOre: number;
  dueAt: string | null;
  href: string;
};

export type OpsLedger = {
  openCount: number;
  notDueOre: number;
  overdueOre: number;
  overdueCount: number;
  overdue: OpsLedgerOpen[];
};

export type OpsSupportKind = "observation" | "task" | "case" | "intake" | "alva";

export type OpsSupportItem = {
  id: string;
  kind: OpsSupportKind;
  title: string;
  detail: string;
  href: string;
  at: string;
};

export type OpsSupport = {
  open: number;
  observations: number;
  tasks: number;
  cases: number;
  intakes: number;
  items: OpsSupportItem[];
};

export type OpsSmsRoute = {
  kind: OpsSmsKind;
  phone: string;
  enabled: boolean;
  updatedAt: string;
};

export type OpsSmsDesk = {
  vendor: boolean;
  phone: string;
  routes: OpsSmsRoute[];
  salesPhone: string | null;
  salesEnabled: boolean;
  outbox: {
    id: string;
    kind: string;
    status: string;
    body: string;
    lastError: string | null;
    createdAt: string;
  }[];
};

export const OPS_SMS_KINDS: readonly OpsSmsKind[] = [
  "overdue",
  "support",
  "sms_failed",
  "readiness",
];

export const OPS_SMS_KIND_LABEL: Record<OpsSmsKind, string> = {
  overdue: "Förfallen reskontra",
  support: "Öppna ärenden",
  sms_failed: "Misslyckat SMS",
  readiness: "Blockerad beredskap",
};

export type OpsSnapshot = {
  takenAt: string;
  scope: OpsScope;
  orgRef: string;
  orgName: string | null;
  runtime: "production" | "preview" | "local";
  hardened: boolean;
  contract: {
    engines: number;
    role: string;
    owner: string;
    pin: string;
    bus: string;
  };
  health: {
    database: "up" | "down";
    gateway: { configured: boolean; auth: string };
    rita: { available: boolean; kind: string; modelReady: boolean };
    sms: boolean;
    tts: boolean;
    credit: boolean;
    webintel: boolean;
    revolut: { configured: boolean; environment: string };
    mcp: {
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
    };
  };
  identity: {
    organizations: number | null;
    users: number | null;
    memberships: number | null;
  };
  schemas: OpsSchemaMeasure[];
  tables: OpsTableMeasure[];
  events: OpsEventMeasure[];
  series: OpsPoint[];
  previousWindow: number;
  recent: OpsRecent[];
  readiness: {
    pilotOfferable: boolean;
    allSystemsReady: boolean;
    gates: OpsReadinessGate[];
  };
  notices: OpsNotice[];
  ledger: OpsLedger;
  support: OpsSupport;
  sms: OpsSmsDesk;
  queues: OpsQueues;
  lastErrors: OpsErrorRow[];
  runtimeDebug: OpsRuntimeDebug;
};

export function seriesTotal(points: OpsPoint[]): number {
  return points.reduce((sum, point) => sum + point.count, 0);
}

export function seriesChangePct(current: number, previous: number): number | null {
  if (previous <= 0 && current <= 0) return null;
  if (previous <= 0) return 100;
  return ((current - previous) / previous) * 100;
}
