import { SYSTEM_MODULES } from "@pixdrift/systems";
import { handleApi, json } from "@/lib/platform/http";

export async function GET() {
  return handleApi(async () => json({ systems: SYSTEM_MODULES }));
}
