import { describe, expect, it } from "vitest";
import { demoCompany } from "@pixdrift/tora";
import { buildCompanyBriefing } from "./briefing.ts";
import { capabilityLabel, requirementStatusText } from "./labels.ts";

describe("company briefing", () => {
  it("names what Tyresö El can do and which contract they already hold", () => {
    const briefing = buildCompanyBriefing(demoCompany);
    expect(briefing.name).toBe("Tyresö El & Installation AB");
    expect(briefing.facts.some((fact) => fact.value.includes("Elinstallation"))).toBe(true);
    expect(briefing.facts.some((fact) => fact.value.includes("Tyresö"))).toBe(true);
    expect(briefing.frameworks.some((item) => /Tyresö Bostäder/.test(item.buyer))).toBe(true);
    expect(briefing.references.some((item) => item.customer === "Tyresö kommun")).toBe(true);
  });
});

describe("labels", () => {
  it("uses everyday Swedish for codes", () => {
    expect(capabilityLabel("el.laddinfra")).toBe("Laddinfrastruktur");
    expect(requirementStatusText("remediable")).toBe("Går att fixa");
  });
});
