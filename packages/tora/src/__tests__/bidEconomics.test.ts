/**
 * Anbudsekonomin.
 *
 * Aritmetiken prövas mot handräknade tal. Det som prövas hårdare är de fyra
 * gränser motorn finns för att hålla:
 *
 *   marginal      ≠  kontraktsvärde
 *   tomt fält     ≠  noll
 *   antagande     ≠  systemets bedömning
 *   aritmetik     ≠  rekommendation
 *
 * Den sista är den som är lättast att glida på i text. Ett verktyg som räknar
 * ut att ett anbud går back kommer nära att säga "avstå", och det får det inte
 * göra — beläggning, strategi och skälet att synas hos en köpare är sådant
 * företaget vet och systemet inte.
 */

import { describe, expect, it } from "vitest";

import { assessBidEconomics, type BidEconomics } from "../engine/bidEconomics";

function computed(result: BidEconomics) {
  if (result.status !== "computed") {
    throw new Error(`förväntade en uträkning, fick unknown: ${result.explanation}`);
  }
  return result;
}
function unknown(result: BidEconomics) {
  if (result.status !== "unknown") throw new Error("förväntade unknown, fick en uträkning");
  return result;
}

/* ------------------------------------------------------------------ */

describe("kostnaden måste vara känd", () => {
  it("räknar inte utan timmar", () => {
    expect(unknown(assessBidEconomics({ hourlyCostSek: 800 })).missing).toContain(
      "timmar för anbudsarbetet",
    );
  });

  it("räknar inte utan timkostnad", () => {
    // Att räkna en oangiven timkostnad som noll vore att påstå att
    // anbudsarbetet är gratis — precis den felräkning motorn finns för.
    expect(unknown(assessBidEconomics({ hours: 40 })).missing).toContain("din timkostnad");
  });

  it("avvisar noll och negativa tal", () => {
    expect(assessBidEconomics({ hours: 0, hourlyCostSek: 800 }).status).toBe("unknown");
    expect(assessBidEconomics({ hours: 40, hourlyCostSek: -1 }).status).toBe("unknown");
  });

  it("räknar utlägg som frivilliga, inte som saknade", () => {
    // Noll utlägg är ett rimligt fall; noll timkostnad är det inte.
    const result = computed(assessBidEconomics({ hours: 40, hourlyCostSek: 800 }));
    expect(result.bidCostSek).toBe(32_000);
  });
});

/* ------------------------------------------------------------------ */

describe("kostnaden", () => {
  it("summerar arbetstid och utlägg", () => {
    // 40 h × 800 kr = 32 000, plus 4 500 i utlägg.
    const result = computed(
      assessBidEconomics({ hours: 40, hourlyCostSek: 800, directCostsSek: 4_500 }),
    );
    expect(result.bidCostSek).toBe(36_500);
    expect(result.steps.some((s) => s.label === "Direkta utlägg")).toBe(true);
  });

  it("svarar med enbart kostnaden när värde och marginal saknas", () => {
    // Ett halvt svar är fortfarande ett svar — och ofta det enda som behövs
    // för att någon ska inse något.
    const result = computed(assessBidEconomics({ hours: 40, hourlyCostSek: 800 }));
    expect(result.breakEvenWinPct).toBeUndefined();
    expect(result.explanation).toContain("Ange uppdragets värde");
  });
});

/* ------------------------------------------------------------------ */

