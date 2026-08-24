import { describe, expect, it } from "vitest";
import { assertBalanced, hashJournal } from "./journal.ts";
import { issueLinesToJournal } from "./invoices.ts";
import { buildLines } from "./invoices.ts";

describe("journal invariants (Cala doctrine)", () => {
  it("accepts a balanced issue posting", () => {
    const lines = buildLines([
      {
        description: "Hjulskifte",
        quantity: 1,
        unitNetOre: 10000,
        vatRateBps: 2500,
        kind: "service",
      },
    ]);
    expect(() => assertBalanced(issueLinesToJournal(lines))).not.toThrow();
  });

  it("rejects unbalanced and unknown accounts", () => {
    expect(() =>
      assertBalanced([
        { account: "1510", debitOre: 100, creditOre: 0 },
        { account: "3001", debitOre: 0, creditOre: 90 },
      ]),
    ).toThrow(/obalans/);
    expect(() => assertBalanced([{ account: "9999", debitOre: 100, creditOre: 0 }])).toThrow(
      /okänt konto/,
    );
  });

  it("chains hashes so a later edit would break the chain", () => {
    const a = hashJournal("0".repeat(64), [
      { account: "1510", debitOre: 100, creditOre: 0 },
      { account: "3001", debitOre: 0, creditOre: 100 },
    ]);
    const b = hashJournal(a, [
      { account: "1930", debitOre: 100, creditOre: 0 },
      { account: "1510", debitOre: 0, creditOre: 100 },
    ]);
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});
