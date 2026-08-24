import { randomUUID } from "node:crypto";
import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import { computeTireHealth } from "./tireHealth.ts";
import { computeTireWarnings, type TireWarning } from "./tireWarnings.ts";
import { generateOpaqueToken, hashTyraToken, tyraHubPath } from "./tokens.ts";

export type HubPositionView = {
  position: string;
  health: ReturnType<typeof computeTireHealth>;
  warnings: TireWarning[];
  pressureKpa: number | null;
  inflationState: string | null;
  fillGas: string | null;
  tyre: {
    brand: string | null;
    model: string | null;
    dimension: string | null;
    dotYear: number | null;
  };
};

export type HubView = {
  customerName: string;
  vehicle: {
    registrationNumber: string;
    make: string | null;
    model: string | null;
  } | null;
  positions: HubPositionView[];
  setWarnings: TireWarning[];
  commercialNote: string;
};

export async function issueHubLink(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  customerId: string;
  requestId: string;
}): Promise<{ token: string; path: string }> {
  const owned = await input.pool.query<{ id: string }>(
    `select id from tyra.customers where org_ref = $1 and id = $2 limit 1`,
    [input.orgRef, input.customerId],
  );
  if (!owned.rows[0]) throw new Error("Kunden saknas.");

  const token = generateOpaqueToken(24);
  const tokenHash = hashTyraToken(token);
  const id = randomUUID();
  await input.pool.query(
    `insert into tyra.customer_hub_links (id, org_ref, customer_id, token_hash)
     values ($1, $2, $3, $4)
     on conflict (org_ref, customer_id) do update
       set token_hash = excluded.token_hash,
           revoked_at = null,
           created_at = now()`,
    [id, input.orgRef, input.customerId, tokenHash],
  );

  await input.events.publish({
    system: "tyra",
    kind: "tyra.hub.link.issued",
    orgRef: input.orgRef,
    actorKind: "user",
    actorRef: input.actorRef,
    subjectRef: `tyra:customer:${input.customerId}`,
    requestId: input.requestId,
    payload: { customerId: input.customerId },
  });

  return { token, path: tyraHubPath(token) };
}

