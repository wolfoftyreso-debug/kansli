import { ApiError, requireOrg } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { addObservation, listObservations } from "@/lib/britt/observations";

export async function GET() {
  return handleApi(async ({ actor, pool }) => {
    const present = requireOrg(actor);
    return json({ observations: await listObservations(pool, present.orgRef) });
  });
}

export async function POST(request: Request) {
  return handleApi(async ({ actor, pool, events, requestId }) => {
    const present = requireOrg(actor);
    const body = (await request.json().catch(() => null)) as {
      title?: string;
      body?: string;
    } | null;
    if (!body?.title?.trim()) throw new ApiError("invalid_request", "title krävs.");
    const observation = await addObservation({
      pool,
      events,
      orgRef: present.orgRef,
      actorRef: present.sub,
      title: body.title,
      body: body.body ?? "",
      requestId,
    });
    return json({ observation }, 201);
  });
}
