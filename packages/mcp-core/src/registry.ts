import type { SystemId } from "@pixdrift/systems";
import type { Actor } from "@pixdrift/api-core";
import { invalidParams, isObject } from "./protocol.ts";
import type { RateClass, RiskLevel } from "./risk.ts";

export interface JsonSchema {
  type?: string;
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
  items?: unknown;
  [key: string]: unknown;
}

export interface McpRuntime {
  requestId: string;
  actor: Actor | null;
  pool: unknown;
  events: unknown;
  locale: string;
  clientId: string | null;
  source: "bearer" | "session" | "none";
}

export type ToolHandler = (ctx: McpRuntime, input: Record<string, unknown>) => Promise<unknown>;

export interface ToolDefinition {
  name: string;
  title: string;
  description: string;
  system: SystemId | "platform";
  domain: string;
  inputSchema: JsonSchema;
  outputSchema: JsonSchema;
  permission: string | null;
  tenantScope: "none" | "org";
  sideEffects: "none" | "write" | "external";
  risk: RiskLevel;
  approvalRequired: boolean;
  idempotent: boolean;
  rateClass: RateClass;
  timeoutMs: number;
  version: string;
  deprecated: boolean;
  replacement?: string;
  examples: readonly Record<string, unknown>[];
  rest?: { method: string; path: string };
  flags: {
    readOnly: boolean;
    destructive: boolean;
    financial: boolean;
    pii: boolean;
    customerCommunication: boolean;
    adminOnly: boolean;
  };
  whenToUse: string;
  whenNotToUse: string;
  handler: ToolHandler;
}

export interface ResourceDefinition {
  uri: string;
  name: string;
  title: string;
  description: string;
  mimeType: string;
  system: SystemId | "platform";
  permission: string | null;
  tenantScope: "none" | "org";
  read: (ctx: McpRuntime) => Promise<string>;
}

export interface PromptDefinition {
  name: string;
  title: string;
  description: string;
  arguments?: readonly { name: string; description: string; required: boolean }[];
}

export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();
  private readonly resources = new Map<string, ResourceDefinition>();
  private readonly prompts = new Map<string, PromptDefinition>();

  registerTool(def: ToolDefinition): void {
    if (this.tools.has(def.name)) throw new Error(`duplicate tool: ${def.name}`);
    this.tools.set(def.name, def);
  }

  registerResource(def: ResourceDefinition): void {
    if (this.resources.has(def.uri)) throw new Error(`duplicate resource: ${def.uri}`);
    this.resources.set(def.uri, def);
  }

  registerPrompt(def: PromptDefinition): void {
    if (this.prompts.has(def.name)) throw new Error(`duplicate prompt: ${def.name}`);
    this.prompts.set(def.name, def);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getResource(uri: string): ResourceDefinition | undefined {
    return this.resources.get(uri);
  }

  listTools(): ToolDefinition[] {
    return [...this.tools.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  listResources(): ResourceDefinition[] {
    return [...this.resources.values()].sort((a, b) => a.uri.localeCompare(b.uri));
  }

  listPrompts(): PromptDefinition[] {
    return [...this.prompts.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  catalog() {
    return {
      protocol: "2026-07-28",
      product: "pixdrift-mcp",
      tools: this.listTools().map(publicTool),
      resources: this.listResources().map((item) => ({
        uri: item.uri,
        name: item.name,
        title: item.title,
        description: item.description,
        mimeType: item.mimeType,
        system: item.system,
      })),
      prompts: this.listPrompts(),
    };
  }
}

export function publicTool(def: ToolDefinition) {
  return {
    name: def.name,
    title: def.title,
    description: `${def.description}\n\nUse when: ${def.whenToUse}\nDo not use when: ${def.whenNotToUse}`,
    system: def.system,
    domain: def.domain,
    inputSchema: def.inputSchema,
    outputSchema: def.outputSchema,
    permission: def.permission,
    tenantScope: def.tenantScope,
    sideEffects: def.sideEffects,
    risk: def.risk,
    approvalRequired: def.approvalRequired,
    idempotent: def.idempotent,
    rateClass: def.rateClass,
    timeoutMs: def.timeoutMs,
    version: def.version,
    deprecated: def.deprecated,
    replacement: def.replacement ?? null,
    examples: def.examples,
    rest: def.rest ?? null,
    flags: def.flags,
  };
}

export function mcpToolListItem(def: ToolDefinition) {
  return {
    name: def.name,
    title: def.title,
    description: `${def.description}\n\nUse when: ${def.whenToUse}\nDo not use when: ${def.whenNotToUse}`,
    inputSchema: def.inputSchema,
    annotations: {
      readOnlyHint: def.flags.readOnly,
      destructiveHint: def.flags.destructive,
      idempotentHint: def.idempotent,
      openWorldHint: def.sideEffects === "external",
    },
  };
}

export function readToolArguments(params: unknown): {
  name: string;
  arguments: Record<string, unknown>;
} {
  if (!isObject(params) || typeof params.name !== "string" || !params.name.trim()) {
    throw invalidParams("tools/call requires params.name.");
  }
  const args = params.arguments;
  if (args === undefined) return { name: params.name, arguments: {} };
  if (!isObject(args)) throw invalidParams("params.arguments must be an object.");
  return { name: params.name, arguments: args };
}

export function validateInput(schema: JsonSchema, input: Record<string, unknown>): void {
  if (schema.additionalProperties === false) {
    const allowed = new Set(Object.keys(schema.properties ?? {}));
    for (const key of Object.keys(input)) {
      if (!allowed.has(key)) throw invalidParams(`Unknown field: ${key}`);
    }
  }
  for (const key of schema.required ?? []) {
    if (input[key] === undefined || input[key] === null || input[key] === "") {
      throw invalidParams(`Missing field: ${key}`);
    }
  }
}

export function page<T>(
  items: readonly T[],
  input: Record<string, unknown>,
  max = 50,
): {
  items: T[];
  limit: number;
  cursor: string | null;
  has_more: boolean;
  next_cursor: string | null;
} {
  const rawLimit = typeof input.limit === "number" ? input.limit : Number(input.limit ?? 20);
  const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 20, 1), max);
  const cursor = typeof input.cursor === "string" && input.cursor.trim() ? input.cursor : "0";
  const offset = Math.max(Number.parseInt(cursor, 10) || 0, 0);
  const slice = items.slice(offset, offset + limit);
  const next = offset + slice.length;
  const hasMore = next < items.length;
  return {
    items: slice,
    limit,
    cursor: String(offset),
    has_more: hasMore,
    next_cursor: hasMore ? String(next) : null,
  };
}
