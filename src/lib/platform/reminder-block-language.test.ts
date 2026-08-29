import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { processDueOutbox } from "../tyra/reminders.ts";

describe("leftover reminder blocked-reason language", () => {
  it("uses English-canonical leftover blocked reasons like leftover provision details", () => {
    const source = readFileSync("src/lib/tyra/reminders.ts", "utf8");
    expect(source).toContain(
      "A vendor key is present, but sending is not wired yet. The row is not sent.",
    );
    expect(source).toContain("No SMS or email vendor is connected. The row is not sent.");
    expect(source).not.toContain("Leverantörsnyckel finns");
    expect(source).not.toContain("Raden skickas inte.");
  });

  it("does not queue or send when the leftover outbox is empty", async () => {
    const pool = {
      query: async () => ({ rows: [], rowCount: 0 }),
    };
    const events = {
      publish: async () => {
        throw new Error("should not publish");
      },
    };
    await expect(
      processDueOutbox({
        pool: pool as never,
        events: events as never,
        orgRef: "pixdrift:org:org-exempelbolaget",
        requestId: "test-reminder-block",
      }),
    ).resolves.toEqual({ blocked: 0, skipped: 0 });
  });

  it("leaves leftover Kundtext and reminder SMS bodies as written", () => {
    const source = readFileSync("src/lib/tyra/reminders.ts", "utf8");
    expect(source).toContain("Kundtext får inte innehålla Tyra.");
    expect(source).toContain("Påminnelse: hjul kvar hos verkstaden");
  });
});
