import { ApiError, type ApiErrorCode } from "@pixdrift/api-core";
import type { JsonRpcError } from "./protocol.ts";

export type McpErrorName =
  | "AUTHENTICATION_REQUIRED"
  | "PERMISSION_DENIED"
  | "TENANT_SCOPE_VIOLATION"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "APPROVAL_REQUIRED"
  | "DEPENDENCY_UNAVAILABLE"
  | "TIMEOUT"
  | "INTERNAL_ERROR";

const FROM_API: Record<ApiErrorCode, McpErrorName> = {
  invalid_request: "VALIDATION_ERROR",
  unauthenticated: "AUTHENTICATION_REQUIRED",
  forbidden: "PERMISSION_DENIED",
  not_found: "NOT_FOUND",
  conflict: "CONFLICT",
  upstream_unavailable: "DEPENDENCY_UNAVAILABLE",
  not_ready: "DEPENDENCY_UNAVAILABLE",
};

const HTTP: Record<McpErrorName, number> = {
  AUTHENTICATION_REQUIRED: 401,
  PERMISSION_DENIED: 403,
  TENANT_SCOPE_VIOLATION: 403,
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  APPROVAL_REQUIRED: 403,
  DEPENDENCY_UNAVAILABLE: 503,
  TIMEOUT: 504,
  INTERNAL_ERROR: 500,
};

const RPC: Record<McpErrorName, number> = {
  AUTHENTICATION_REQUIRED: -32001,
  PERMISSION_DENIED: -32002,
  TENANT_SCOPE_VIOLATION: -32003,
  VALIDATION_ERROR: -32602,
  NOT_FOUND: -32004,
  CONFLICT: -32005,
  RATE_LIMITED: -32006,
  APPROVAL_REQUIRED: -32007,
  DEPENDENCY_UNAVAILABLE: -32008,
  TIMEOUT: -32009,
  INTERNAL_ERROR: -32603,
};

export class McpError extends Error {
  readonly nameCode: McpErrorName;
  readonly httpStatus: number;
  readonly rpcCode: number;
  readonly requestId: string;

  constructor(name: McpErrorName, message: string, requestId: string) {
    super(message);
    this.name = "McpError";
    this.nameCode = name;
    this.httpStatus = HTTP[name];
    this.rpcCode = RPC[name];
    this.requestId = requestId;
  }

  toRpc(): JsonRpcError {
    return {
      code: this.rpcCode,
      message: this.message,
      data: { name: this.nameCode, requestId: this.requestId },
    };
  }
}

export function normalizeError(error: unknown, requestId: string): McpError {
  if (error instanceof McpError) return error;
  if (error instanceof ApiError) {
    return new McpError(FROM_API[error.code], error.message, requestId);
  }
  if (error instanceof Error && /krävs|required|tom/i.test(error.message)) {
    return new McpError("VALIDATION_ERROR", error.message, requestId);
  }
  return new McpError("INTERNAL_ERROR", "Ett oväntat fel uppstod.", requestId);
}

export function safeErrorMessage(error: unknown): string {
  if (error instanceof McpError || error instanceof ApiError) return error.message;
  return "Ett oväntat fel uppstod.";
}
