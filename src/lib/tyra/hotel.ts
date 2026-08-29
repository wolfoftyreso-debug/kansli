import type pg from "pg";
import { DEFAULT_LOCALE, type Locale } from "../i18n/index.ts";
import { buildCustomerCard, type CustomerCard } from "./crm.ts";

export async function listCustomerCards(
  pool: pg.Pool,
  orgRef: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<CustomerCard[]> {
  const customers = await pool.query<{ id: string; name: string }>(
    `select id, name from tyra.customers where org_ref = $1 order by lower(name) asc`,
    [orgRef],
  );
  if (customers.rowCount === 0) return [];

  const vehicles = await pool.query<{
    id: string;
    customer_id: string | null;
    registration_number: string;
    make: string | null;
    model: string | null;
    model_year: number | null;
  }>(
    `select id, customer_id, registration_number, make, model, model_year
       from tyra.vehicles where org_ref = $1`,
    [orgRef],
  );
  const wheelSets = await pool.query<{
    id: string;
    customer_id: string | null;
    vehicle_id: string | null;
    season: string;
    status: string;
    storage_status: string;
    storage_code: string | null;
  }>(
    `select id, customer_id, vehicle_id, season, status, storage_status,
            coalesce(storage_code, null) as storage_code
       from tyra.wheel_sets where org_ref = $1`,
    [orgRef],
  );

  return customers.rows.map((customer) => {
    const ownedVehicles = vehicles.rows.filter((row) => row.customer_id === customer.id);
    const ownedIds = new Set(ownedVehicles.map((row) => row.id));
    const ownedSets = wheelSets.rows.filter(
      (row) => row.customer_id === customer.id || (row.vehicle_id && ownedIds.has(row.vehicle_id)),
    );
    return buildCustomerCard({
      locale,
      customer: { id: customer.id, name: customer.name },
      vehicles: ownedVehicles.map((row) => ({
        id: row.id,
        registrationNumber: row.registration_number,
        make: row.make,
        model: row.model,
        modelYear: row.model_year,
      })),
      wheelSets: ownedSets.map((row) => ({
        id: row.id,
        vehicleId: row.vehicle_id,
        season: row.season,
        status: row.status,
        storageStatus: row.storage_status,
        storageCode: row.storage_code,
      })),
      opportunities: [],
    });
  });
}

export type CaseTimelineEvent = {
  eventType: string;
  source: string;
  createdAt: string;
};

export async function listCaseEvents(
  pool: pg.Pool,
  orgRef: string,
  tireCaseId: string,
): Promise<CaseTimelineEvent[]> {
  const { rows } = await pool.query<{
    event_type: string;
    source: string;
    created_at: Date;
  }>(
    `select event_type, source, created_at
       from tyra.tire_case_events
      where org_ref = $1 and tire_case_id = $2
      order by created_at desc
      limit 40`,
    [orgRef, tireCaseId],
  );
  return rows.map((row) => ({
    eventType: row.event_type,
    source: row.source,
    createdAt: new Date(row.created_at).toISOString(),
  }));
}
