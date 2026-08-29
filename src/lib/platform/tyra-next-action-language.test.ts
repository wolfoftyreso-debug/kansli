import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { t } from "../i18n/index.ts";
import { buildCustomerCard, nextActionLabel } from "../tyra/crm.ts";

const quoteInput = {
  customer: { id: "c1", name: "Erik Svensson" },
  vehicles: [{ id: "v1", registrationNumber: "DEF456" }],
  wheelSets: [
    {
      id: "ws1",
      vehicleId: "v1",
      season: "winter",
      status: "PICK_REQUESTED",
      storageStatus: "STORED",
    },
  ],
  opportunities: [{ id: "o1", wheelSetId: "ws1", status: "open", reason: "replacement" }],
};

describe("leftover TYRA next-action language", () => {
  it("uses English-canonical leftover next-action labels like leftover hub notes", () => {
    expect(nextActionLabel("prepareQuote")).toBe("Sell tyres");
    expect(nextActionLabel("pick")).toBe("Pick wheels");
    expect(nextActionLabel("checkIn")).toBe("Check in");
    expect(nextActionLabel("stored")).toBe("Stored wheels — no open action");
    expect(nextActionLabel("idle")).toBe("Nothing to do right now");
    expect(nextActionLabel("prepareQuote", "sv")).toBe("Sälj däck");
    expect(nextActionLabel("pick", "sv")).toBe("Plocka hjul");
    expect(nextActionLabel("checkIn", "sv")).toBe("Checka in");
    expect(nextActionLabel("stored", "sv")).toBe("Inlagda hjul — ingen öppen åtgärd");
    expect(nextActionLabel("idle", "sv")).toBe("Inget att göra just nu");
    expect(t("en", "tyra.cards.next.prepareQuote")).toBe("Sell tyres");
    expect(t("sv", "tyra.cards.next.prepareQuote")).toBe("Sälj däck");

    expect(buildCustomerCard(quoteInput).nextAction).toEqual({
      kind: "prepare_quote",
      label: "Sell tyres",
    });
    expect(buildCustomerCard({ ...quoteInput, locale: "sv" }).nextAction.label).toBe("Sälj däck");

    const crm = readFileSync("src/lib/tyra/crm.ts", "utf8");
    expect(crm).not.toContain("Sälj däck");
    expect(crm).not.toContain("Plocka hjul");
    expect(crm).not.toContain("Checka in");
    expect(crm).not.toContain("Inlagda hjul");
    expect(crm).not.toContain("Inget att göra just nu");
  });

  it("leaves leftover OPERATION_LABELS and reminder SMS as written", () => {
    expect(readFileSync("src/lib/tyra/services.ts", "utf8")).toContain('TIRE_QUOTE: "Sälj däck"');
    expect(readFileSync("src/lib/tyra/reminders.ts", "utf8")).toContain(
      "Påminnelse: hjul kvar hos verkstaden",
    );
  });
});
