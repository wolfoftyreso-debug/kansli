/**
 * OpenAPI 3.1 seed — generated from the Capability Graph.
 * Not a second handwritten catalog. If a path is missing here,
 * it is not registered as an MCP tool.
 */

import type { ToolDefinition } from "@pixdrift/mcp-core";
import { buildPixdriftRegistry } from "@/lib/mcp/tools";
import { buildCapabilityGraph, type CapabilityNode } from "./capability-graph";

export const OPENAPI_VERSION = "3.1.0";

export interface OpenApiOperationView {
  capabilityId: string;
  title: string;
  product: string;
  method: string;
  path: string;
  openApiPath: string;
  permission: string | null;
  event: string | null;
  description: string;
}

type JsonSchema = {
  type?: string;
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
  items?: unknown;
  [key: string]: unknown;
};

type OpenApiOperation = {
  operationId: string;
  summary: string;
  description: string;
  tags: string[];
  security: Array<Record<string, string[]>>;
  parameters?: Array<Record<string, unknown>>;
  requestBody?: Record<string, unknown>;
  responses: Record<string, unknown>;
  "x-mcp": string;
  "x-event": string | null;
};

type OpenApiDocument = {
  openapi: typeof OPENAPI_VERSION;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{ url: string; description: string }>;
  tags: Array<{ name: string }>;
  paths: Record<string, Record<string, OpenApiOperation>>;
  components: {
    securitySchemes: Record<string, Record<string, unknown>>;
  };
  "x-source": "capability-graph";
  "x-generated-from": string;
};

const PATH_PARAM = /:([A-Za-z_][\w]*)/g;
const MCP_ONLY = new Set(["limit", "cursor", "idempotency_key"]);

export function openApiPath(restPath: string): string {
  return restPath.replace(PATH_PARAM, "{$1}");
}

export function pathParamNames(restPath: string): string[] {
  return [...restPath.matchAll(PATH_PARAM)].map((match) => match[1] ?? "").filter(Boolean);
}

function registry() {
  return buildPixdriftRegistry();
}

function schemaOf(tool: ToolDefinition | undefined): JsonSchema {
  const schema = tool?.inputSchema;
  if (!schema || typeof schema !== "object") return { type: "object", properties: {} };
  return schema as JsonSchema;
}

function propertySchema(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return { type: "string" };
}

function writeMethod(method: string): boolean {
  return method === "POST" || method === "PATCH" || method === "PUT";
}

function operationFrom(
  capability: CapabilityNode,
  tool: ToolDefinition | undefined,
): OpenApiOperation {
  const rest = capability.interfaces.rest!;
  const method = rest.method.toUpperCase();
  const params = pathParamNames(rest.path);
  const input = schemaOf(tool);
  const properties = input.properties ?? {};
  const required = new Set(input.required ?? []);
  const parameters: Array<Record<string, unknown>> = params.map((name) => ({
    name,
    in: "path",
    required: true,
    schema: { type: "string" },
  }));

  const bodyProps: Record<string, unknown> = {};
  const bodyRequired: string[] = [];
  for (const [name, spec] of Object.entries(properties)) {
    if (params.includes(name) || MCP_ONLY.has(name)) continue;
    if (method === "GET" || method === "DELETE") {
      parameters.push({
        name,
        in: "query",
        required: required.has(name),
        schema: propertySchema(spec),
      });
    } else {
      bodyProps[name] = propertySchema(spec);
      if (required.has(name)) bodyRequired.push(name);
    }
  }

  const operation: OpenApiOperation = {
    operationId: capability.id,
    summary: capability.title,
    description: tool?.description ?? capability.title,
    tags: [capability.product],
    security: [{ KansliSession: [] }, { Bearer: [] }],
    responses: {
      "200": { description: "Same domain service as the MCP tool." },
      "401": { description: "Not authenticated." },
      "403": { description: "Not allowed for this organisation." },
    },
    "x-mcp": capability.id,
    "x-event": capability.interfaces.event,
  };
  if (parameters.length > 0) operation.parameters = parameters;
  if (writeMethod(method) && Object.keys(bodyProps).length > 0) {
    operation.requestBody = {
      required: bodyRequired.length > 0,
      content: {
        "application/json": {
          schema: {
            type: "object",
            additionalProperties: false,
            properties: bodyProps,
            ...(bodyRequired.length > 0 ? { required: bodyRequired } : {}),
          },
        },
      },
    };
  }
  return operation;
}

export function listOpenApiOperations(): OpenApiOperationView[] {
  const graph = buildCapabilityGraph();
  const tools = registry();
  return graph.capabilities
    .filter((item) => item.interfaces.rest)
    .map((item) => {
      const rest = item.interfaces.rest!;
      const tool = tools.getTool(item.id);
      return {
        capabilityId: item.id,
        title: item.title,
        product: item.product,
        method: rest.method.toUpperCase(),
        path: rest.path,
        openApiPath: openApiPath(rest.path),
        permission: item.permissions[0] ?? null,
        event: item.interfaces.event,
        description: tool?.description ?? item.title,
      };
    });
}

export function buildOpenApiDocument(): OpenApiDocument {
  const graph = buildCapabilityGraph();
  const tools = registry();
  const paths: OpenApiDocument["paths"] = {};
  const tagNames = new Set<string>();

  for (const capability of graph.capabilities) {
    const rest = capability.interfaces.rest;
    if (!rest) continue;
    const converted = openApiPath(rest.path);
    const method = rest.method.toLowerCase();
    const tool = tools.getTool(capability.id);
    paths[converted] ??= {};
    paths[converted][method] = operationFrom(capability, tool);
    tagNames.add(capability.product);
  }

  return {
    openapi: OPENAPI_VERSION,
    info: {
      title: "PIXDRIFT",
      version: graph.version,
      description:
        "Generated from the Capability Graph. Each operationId is an MCP tool name. Same domain services as REST. Not a handwritten catalog. NORA, MOVA and SAGA are not in this repository.",
    },
    servers: [{ url: "/", description: "Same origin as the product." }],
    tags: [...tagNames].sort().map((name) => ({ name })),
    paths,
    components: {
      securitySchemes: {
        KansliSession: {
          type: "apiKey",
          in: "cookie",
          name: "kansli_session",
          description: "Browser session from Pixdrift Identity.",
        },
        Bearer: {
          type: "http",
          scheme: "bearer",
          description: "Access token from Pixdrift Identity.",
        },
      },
    },
    "x-source": "capability-graph",
    "x-generated-from": graph.generatedFrom,
  };
}
