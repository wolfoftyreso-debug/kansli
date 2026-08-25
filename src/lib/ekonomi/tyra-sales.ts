import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import { netOreFromGross } from "./money.ts";
import { bookSale, findInvoiceBySource, type Invoice } from "./invoices.ts";

export type UnbookedTyraQuote = {
  id: string;
  tireCaseId: string;
  title: string;
  customerName: string;
  totalCustomerPriceOre: number;
  createdAt: string;
};

/**
 * Ekonomi reads TYRA quotes and writes only ekonomi invoices.
 * Customer price is treated as including 25 % VAT (workshop consumer price).
 * Tires are booked as goods. Live supplier prices are not invented.
 */
export async function listUnbookedTyraQuotes(
  pool: pg.Pool,
  orgRef: string,
  tireCaseId?: string,
): Promise<UnbookedTyraQuote[]> {
  const { rows } = await pool.query<{
    id: string;
    tire_case_id: string;
    title: string;
    customer_name: string | null;
    total_ore: number;
    created_at: Date;
  }>(
    `select q.id,
            q.tire_case_id,
            q.title,
            c.name as customer_name,
            q.total_ore,
            q.created_at
       from tyra.quote_drafts q
       join tyra.tire_cases tc
         on tc.id = q.tire_case_id and tc.org_ref = q.org_ref
       left join tyra.customers c
         on c.id = tc.customer_id and c.org_ref = q.org_ref
      where q.org_ref = $1
        and ($2::text is null or q.tire_case_id = $2)
        and not exists (
          select 1 from ekonomi.invoices i
           where i.org_ref = q.org_ref
             and i.source_system = 'tyra'
             and i.source_ref = q.id
        )
      order by q.created_at desc`,
    [orgRef, tireCaseId ?? null],
  );
  return rows.map((row) => ({
    id: row.id,
    tireCaseId: row.tire_case_id,
    title: row.title,
    customerName: row.customer_name?.trim() || "Kund saknas",
    totalCustomerPriceOre: Number(row.total_ore),
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

export type BookedTyraQuote = {
  quoteId: string;
  invoiceId: string;
  invoiceNumber: string;
};

export async function listBookedTyraQuotes(
  pool: pg.Pool,
  orgRef: string,
  tireCaseId: string,
): Promise<BookedTyraQuote[]> {
  const { rows } = await pool.query<{
    source_ref: string;
    id: string;
    number: string;
  }>(
    `select i.source_ref, i.id, i.number
       from ekonomi.invoices i
       join tyra.quote_drafts q
         on q.id = i.source_ref and q.org_ref = i.org_ref
      where i.org_ref = $1
        and i.source_system = 'tyra'
        and q.tire_case_id = $2
      order by i.created_at desc`,
    [orgRef, tireCaseId],
  );
  return rows.map((row) => ({
    quoteId: row.source_ref,
    invoiceId: row.id,
    invoiceNumber: row.number,
  }));
}

export async function bookTyraQuote(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  quoteId: string;
  requestId: string;
}): Promise<Invoice> {
  const quoteId = input.quoteId.trim();
  if (!quoteId) throw new Error("offerten saknas.");
  const existing = await findInvoiceBySource(input.pool, input.orgRef, "tyra", quoteId);
  if (existing) throw new Error("offerten är redan bokad.");

  const { rows } = await input.pool.query<{
    id: string;
    title: string;
    total_ore: number;
    customer_name: string | null;
  }>(
    `select q.id, q.title, q.total_ore, c.name as customer_name
       from tyra.quote_drafts q
       join tyra.tire_cases tc
         on tc.id = q.tire_case_id and tc.org_ref = q.org_ref
       left join tyra.customers c
         on c.id = tc.customer_id and c.org_ref = q.org_ref
      where q.org_ref = $1 and q.id = $2
      limit 1`,
    [input.orgRef, quoteId],
  );
  const quote = rows[0];
  if (!quote) throw new Error("offerten finns inte.");
  const customerName = quote.customer_name?.trim();
  if (!customerName) throw new Error("kunden saknas på ärendet.");

  const grossOre = Number(quote.total_ore);
  const unitNetOre = netOreFromGross(grossOre, 2500, "offertens kundpris");
  return bookSale({
    pool: input.pool,
    events: input.events,
    orgRef: input.orgRef,
    actorRef: input.actorRef,
    customerName,
    sourceSystem: "tyra",
    sourceRef: quote.id,
    requestId: input.requestId,
    lines: [
      {
        description: quote.title.trim() || "Däck",
        quantity: 1,
        unitNetOre,
        vatRateBps: 2500,
        kind: "goods",
      },
    ],
  });
}
