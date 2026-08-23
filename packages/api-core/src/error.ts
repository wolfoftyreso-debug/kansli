export type ApiErrorCode =
  | "invalid_request"
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "upstream_unavailable"
  | "not_ready";

const STATUS: Record<ApiErrorCode, number> = {
  invalid_request: 400,
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  upstream_unavailable: 503,
  not_ready: 503,
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly detail?: string;

  constructor(code: ApiErrorCode, message: string, detail?: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = STATUS[code];
    this.detail = detail;
  }
}

export interface ProblemBody {
  type: "about:blank";
  title: string;
  status: number;
  detail?: string;
  code: string;
  requestId: string;
}

export function problemBody(error: unknown, requestId: string): ProblemBody {
  if (error instanceof ApiError) {
    return {
      type: "about:blank",
      title: error.message,
      status: error.status,
      detail: error.detail,
      code: error.code,
      requestId,
    };
  }
  return {
    type: "about:blank",
    title: "Ett oväntat fel uppstod.",
    status: 500,
    code: "internal",
    requestId,
  };
}

export function problemResponse(error: unknown, requestId: string): Response {
  const body = problemBody(error, requestId);
  return Response.json(body, { status: body.status, headers: { "x-request-id": requestId } });
}