export async function getHubViewByToken(pool: pg.Pool, token: string): Promise<HubView | null> {
  const tokenHash = hashTyraToken(token);
  const linkRes = await pool.query<{ org_ref: string; customer_id: string }>(
    `select org_ref, customer_id from tyra.customer_hub_links
      where token_hash = $1 and revoked_at is null
      limit 1`,
    [tokenHash],
  );
  const link = linkRes.rows[0];
  if (!link) return null;

  await pool.query(
    `update tyra.customer_hub_links set last_used_at = now() where token_hash = $1`,
    [tokenHash],
  );

  const customer = await pool.query<{ name: string }>(
    `select name from tyra.customers where org_ref = $1 and id = $2 limit 1`,
    [link.org_ref, link.customer_id],
  );
  const customerName = customer.rows[0]?.name ?? "Kund";

  const vehicleRes = await pool.query<{
    id: string;
    registration_number: string;
    make: string | null;
    model: string | null;
  }>(
    `select id, registration_number, make, model
       from tyra.vehicles
      where org_ref = $1 and customer_id = $2
      order by created_at desc
      limit 1`,
    [link.org_ref, link.customer_id],
  );
  const vehicle = vehicleRes.rows[0];
  if (!vehicle) {
    return {
      customerName,
      vehicle: null,
      positions: [],
      setWarnings: [],
      commercialNote: "Inget fordon är kopplat ännu.",
    };
  }

  const wsRes = await pool.query<{ id: string; season: string }>(
    `select id, season from tyra.wheel_sets
      where org_ref = $1 and vehicle_id = $2 and status = 'MOUNTED'
      order by updated_at desc
      limit 1`,
    [link.org_ref, vehicle.id],
  );
  const wheelSetId = wsRes.rows[0]?.id ?? null;
  const mountedSeason = wsRes.rows[0]?.season ?? null;

  const posRows = wheelSetId
    ? await pool.query<{
        position: string;
        tread_depth_mm: string | null;
        tread_depth_source: string | null;
        confidence: string | null;
        verified: boolean;
        tyre_brand: string | null;
        tyre_model: string | null;
        tyre_dimension: string | null;
        dot_year: number | null;
        wear_pattern: string | null;
        damage_types: string[] | null;
        notes: string | null;
        valve_age_years: number | null;
        valve_condition: string | null;
        rim_severity: string | null;
        tyre_pressure_kpa: number | null;
        inflation_state: string | null;
        fill_gas: string | null;
      }>(
        `with latest as (
           select id from tyra.tire_inspections
            where org_ref = $1 and wheel_set_id = $2 and inspection_status = 'VERIFIED'
            order by captured_at desc
            limit 1
         )
         select tip.position,
                tip.tread_depth_mm,
                tip.tread_depth_source,
                tip.confidence,
                tip.verified,
                tip.tyre_brand,
                tip.tyre_model,
                tip.tyre_dimension,
                tip.dot_year,
                tip.wear_pattern,
                tip.damage_types,
                tip.notes,
                tip.valve_age_years,
                tip.valve_condition,
                tip.rim_severity,
                tip.tyre_pressure_kpa,
                tip.inflation_state,
                tip.fill_gas
           from tyra.tire_inspection_positions tip
           join latest on latest.id = tip.inspection_id
          where tip.org_ref = $1
          order by tip.position`,
        [link.org_ref, wheelSetId],
      )
    : { rows: [] };

  const positionInputs = posRows.rows.map((row) => ({
    position: row.position,
    verified: row.verified,
    treadDepthMm: row.tread_depth_mm == null ? null : Number(row.tread_depth_mm),
    tyreBrand: row.tyre_brand,
    tyreModel: row.tyre_model,
    tyreDimension: row.tyre_dimension,
    dotWeek: null,
    dotYear: row.dot_year,
    valveAgeYears: row.valve_age_years,
    valveCondition: row.valve_condition,
    rimSeverity: row.rim_severity,
    tyrePressureKpa: row.tyre_pressure_kpa,
    inflationState: row.inflation_state,
    wearPattern: row.wear_pattern,
    damageTypes: row.damage_types,
    notes: row.notes,
  }));

  const warnings = computeTireWarnings({
    positions: positionInputs,
    mountedSeason,
  });

  const positions: HubPositionView[] = posRows.rows.map((row) => {
    const tread = row.tread_depth_mm == null ? null : Number(row.tread_depth_mm);
    return {
      position: row.position,
      health: computeTireHealth({
        treadDepthMm: tread,
        treadDepthSource: row.tread_depth_source,
        confidence: row.confidence == null ? null : Number(row.confidence),
        verified: row.verified,
      }),
      warnings: warnings.positionWarnings[row.position] ?? [],
      pressureKpa: row.tyre_pressure_kpa,
      inflationState: row.inflation_state,
      fillGas: row.fill_gas,
      tyre: {
        brand: row.tyre_brand,
        model: row.tyre_model,
        dimension: row.tyre_dimension,
        dotYear: row.dot_year,
      },
    };
  });

  const blocked = warnings.setWarnings.some((item) => item.tone === "blocked");
  const attention = warnings.setWarnings.some((item) => item.tone === "attention");

  return {
    customerName,
    vehicle: {
      registrationNumber: vehicle.registration_number,
      make: vehicle.make,
      model: vehicle.model,
    },
    positions,
    setWarnings: warnings.setWarnings,
    commercialNote: blocked
      ? "Åtgärd behövs — verkstaden har markerat att däcken inte är i gott skick."
      : attention
        ? "Något behöver följas upp vid nästa besök."
        : positions.length === 0
          ? "Ingen verifierad inspektion finns ännu. Inga mätvärden visas."
          : "Inga varningar från den senaste verifierade inspektionen.",
  };
}
