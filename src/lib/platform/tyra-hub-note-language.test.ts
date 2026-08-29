import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { t } from "../i18n/index.ts";
import { hubCommercialNote } from "../tyra/hub.ts";

describe("leftover TYRA hub commercial-note language", () => {
  it("uses English-canonical leftover notes like leftover RITA fallbacks", () => {
    expect(hubCommercialNote("noVehicle")).toBe("No vehicle is linked yet.");
    expect(hubCommercialNote("noInspection")).toBe(
      "No verified inspection yet. No measurements are shown.",
    );
    expect(hubCommercialNote("actionNeeded")).toMatch(/Action needed/);
    expect(hubCommercialNote("followUp")).toMatch(/follow-up/);
    expect(hubCommercialNote("clear")).toMatch(/No warnings/);
    expect(hubCommercialNote("noInspection", "sv")).toMatch(/Ingen verifierad inspektion/);
    expect(t("en", "tyra.hub.note.noVehicle")).toBe("No vehicle is linked yet.");
    expect(t("sv", "tyra.hub.note.noVehicle")).toBe("Inget fordon är kopplat ännu.");

    const hub = readFileSync("src/lib/tyra/hub.ts", "utf8");
    expect(hub).not.toContain("Inget fordon är kopplat ännu.");
    expect(hub).not.toContain("Ingen verifierad inspektion finns ännu.");
  });

  it("leaves leftover tire-warning titles and reminder SMS as written", () => {
    expect(readFileSync("src/lib/tyra/tireWarnings.ts", "utf8")).toContain("Lågt mönsterdjup");
    expect(readFileSync("src/lib/tyra/reminders.ts", "utf8")).toContain(
      "Påminnelse: hjul kvar hos verkstaden",
    );
  });
});
