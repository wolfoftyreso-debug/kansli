import { describe, expect, it } from "vitest";
import { DEFAULT_CLAUSES } from "./clauses.ts";
import { hashContent } from "./agreements.ts";
import { verifyAgreementIntegrity } from "./integrity.ts";

const base = {
  id: "agr-1",
  title: "Underlag",
  counterparty: "Motpart AB",
  body: "Text",
  clauses: [...DEFAULT_CLAUSES],
};

describe("verifyAgreementIntegrity", () => {
  it("matches a stored content hash and reports missing artifact", () => {
    const contentSha256 = hashContent(base);
    expect(
      verifyAgreementIntegrity({
        ...base,
        contentSha256,
        signerName: null,
        signedAt: null,
        artifactSha256: null,
      }),
    ).toEqual({ contentMatches: true, artifactMatches: null });
  });

  it("fails when title changes after the hash was stored", () => {
    const contentSha256 = hashContent(base);
    expect(
      verifyAgreementIntegrity({
        ...base,
        title: "Annat",
        contentSha256,
        signerName: null,
        signedAt: null,
        artifactSha256: null,
      }).contentMatches,
    ).toBe(false);
  });

  it("returns null content match for older rows without a hash", () => {
    expect(
      verifyAgreementIntegrity({
        ...base,
        contentSha256: null,
        signerName: null,
        signedAt: null,
        artifactSha256: null,
      }).contentMatches,
    ).toBeNull();
  });
});
