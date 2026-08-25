import { ACKNOWLEDGEMENT_DECLARATION, type AgreementClause } from "./clauses.ts";
import { artifactPayload, hashArtifact, hashContent } from "./agreements.ts";

export function verifyAgreementIntegrity(input: {
  id: string;
  title: string;
  counterparty: string;
  body: string;
  clauses: AgreementClause[];
  contentSha256: string | null;
  signerName: string | null;
  signedAt: string | null;
  artifactSha256: string | null;
}): { contentMatches: boolean | null; artifactMatches: boolean | null } {
  const contentMatches = input.contentSha256 ? hashContent(input) === input.contentSha256 : null;
  if (!input.artifactSha256 || !input.signerName || !input.signedAt) {
    return { contentMatches, artifactMatches: null };
  }
  const canonical = artifactPayload({
    id: input.id,
    title: input.title,
    counterparty: input.counterparty,
    clauses: input.clauses,
    signerName: input.signerName,
    signedAt: input.signedAt,
    declaration: ACKNOWLEDGEMENT_DECLARATION,
  });
  return { contentMatches, artifactMatches: hashArtifact(canonical) === input.artifactSha256 };
}
