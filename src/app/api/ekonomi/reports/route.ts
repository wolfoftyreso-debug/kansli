import { requireOrg } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { listInvoices } from "@/lib/ekonomi/invoices";
import { agedReceivables, journalCsv, vatCsv, vatReport } from "@/lib/ekonomi/reports";

export async function GET(request: Request) {
  return handleApi(async ({ actor, pool }) => {
    const present = requireOrg(actor);
    const kind = new URL(request.url).searchParams.get("kind") ?? "vat";
    const invoices = await listInvoices(pool, present.orgRef);
    const from = new Date(new Date().getUTCFullYear(), 0, 1);
    const to = new Date();
    if (kind === "journal") {
      const csv = await journalCsv(pool, present.orgRef);
      return new Response(csv, {
        headers: { "content-type": "text/csv; charset=utf-8" },
      });
    }
    if (kind === "aged") {
      return json(agedReceivables(invoices));
    }
    const csv = vatCsv(vatReport(invoices, from, to));
    return new Response(csv, {
      headers: { "content-type": "text/csv; charset=utf-8" },
    });
  });
}