describe("break even", () => {
  const base = { hours: 40, hourlyCostSek: 800 }; // 32 000 kr

  it("räknar kostnad delat på marginal", () => {
    // Marginal: 1 000 000 × 10 % = 100 000. 32 000 / 100 000 = 32 %.
    const result = computed(
      assessBidEconomics({ ...base, contractValueSek: 1_000_000, marginPct: 10 }),
    );
    expect(result.contractMarginSek).toBe(100_000);
    expect(result.breakEvenWinPct).toBe(32);
    expect(result.explanation).toContain("en av 3");
  });

  it("räknar mot marginalen och aldrig mot kontraktsvärdet", () => {
    // Det klassiska felet: 32 000 / 1 000 000 = 3,2 %. Man behåller inte
    // kontraktsvärdet, man behåller sin marginal på det — här en tiopotens fel.
    const result = computed(
      assessBidEconomics({ ...base, contractValueSek: 1_000_000, marginPct: 10 }),
    );
    expect(result.breakEvenWinPct).not.toBeCloseTo(3.2, 1);
  });

  it("säger rakt ut när inte ens en säker vinst täcker kostnaden", () => {
    // Marginal 20 000 mot en anbudskostnad på 32 000: break even 160 %.
    const result = computed(
      assessBidEconomics({ ...base, contractValueSek: 200_000, marginPct: 10 }),
    );
    expect(result.breakEvenWinPct).toBe(160);
    expect(result.explanation).toContain("Även en garanterad vinst");
    // Det är aritmetik, och ska sägas vara det.
    expect(result.explanation).toContain("följer av talen");
  });
});

/* ------------------------------------------------------------------ */

describe("vinstchansen är användarens antagande", () => {
  const full = {
    hours: 40,
    hourlyCostSek: 800,
    contractValueSek: 1_000_000,
    marginPct: 10,
  };

  it("räknar förväntat utfall först när antagandet finns", () => {
    const utan = computed(assessBidEconomics(full));
    expect(utan.expectedValueSek).toBeUndefined();
    expect(utan.restsOnAssumption).toBe(false);

    // 40 % × 100 000 − 32 000 = 8 000.
    const med = computed(assessBidEconomics({ ...full, winProbabilityPct: 40 }));
    expect(med.expectedValueSek).toBe(8_000);
    expect(med.restsOnAssumption).toBe(true);
  });

  it("märker ut antagandet i klartext", () => {
    const result = computed(assessBidEconomics({ ...full, winProbabilityPct: 40 }));
    expect(result.explanation).toContain("ditt antagande");
  });

  it("kapar en vinstchans över hundra procent", () => {
    const result = computed(assessBidEconomics({ ...full, winProbabilityPct: 150 }));
    // 100 % × 100 000 − 32 000 = 68 000. Utan kapningen hade svaret blivit
    // 118 000, alltså mer marginal än uppdraget innehåller.
    expect(result.expectedValueSek).toBe(68_000);
  });
});

/* ------------------------------------------------------------------ */

describe("räknar, rekommenderar inte", () => {
  const cases = [
    { hours: 40, hourlyCostSek: 800, contractValueSek: 200_000, marginPct: 10 },
    { hours: 40, hourlyCostSek: 800, contractValueSek: 5_000_000, marginPct: 15 },
    { hours: 40, hourlyCostSek: 800, contractValueSek: 1_000_000, marginPct: 10, winProbabilityPct: 5 },
  ];

  it.each(cases)("säger aldrig lämna eller avstå (%#)", (input) => {
    const result = computed(assessBidEconomics(input));
    const text = `${result.explanation} ${result.steps.map((s) => s.label).join(" ")}`;
    expect(text).not.toMatch(/du bör|vi rekommenderar|avstå från att lämna|lämna inte|skippa/i);
  });

  it("påminner om att det finns skäl utanför kalkylen", () => {
    // Ett anbud som inte bär sig ensamt kan ändå vara rätt — att bli känd hos
    // en köpare är ett värde kalkylen inte ser.
    const result = computed(assessBidEconomics(cases[0]));
    expect(result.explanation).toContain("avgör du");
    expect(result.explanation).toMatch(/känd hos en köpare|positionera/);
  });

  it("bär förbudet mot prissamordning", () => {
    for (const input of [...cases, { hours: 1 }]) {
      const result = assessBidEconomics(input);
      expect(result.caveats.map((c) => c.key)).toContain("noPriceCoordination");
    }
  });
});
