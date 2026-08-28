import { randomUUID } from "node:crypto";
import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import {
  resolveWorkflow,
  type TireCaseIntent,
  type WheelPhysicalStatus,
  type WorkflowStep,
  type WorkflowStepKind,
  type WorkCard,
} from "./case.ts";
import { summarizeOperations, type CanonicalOperation } from "./services.ts";

export type CaseEventSource =
  "SYSTEM" | "DMS" | "TECHNICIAN" | "ADVISOR" | "WAREHOUSE" | "CUSTOMER";

export type StepStatus = "TODO" | "DOING" | "DONE" | "BLOCKED";

export interface TireCaseListItem {
  id: string;
  intent: TireCaseIntent;
  caseStatus: string;
  updatedAt: string;
  customerId: string | null;
  registrationNumber: string | null;
  customerName: string | null;
}

export const INTENT_LABELS: Record<TireCaseIntent, string> = {
  TIRE_SWAP_APPOINTMENT: "Wheel change",
  STORE_ONLY: "Storage in",
  PICKUP_ONLY: "Pickup",
  QUOTE_ONLY: "Quote",
  MIXED: "Mixed",
};

export const CASE_STATUS_LABELS: Record<string, string> = {
  OPEN: "Öppet",
  IN_PROGRESS: "Pågår",
  BLOCKED: "Blockerat",
  DONE: "Klart",
  CANCELLED: "Avbrutet",
};

export const STEP_STATUS_LABELS: Record<StepStatus, string> = {
  TODO: "Att göra",
  DOING: "Pågår",
  DONE: "Klart",
  BLOCKED: "Blockerat",
};

const CANONICAL_OPS: readonly CanonicalOperation[] = [
  "STORAGE_IN",
  "STORAGE_OUT",
  "STORAGE_CONTINUE",
  "STORAGE_TERMINATE",
  "STORAGE_TRANSFER_IN",
  "STORAGE_TRANSFER_OUT",
  "TIRE_SWAP",
  "TIRE_SWAP_FROM_STORAGE",
  "TIRE_SWAP_TO_STORAGE",
  "NEW_CUSTOMER_SWAP_AND_STORE",
  "EXISTING_CUSTOMER_SWAP_AND_STORE",
  "CUSTOMER_CARRIED_WHEELS_SWAP",
  "WHEEL_WASH",
  "WHEEL_BALANCE",
  "WHEEL_INSPECTION",
  "WHEEL_REPAIR",
  "RIM_REPAIR",
  "VALVE_SERVICE",
  "TPMS_SERVICE",
  "WHEEL_PACKING",
  "WHEEL_DISPOSAL",
  "TIRE_REPLACEMENT_REQUIRED",
  "TIRE_REPLACEMENT_RECOMMENDED",
  "TIRE_QUOTE",
  "TIRE_ORDER",
  "TIRE_INSTALLATION",
  "TIRE_DISPOSAL",
];

const INTENTS: readonly TireCaseIntent[] = [
  "TIRE_SWAP_APPOINTMENT",
  "STORE_ONLY",
  "PICKUP_ONLY",
  "QUOTE_ONLY",
  "MIXED",
];

const STEP_STATUSES: readonly StepStatus[] = ["TODO", "DOING", "DONE", "BLOCKED"];

