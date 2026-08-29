import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("leftover provision detail language", () => {
  it("uses English-canonical leftover details like leftover blocked notes", () => {
    const provision = readFileSync("src/lib/kansli/provision.ts", "utf8");
    expect(provision).toContain(
      "The email already exists. The new company was linked. Sign in with the password you already have.",
    );
    expect(provision).toContain("The account is created. The password is shown once.");
    expect(provision).not.toContain("E-posten fanns redan.");
    expect(provision).not.toContain("Konto skapat. Lösenordet visas en gång.");
  });

  it("leaves leftover event headlines and invoice lines as written", () => {
    const submit = readFileSync("src/lib/kansli/submit-intake.ts", "utf8");
    expect(submit).toContain('title: provision.status === "created" ? "Konto skapat"');
    expect(submit).toContain("Befintligt konto kopplat");
    expect(submit).toContain("ny registrering");
    expect(submit).toContain("Pixdrift år 1, del ${part} av ${YEAR_INSTALMENTS}");
  });
});
