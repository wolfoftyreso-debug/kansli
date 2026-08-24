import { isEventKind, isSystemId } from "@pixdrift/events";
import { ApiError, requireActor } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";

export async function GET(request: Request) {
  return handleApi(async ({ actor, events }) => {
    requireActor(actor);
    const url = new URL(request.url);
    const system = url.searchParams.get("system") ?? undefined;
    const kind = url.searchParams.get("kind") ?? undefined;
    const after = url.searchParams.get("after") ?? undefined;
    if (system && !isSystemId(system)) throw new ApiError("invalid_request", "okänt system");
    if (kind && !isEventKind(kind)) throw new ApiError("invalid_request", "okänd händelse");
    const order = url.searchParams.get("order") === "desc" ? "desc" : "asc";
    const items = await events.list({
      after,
      system: system as never,
      kind: kind as never,
      orgRef: actor?.orgRef ?? undefined,
      limit: Number(url.searchParams.get("limit") ?? 50),
      order,
    });
    return json({ events: items });
  });
}
