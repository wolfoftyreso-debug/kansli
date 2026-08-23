import { requireOrg } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { listFindings, runIntel } from "@/lib/britt/intel";

export async function GET() {
  return handleApi(async ({ actor, pool }) => {
    const present = requireOrg(actor);
    return json({ findings: await listFindings(pool, present.orgRef) });
  });
}

export async function POST() {
  return handleApi(async ({ actor, pool, events, requestId }) => {
    const present = requireOrg(actor);
    const result = await runIntel({
      pool,
      events,
      orgRef: present.orgRef,
      actorRef: present.sub,
      requestId,
    });
    return json(result, 201);
  });
}
