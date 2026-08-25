import { requireActor } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";

export async function GET() {
  return handleApi(async ({ actor }) => {
    const present = requireActor(actor);
    return json({ user: present });
  });
}
