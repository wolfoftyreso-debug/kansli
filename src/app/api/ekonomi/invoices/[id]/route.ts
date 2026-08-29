import { ApiError, requireOrg, requirePermission } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { getInvoice, issueInvoice } from "@/lib/ekonomi/invoices";
import { listPayments, parseRail, recordReceivedPayment } from "@/lib/ekonomi/payments";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleApi(async ({ actor, pool }) => {
    const present = requireOrg(actor);
    const invoice = await getInvoice(pool, present.orgRef, id);
    if (!invoice) throw new ApiError("not_found", "The invoice does not exist.");
    return json({ invoice, payments: await listPayments(pool, present.orgRef, id) });
  });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleApi(async ({ actor, pool, events, requestId }) => {
    const present = requirePermission(actor, "invoice:approve");
    const body = (await request.json().catch(() => null)) as {
      action?: string;
      rail?: string;
      amountOre?: number;
      externalRef?: string;
    } | null;
    if (body?.action === "issue") {
      return json({
        invoice: await issueInvoice({
          pool,
          events,
          orgRef: present.orgRef,
          actorRef: present.sub,
          invoiceId: id,
          dueDays: 10,
          requestId,
        }),
      });
    }
    if (body?.action === "record_payment") {
      return json({
        payment: await recordReceivedPayment({
          pool,
          events,
          orgRef: present.orgRef,
          actorRef: present.sub,
          invoiceId: id,
          rail: parseRail(body.rail),
          amountOre: body.amountOre ?? 0,
          externalRef: body.externalRef,
          requestId,
        }),
      });
    }
    throw new ApiError("invalid_request", "action måste vara issue eller record_payment.");
  });
}
