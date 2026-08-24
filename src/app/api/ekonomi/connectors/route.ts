import { ApiError, requireOrg, requirePermission } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import {
  CONNECTORS,
  listConnectorSlots,
  saveConnectorSecret,
  type ConnectorId,
} from "@/lib/ekonomi/connectors";
import { publicRailBoard } from "@/lib/ekonomi/connectors";
import { syncRevolut } from "@/lib/ekonomi/revolut";

export async function GET() {
  return handleApi(async ({ actor, pool }) => {
    const present = requireOrg(actor);
    return json({
      slots: await listConnectorSlots(pool, present.orgRef),
      rails: publicRailBoard(),
    });
  });
}

export async function POST(request: Request) {
  return handleApi(async ({ actor, pool, events, requestId }) => {
    const present = requirePermission(actor, "invoice:approve");
    const body = (await request.json().catch(() => null)) as {
      action?: string;
      provider?: string;
      secret?: string;
    } | null;
    if (body?.action === "sync_revolut") {
      return json(
        await syncRevolut({
          pool,
          events,
          orgRef: present.orgRef,
          actorRef: present.sub,
          requestId,
        }),
      );
    }
    if (!body?.provider || !(CONNECTORS as readonly string[]).includes(body.provider)) {
      throw new ApiError("invalid_request", "provider krävs.");
    }
    if (!body.secret)
      throw new ApiError("invalid_request", "secret krävs. Den ekas inte tillbaka.");
    const slot = await saveConnectorSecret({
      pool,
      events,
      orgRef: present.orgRef,
      actorRef: present.sub,
      provider: body.provider as ConnectorId,
      secret: body.secret,
      requestId,
    });
    return json({ slot });
  });
}
