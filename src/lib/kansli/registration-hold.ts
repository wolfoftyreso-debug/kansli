import type pg from "pg";

export interface RegistrationHold {
  invoiceNumber: string;
  dueAt: string;
  grossOre: number;
  paidOre: number;
}

/**
 * Pay the registration invoice within ten days and everything keeps working.
 * When it goes overdue unpaid, the rooms go on hold until it is settled in
 * Ekonomi. Only registration invoices (source_system = 'kansli') count —
 * the customer's own invoicing never locks them out.
 */
export async function registrationHold(
  pool: pg.Pool,
  orgRef: string,
): Promise<RegistrationHold | null> {
  const { rows } = await pool.query<{
    number: string;
    due_at: Date;
    gross_ore: string;
    paid_ore: string;
  }>(
    `select number, due_at, gross_ore, paid_ore
       from ekonomi.invoices
      where org_ref = $1
        and source_system = 'kansli'
        and status in ('issued', 'part_paid')
        and due_at is not null
        and due_at < now()
      order by due_at asc
      limit 1`,
    [orgRef],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    invoiceNumber: row.number,
    dueAt: new Date(row.due_at).toISOString(),
    grossOre: Number(row.gross_ore),
    paidOre: Number(row.paid_ore),
  };
}
