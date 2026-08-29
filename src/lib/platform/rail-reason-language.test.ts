import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { railSnapshot } from "../ekonomi/rails.ts";

describe("payment-rail reason language", () => {
  it("uses English-canonical rail reasons like the API layer", () => {
    const source = readFileSync("src/lib/ekonomi/rails.ts", "utf8");
    const empty = railSnapshot({ NODE_ENV: "test" } as NodeJS.ProcessEnv);
    expect(empty.invoice_10.reason).toBe("Works immediately. The customer pays by the due date.");
    expect(empty.stripe.reason).toBe(
      "Stripe is not connected. Card payment cannot be offered yet.",
    );
    expect(empty.revolut.reason).toBe(
      "Revolut is not connected. Connect under Connections — then it takes care of itself.",
    );
    expect(empty.swish.reason).toBe(
      "Swish is not connected. It needs a certificate from the bank — we never show a QR code that does not work.",
    );
    expect(source).not.toContain("Stripe är inte inkopplat.");
    expect(source).not.toContain("Fungerar direkt.");
    expect(source).not.toContain("Revolut är inte anslutet.");
  });

  it("keeps connected-state reasons English-canonical", () => {
    const stripe = railSnapshot({ STRIPE_SECRET_KEY: "sk_test_x" } as NodeJS.ProcessEnv);
    expect(stripe.stripe.reason).toBe(
      "Stripe is connected. Payments are real — nothing is simulated.",
    );
    const merchant = railSnapshot({
      REVOLUT_MERCHANT_SECRET: "merch",
    } as NodeJS.ProcessEnv);
    expect(merchant.revolut.reason).toBe(
      "The Merchant connection is there. Statements are missing.",
    );
    const business = railSnapshot({
      REVOLUT_BUSINESS_TOKEN: "oa_x",
    } as NodeJS.ProcessEnv);
    expect(business.revolut.reason).toMatch(/Statements and matching work/);
    const swish = railSnapshot({ SWISH_PAYEE_ALIAS: "123" } as NodeJS.ProcessEnv);
    expect(swish.swish.reason).toMatch(/Swish Handel connection is not ready/);
  });

  it("leaves rail labels and invoice-book throws as written", () => {
    expect(readFileSync("src/lib/ekonomi/rails.ts", "utf8")).toContain('label: "Faktura 10 dagar"');
    expect(readFileSync("src/lib/ekonomi/payments.ts", "utf8")).toContain(
      "bara utfärdade fakturor kan få en betalning.",
    );
  });
});