export function normalizeRegistration(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

export function parseIntent(value: unknown): TireCaseIntent {
  if (typeof value === "string" && (INTENTS as readonly string[]).includes(value)) {
    return value as TireCaseIntent;
  }
  return "MIXED";
}

export function parseOperations(raw: unknown): CanonicalOperation[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<CanonicalOperation>();
  for (const item of raw) {
    if (typeof item === "string" && (CANONICAL_OPS as readonly string[]).includes(item)) {
      seen.add(item as CanonicalOperation);
    }
  }
  return [...seen];
}

export function parseStepStatus(value: unknown): StepStatus | null {
  if (typeof value === "string" && (STEP_STATUSES as readonly string[]).includes(value)) {
    return value as StepStatus;
  }
  return null;
}

export async function listCases(pool: pg.Pool, orgRef: string): Promise<TireCaseListItem[]> {
  const { rows } = await pool.query<{
    id: string;
    intent: string;
    case_status: string;
    updated_at: Date;
    customer_id: string | null;
    registration_number: string | null;
    customer_name: string | null;
  }>(
    `select tc.id, tc.intent, tc.case_status, tc.updated_at, tc.customer_id,
            v.registration_number,
            c.name as customer_name
       from tyra.tire_cases tc
       left join tyra.vehicles v on v.id = tc.vehicle_id and v.org_ref = tc.org_ref
       left join tyra.customers c on c.id = tc.customer_id and c.org_ref = tc.org_ref
      where tc.org_ref = $1
      order by tc.updated_at desc
      limit 200`,
    [orgRef],
  );
  return rows.map((row) => ({
    id: row.id,
    intent: parseIntent(row.intent),
    caseStatus: row.case_status,
    updatedAt: new Date(row.updated_at).toISOString(),
    customerId: row.customer_id,
    registrationNumber: row.registration_number,
    customerName: row.customer_name,
  }));
}

export async function createCase(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  customerName: string;
  registrationNumber: string;
  phone?: string;
  email?: string;
  make?: string;
  model?: string;
  intent?: TireCaseIntent;
  operations: CanonicalOperation[];
  requestId: string;
}): Promise<{ id: string; customerId: string; vehicleId: string }> {
  const customerName = input.customerName.trim();
  const registrationNumber = normalizeRegistration(input.registrationNumber);
  const operations = parseOperations(input.operations);
  const intent = parseIntent(input.intent);
  if (!customerName) throw new Error("Kundnamn krävs.");
  if (!registrationNumber) throw new Error("Registreringsnummer krävs.");
  if (operations.length === 0) throw new Error("Minst en åtgärd krävs.");

  const client = await input.pool.connect();
  let id = "";
  let customerId = "";
  let vehicleId = "";
  try {
    await client.query("begin");
    const existingCustomer = await client.query<{ id: string }>(
      `select id from tyra.customers where org_ref = $1 and lower(name) = lower($2) limit 1`,
      [input.orgRef, customerName],
    );
    customerId = existingCustomer.rows[0]?.id ?? randomUUID();
    if (!existingCustomer.rows[0]) {
      await client.query(
        `insert into tyra.customers (id, org_ref, name, phone, email) values ($1, $2, $3, $4, $5)`,
        [
          customerId,
          input.orgRef,
          customerName,
          input.phone?.trim() || null,
          input.email?.trim() || null,
        ],
      );
    } else {
      await client.query(
        `update tyra.customers
            set phone = coalesce($3, phone), email = coalesce($4, email)
          where id = $1 and org_ref = $2`,
        [customerId, input.orgRef, input.phone?.trim() || null, input.email?.trim() || null],
      );
    }

    const existingVehicle = await client.query<{ id: string; customer_id: string | null }>(
      `select id, customer_id from tyra.vehicles
        where org_ref = $1 and registration_number = $2 limit 1`,
      [input.orgRef, registrationNumber],
    );
    vehicleId = existingVehicle.rows[0]?.id ?? randomUUID();
    if (!existingVehicle.rows[0]) {
      await client.query(
        `insert into tyra.vehicles (id, org_ref, customer_id, registration_number, make, model)
         values ($1, $2, $3, $4, $5, $6)`,
        [
          vehicleId,
          input.orgRef,
          customerId,
          registrationNumber,
          input.make?.trim() || null,
          input.model?.trim() || null,
        ],
      );
    } else if (!existingVehicle.rows[0].customer_id) {
      await client.query(
        `update tyra.vehicles set customer_id = $1 where id = $2 and org_ref = $3`,
        [customerId, vehicleId, input.orgRef],
      );
    } else {
      customerId = existingVehicle.rows[0].customer_id ?? customerId;
    }

    const stored = await client.query<{ id: string }>(
      `select id from tyra.wheel_sets
        where org_ref = $1 and vehicle_id = $2 and storage_status = 'STORED'
        order by updated_at desc limit 1`,
      [input.orgRef, vehicleId],
    );
    const sourceWheelStatus: WheelPhysicalStatus = stored.rows[0] ? "STORED" : "UNKNOWN";
    const targetWheelStatus: WheelPhysicalStatus = operations.includes("STORAGE_IN")
      ? "STORED"
      : "IN_WORKSHOP";

    id = randomUUID();
    await client.query(
      `insert into tyra.tire_cases (
         id, org_ref, customer_id, vehicle_id, intent,
         case_status, work_status, wheel_status, commercial_status, documentation_status,
         source_state, target_state
       ) values ($1,$2,$3,$4,$5,'OPEN','READY',$6,'NOT_REQUIRED','NOT_REQUIRED',$7,$8)`,
      [
        id,
        input.orgRef,
        customerId,
        vehicleId,
        intent,
        sourceWheelStatus,
        JSON.stringify({ wheelPhysicalStatus: sourceWheelStatus }),
        JSON.stringify({ wheelPhysicalStatus: targetWheelStatus }),
      ],
    );

    for (const op of operations) {
      await client.query(
        `insert into tyra.tire_case_operations (id, org_ref, tire_case_id, canonical_operation)
         values ($1, $2, $3, $4)`,
        [randomUUID(), input.orgRef, id, op],
      );
    }

    const steps = resolveWorkflow({
      intent,
      requestedOperations: operations,
      sourceWheelStatus,
      targetWheelStatus,
    });
    let sort = 0;
    for (const step of steps) {
      await insertStep(client, input.orgRef, id, step, sort++);
    }

    if (operations.includes("STORAGE_IN")) {
      await upsertWheelSet(client, {
        orgRef: input.orgRef,
        customerId,
        vehicleId,
        status: "REGISTERED",
        storageStatus: "IN_WORKSHOP",
      });
    }

    await recordCaseEvent(client, {
      orgRef: input.orgRef,
      tireCaseId: id,
      eventType: "TIRE_CASE_CREATED",
      actorRef: input.actorRef,
      source: "ADVISOR",
      data: { intent, operations, registrationNumber },
    });

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }

  await input.events.publish({
    system: "tyra",
    kind: "tyra.case.created",
    orgRef: input.orgRef,
    actorKind: "user",
    actorRef: input.actorRef,
    subjectRef: `tyra:case:${id}`,
    requestId: input.requestId,
    payload: { intent, registrationNumber, customerName },
  });

  return { id, customerId, vehicleId };
}

