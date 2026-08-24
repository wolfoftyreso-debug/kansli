import { randomUUID } from "node:crypto";
import type pg from "pg";

export const INSPECTION_POSITIONS = ["LF", "RF", "LR", "RR"] as const;
export type InspectionPosition = (typeof INSPECTION_POSITIONS)[number];

export type TreadReading = {
  position: InspectionPosition;
  treadDepthMm: number;
};

export async function recordVerifiedInspection(input: {
  pool: pg.Pool;
  orgRef: string;
  actorRef: string;
  tireCaseId: string;
  readings: TreadReading[];
}): Promise<{ inspectionId: string; wheelSetId: string }> {
  const caseRow = await input.pool.query<{
    customer_id: string | null;
    vehicle_id: string | null;
  }>(
    `select customer_id, vehicle_id from tyra.tire_cases
      where org_ref = $1 and id = $2 limit 1`,
    [input.orgRef, input.tireCaseId],
  );
  const vehicleId = caseRow.rows[0]?.vehicle_id;
  if (!vehicleId) throw new Error("Ärendet saknar fordon.");

  let wheelSetId = (
    await input.pool.query<{ id: string }>(
      `select id from tyra.wheel_sets
        where org_ref = $1 and vehicle_id = $2
        order by case when status = 'MOUNTED' then 0 else 1 end, updated_at desc
        limit 1`,
      [input.orgRef, vehicleId],
    )
  ).rows[0]?.id;

  if (!wheelSetId) {
    wheelSetId = randomUUID();
    await input.pool.query(
      `insert into tyra.wheel_sets
         (id, org_ref, customer_id, vehicle_id, season, wheel_count, status, storage_status)
       values ($1,$2,$3,$4,'unknown',4,'MOUNTED','ON_VEHICLE')`,
      [wheelSetId, input.orgRef, caseRow.rows[0]?.customer_id ?? null, vehicleId],
    );
  }

  const inspectionId = randomUUID();
  await input.pool.query(
    `insert into tyra.tire_inspections
       (id, org_ref, customer_id, vehicle_id, wheel_set_id, tire_case_id,
        captured_by_ref, source, inspection_status)
     values ($1,$2,$3,$4,$5,$6,$7,'PHYSICAL_INSPECTION','VERIFIED')`,
    [
      inspectionId,
      input.orgRef,
      caseRow.rows[0]?.customer_id ?? null,
      vehicleId,
      wheelSetId,
      input.tireCaseId,
      input.actorRef,
    ],
  );

  for (const reading of input.readings) {
    await input.pool.query(
      `insert into tyra.tire_inspection_positions
         (id, org_ref, inspection_id, position, tread_depth_mm, tread_depth_source,
          verified, verified_by_ref, verified_at)
       values ($1,$2,$3,$4,$5,'TECHNICIAN',true,$6,now())`,
      [
        randomUUID(),
        input.orgRef,
        inspectionId,
        reading.position,
        reading.treadDepthMm,
        input.actorRef,
      ],
    );
  }

  await input.pool.query(
    `update tyra.tire_case_steps
        set status = 'DONE', updated_at = now()
      where org_ref = $1 and tire_case_id = $2 and step_kind = 'MEASURE_TREAD'`,
    [input.orgRef, input.tireCaseId],
  );

  return { inspectionId, wheelSetId };
}

export function parseTreadReadings(formData: FormData): TreadReading[] {
  const readings: TreadReading[] = [];
  for (const position of INSPECTION_POSITIONS) {
    const raw = String(formData.get(`tread_${position}`) ?? "")
      .trim()
      .replace(",", ".");
    if (!raw) continue;
    const treadDepthMm = Number(raw);
    if (!Number.isFinite(treadDepthMm) || treadDepthMm < 0 || treadDepthMm > 20) {
      throw new Error(`Ogiltigt mönsterdjup för ${position}.`);
    }
    readings.push({ position, treadDepthMm });
  }
  if (readings.length !== INSPECTION_POSITIONS.length) {
    throw new Error("Alla fyra positioner krävs (LF, RF, LR, RR).");
  }
  return readings;
}
