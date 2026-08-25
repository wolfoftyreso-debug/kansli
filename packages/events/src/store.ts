import { CONTRACTS_VERSION } from "@pixdrift/contracts";
import type pg from "pg";
import { isEventKind, isSystemId, type EventKind, type SystemId } from "./kinds.ts";

export type ActorKind = "user" | "system" | "automation" | "support" | "integration";

export interface PublishInput {
  system: SystemId;
  kind: EventKind;
  orgRef?: string | null;
  actorKind?: ActorKind;
  actorRef?: string | null;
  subjectRef?: string | null;
  payload?: Record<string, unknown>;
  requestId?: string | null;
}

export interface StoredEvent {
  id: string;
  occurredAt: string;
  system: SystemId;
  kind: EventKind;
  orgRef: string | null;
  actorKind: ActorKind;
  actorRef: string | null;
  subjectRef: string | null;
  payload: Record<string, unknown>;
  contractsVersion: string;
  requestId: string | null;
}

export interface ListFilter {
  orgRef: string;
  after?: string;
  system?: SystemId;
  kind?: EventKind;
  limit?: number;
  order?: "asc" | "desc";
}

export type EventHandler = (event: StoredEvent) => Promise<void>;

type Queryable = Pick<pg.Pool, "query">;

export class EventLog {
  private readonly handlers = new Map<string, EventHandler[]>();

  constructor(
    private readonly db: Queryable,
    private readonly schema = "platform",
  ) {}

  subscribe(kind: EventKind | "*", handler: EventHandler): void {
    const list = this.handlers.get(kind) ?? [];
    list.push(handler);
    this.handlers.set(kind, list);
  }

  async publish(input: PublishInput): Promise<StoredEvent> {
    if (!isSystemId(input.system)) throw new Error(`okänt system: ${input.system}`);
    if (!isEventKind(input.kind)) throw new Error(`okänd händelse: ${input.kind}`);

    const { rows } = await this.db.query<{
      id: string;
      occurred_at: Date;
      system: string;
      kind: string;
      org_ref: string | null;
      actor_kind: string;
      actor_ref: string | null;
      subject_ref: string | null;
      payload: Record<string, unknown>;
      contracts_version: string;
      request_id: string | null;
    }>(
      `insert into ${this.schema}.events
         (system, kind, org_ref, actor_kind, actor_ref, subject_ref, payload, contracts_version, request_id)
       values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9)
       returning id::text, occurred_at, system, kind, org_ref, actor_kind, actor_ref, subject_ref, payload, contracts_version, request_id`,
      [
        input.system,
        input.kind,
        input.orgRef ?? null,
        input.actorKind ?? "system",
        input.actorRef ?? null,
        input.subjectRef ?? null,
        JSON.stringify(input.payload ?? {}),
        CONTRACTS_VERSION,
        input.requestId ?? null,
      ],
    );

    const event = toEvent(rows[0]!);
    await this.dispatch(event);
    return event;
  }

  async list(filter: ListFilter): Promise<StoredEvent[]> {
    const orgRef = filter.orgRef?.trim();
    if (!orgRef) throw new Error("orgRef krävs. EventLog listar inte hela boken.");
    const clauses = ["true"];
    const values: unknown[] = [];
    const add = (sql: string, value: unknown) => {
      values.push(value);
      clauses.push(sql.replace("?", `$${values.length}`));
    };
    add("org_ref = ?", orgRef);
    if (filter.after) add("id > ?::bigint", filter.after);
    if (filter.system) add("system = ?", filter.system);
    if (filter.kind) add("kind = ?", filter.kind);
    const limit = Math.min(Math.max(filter.limit ?? 50, 1), 200);
    const order = filter.order === "desc" ? "desc" : "asc";
    values.push(limit);

    const { rows } = await this.db.query(
      `select id::text, occurred_at, system, kind, org_ref, actor_kind, actor_ref, subject_ref, payload, contracts_version, request_id
         from ${this.schema}.events
        where ${clauses.join(" and ")}
        order by id ${order}
        limit $${values.length}`,
      values,
    );
    return rows.map(toEvent);
  }

  private async dispatch(event: StoredEvent): Promise<void> {
    const specific = this.handlers.get(event.kind) ?? [];
    const wildcard = this.handlers.get("*") ?? [];
    for (const handler of [...specific, ...wildcard]) {
      await handler(event);
    }
  }
}

function toEvent(row: {
  id: string;
  occurred_at: Date | string;
  system: string;
  kind: string;
  org_ref: string | null;
  actor_kind: string;
  actor_ref: string | null;
  subject_ref: string | null;
  payload: Record<string, unknown> | string;
  contracts_version: string;
  request_id: string | null;
}): StoredEvent {
  const payload =
    typeof row.payload === "string"
      ? (JSON.parse(row.payload) as Record<string, unknown>)
      : row.payload;
  return {
    id: row.id,
    occurredAt: new Date(row.occurred_at).toISOString(),
    system: row.system as SystemId,
    kind: row.kind as EventKind,
    orgRef: row.org_ref,
    actorKind: row.actor_kind as StoredEvent["actorKind"],
    actorRef: row.actor_ref,
    subjectRef: row.subject_ref,
    payload: payload ?? {},
    contractsVersion: row.contracts_version,
    requestId: row.request_id,
  };
}