export async function getCaseWorkCard(
  pool: pg.Pool,
  orgRef: string,
  tireCaseId: string,
): Promise<
  | (WorkCard & {
      customerId: string | null;
      customerName: string | null;
      customerPhone: string | null;
      customerEmail: string | null;
      vehicleId: string | null;
      registrationNumber: string | null;
      make: string | null;
      model: string | null;
      caseStatus: string;
      advisorNotes: string;
      storageCode: string | null;
      wheelSetId: string | null;
    })
  | null
> {
  const { rows } = await pool.query<{
    id: string;
    customer_id: string | null;
    vehicle_id: string | null;
    case_status: string;
    advisor_notes: string | null;
  }>(
    `select id, customer_id, vehicle_id, case_status, advisor_notes
       from tyra.tire_cases where org_ref = $1 and id = $2 limit 1`,
    [orgRef, tireCaseId],
  );
  const row = rows[0];
  if (!row) return null;

  const ops = await pool.query<{ canonical_operation: string }>(
    `select canonical_operation from tyra.tire_case_operations
      where org_ref = $1 and tire_case_id = $2 order by created_at asc`,
    [orgRef, tireCaseId],
  );
  const operations = parseOperations(ops.rows.map((item) => item.canonical_operation));

  const vehicle = row.vehicle_id
    ? await pool.query<{
        registration_number: string | null;
        make: string | null;
        model: string | null;
      }>(
        `select registration_number, make, model from tyra.vehicles
          where org_ref = $1 and id = $2 limit 1`,
        [orgRef, row.vehicle_id],
      )
    : {
        rows: [] as {
          registration_number: string | null;
          make: string | null;
          model: string | null;
        }[],
      };

  const customer = row.customer_id
    ? await pool.query<{ name: string; phone: string | null; email: string | null }>(
        `select name, phone, email from tyra.customers where org_ref = $1 and id = $2 limit 1`,
        [orgRef, row.customer_id],
      )
    : { rows: [] as { name: string; phone: string | null; email: string | null }[] };

  const stepsRes = await pool.query<{
    step_kind: string;
    title: string;
    status: string;
    required: boolean;
    requires: WorkflowStep["requires"];
  }>(
    `select step_kind, title, status, required, requires
       from tyra.tire_case_steps
      where org_ref = $1 and tire_case_id = $2
      order by sort_order asc`,
    [orgRef, tireCaseId],
  );
  const steps: WorkflowStep[] = stepsRes.rows.map((item) => ({
    kind: item.step_kind as WorkflowStepKind,
    title: item.title,
    status: (parseStepStatus(item.status) ?? "TODO") as WorkflowStep["status"],
    required: item.required,
    requires: item.requires ?? {},
  }));
  const next = steps.find((step) => step.status === "TODO") ?? null;
  const v = vehicle.rows[0];
  const wheelSet = row.vehicle_id
    ? await pool.query<{ id: string; storage_code: string | null }>(
        `select id, storage_code from tyra.wheel_sets
          where org_ref = $1 and vehicle_id = $2
          order by updated_at desc limit 1`,
        [orgRef, row.vehicle_id],
      )
    : { rows: [] as { id: string; storage_code: string | null }[] };

  return {
    caseId: tireCaseId,
    customerId: row.customer_id,
    customerName: customer.rows[0]?.name ?? null,
    customerPhone: customer.rows[0]?.phone ?? null,
    customerEmail: customer.rows[0]?.email ?? null,
    vehicleId: row.vehicle_id,
    registrationNumber: v?.registration_number ?? null,
    make: v?.make ?? null,
    model: v?.model ?? null,
    caseStatus: row.case_status,
    advisorNotes: row.advisor_notes ?? "",
    storageCode: wheelSet.rows[0]?.storage_code ?? null,
    wheelSetId: wheelSet.rows[0]?.id ?? null,
    headline:
      v?.make && v?.model && v?.registration_number
        ? `${v.make.toUpperCase()} ${v.model.toUpperCase()} — ${v.registration_number}`
        : (v?.registration_number ?? "Ärende"),
    summary: summarizeOperations(operations),
    nextBestAction: next ? { title: `Nästa: ${next.title}`, stepKind: next.kind } : null,
    steps,
  };
}

