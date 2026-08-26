/** Client-safe debug types. Do not import Postgres loaders here. */

export type OpsQueueCounts = {
  pending: number;
  sent: number;
  failed: number;
  blocked: number;
};

export type OpsQueues = {
  sales: OpsQueueCounts;
  alarms: OpsQueueCounts;
  reminders: OpsQueueCounts;
};

export type OpsErrorRow = {
  id: string;
  at: string;
  system: string;
  kind: string;
  requestId: string | null;
  subjectRef: string | null;
  headline: string | null;
};

export type OpsRuntimeDebug = {
  mark: "produktion" | "förhandsvisning" | "lokal";
  hardened: boolean;
  vercelEnv: string | null;
  appEnv: string | null;
  seedDemo: boolean;
  cronSet: boolean;
  smsSet: boolean;
  sessionSecretSet: boolean;
  cookieSecure: boolean;
};

export type OpsDebugHit = {
  id: string;
  at: string;
  system: string;
  kind: string;
  orgRef: string | null;
  requestId: string | null;
  subjectRef: string | null;
  actorRef: string | null;
  payload: Record<string, unknown>;
};

export type OpsDebugLookup = {
  q: string;
  events: OpsDebugHit[];
  outbox: {
    source: "sales" | "alarm" | "reminder";
    id: string;
    status: string;
    body: string;
    lastError: string | null;
    createdAt: string;
  }[];
  note: string | null;
};

const SECRET_KEY =
  /secret|password|passwd|token|authorization|cookie|api[_-]?key|private|pem|credential|session/i;

export function isSecretKey(key: string): boolean {
  return SECRET_KEY.test(key);
}

export function sanitizePayload(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[…]";
  if (value == null) return value;
  if (typeof value === "string") {
    if (value.length > 400) return `${value.slice(0, 400)}…`;
    return value;
  }
  if (typeof value !== "object") return value;
  if (Array.isArray(value))
    return value.slice(0, 20).map((item) => sanitizePayload(item, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    out[key] = isSecretKey(key) ? "[dold]" : sanitizePayload(item, depth + 1);
  }
  return out;
}
