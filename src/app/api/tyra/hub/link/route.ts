import { ApiError, requirePermission } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { issueHubLink } from "@/lib/tyra/hub";

export async function POST(request: Request) {
  return handleApi(async ({ actor, pool, events, requestId }) => {
    const present = requirePermission(actor, "arende:write");
    const body = (await request.json().catch(() => null)) as { customerId?: string } | null;
    if (!body?.customerId?.trim()) throw new ApiError("invalid_request", "customerId is required.");
    const issued = await issueHubLink({
      pool,
      events,
      orgRef: present.orgRef,
      actorRef: present.sub,
      customerId: body.customerId,
      requestId,
    });
    return json({ path: issued.path, token: issued.token }, 201);
  });
}
