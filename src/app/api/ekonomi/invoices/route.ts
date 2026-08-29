import { ApiError, requireOrg, requirePermission } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { createDraftInvoice, listInvoices, parseLineKind } from "@/lib/ekonomi/invoices";
import { parseVatRateBps } from "@/lib/ekonomi/money";

export async function GET() {
  return handleApi(async ({ actor, pool }) => {
    const present = requireOrg(actor);
    return json({ invoices: await listInvoices(pool, present.orgRef) });
  });
}

export async function POST(request: Request) {
  return handleApi(async ({ actor, pool, events, requestId }) => {
    const present = requirePermission(actor, "invoice:approve");
    const body = (await request.json().catch(() => null)) as {
      customerName?: string;
      customerRef?: string;
      sourceSystem?: string;
      sourceRef?: string;
      lines?: Array<{
        description?: string;
        quantity?: number;
        unitNetOre?: number;
        vatRateBps?: number;
        kind?: string;
      }>;
    } | null;
    if (!body?.customerName?.trim() || !body.lines?.length) {
      throw new ApiError("invalid_request", "customerName and at least one line are required.");
    }
    const invoice = await createDraftInvoice({
      pool,
      events,
      orgRef: present.orgRef,
      actorRef: present.sub,
      customerName: body.customerName,
      customerRef: body.customerRef,
      sourceSystem: body.sourceSystem,
      sourceRef: body.sourceRef,
      lines: body.lines.map((line) => ({
        description: line.description ?? "",
        quantity: line.quantity ?? 1,
        unitNetOre: line.unitNetOre ?? 0,
        vatRateBps: parseVatRateBps(line.vatRateBps),
        kind: parseLineKind(line.kind ?? "service"),
      })),
      requestId,
    });
    return json({ invoice }, 201);
  });
}
