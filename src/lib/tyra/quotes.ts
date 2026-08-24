import { randomUUID } from "node:crypto";
import type pg from "pg";
import { computeInstalledPrice, formatSekFromOre, type PricingSnapshot } from "./pricing.ts";

export type QuoteDraft = {
  id: string;
  tireCaseId: string;
  title: string;
  snapshot: PricingSnapshot;
  note: string;
  createdAt: string;
};

export async function saveQuoteDraft(input: {
  pool: pg.Pool;
  orgRef: string;
  tireCaseId: string;
  title: string;
  quantity: number;
  unitCostOre: number;
  installationOrePerTyre: number;
  environmentalOrePerTyre: number;
  markupPercent: number;
  note?: string;
}): Promise<QuoteDraft> {
  const owned = await input.pool.query<{ id: string }>(
    `select id from tyra.tire_cases where org_ref = $1 and id = $2 limit 1`,
    [input.orgRef, input.tireCaseId],
  );
  if (!owned.rows[0]) throw new Error("Ärendet saknas.");

  const now = new Date().toISOString();
  const snapshot = computeInstalledPrice({
    supplierPriceOre: input.unitCostOre,
    quantity: input.quantity,
    markupRule: { type: "percent", percent: input.markupPercent },
    installationPriceOrePerTyre: input.installationOrePerTyre,
    environmentalFeeOrePerTyre: input.environmentalOrePerTyre,
    supplier: null,
    supplierPriceTimestampIso: now,
    generatedAtIso: now,
  });

  const id = randomUUID();
  const title = input.title.trim() || "Offertutkast";
  const note = (input.note ?? "").trim();
  await input.pool.query(
    `insert into tyra.quote_drafts
       (id, org_ref, tire_case_id, title, quantity, unit_cost_ore, installation_ore,
        environmental_ore, markup_percent, total_ore, snapshot, note)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12)`,
    [
      id,
      input.orgRef,
      input.tireCaseId,
      title,
      snapshot.quantity,
      snapshot.supplierPriceOre,
      snapshot.installationPriceOre,
      snapshot.environmentalFeeOre,
      input.markupPercent,
      snapshot.totalCustomerPriceOre,
      JSON.stringify(snapshot),
      note || null,
    ],
  );
  await input.pool.query(
    `update tyra.tire_cases
        set commercial_status = 'QUOTE_READY', updated_at = now()
      where org_ref = $1 and id = $2`,
    [input.orgRef, input.tireCaseId],
  );
  return {
    id,
    tireCaseId: input.tireCaseId,
    title,
    snapshot,
    note,
    createdAt: now,
  };
}

export async function listQuoteDrafts(
  pool: pg.Pool,
  orgRef: string,
  tireCaseId: string,
): Promise<QuoteDraft[]> {
  const { rows } = await pool.query<{
    id: string;
    tire_case_id: string;
    title: string;
    snapshot: PricingSnapshot;
    note: string | null;
    created_at: Date;
  }>(
    `select id, tire_case_id, title, snapshot, note, created_at
       from tyra.quote_drafts
      where org_ref = $1 and tire_case_id = $2
      order by created_at desc`,
    [orgRef, tireCaseId],
  );
  return rows.map((row) => ({
    id: row.id,
    tireCaseId: row.tire_case_id,
    title: row.title,
    snapshot: row.snapshot,
    note: row.note ?? "",
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

export { formatSekFromOre };
