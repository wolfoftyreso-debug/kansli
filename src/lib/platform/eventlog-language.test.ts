import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EventLog } from "@pixdrift/events";

describe("EventLog language", () => {
  it("uses English-canonical throws like the events API", () => {
    const store = readFileSync("packages/events/src/store.ts", "utf8");
    expect(store).toContain("unknown system:");
    expect(store).toContain("unknown event:");
    expect(store).toContain("orgRef is required. EventLog does not list the whole book.");
    expect(store).not.toContain("okänt system:");
    expect(store).not.toContain("okänd händelse:");
    expect(store).not.toContain("orgRef krävs.");
  });

  it("throws before listing or writing", async () => {
    const log = new EventLog({ query: async () => ({ rows: [] }) } as never);
    await expect(log.list({} as never)).rejects.toThrow(
      /orgRef is required. EventLog does not list the whole book/,
    );
    await expect(
      log.publish({ system: "not-a-system" as never, kind: "kansli.task.created" }),
    ).rejects.toThrow(/unknown system: not-a-system/);
    await expect(log.publish({ system: "kansli", kind: "not-a-kind" as never })).rejects.toThrow(
      /unknown event: not-a-kind/,
    );
  });

  it("leaves stored CREDITAE and ALVA event notes as written", () => {
    expect(readFileSync("src/lib/alva/cases.ts", "utf8")).toContain(
      "Ärendet är registrerat. Diagnosen är inte inkopplad än.",
    );
    expect(readFileSync("src/lib/creditae/inquiries.ts", "utf8")).toContain(
      "Förfrågan är registrerad. CREDITAE sätter inget kreditbetyg.",
    );
  });
});
