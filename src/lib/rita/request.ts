import { existsSync } from "node:fs";
import { join } from "node:path";
import type { EngineDocumentRequest, EngineRequest } from "@pixdrift/rita-engine";
import { uuidFromSeed } from "./uuid.ts";

/** Valid Swedish org number used in skattjakt's own fixtures. `556000-0000` fails the checksum. */
export const DEMO_ORG_NUMBER = "556016-0680";
export const DEMO_FISCAL_YEAR_START = "2025-01-01";
export const DEMO_FISCAL_YEAR_END = "2025-12-31";

export const NO_DOCUMENTS_REASON =
  "Inga dokument skickades. Motorn kräver minst ett underlag på disk. Kunduppladdning via Blob är inte kopplad.";
export const DEMO_DOCUMENT_HTTP_REASON =
  "Demonstrationsbokslutet är en lokal fil. HTTP-motorn läser sökvägar på hosten, inte i den här processen.";
export const DEMO_DOCUMENT_MISSING_REASON =
  "Demonstrationsbokslutet saknas i src/lib/rita/fixtures.";

export function demoBokslutPath(): string {
  return join(process.cwd(), "src/lib/rita/fixtures/exempel-bokslut.txt");
}

export function companyIdForOrg(orgRef: string): string {
  return uuidFromSeed(`rita:company:${orgRef}`);
}

export function demoDocumentRequest(): EngineDocumentRequest | null {
  const path = demoBokslutPath();
  if (!existsSync(path)) return null;
  return {
    document_id: uuidFromSeed("rita:doc:exempel-bokslut"),
    document_version_id: uuidFromSeed("rita:docver:exempel-bokslut"),
    path,
    content_type: "text/plain",
    filename: "exempel-bokslut.txt",
  };
}

export function buildEngineRequest(input: {
  analysisId: string;
  orgRef: string;
  companyName: string;
  orgNumber: string;
  documents: readonly EngineDocumentRequest[];
}): EngineRequest {
  return {
    analysis_id: input.analysisId,
    company: {
      id: companyIdForOrg(input.orgRef),
      name: input.companyName,
      org_number: input.orgNumber,
      fiscal_year_start: DEMO_FISCAL_YEAR_START,
      fiscal_year_end: DEMO_FISCAL_YEAR_END,
    },
    documents: input.documents,
    accounts_state: "unknown",
    audience: "company",
  };
}
