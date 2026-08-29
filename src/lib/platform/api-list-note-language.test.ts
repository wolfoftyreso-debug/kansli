import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function routeFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return routeFiles(path);
    return entry.name === "route.ts" ? [path] : [];
  });
}

describe("API list note language", () => {
  const joined = routeFiles(join(process.cwd(), "src/app/api"))
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");

  it("uses English-canonical list notes like MAJ", () => {
    expect(joined).toContain(
      "MAJ shows decisions, not vendor metrics. Evidence sits behind every decision.",
    );
    expect(joined).toContain(
      "CREDITAE does not set a credit rating. The bureau report is not your conclusion.",
    );
    expect(joined).toContain("The case is registered. Diagnosis is not connected yet.");
    expect(joined).toContain("Wrong sender.");
    expect(joined).not.toContain("Fel avsändare.");
    expect(joined).not.toContain("CREDITAE sätter inget kreditbetyg.");
    expect(joined).not.toContain("Ärendet är registrerat.");
  });

  it("leaves stored event notes and org-number pass-through as written", () => {
    expect(readFileSync("src/lib/alva/cases.ts", "utf8")).toContain(
      "Ärendet är registrerat. Diagnosen är inte inkopplad än.",
    );
    expect(readFileSync("src/lib/creditae/inquiries.ts", "utf8")).toContain(
      "Förfrågan är registrerad. CREDITAE sätter inget kreditbetyg.",
    );
    expect(readFileSync("src/app/api/kansli/intake/route.ts", "utf8")).toContain(
      "does not check out|ten digits|is missing",
    );
    expect(readFileSync("src/app/api/kansli/intake/route.ts", "utf8")).toContain(
      "minst en modul|at least one module",
    );
  });
});
