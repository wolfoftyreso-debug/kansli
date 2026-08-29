import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const API_ROOT = join(process.cwd(), "src/app/api");
const SWEDISH_NOT_FOUND = [
  "Ärendet saknas.",
  "fakturan finns inte.",
  "Avtalet finns inte.",
  "Analysen finns inte.",
  "Möjligheten finns inte i underlaget.",
  "Länken är ogiltig eller har gått ut.",
  "Uppgiften hittades inte.",
];
const ENGLISH_NOT_FOUND = [
  "The case does not exist.",
  "The invoice does not exist.",
  "The agreement does not exist.",
  "The analysis does not exist.",
  "The opportunity does not exist in the record.",
  "The link is invalid or has expired.",
  "The task does not exist.",
  "The project does not exist.",
];

function routeFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return routeFiles(path);
    return entry.name === "route.ts" ? [path] : [];
  });
}

describe("API not_found language", () => {
  const sources = routeFiles(API_ROOT).map((path) => ({
    path,
    text: readFileSync(path, "utf8"),
  }));
  const joined = sources.map((file) => file.text).join("\n");

  it("uses English-canonical not_found titles like MAJ", () => {
    const leftovers = sources.flatMap((file) =>
      SWEDISH_NOT_FOUND.filter((phrase) => file.text.includes(phrase)).map(
        (phrase) => `${file.path.replace(process.cwd() + "/", "")}: ${phrase}`,
      ),
    );
    expect(leftovers).toEqual([]);
    for (const phrase of ENGLISH_NOT_FOUND) {
      expect(joined).toContain(phrase);
    }
  });

  it("uses the same English-canonical not_found titles in lib throws", () => {
    expect(readFileSync("src/lib/tyra/cases.ts", "utf8")).toContain("The case does not exist.");
    expect(readFileSync("src/lib/ekonomi/invoices.ts", "utf8")).toContain(
      "The invoice does not exist.",
    );
    expect(readFileSync("src/lib/creditae/inquiries.ts", "utf8")).toContain(
      "The inquiry does not exist.",
    );
    expect(readFileSync("src/lib/tyra/cases.ts", "utf8")).not.toContain("Ärendet saknas.");
    expect(readFileSync("src/lib/ekonomi/invoices.ts", "utf8")).not.toContain(
      "fakturan finns inte.",
    );
  });
});