export async function setStepStatus(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  tireCaseId: string;
  stepKind: string;
  status: StepStatus;
  requestId: string;
}): Promise<void> {
  const client = await input.pool.connect();
  let completed = false;
  try {
    await client.query("begin");
    const prev = await client.query<{ id: string; status: string }>(
      `select id, status from tyra.tire_case_steps
        where org_ref = $1 and tire_case_id = $2 and step_kind = $3
        limit 1`,
      [input.orgRef, input.tireCaseId, input.stepKind],
    );
    if (!prev.rows[0]) throw new Error("Steg saknas.");

    await client.query(
      `update tyra.tire_case_steps
          set status = $1, updated_at = now()
        where org_ref = $2 and tire_case_id = $3 and step_kind = $4`,
      [input.status, input.orgRef, input.tireCaseId, input.stepKind],
    );

    await recordCaseEvent(client, {
      orgRef: input.orgRef,
      tireCaseId: input.tireCaseId,
      eventType: `${input.stepKind}_STATUS_CHANGED`,
      actorRef: input.actorRef,
      source: "TECHNICIAN",
      previousValue: { status: prev.rows[0].status },
      newValue: { status: input.status },
    });

    if (input.stepKind === "CREATE_QUOTE") {
      const commercial =
        input.status === "DONE" ? "QUOTE_READY" : input.status === "DOING" ? "QUOTE_DRAFT" : null;
      if (commercial) {
        await client.query(
          `update tyra.tire_cases
              set commercial_status = $3, updated_at = now()
            where org_ref = $1 and id = $2`,
          [input.orgRef, input.tireCaseId, commercial],
        );
      }
    }

    if (
      input.status === "DONE" &&
      (input.stepKind === "STORE_WHEELS" || input.stepKind === "VERIFY_STORAGE_LOCATION")
    ) {
      const owner = await client.query<{
        vehicle_id: string | null;
        customer_id: string | null;
      }>(`select vehicle_id, customer_id from tyra.tire_cases where org_ref = $1 and id = $2`, [
        input.orgRef,
        input.tireCaseId,
      ]);
      if (owner.rows[0]?.vehicle_id) {
        await upsertWheelSet(client, {
          orgRef: input.orgRef,
          customerId: owner.rows[0].customer_id,
          vehicleId: owner.rows[0].vehicle_id,
          status: "STORED",
          storageStatus: "STORED",
        });
      }
    }

    if (input.status === "DONE" && input.stepKind === "WASH") {
      await recordCaseEvent(client, {
        orgRef: input.orgRef,
        tireCaseId: input.tireCaseId,
        eventType: "WHEEL_WASH_COMPLETED",
        actorRef: input.actorRef,
        source: "TECHNICIAN",
      });
    }

    if (input.status === "DONE" && input.stepKind === "SWAP_ON_VEHICLE") {
      const vehicle = await client.query<{ vehicle_id: string | null }>(
        `select vehicle_id from tyra.tire_cases where org_ref = $1 and id = $2`,
        [input.orgRef, input.tireCaseId],
      );
      const vehicleId = vehicle.rows[0]?.vehicle_id;
      if (vehicleId) {
        const stored = await client.query<{ id: string }>(
          `select id from tyra.wheel_sets
            where org_ref = $1 and vehicle_id = $2 and storage_status = 'STORED'
            order by updated_at desc limit 1`,
          [input.orgRef, vehicleId],
        );
        const mounted = await client.query<{ id: string }>(
          `select id from tyra.wheel_sets
            where org_ref = $1 and vehicle_id = $2 and status = 'MOUNTED'
            order by updated_at desc limit 1`,
          [input.orgRef, vehicleId],
        );
        if (stored.rows[0]) {
          await client.query(
            `update tyra.wheel_sets
                set status = 'MOUNTED', storage_status = 'ON_VEHICLE', updated_at = now()
              where org_ref = $1 and id = $2`,
            [input.orgRef, stored.rows[0].id],
          );
        }
        if (mounted.rows[0]) {
          await client.query(
            `update tyra.wheel_sets
                set status = 'REMOVED', storage_status = 'RETURN_PENDING', updated_at = now()
              where org_ref = $1 and id = $2`,
            [input.orgRef, mounted.rows[0].id],
          );
        }
      }
    }

    const remaining = await client.query<{ id: string }>(
      `select id from tyra.tire_case_steps
        where org_ref = $1 and tire_case_id = $2 and required = true and status <> 'DONE'`,
      [input.orgRef, input.tireCaseId],
    );
    if (remaining.rowCount === 0) {
      const done = await client.query(
        `update tyra.tire_cases
            set case_status = 'DONE', work_status = 'DONE', updated_at = now()
          where org_ref = $1 and id = $2 and case_status <> 'DONE'`,
        [input.orgRef, input.tireCaseId],
      );
      completed = (done.rowCount ?? 0) > 0;
    } else if (input.status === "DOING" || input.status === "DONE") {
      await client.query(
        `update tyra.tire_cases
            set case_status = 'IN_PROGRESS', work_status = 'IN_PROGRESS', updated_at = now()
          where org_ref = $1 and id = $2 and case_status = 'OPEN'`,
        [input.orgRef, input.tireCaseId],
      );
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }

  if (completed) {
    await input.events.publish({
      system: "tyra",
      kind: "tyra.case.completed",
      orgRef: input.orgRef,
      actorKind: "user",
      actorRef: input.actorRef,
      subjectRef: `tyra:case:${input.tireCaseId}`,
      requestId: input.requestId,
      payload: { stepKind: input.stepKind },
    });
  }
}

async function upsertWheelSet(
  client: pg.PoolClient,
  input: {
    orgRef: string;
    customerId: string | null;
    vehicleId: string;
    status: string;
    storageStatus: string;
    storageCode?: string | null;
  },
): Promise<string> {
  const existing = await client.query<{ id: string }>(
    `select id from tyra.wheel_sets
      where org_ref = $1 and vehicle_id = $2
      order by updated_at desc
      limit 1`,
    [input.orgRef, input.vehicleId],
  );
  if (existing.rows[0]) {
    await client.query(
      `update tyra.wheel_sets
          set status = $3,
              storage_status = $4,
              customer_id = coalesce($5, customer_id),
              storage_code = coalesce($6, storage_code),
              updated_at = now()
        where org_ref = $1 and id = $2`,
      [
        input.orgRef,
        existing.rows[0].id,
        input.status,
        input.storageStatus,
        input.customerId,
        input.storageCode?.trim() || null,
      ],
    );
    return existing.rows[0].id;
  }
  const id = randomUUID();
  await client.query(
    `insert into tyra.wheel_sets
       (id, org_ref, customer_id, vehicle_id, season, wheel_count, status, storage_status, storage_code)
     values ($1,$2,$3,$4,'unknown',4,$5,$6,$7)`,
    [
      id,
      input.orgRef,
      input.customerId,
      input.vehicleId,
      input.status,
      input.storageStatus,
      input.storageCode?.trim() || null,
    ],
  );
  return id;
}

export async function updateCustomerContact(input: {
  pool: pg.Pool;
  orgRef: string;
  customerId: string;
  name: string;
  phone?: string;
  email?: string;
}): Promise<void> {
  const name = input.name.trim();
  if (!name) throw new Error("Kundnamn krävs.");
  const updated = await input.pool.query(
    `update tyra.customers
        set name = $3, phone = $4, email = $5
      where org_ref = $1 and id = $2`,
    [
      input.orgRef,
      input.customerId,
      name,
      input.phone?.trim() || null,
      input.email?.trim() || null,
    ],
  );
  if ((updated.rowCount ?? 0) === 0) throw new Error("Kunden saknas.");
}

export async function setCaseNotes(input: {
  pool: pg.Pool;
  orgRef: string;
  tireCaseId: string;
  notes: string;
}): Promise<void> {
  const updated = await input.pool.query(
    `update tyra.tire_cases
        set advisor_notes = $3, updated_at = now()
      where org_ref = $1 and id = $2`,
    [input.orgRef, input.tireCaseId, input.notes.trim() || null],
  );
  if ((updated.rowCount ?? 0) === 0) throw new Error("Ärendet saknas.");
}

export async function cancelCase(input: {
  pool: pg.Pool;
  orgRef: string;
  tireCaseId: string;
}): Promise<void> {
  await input.pool.query(
    `update tyra.tire_cases
        set case_status = 'CANCELLED', work_status = 'DONE', updated_at = now()
      where org_ref = $1 and id = $2 and case_status not in ('DONE', 'CANCELLED')`,
    [input.orgRef, input.tireCaseId],
  );
}

export async function assignStorageCode(input: {
  pool: pg.Pool;
  orgRef: string;
  actorRef: string;
  tireCaseId: string;
  storageCode: string;
}): Promise<void> {
  const code = input.storageCode.trim().toUpperCase();
  if (!code) throw new Error("Lagerplats krävs.");
  const client = await input.pool.connect();
  try {
    await client.query("begin");
    const owner = await client.query<{
      vehicle_id: string | null;
      customer_id: string | null;
    }>(`select vehicle_id, customer_id from tyra.tire_cases where org_ref = $1 and id = $2`, [
      input.orgRef,
      input.tireCaseId,
    ]);
    if (!owner.rows[0]?.vehicle_id) throw new Error("Ärendet saknar fordon.");
    await upsertWheelSet(client, {
      orgRef: input.orgRef,
      customerId: owner.rows[0].customer_id,
      vehicleId: owner.rows[0].vehicle_id,
      status: "STORED",
      storageStatus: "STORED",
      storageCode: code,
    });
    await client.query(
      `update tyra.tire_case_steps
          set status = 'DONE', updated_at = now()
        where org_ref = $1 and tire_case_id = $2 and step_kind = 'VERIFY_STORAGE_LOCATION'`,
      [input.orgRef, input.tireCaseId],
    );
    await recordCaseEvent(client, {
      orgRef: input.orgRef,
      tireCaseId: input.tireCaseId,
      eventType: "STORAGE_CODE_ASSIGNED",
      actorRef: input.actorRef,
      source: "WAREHOUSE",
      newValue: { storageCode: code },
    });
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function insertStep(
  client: pg.PoolClient,
  orgRef: string,
  tireCaseId: string,
  step: WorkflowStep,
  sortOrder: number,
): Promise<void> {
  await client.query(
    `insert into tyra.tire_case_steps (
       id, org_ref, tire_case_id, step_kind, title, status, required, requires, sort_order
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      randomUUID(),
      orgRef,
      tireCaseId,
      step.kind,
      step.title,
      step.status,
      step.required,
      JSON.stringify(step.requires ?? {}),
      sortOrder,
    ],
  );
}

async function recordCaseEvent(
  client: pg.PoolClient,
  input: {
    orgRef: string;
    tireCaseId: string;
    eventType: string;
    actorRef?: string | null;
    source: CaseEventSource;
    data?: unknown;
    previousValue?: unknown;
    newValue?: unknown;
  },
): Promise<void> {
  await client.query(
    `insert into tyra.tire_case_events (
       id, org_ref, tire_case_id, event_type, data, actor_ref, source, previous_value, new_value
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      randomUUID(),
      input.orgRef,
      input.tireCaseId,
      input.eventType,
      input.data ? JSON.stringify(input.data) : null,
      input.actorRef ?? null,
      input.source,
      input.previousValue ? JSON.stringify(input.previousValue) : null,
      input.newValue ? JSON.stringify(input.newValue) : null,
    ],
  );
}
