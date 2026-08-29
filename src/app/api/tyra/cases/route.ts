import { ApiError, requireOrg, requirePermission } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { createCase, listCases, parseIntent, parseOperations } from "@/lib/tyra/cases";

export async function GET() {
  return handleApi(async ({ actor, pool }) => {
    const present = requireOrg(actor);
    return json({ cases: await listCases(pool, present.orgRef) });
  });
}

export async function POST(request: Request) {
  return handleApi(async ({ actor, pool, events, requestId }) => {
    const present = requirePermission(actor, "arende:write");
    const body = (await request.json().catch(() => null)) as {
      customerName?: string;
      registrationNumber?: string;
      make?: string;
      model?: string;
      intent?: string;
      operations?: string[];
    } | null;
    const operations = parseOperations(body?.operations);
    if (
      !body?.customerName?.trim() ||
      !body.registrationNumber?.trim() ||
      operations.length === 0
    ) {
      throw new ApiError(
        "invalid_request",
        "customerName, registrationNumber and operations are required.",
      );
    }
    const created = await createCase({
      pool,
      events,
      orgRef: present.orgRef,
      actorRef: present.sub,
      customerName: body.customerName,
      registrationNumber: body.registrationNumber,
      make: body.make,
      model: body.model,
      intent: parseIntent(body.intent),
      operations,
      requestId,
    });
    return json({ case: created }, 201);
  });
}
