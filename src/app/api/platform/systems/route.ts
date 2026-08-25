import { requireActor, requireOrg } from "@pixdrift/api-core";
import { SYSTEM_MODULES } from "@pixdrift/systems";
import { handleApi, json } from "@/lib/platform/http";

export async function GET() {
  return handleApi(async ({ actor }) => {
    requireActor(actor);
    requireOrg(actor);
    return json({ systems: SYSTEM_MODULES });
  });
}
