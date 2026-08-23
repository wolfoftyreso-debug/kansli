import { ApiError, requireOrg } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { createAgreement, listAgreements } from "@/lib/irma/agreements";

export async function GET() {
  return handleApi(async ({ actor, pool }) => {
    const present = requireOrg(actor);
    return json({ agreements: await listAgreements(pool, present.orgRef) });
  });
}

export async function POST(request: Request) {
  return handleApi(async ({ actor, pool, events, requestId }) => {
    const present = requireOrg(actor);
    const body = (await request.json().catch(() => null)) as {
      title?: string;
      counterparty?: string;
    } | null;
    if (!body?.title?.trim() || !body.counterparty?.trim()) {
      throw new ApiError("invalid_request", "title och counterparty krävs.");
    }
    const agreement = await createAgreement({
      pool,
      events,
      orgRef: present.orgRef,
      actorRef: present.sub,
      title: body.title,
      counterparty: body.counterparty,
      requestId,
    });
    return json({ agreement }, 201);
  });
}
