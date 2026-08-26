import { ApiError, requireOrg, requirePermission } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { createInquiry, listInquiries } from "@/lib/creditae/inquiries";

export async function GET() {
  return handleApi(async ({ actor, pool }) => {
    const present = requireOrg(actor);
    return json({
      inquiries: await listInquiries(pool, present.orgRef),
      bureau: null,
      note: "Förfrågan är registrerad. CREDITAE sätter inget kreditbetyg.",
    });
  });
}

export async function POST(request: Request) {
  return handleApi(async ({ actor, pool, events, requestId }) => {
    const present = requirePermission(actor, "arende:write");
    const body = (await request.json().catch(() => null)) as {
      subjectOrgNumber?: string;
      subjectName?: string;
      reason?: string;
    } | null;
    if (!body?.subjectOrgNumber?.trim()) {
      throw new ApiError("invalid_request", "subjectOrgNumber krävs.");
    }
    try {
      const item = await createInquiry({
        pool,
        events,
        orgRef: present.orgRef,
        actorRef: present.sub,
        subjectOrgNumber: body.subjectOrgNumber,
        subjectName: body.subjectName,
        reason: body.reason,
        requestId,
      });
      return json({ inquiry: item, bureau: null }, 201);
    } catch (error) {
      throw new ApiError(
        "invalid_request",
        error instanceof Error ? error.message : "Förfrågan gick inte att spara.",
      );
    }
  });
}
