import { WORKSPACE_SCHEMAS } from "@pixdrift/db";
import { SYSTEM_MODULES, type SystemId } from "@pixdrift/systems";

/**
 * The shared storage contract. One Postgres. One schema per product.
 * Identity stays in `public`. Customer rows carry `org_ref` unless listed
 * in `TABLES_WITHOUT_ORG_REF`. This is structure, not a second capability
 * catalog — capabilities still come from `src/lib/mcp/tools.ts`.
 */

export const DATABASE_CONTRACT = {
  engines: 1,
  role: "pixdrift_app",
  owner: "pixdrift_owner",
  pin: "app.org_ref",
  bus: "platform.events",
} as const;

export type TableTenancy = "org_ref" | "house_org_ref" | "none" | "identity";

export type StructureTable = {
  schema: string;
  table: string;
  tenancy: TableTenancy;
  system: SystemId | "platform";
};

/** Product tables created by `db/migrations`. Identity is bootstrapped separately. */
export const PRODUCT_TABLES: readonly StructureTable[] = [
  { schema: "platform", table: "events", tenancy: "org_ref", system: "platform" },
  { schema: "platform", table: "sms_routes", tenancy: "org_ref", system: "platform" },
  { schema: "platform", table: "alarm_states", tenancy: "org_ref", system: "platform" },
  { schema: "platform", table: "alarm_outbox", tenancy: "org_ref", system: "platform" },
  { schema: "kansli", table: "tasks", tenancy: "org_ref", system: "kansli" },
  { schema: "kansli", table: "intakes", tenancy: "house_org_ref", system: "kansli" },
  { schema: "ekonomi", table: "accounts", tenancy: "none", system: "ekonomi" },
  { schema: "ekonomi", table: "journals", tenancy: "org_ref", system: "ekonomi" },
  { schema: "ekonomi", table: "transactions", tenancy: "org_ref", system: "ekonomi" },
  { schema: "ekonomi", table: "entries", tenancy: "org_ref", system: "ekonomi" },
  { schema: "ekonomi", table: "invoices", tenancy: "org_ref", system: "ekonomi" },
  { schema: "ekonomi", table: "invoice_lines", tenancy: "org_ref", system: "ekonomi" },
  { schema: "ekonomi", table: "payments", tenancy: "org_ref", system: "ekonomi" },
  { schema: "ekonomi", table: "inbound_transfers", tenancy: "org_ref", system: "ekonomi" },
  { schema: "ekonomi", table: "connectors", tenancy: "org_ref", system: "ekonomi" },
  { schema: "ekonomi", table: "documents", tenancy: "org_ref", system: "ekonomi" },
  { schema: "ekonomi", table: "integration_connections", tenancy: "org_ref", system: "ekonomi" },
  { schema: "ekonomi", table: "integration_oauth_states", tenancy: "org_ref", system: "ekonomi" },
  { schema: "ekonomi", table: "sales_alert_settings", tenancy: "org_ref", system: "ekonomi" },
  { schema: "ekonomi", table: "sales_alert_outbox", tenancy: "org_ref", system: "ekonomi" },
  { schema: "tora", table: "market_snapshots", tenancy: "org_ref", system: "tora" },
  { schema: "tora", table: "company_profiles", tenancy: "org_ref", system: "tora" },
  { schema: "rita", table: "analyses", tenancy: "org_ref", system: "rita" },
  { schema: "britt", table: "observations", tenancy: "org_ref", system: "britt" },
  { schema: "britt", table: "metric_snapshots", tenancy: "org_ref", system: "britt" },
  { schema: "britt", table: "analysis_runs", tenancy: "org_ref", system: "britt" },
  { schema: "britt", table: "findings", tenancy: "org_ref", system: "britt" },
  { schema: "irma", table: "agreements", tenancy: "org_ref", system: "irma" },
  { schema: "tyra", table: "customers", tenancy: "org_ref", system: "tyra" },
  { schema: "tyra", table: "vehicles", tenancy: "org_ref", system: "tyra" },
  { schema: "tyra", table: "wheel_sets", tenancy: "org_ref", system: "tyra" },
  { schema: "tyra", table: "tire_cases", tenancy: "org_ref", system: "tyra" },
  { schema: "tyra", table: "tire_case_operations", tenancy: "org_ref", system: "tyra" },
  { schema: "tyra", table: "tire_case_steps", tenancy: "org_ref", system: "tyra" },
  { schema: "tyra", table: "tire_case_events", tenancy: "org_ref", system: "tyra" },
  { schema: "tyra", table: "customer_hub_links", tenancy: "org_ref", system: "tyra" },
  { schema: "tyra", table: "tire_inspections", tenancy: "org_ref", system: "tyra" },
  { schema: "tyra", table: "tire_inspection_positions", tenancy: "org_ref", system: "tyra" },
  { schema: "tyra", table: "org_settings", tenancy: "org_ref", system: "tyra" },
  { schema: "tyra", table: "reminder_runs", tenancy: "org_ref", system: "tyra" },
  { schema: "tyra", table: "reminder_outbox", tenancy: "org_ref", system: "tyra" },
  { schema: "tyra", table: "reminder_deliveries", tenancy: "org_ref", system: "tyra" },
  { schema: "tyra", table: "reminder_threads", tenancy: "org_ref", system: "tyra" },
  { schema: "tyra", table: "tenant_supplier_accounts", tenancy: "org_ref", system: "tyra" },
  { schema: "tyra", table: "supplier_integration_events", tenancy: "org_ref", system: "tyra" },
  { schema: "tyra", table: "tire_products", tenancy: "org_ref", system: "tyra" },
  { schema: "tyra", table: "tire_price_snapshots", tenancy: "org_ref", system: "tyra" },
  { schema: "tyra", table: "quote_drafts", tenancy: "org_ref", system: "tyra" },
  { schema: "alva", table: "cases", tenancy: "org_ref", system: "alva" },
  { schema: "alva", table: "case_observations", tenancy: "org_ref", system: "alva" },
  { schema: "alva", table: "case_measurements", tenancy: "org_ref", system: "alva" },
  { schema: "creditae", table: "inquiries", tenancy: "org_ref", system: "creditae" },
];

export const IDENTITY_TABLES = [
  "organizations",
  "legal_entities",
  "roles",
  "users",
  "memberships",
  "oauth_clients",
  "auth_codes",
  "signing_keys",
] as const;

export const PRODUCT_SCHEMAS = WORKSPACE_SCHEMAS.map((entry) => entry.schema);

export function structureKey(schema: string, table: string): string {
  return `${schema}.${table}`;
}

export function knownProductKeys(): Set<string> {
  return new Set(PRODUCT_TABLES.map((item) => structureKey(item.schema, item.table)));
}

export function schemaOwner(schema: string): SystemId | "platform" | null {
  if (schema === "public") return "identity";
  if (schema === "platform") return "platform";
  const module = SYSTEM_MODULES.find((item) => item.schema === schema);
  return module?.id ?? null;
}

export function isKnownSchema(schema: string): boolean {
  return schema === "public" || PRODUCT_SCHEMAS.includes(schema);
}
