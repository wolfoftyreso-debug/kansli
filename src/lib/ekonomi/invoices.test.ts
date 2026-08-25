import { afterAll, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import { accountBalance } from "./journal.ts";
import {
  bookSale,
  createDraftInvoice,
  getInvoice,
  issueInvoice,
  parseInvoiceLinesFromForm,
} from "./invoices.ts";
import { bookTyraQuote, listUnbookedTyraQuotes } from "./tyra-sales.ts";
import { createCase } from "../tyra/cases.ts";
import { saveQuoteDraft } from "../tyra/quotes.ts";
import { recordReceivedPayment } from "./payments.ts";
import { encryptSecret, last4Of } from "./connectors.ts";
import { syncRevolut } from "./revolut.ts";
import { vatReport } from "./reports.ts";

describe("invoice form lines", () => {
  it("prefers kronor and still accepts öre", () => {
    expect(
      parseInvoiceLinesFromForm({
        descriptions: ["Hjulskifte", ""],
        quantities: ["1", "2"],
        unitNetKronor: ["2500", ""],
        vatRates: ["2500", "2500"],
        kinds: ["service", "service"],
      }),
    ).toEqual([
      {
        description: "Hjulskifte",
        quantity: 1,
        unitNetOre: 250_000,
        vatRateBps: 2500,
        kind: "service",
      },
    ]);
    expect(
      parseInvoiceLinesFromForm({
        descriptions: ["Lagring"],
        quantities: ["1"],
        unitNetOre: ["4000"],
        vatRates: ["2500"],
        kinds: ["service"],
      })[0]?.unitNetOre,
    ).toBe(4000);
  });
});

describe("connector wrapping", () => {
  it("never returns the raw token from last4", () => {
    const token = "sk_test_this_is_not_a_real_key_1234";
    expect(last4Of(token)).toBe("1234");
    expect(last4Of(token)).not.toContain("sk_test");
  });
});

const OWNER = process.env.PIXDRIFT_TEST_OWNER_URL ?? process.env.PIXDRIFT_DB_OWNER_URL;
const APP = process.env.PIXDRIFT_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const live = OWNER && APP ? describe : describe.skip;

live("ekonomi ledger (live Postgres)", () => {
  const pool = createPool(APP!, { applicationName: "ekonomi-test", max: 2 });

  afterAll(async () => {
    await pool.end();
  });

  it("issues an invoice, books VAT, then books a 10-day payment", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    const orgRef = `pixdrift:org:ekonomi-${Date.now()}`;
    const draft = await createDraftInvoice({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      customerName: "Holm AB",
      lines: [
        {
          description: "Hjulskifte",
          quantity: 1,
          unitNetOre: 10000,
          vatRateBps: 2500,
          kind: "service",
        },
      ],
      sourceSystem: "tyra",
      sourceRef: "case-demo",
      requestId: "req-inv-1",
    });
    expect(draft.status).toBe("draft");
    expect(draft.grossOre).toBe(12500);

    const issued = await issueInvoice({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      invoiceId: draft.id,
      dueDays: 10,
      requestId: "req-inv-2",
    });
    expect(issued.status).toBe("issued");
    expect(issued.dueAt).toBeTruthy();
    expect(await accountBalance(pool, orgRef, "1510")).toBe(12500);
    expect(await accountBalance(pool, orgRef, "3001")).toBe(-10000);
    expect(await accountBalance(pool, orgRef, "2610")).toBe(-2500);

    const paid = await recordReceivedPayment({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      invoiceId: issued.id,
      rail: "invoice_10",
      amountOre: 12500,
      externalRef: "manual-1",
      requestId: "req-pay-1",
    });
    expect(paid.status).toBe("received");
    const after = await getInvoice(pool, orgRef, issued.id);
    expect(after?.status).toBe("paid");
    expect(await accountBalance(pool, orgRef, "1510")).toBe(0);
    expect(await accountBalance(pool, orgRef, "1910")).toBe(12500);

    const vat = vatReport([after!], new Date("2020-01-01"), new Date("2030-01-01"));
    expect(vat).toEqual([{ rateBps: 2500, netOre: 10000, vatOre: 2500 }]);
  });

  it("blocks Revolut sync without a token and matches when a fixture lands", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    const orgRef = `pixdrift:org:ekonomi-rev-${Date.now()}`;
    const blocked = await syncRevolut({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      requestId: "req-rev-0",
    });
    expect(blocked.blocked).toBe(true);

    if (!process.env.APP_SESSION_SECRET && !process.env.EKONOMI_WRAP_KEY) {
      process.env.APP_SESSION_SECRET = "ekonomi-test-wrap-key-not-for-prod";
    }
    const { ciphertext } = encryptSecret("revolut_test_token_xxxx");
    await pool.query(
      `insert into ekonomi.connectors (org_ref, provider, ciphertext, last4, env_key)
       values ($1,'revolut_business',$2,'xxxx','REVOLUT_BUSINESS_TOKEN')`,
      [orgRef, ciphertext],
    );
    const draft = await createDraftInvoice({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      customerName: "Holm AB",
      lines: [
        {
          description: "Lagring",
          quantity: 1,
          unitNetOre: 4000,
          vatRateBps: 2500,
          kind: "service",
        },
      ],
      requestId: "req-rev-1",
    });
    const issued = await issueInvoice({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      invoiceId: draft.id,
      requestId: "req-rev-2",
    });
    const result = await syncRevolut({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      requestId: "req-rev-3",
      fetchTx: async () => [
        {
          id: "rev-1",
          type: "transfer",
          state: "completed",
          reference: issued.number,
          legs: [{ amount: 50, currency: "SEK" }],
        },
      ],
    });
    expect(result.blocked).toBe(false);
    expect(result.matched).toBe(1);
    expect((await getInvoice(pool, orgRef, issued.id))?.status).toBe("paid");
  });

  it("books a sale in one step and refuses a second book of the same TYRA quote", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    const orgRef = `pixdrift:org:ekonomi-book-${Date.now()}`;
    const booked = await bookSale({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      customerName: "Holm AB",
      lines: [
        {
          description: "Hjulskifte",
          quantity: 1,
          unitNetOre: 10_000,
          vatRateBps: 2500,
          kind: "service",
        },
      ],
      requestId: "req-book-1",
    });
    expect(booked.status).toBe("issued");
    expect(booked.grossOre).toBe(12_500);
    expect(await accountBalance(pool, orgRef, "1510")).toBe(12_500);

    const created = await createCase({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      customerName: "Erik",
      registrationNumber: "BOOK01",
      intent: "QUOTE_ONLY",
      operations: ["TIRE_QUOTE"],
      requestId: "req-tyra-book-case",
    });
    const quote = await saveQuoteDraft({
      pool,
      orgRef,
      tireCaseId: created.id,
      title: "Vinterdäck",
      quantity: 4,
      unitCostOre: 120_000,
      installationOrePerTyre: 15_000,
      environmentalOrePerTyre: 2_500,
      markupPercent: 20,
    });
    const waiting = await listUnbookedTyraQuotes(pool, orgRef);
    expect(waiting.map((row) => row.id)).toContain(quote.id);

    const fromQuote = await bookTyraQuote({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      quoteId: quote.id,
      requestId: "req-tyra-book-1",
    });
    expect(fromQuote.status).toBe("issued");
    expect(fromQuote.sourceSystem).toBe("tyra");
    expect(fromQuote.sourceRef).toBe(quote.id);
    expect(fromQuote.customerName).toBe("Erik");
    expect(fromQuote.grossOre).toBe(quote.snapshot.totalCustomerPriceOre);
    expect(fromQuote.lines[0]?.kind).toBe("goods");
    expect(await listUnbookedTyraQuotes(pool, orgRef)).toHaveLength(0);

    await expect(
      bookTyraQuote({
        pool,
        events,
        orgRef,
        actorRef: "user-test",
        quoteId: quote.id,
        requestId: "req-tyra-book-2",
      }),
    ).rejects.toThrow(/redan bokad/);
  });
});
