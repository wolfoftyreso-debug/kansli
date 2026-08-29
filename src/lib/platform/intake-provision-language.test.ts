import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Kansli provision leftover-block language", () => {
  it("uses English-canonical leftover blocked notes like intake form throws", () => {
    const submit = readFileSync("src/lib/kansli/submit-intake.ts", "utf8");
    expect(submit).toContain("PIXDRIFT_DB_OWNER_URL is missing. The account is not created here.");
    expect(submit).toContain("The account could not be created.");
    expect(submit).toContain("The invoices could not be issued.");
    expect(submit).not.toContain("PIXDRIFT_DB_OWNER_URL saknas.");
    expect(submit).not.toContain("kontot kunde inte skapas.");
    expect(submit).not.toContain("fakturorna kunde inte utfärdas.");
  });

  it("leaves leftover invoice-book lines and event headlines as written", () => {
    const submit = readFileSync("src/lib/kansli/submit-intake.ts", "utf8");
    expect(submit).toContain("Pixdrift år 1, del ${part} av ${YEAR_INSTALMENTS}");
    expect(submit).toContain("ny registrering");
    expect(readFileSync("src/lib/ekonomi/invoices.ts", "utf8")).toContain(
      "bara utkast kan utfärdas.",
    );
  });
});
