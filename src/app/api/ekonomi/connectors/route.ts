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
import { revolutHealth, warnOnCertificateExpiry } from "@/lib/ekonomi/revolut/health";

export async function GET() {
  return handleApi(async ({ actor, pool, events }) => {
    const present = requireOrg(actor);
    // Authenticated and org-scoped. Never a public endpoint: it describes the
    // state of a bank connection.
    const health = await revolutHealth(pool, present.orgRef);
    await warnOnCertificateExpiry(events, present.orgRef, health).catch(() => undefined);
    return json({
      slots: await listConnectorSlots(pool, present.orgRef),
      rails: publicRailBoard(),
      revolut: health,
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
      throw new ApiError("invalid_request", "provider is required.");
    }
    if (!body.secret)
      throw new ApiError("invalid_request", "secret is required. It is not echoed back.");
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
