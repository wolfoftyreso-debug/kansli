import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { saveSalesAlertSettings } from "../ekonomi/sales-alerts.ts";
import { saveOpsSmsRoutes } from "./ops-desk.ts";

const ENGLISH = "Enter a Swedish mobile number, for example 070-123 45 67.";

describe("leftover phone validation throw language", () => {
  it("uses English-canonical leftover throws like leftover lib throws", () => {
    const ops = readFileSync("src/lib/platform/ops-desk.ts", "utf8");
    const sales = readFileSync("src/lib/ekonomi/sales-alerts.ts", "utf8");
    expect(ops).toContain(ENGLISH);
    expect(sales).toContain(ENGLISH);
    expect(ops).not.toContain("Skriv ett svenskt mobilnummer, till exempel 070-123 45 67.");
    expect(sales).not.toContain("Skriv ett svenskt mobilnummer, till exempel 070-123 45 67.");
  });

  it("throws before writes on an invalid leftover phone", async () => {
    await expect(
      saveOpsSmsRoutes({
        pool: {} as never,
        orgRef: "pixdrift:org:org-exempelbolaget",
        phone: "123",
        enabled: ["overdue"],
      }),
    ).rejects.toThrow(ENGLISH);

    await expect(
      saveSalesAlertSettings({
        pool: {} as never,
        orgRef: "pixdrift:org:org-exempelbolaget",
        phone: "",
        enabled: true,
      }),
    ).rejects.toThrow(ENGLISH);
  });

  it("leaves leftover alarm SMS bodies and the ping prompt as written", () => {
    expect(readFileSync("src/lib/platform/sms.ts", "utf8")).toContain(
      "Sälj: faktura ${input.invoiceNumber} till ${input.customerName}, ${input.amountLabel}. Pixdrift Ekonomi.",
    );
    expect(readFileSync("scripts/vendor-check.ts", "utf8")).toContain(
      "Svara med ett enda ord: pong. Inget annat.",
    );
  });
});
