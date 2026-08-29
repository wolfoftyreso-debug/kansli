import { ApiError, requireOrg, requirePermission } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { createAgreement, listAgreements } from "@/lib/irma/agreements";

export async function GET(request: Request) {
  return handleApi(async ({ actor, pool }) => {
    const present = requireOrg(actor);
    const query = new URL(request.url).searchParams.get("q") ?? undefined;
    return json({ agreements: await listAgreements(pool, present.orgRef, query) });
  });
}

export async function POST(request: Request) {
  return handleApi(async ({ actor, pool, events, requestId }) => {
    const present = requirePermission(actor, "document:upload");
    const body = (await request.json().catch(() => null)) as {
      title?: string;
      counterparty?: string;
      body?: string;
      verificationLevel?: 0 | 1;
    } | null;
    if (!body?.title?.trim() || !body.counterparty?.trim()) {
      throw new ApiError("invalid_request", "title and counterparty are required.");
    }
    const agreement = await createAgreement({
      pool,
      events,
      orgRef: present.orgRef,
      actorRef: present.sub,
      title: body.title,
      counterparty: body.counterparty,
      body: body.body,
      verificationLevel: body.verificationLevel,
      requestId,
    });
    return json({ agreement }, 201);
  });
}
