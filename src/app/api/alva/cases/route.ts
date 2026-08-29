import { ApiError, requireOrg, requirePermission } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { createCase, listCases } from "@/lib/alva/cases";

export async function GET() {
  return handleApi(async ({ actor, pool }) => {
    const present = requireOrg(actor);
    return json({
      cases: await listCases(pool, present.orgRef),
      engine: "deferred",
      note: "The case is registered. Diagnosis is not connected yet.",
    });
  });
}

export async function POST(request: Request) {
  return handleApi(async ({ actor, pool, events, requestId }) => {
    const present = requirePermission(actor, "arende:write");
    const body = (await request.json().catch(() => null)) as {
      complaint?: string;
      vehicleRef?: string;
      area?: string;
      mileageKm?: number;
      desiredOutcome?: string;
    } | null;
    if (!body?.complaint?.trim()) throw new ApiError("invalid_request", "complaint is required.");
    const item = await createCase({
      pool,
      events,
      orgRef: present.orgRef,
      actorRef: present.sub,
      complaint: body.complaint,
      vehicleRef: body.vehicleRef,
      area: body.area,
      mileageKm: body.mileageKm,
      desiredOutcome: body.desiredOutcome,
      requestId,
    });
    return json({ case: item, engine: "deferred" }, 201);
  });
}
