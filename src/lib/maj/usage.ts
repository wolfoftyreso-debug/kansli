import { randomUUID } from "node:crypto";
import type pg from "pg";

/**
 * Usage is COGS. Every external call is booked to the ledger BEFORE it is
 * made — the ledger is the budget, not an afterthought. Meters are
 * capability-named, never vendor-named.
 */

export const MAJ_METERS = ["vendor_units", "llm_tokens", "crawl_ms", "jobs"] as const;
export type MajMeter = (typeof MAJ_METERS)[number];

export async function bookUsage(input: {
  pool: pg.Pool;
  orgRef: string;
  projectId?: string | null;
  meter: MajMeter;
  amount: number;
  note?: string;
}): Promise<void> {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error("Usage is booked in positive integers.");
  }
  await input.pool.query(
    `insert into maj.usage_ledger (id, org_ref, project_id, meter, amount, note)
     values ($1,$2,$3,$4,$5,$6)`,
    [
      randomUUID(),
      input.orgRef,
      input.projectId ?? null,
      input.meter,
      input.amount,
      input.note ?? null,
    ],
  );
}

export async function usageTotals(
  pool: pg.Pool,
  orgRef: string,
  projectId?: string,
): Promise<Record<MajMeter, number>> {
  const { rows } = await pool.query<{ meter: string; total: string }>(
    projectId
      ? `select meter, sum(amount)::text as total from maj.usage_ledger
          where org_ref = $1 and project_id = $2 group by meter`
      : `select meter, sum(amount)::text as total from maj.usage_ledger
          where org_ref = $1 group by meter`,
    projectId ? [orgRef, projectId] : [orgRef],
  );
  const totals = { vendor_units: 0, llm_tokens: 0, crawl_ms: 0, jobs: 0 } as Record<
    MajMeter,
    number
  >;
  for (const row of rows) {
    if ((MAJ_METERS as readonly string[]).includes(row.meter)) {
      totals[row.meter as MajMeter] = Number(row.total);
    }
  }
  return totals;
}
