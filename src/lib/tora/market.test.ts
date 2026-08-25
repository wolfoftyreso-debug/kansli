import { describe, expect, it } from "vitest";
import { demoCompany } from "@pixdrift/tora";
import {
  loadToraCalendar,
  loadToraMarket,
  loadToraOpportunity,
  parseTier,
  resolveViewTier,
} from "./market.ts";
import { legalBasisText, opportunityHref } from "./view.ts";

describe("TORA loaders", () => {
  it("exposes upcoming, watch and history alongside openNow", () => {
    const market = loadToraMarket("enterprise");
    expect(market.openNow.length).toBe(market.summary.openNowCount);
    expect(market.upcoming.length).toBe(market.summary.upcomingCount);
    expect(market.watch.length).toBe(market.summary.watchCount);
    expect(market.history.length).toBeGreaterThan(0);
  });

  it("returns a legal basis for a known call-off", () => {
    const id = `opp:${demoCompany.id}:proc:tyresobostader-avrop-hiss`;
    const detail = loadToraOpportunity("enterprise", id);
    expect(detail).toBeDefined();
    const basis = legalBasisText(detail!.view.legalBasis);
    expect(basis.locked).toBe(false);
    expect(basis.contractId).toBeTruthy();
    expect(basis.reason.length).toBeGreaterThan(0);
    expect(opportunityHref(detail!.view)).toBe(`/tora/${encodeURIComponent(id)}`);
  });

  it("redacts the calendar for free tier and identifies for enterprise", () => {
    const free = loadToraCalendar("free");
    const paid = loadToraCalendar("enterprise");
    expect(free.alerts.state).toBe("locked");
    expect(paid.alerts.state).toBe("unlocked");
    const identified = [
      ...paid.thisWeek,
      ...paid.next30Days,
      ...paid.next90Days,
      ...paid.next12Months,
    ];
    expect(identified.some((entry) => entry.opportunityId)).toBe(true);
  });

  it("returns undefined for an unknown opportunity", () => {
    expect(loadToraOpportunity("pro", "opp:missing")).toBeUndefined();
  });
});

describe("resolveViewTier", () => {
  it("treats the demo company as a paying account", () => {
    expect(resolveViewTier({ sessionTier: undefined, usingDemoCompany: true })).toBe("enterprise");
    expect(resolveViewTier({ sessionTier: "free", usingDemoCompany: true })).toBe("enterprise");
  });

  it("maps provisioned paying aliases to enterprise", () => {
    expect(parseTier("pilot")).toBe("enterprise");
    expect(parseTier("paid")).toBe("enterprise");
    expect(parseTier("enterprise")).toBe("enterprise");
  });

  it("opens a free session as a paying account so the owner can see the product", () => {
    expect(resolveViewTier({ sessionTier: "free", usingDemoCompany: false })).toBe("enterprise");
  });

  it("keeps a named paying plan", () => {
    expect(resolveViewTier({ sessionTier: "professional", usingDemoCompany: false })).toBe(
      "professional",
    );
  });
});
