import { requireOrg } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { listOutbox } from "@/lib/tyra/reminders";

export async function GET() {
  return handleApi(async ({ actor, pool }) => {
    const present = requireOrg(actor);
    return json({ outbox: await listOutbox(pool, present.orgRef) });
  });
}
