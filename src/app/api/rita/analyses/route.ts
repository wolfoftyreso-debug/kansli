import { ApiError, requireOrg, requirePermission } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { listAnalyses, requestAnalysis } from "@/lib/rita/analyses";

export async function GET() {
  return handleApi(async ({ actor, pool }) => {
    const present = requireOrg(actor);
    return json({ analyses: await listAnalyses(pool, present.orgRef) });
  });
}

export async function POST(request: Request) {
  return handleApi(async ({ actor, pool, events, requestId }) => {
    const present = requirePermission(actor, "scan:run");
    const body = (await request.json().catch(() => null)) as {
      companyName?: string;
      orgNumber?: string;
      useDemoDocument?: boolean;
    } | null;
    if (!body?.companyName?.trim() || !body.orgNumber?.trim()) {
      throw new ApiError("invalid_request", "companyName och orgNumber krävs.");
    }
    const analysis = await requestAnalysis({
      pool,
      events,
      orgRef: present.orgRef,
      actorRef: present.sub,
      companyName: body.companyName,
      orgNumber: body.orgNumber,
      requestId,
      useDemoDocument: body.useDemoDocument === true,
    });
    return json({ analysis }, 201);
  });
}
