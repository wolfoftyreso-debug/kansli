import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { lookupOpsDebug } from "./ops-debug.ts";
import { sanitizePayload } from "./ops-debug-view.ts";

const SHORT = "Enter at least three characters.";
const EMPTY = "Nothing matched. Try a request id, an event id or a case.";

describe("leftover ops-debug language", () => {
  it("uses English-canonical leftover notes like leftover lib throws", () => {
    const debug = readFileSync("src/lib/platform/ops-debug.ts", "utf8");
    const view = readFileSync("src/lib/platform/ops-debug-view.ts", "utf8");
    expect(debug).toContain(SHORT);
    expect(debug).toContain(EMPTY);
    expect(view).toContain('"[hidden]"');
    expect(debug).not.toContain("Skriv minst tre tecken.");
    expect(debug).not.toContain("Inget träffade.");
    expect(view).not.toContain("[dold]");
  });

  it("returns the English-canonical notes without writing", async () => {
    const unused = { query: async () => ({ rows: [], rowCount: 0 }) };
    await expect(
      lookupOpsDebug(unused as never, {
        q: "ab",
        scope: "org",
        orgRef: "pixdrift:org:org-exempelbolaget",
      }),
    ).resolves.toEqual({ q: "ab", events: [], outbox: [], note: SHORT });

    await expect(
      lookupOpsDebug(unused as never, {
        q: "req-missing",
        scope: "org",
        orgRef: "pixdrift:org:org-exempelbolaget",
      }),
    ).resolves.toEqual({ q: "req-missing", events: [], outbox: [], note: EMPTY });

    expect(sanitizePayload({ token: "secret", reason: "saknas" })).toEqual({
      token: "[hidden]",
      reason: "saknas",
    });
  });

  it("leaves leftover alarm SMS bodies as written", () => {
    expect(readFileSync("src/lib/platform/ops-desk.ts", "utf8")).toContain(
      "Larm: förfallen reskontra ${formatSek(facts.ledger.overdueOre)}. Pixdrift Drift.",
    );
    expect(readFileSync("src/lib/platform/sms.ts", "utf8")).toContain(
      "Sälj: faktura ${input.invoiceNumber} till ${input.customerName}, ${input.amountLabel}. Pixdrift Ekonomi.",
    );
  });
});
