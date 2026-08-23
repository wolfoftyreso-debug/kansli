import { ApiError, requireOrg } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { createCase, listCases } from "@/lib/alva/cases";

export async function GET() {
  return handleApi(async ({ actor, pool }) => {
    const present = requireOrg(actor);
    return json({
      cases: await listCases(pool, present.orgRef),
      engine: "deferred",
      note: "ALVA-repot anländer senare. Fallet registreras; diagnosmotorn saknas.",
    });
  });
}

export async function POST(request: Request) {
  return handleApi(async ({ actor, pool, events, requestId }) => {
    const present = requireOrg(actor);
    const body = (await request.json().catch(() => null)) as {
      complaint?: string;
      vehicleRef?: string;
    } | null;
    if (!body?.complaint?.trim()) throw new ApiError("invalid_request", "complaint krävs.");
    const item = await createCase({
      pool,
      events,
      orgRef: present.orgRef,
      actorRef: present.sub,
      complaint: body.complaint,
      vehicleRef: body.vehicleRef,
      requestId,
    });
    return json({ case: item, engine: "deferred" }, 201);
  });
}
