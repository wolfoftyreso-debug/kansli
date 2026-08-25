import { afterEach, describe, expect, it } from "vitest";
import {
  loadRevolutStatement,
  statementFromTransactions,
  toInbound,
  toStatementLine,
} from "./revolut.ts";

const inbound = {
  id: "tx-in",
  type: "transfer",
  state: "completed",
  completed_at: "2026-08-20T10:00:00.000Z",
  reference: "INV-2026-0001",
  legs: [{ amount: 50, currency: "SEK", description: "in" }],
};

const outbound = {
  id: "tx-out",
  type: "card",
  state: "completed",
  completed_at: "2026-08-21T10:00:00.000Z",
  legs: [{ amount: -12.5, currency: "EUR", description: "kort" }],
};

const fakePool = {
  query: async () => ({ rows: [] }),
};

describe("Revolut statement mapping", () => {
  it("keeps outbound rows on the statement and skips them for invoice match", () => {
    const line = toStatementLine(outbound);
    expect(line).toEqual({
      id: "tx-out",
      type: "card",
      state: "completed",
      amountOre: -1250,
      currency: "EUR",
      reference: "kort",
      bookedAt: "2026-08-21T10:00:00.000Z",
      direction: "out",
    });
    expect(toInbound(outbound)).toBeNull();
    expect(toInbound(inbound)?.amountOre).toBe(5000);
  });

  it("sorts newest first and drops rows without legs", () => {
    const lines = statementFromTransactions([
      inbound,
      outbound,
      { id: "empty", type: "transfer", state: "pending" },
    ]);
    expect(lines.map((line) => line.id)).toEqual(["tx-out", "tx-in"]);
  });
});

describe("loadRevolutStatement", () => {
  const previous = process.env.REVOLUT_BUSINESS_TOKEN;

  afterEach(() => {
    if (previous === undefined) delete process.env.REVOLUT_BUSINESS_TOKEN;
    else process.env.REVOLUT_BUSINESS_TOKEN = previous;
  });

  it("stays empty without a token", async () => {
    delete process.env.REVOLUT_BUSINESS_TOKEN;
    const statement = await loadRevolutStatement({
      pool: fakePool as never,
      orgRef: "pixdrift:org:test",
    });
    expect(statement.hasToken).toBe(false);
    expect(statement.lines).toEqual([]);
    expect(statement.accounts).toEqual([]);
  });

  it("surfaces Revolut's refusal and does not invent rows", async () => {
    process.env.REVOLUT_BUSINESS_TOKEN = "oa_test_not_a_real_token_xxxx";
    const statement = await loadRevolutStatement({
      pool: fakePool as never,
      orgRef: "pixdrift:org:test",
      fetchAccounts: async () => {
        throw new Error("Revolut 401. Tokenen avvisades eller API:t är otillgängligt.");
      },
      fetchTx: async () => {
        throw new Error("Revolut 401. Tokenen avvisades eller API:t är otillgängligt.");
      },
    });
    expect(statement.hasToken).toBe(true);
    expect(statement.lines).toEqual([]);
    expect(statement.accounts).toEqual([]);
    expect(statement.error).toMatch(/401/);
  });

  it("returns live rows when Revolut answers", async () => {
    process.env.REVOLUT_BUSINESS_TOKEN = "oa_test_not_a_real_token_xxxx";
    const statement = await loadRevolutStatement({
      pool: fakePool as never,
      orgRef: "pixdrift:org:test",
      fetchAccounts: async () => [{ id: "acc-1", name: "Main", balance: 10, currency: "SEK" }],
      fetchTx: async () => [inbound],
    });
    expect(statement.source).toBe("revolut");
    expect(statement.error).toBeNull();
    expect(statement.accounts[0]?.balance).toBe(10);
    expect(statement.lines[0]?.id).toBe("tx-in");
  });
});
