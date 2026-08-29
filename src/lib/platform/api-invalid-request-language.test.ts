import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const API_ROOT = join(process.cwd(), "src/app/api");
const SWEDISH_INVALID = [
  "action måste vara issue eller record_payment.",
  "action=revoke krävs.",
  "Uppläsning är inte kopplad.",
  "signerName krävs.",
  "Underlaget kräver ingen bekräftelse.",
  "width, aspectRatio och rimDiameter krävs.",
  "companyName och orgNumber krävs.",
  "title och counterparty krävs.",
  "Titeln får inte vara tom.",
  "provider krävs.",
  "secret krävs. Den ekas inte tillbaka.",
  "customerName och minst en rad krävs.",
  "title krävs.",
  "customerId krävs.",
  "customerName, registrationNumber och operations krävs.",
  "complaint krävs.",
  "subjectOrgNumber krävs.",
  "Förfrågan gick inte att spara.",
  "AI_GATEWAY_API_KEY eller VERCEL_OIDC_TOKEN saknas.",
  "okänt system",
  "okänd händelse",
];
const ENGLISH_INVALID = [
  "action must be issue or record_payment.",
  "action=revoke is required.",
  "Speech is not connected.",
  "signerName is required.",
  "The record does not require acknowledgement.",
  "width, aspectRatio and rimDiameter are required.",
  "companyName and orgNumber are required.",
  "title and counterparty are required.",
  "The title must not be empty.",
  "provider is required.",
  "secret is required. It is not echoed back.",
  "customerName and at least one line are required.",
  "title is required.",
  "customerId is required.",
  "customerName, registrationNumber and operations are required.",
  "complaint is required.",
  "subjectOrgNumber is required.",
  "The inquiry could not be saved.",
  "AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN is missing.",
  "unknown system",
  "unknown event",
];

function routeFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return routeFiles(path);
    return entry.name === "route.ts" ? [path] : [];
  });
}

describe("API invalid_request language", () => {
  const sources = routeFiles(API_ROOT).map((path) => ({
    path,
    text: readFileSync(path, "utf8"),
  }));
  const joined = sources.map((file) => file.text).join("\n");

  it("uses English-canonical invalid_request and not_ready titles like MAJ", () => {
    const leftovers = sources.flatMap((file) =>
      SWEDISH_INVALID.filter((phrase) => file.text.includes(phrase)).map(
        (phrase) => `${file.path.replace(process.cwd() + "/", "")}: ${phrase}`,
      ),
    );
    expect(leftovers).toEqual([]);
    for (const phrase of ENGLISH_INVALID) {
      expect(joined).toContain(phrase);
    }
  });

  it("leaves intake sender check, org-number pass-through and authz as written", () => {
    expect(readFileSync("src/app/api/kansli/intake/route.ts", "utf8")).toContain("Fel avsändare.");
    expect(readFileSync("src/app/api/rita/analyses/route.ts", "utf8")).toContain("numberIssue");
    expect(readFileSync("packages/api-core/src/authz.ts", "utf8")).toContain("Saknar behörighet");
    expect(readFileSync("packages/api-core/src/error.ts", "utf8")).toContain(
      "An unexpected error occurred.",
    );
    expect(readFileSync("packages/mcp-core/src/errors.ts", "utf8")).toContain(
      "An unexpected error occurred.",
    );
  });
});
