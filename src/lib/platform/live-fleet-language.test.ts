import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const SOURCE = "src/lib/platform/live-fleet.test.ts";

describe("leftover live-fleet operator language", () => {
  it("uses English-canonical leftover operator copy like vendor-check", () => {
    const source = readFileSync(SOURCE, "utf8");
    expect(source).toContain("DATABASE_URL and PIXDRIFT_DB_OWNER_URL are required.");
    expect(source).toContain("missing schemas:");
    expect(source).toContain("provision incomplete:");
    expect(source).toContain("missing account/invoice");
    expect(source).toContain("shows the right company");
    expect(source).toContain("is missing ${needle}");
    expect(source).toContain("companies fully green");
    expect(source).not.toContain("PIXDRIFT_DB_OWNER_URL krävs.");
    expect(source).not.toContain("saknade scheman:");
    expect(source).not.toContain("provision ofullständig:");
    expect(source).not.toContain("saknar konto/faktura");
    expect(source).not.toContain("visar rätt bolag");
    expect(source).not.toContain("bolag helt gröna");
  });

  it("stays gated and does not run the fleet from this leftover check", () => {
    const source = readFileSync(SOURCE, "utf8");
    expect(source).toContain('process.env.LIVE_FLEET === "1"');
    expect(process.env.LIVE_FLEET).not.toBe("1");
  });

  it("leaves leftover Swedish fixture titles as written", () => {
    const source = readFileSync(SOURCE, "utf8");
    expect(source).toContain("Sommardäck ${n}");
    expect(source).toContain("Däckavtal ${companyName}");
    expect(source).toContain("Uppföljning ${companyName}");
  });
});
