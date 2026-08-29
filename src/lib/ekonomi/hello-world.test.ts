import { afterAll, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import { CONNECTORS } from "./connectors.ts";
import { accountBalance, listTransactions } from "./journal.ts";
import { createDraftInvoice, getInvoice, issueInvoice, remainingOre } from "./invoices.ts";
import { offerPayment, recordReceivedPayment } from "./payments.ts";
import { railSnapshot } from "./rails.ts";
import { agedReceivables, vatReport } from "./reports.ts";
import { listSalesAlerts } from "./sales-alerts.ts";
import { buildDailyLedger } from "./series.ts";

const OWNER = process.env.PIXDRIFT_TEST_OWNER_URL ?? process.env.PIXDRIFT_DB_OWNER_URL;
const APP = process.env.PIXDRIFT_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const live = OWNER && APP ? describe : describe.skip;

live("ekonomi hello-world (live Postgres)", () => {
  const pool = createPool(APP!, { applicationName: "ekonomi-hello-world", max: 2 });

  afterAll(async () => {
    await pool.end();
  });

  it("books 12 % VAT, a part payment, and refuses to invent Visma or Stripe", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    const orgRef = `pixdrift:org:ekonomi-hello-${Date.now()}`;

    expect(CONNECTORS).not.toContain("visma");
    await expect(
      createDraftInvoice({
        pool,
        events,
        orgRef,
        actorRef: "user-hello",
        customerName: "Bilia Landvetter",
        lines: [
          {
            description: "Bok 6 procent",
            quantity: 1,
            unitNetOre: 1000,
            vatRateBps: 600,
            kind: "service",
          },
        ],
        requestId: "hello-vat6",
      }),
    ).rejects.toThrow(/12 eller 25/);
    const emptyEnv = { NODE_ENV: "test" } as NodeJS.ProcessEnv;
    expect(railSnapshot(emptyEnv).stripe.offerable).toBe(false);
    expect(railSnapshot(emptyEnv).swish.offerable).toBe(false);

    const draft = await createDraftInvoice({
      pool,
      events,
      orgRef,
      actorRef: "user-hello",
      customerName: "Bilia Landvetter",
      sourceSystem: "tyra",
      sourceRef: "hello-world-visma-prep",
      lines: [
        {
          description: "Däckhotell vinter",
          quantity: 1,
          unitNetOre: 8_000,
          vatRateBps: 1200,
          kind: "service",
        },
      ],
      requestId: "hello-draft",
    });
    expect(draft.status).toBe("draft");
    expect(draft.grossOre).toBe(8_960);
    expect(buildDailyLedger([draft], []).length).toBe(0);
    expect(vatReport([draft], new Date("2020-01-01"), new Date("2030-01-01"))).toEqual([]);

    const issued = await issueInvoice({
      pool,
      events,
      orgRef,
      actorRef: "user-hello",
      invoiceId: draft.id,
      dueDays: 10,
      requestId: "hello-issue",
    });
    expect(issued.status).toBe("issued");
    expect(await accountBalance(pool, orgRef, "1510")).toBe(8_960);
    expect(await accountBalance(pool, orgRef, "3002")).toBe(-8_000);
    expect(await accountBalance(pool, orgRef, "2614")).toBe(-960);
    expect(await listSalesAlerts(pool, orgRef)).toEqual([]);

    const stripeOffer = await offerPayment({
      pool,
      orgRef,
      invoiceId: issued.id,
      rail: "stripe",
    });
    expect(stripeOffer.status).toBe("blocked");
    expect(stripeOffer.note).toMatch(/Stripe is not connected/);

    const first = await recordReceivedPayment({
      pool,
      events,
      orgRef,
      actorRef: "user-hello",
      invoiceId: issued.id,
      rail: "invoice_10",
      amountOre: 4_000,
      externalRef: "hello-part",
      requestId: "hello-pay-1",
    });
    expect(first.status).toBe("received");
    const midway = await getInvoice(pool, orgRef, issued.id);
    expect(midway?.status).toBe("part_paid");
    expect(remainingOre(midway!)).toBe(4_960);

    const rest = await recordReceivedPayment({
      pool,
      events,
      orgRef,
      actorRef: "user-hello",
      invoiceId: issued.id,
      rail: "invoice_10",
      amountOre: 4_960,
      externalRef: "hello-rest",
      requestId: "hello-pay-2",
    });
    expect(rest.status).toBe("received");
    const paid = await getInvoice(pool, orgRef, issued.id);
    expect(paid?.status).toBe("paid");
    expect(remainingOre(paid!)).toBe(0);
    expect(await accountBalance(pool, orgRef, "1510")).toBe(0);
    expect(await accountBalance(pool, orgRef, "1910")).toBe(8_960);

    const vat = vatReport([paid!], new Date("2020-01-01"), new Date("2030-01-01"));
    expect(vat).toEqual([{ rateBps: 1200, netOre: 8_000, vatOre: 960 }]);
    expect(agedReceivables([paid!]).openCount).toBe(0);

    const journal = await listTransactions(pool, orgRef);
    expect(journal).toHaveLength(3);
    expect(journal.map((row) => row.template)).toEqual([
      "RECORD_PAYMENT",
      "RECORD_PAYMENT",
      "ISSUE_INVOICE",
    ]);
    const chain = await pool.query<{ hash: string; prev_hash: string }>(
      `select hash, prev_hash from ekonomi.transactions
        where org_ref = $1 order by created_at asc`,
      [orgRef],
    );
    expect(chain.rows).toHaveLength(3);
    expect(chain.rows[1]?.prev_hash).toBe(chain.rows[0]?.hash);
    expect(chain.rows[2]?.prev_hash).toBe(chain.rows[1]?.hash);

    const points = buildDailyLedger(
      [paid!],
      [
        {
          id: first.id,
          invoiceId: paid!.id,
          rail: "invoice_10",
          status: "received",
          amountOre: 4_000,
          currency: "SEK",
          externalRef: "hello-part",
          receivedAt: first.receivedAt,
          transactionId: first.transactionId,
          note: null,
          createdAt: first.createdAt,
        },
        {
          id: rest.id,
          invoiceId: paid!.id,
          rail: "invoice_10",
          status: "received",
          amountOre: 4_960,
          currency: "SEK",
          externalRef: "hello-rest",
          receivedAt: rest.receivedAt,
          transactionId: rest.transactionId,
          note: null,
          createdAt: rest.createdAt,
        },
      ],
    );
    expect(points.at(-1)?.salesCumOre).toBe(8_960);
    expect(points.at(-1)?.receivedCumOre).toBe(8_960);
  });
});
