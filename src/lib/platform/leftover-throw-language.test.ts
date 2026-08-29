import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { encryptSecret, saveConnectorSecret } from "../ekonomi/connectors.ts";
import { bookUsage } from "../maj/usage.ts";

describe("leftover unlocked machine-throw language", () => {
  it("uses English-canonical leftover throws like the API layer", () => {
    const ai = readFileSync("src/lib/platform/ai.ts", "utf8");
    const connectors = readFileSync("src/lib/ekonomi/connectors.ts", "utf8");
    const actions = readFileSync("src/app/ekonomi/actions.ts", "utf8");
    const inquiries = readFileSync("src/lib/creditae/inquiries.ts", "utf8");
    const usage = readFileSync("src/lib/maj/usage.ts", "utf8");
    expect(ai).toContain("Vercel Gateway is not configured.");
    expect(connectors).toContain(
      "EKONOMI_WRAP_KEY or APP_SESSION_SECRET is required to save a key.",
    );
    expect(connectors).toContain("No wrap key.");
    expect(connectors).toContain("The key is too short to be real.");
    expect(actions).toContain("Unknown connection.");
    expect(inquiries).toContain("The domain cannot be used.");
    expect(usage).toContain("Usage is booked in positive integers.");
    expect(ai).not.toContain("Vercel Gateway är inte konfigurerad.");
    expect(actions).not.toContain("okänd anslutning.");
    expect(inquiries).not.toContain("Domänen går inte att använda.");
  });

  it("throws before writes on invalid leftover inputs", async () => {
    await expect(
      saveConnectorSecret({
        pool: {} as never,
        events: {} as never,
        orgRef: "pixdrift:org:org-exempelbolaget",
        actorRef: "tester",
        provider: "stripe",
        secret: "short",
        requestId: "test-conn",
      }),
    ).rejects.toThrow(/The key is too short to be real/);

    await expect(
      bookUsage({
        pool: {} as never,
        orgRef: "pixdrift:org:org-exempelbolaget",
        meter: "jobs",
        amount: 0,
      }),
    ).rejects.toThrow(/Usage is booked in positive integers/);

    const wrap = process.env.EKONOMI_WRAP_KEY;
    const session = process.env.APP_SESSION_SECRET;
    delete process.env.EKONOMI_WRAP_KEY;
    delete process.env.APP_SESSION_SECRET;
    try {
      expect(() => encryptSecret("long-enough-secret")).toThrow(
        /EKONOMI_WRAP_KEY or APP_SESSION_SECRET is required/,
      );
    } finally {
      if (wrap !== undefined) process.env.EKONOMI_WRAP_KEY = wrap;
      if (session !== undefined) process.env.APP_SESSION_SECRET = session;
    }
  });

  it("leaves invoice-book, tenancy, BRITT demo and TYRA reminder throws as written", () => {
    expect(readFileSync("src/lib/ekonomi/invoices.ts", "utf8")).toContain(
      "bara utkast kan utfärdas.",
    );
    expect(readFileSync("src/lib/ekonomi/money.ts", "utf8")).toContain(
      "antal måste vara ett heltal ≥ 1.",
    );
    expect(readFileSync("src/lib/platform/tenancy.ts", "utf8")).toContain("orgRef krävs");
    expect(readFileSync("src/lib/britt/intel.ts", "utf8")).toContain(
      "Demonstrationssiffror körs bara på huset.",
    );
    expect(readFileSync("src/lib/tyra/reminders.ts", "utf8")).toContain(
      "Kundtext får inte innehålla Tyra.",
    );
  });
});
