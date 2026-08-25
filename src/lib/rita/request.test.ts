import { describe, expect, it } from "vitest";
import {
  DEMO_ORG_NUMBER,
  buildEngineRequest,
  companyIdForOrg,
  demoBokslutPath,
  demoDocumentRequest,
} from "./request.ts";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("buildEngineRequest", () => {
  it("uses a UUID company id and the demo bokslut on disk", () => {
    const document = demoDocumentRequest();
    expect(document).not.toBeNull();
    expect(document!.path).toBe(demoBokslutPath());
    expect(document!.document_id).toMatch(UUID_V4);

    const request = buildEngineRequest({
      analysisId: "11111111-1111-4111-8111-111111111111",
      orgRef: "org-exempelbolaget",
      companyName: "Exempelbolaget AB",
      orgNumber: DEMO_ORG_NUMBER,
      documents: [document!],
    });

    expect(request.company.id).toBe(companyIdForOrg("org-exempelbolaget"));
    expect(request.company.id).toMatch(UUID_V4);
    expect(request.company.id).not.toBe("org-exempelbolaget");
    expect(request.company.org_number).toBe("556016-0680");
    expect(request.documents).toHaveLength(1);
    expect(request.documents[0]?.filename).toBe("exempel-bokslut.txt");
  });
});
