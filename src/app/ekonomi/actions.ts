"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrgAction } from "@/lib/platform/actions";
import { saveConnectorSecret, type ConnectorId } from "@/lib/ekonomi/connectors";
import { CONNECTORS } from "@/lib/ekonomi/connectors";
import {
  bookSale,
  createDraftInvoice,
  issueInvoice,
  parseInvoiceLinesFromForm,
} from "@/lib/ekonomi/invoices";
import { parseKronorToOre } from "@/lib/ekonomi/money";
import { bookTyraQuote } from "@/lib/ekonomi/tyra-sales";
import { markQuoteInvoiced } from "@/lib/tyra/quotes";
import { offerPayment, parseRail, recordReceivedPayment } from "@/lib/ekonomi/payments";
import { saveSalesAlertSettings } from "@/lib/ekonomi/sales-alerts";
import { loadRevolutStatement, syncRevolut } from "@/lib/ekonomi/revolut";
import { revolutEnvironment } from "@/lib/ekonomi/revolut/config";
import { disconnect as disconnectRevolut } from "@/lib/ekonomi/revolut/connection";
import { logRevolut } from "@/lib/ekonomi/revolut/observability";

function formList(form: FormData, name: string): string[] {
  return form.getAll(name).map((value) => String(value));
}

function invoiceLinesFromForm(form: FormData) {
  return parseInvoiceLinesFromForm({
    descriptions: formList(form, "description"),
    quantities: formList(form, "quantity"),
    unitNetKronor: formList(form, "unitNetKronor"),
    unitNetOre: formList(form, "unitNetOre"),
    vatRates: formList(form, "vatRateBps"),
    kinds: formList(form, "kind"),
  });
}

export async function createInvoiceAction(form: FormData) {
  const { session, pool, events } = await requireOrgAction("/ekonomi", "invoice:approve");
  const created = await createDraftInvoice({
    pool,
    events,
    orgRef: session.org.ref,
    actorRef: session.sub,
    customerName: String(form.get("customerName") ?? ""),
    customerRef: String(form.get("customerRef") ?? ""),
    sourceSystem: String(form.get("sourceSystem") ?? "") || undefined,
    sourceRef: String(form.get("sourceRef") ?? "") || undefined,
    lines: invoiceLinesFromForm(form),
    requestId: `ekonomi-create-${Date.now()}`,
  });
  revalidatePath("/ekonomi");
  revalidatePath("/ekonomi/fakturor");
  redirect(`/ekonomi/fakturor/${created.id}`);
}

export async function bookSaleAction(form: FormData) {
  const { session, pool, events } = await requireOrgAction("/ekonomi", "invoice:approve");
  const created = await bookSale({
    pool,
    events,
    orgRef: session.org.ref,
    actorRef: session.sub,
    customerName: String(form.get("customerName") ?? ""),
    customerRef: String(form.get("customerRef") ?? ""),
    sourceSystem: String(form.get("sourceSystem") ?? "") || undefined,
    sourceRef: String(form.get("sourceRef") ?? "") || undefined,
    lines: invoiceLinesFromForm(form),
    requestId: `ekonomi-book-${Date.now()}`,
  });
  revalidatePath("/ekonomi");
  revalidatePath("/ekonomi/fakturor");
  revalidatePath(`/ekonomi/fakturor/${created.id}`);
  if (form.get("stay") === "1") redirect("/ekonomi");
  redirect(`/ekonomi/fakturor/${created.id}`);
}

export async function bookTyraQuoteAction(form: FormData) {
  const { session, pool, events } = await requireOrgAction("/ekonomi", "invoice:approve");
  const quoteId = String(form.get("quoteId") ?? "");
  const invoice = await bookTyraQuote({
    pool,
    events,
    orgRef: session.org.ref,
    actorRef: session.sub,
    quoteId,
    requestId: `ekonomi-tyra-${Date.now()}`,
  });
  revalidatePath("/ekonomi");
  revalidatePath("/ekonomi/fakturor");
  revalidatePath(`/ekonomi/fakturor/${invoice.id}`);
  revalidatePath("/tyra");
  await markQuoteInvoiced(pool, session.org.ref, quoteId);
  const tireCaseId = String(form.get("tireCaseId") ?? "").trim();
  if (tireCaseId) revalidatePath(`/tyra/cases/${tireCaseId}`);
}

export async function issueInvoiceAction(form: FormData) {
  const { session, pool, events } = await requireOrgAction("/ekonomi", "invoice:approve");
  const id = String(form.get("invoiceId") ?? "");
  await issueInvoice({
    pool,
    events,
    orgRef: session.org.ref,
    actorRef: session.sub,
    invoiceId: id,
    dueDays: 10,
    requestId: `ekonomi-issue-${Date.now()}`,
  });
  revalidatePath("/ekonomi");
  revalidatePath(`/ekonomi/fakturor/${id}`);
}

export async function offerPaymentAction(form: FormData) {
  const { session, pool } = await requireOrgAction("/ekonomi", "invoice:approve");
  const id = String(form.get("invoiceId") ?? "");
  await offerPayment({
    pool,
    orgRef: session.org.ref,
    invoiceId: id,
    rail: parseRail(form.get("rail")),
  });
  revalidatePath(`/ekonomi/fakturor/${id}`);
}

export async function saveSalesAlertAction(form: FormData) {
  const { session, pool } = await requireOrgAction("/ekonomi", "invoice:approve");
  await saveSalesAlertSettings({
    pool,
    orgRef: session.org.ref,
    phone: String(form.get("phone") ?? ""),
    enabled: form.get("enabled") === "on",
  });
  revalidatePath("/ekonomi");
}

export async function recordPaymentAction(form: FormData) {
  const { session, pool, events } = await requireOrgAction("/ekonomi", "invoice:approve");
  const id = String(form.get("invoiceId") ?? "");
  await recordReceivedPayment({
    pool,
    events,
    orgRef: session.org.ref,
    actorRef: session.sub,
    invoiceId: id,
    rail: parseRail(form.get("rail")),
    amountOre: (() => {
      const kronor = String(form.get("amountKronor") ?? "").trim();
      if (kronor) return parseKronorToOre(kronor, "belopp");
      return Number(form.get("amountOre"));
    })(),
    externalRef: String(form.get("externalRef") ?? ""),
    requestId: `ekonomi-pay-${Date.now()}`,
  });
  revalidatePath("/ekonomi");
  revalidatePath(`/ekonomi/fakturor/${id}`);
}

export async function saveConnectorAction(form: FormData) {
  const { session, pool, events } = await requireOrgAction(
    "/ekonomi/anslutningar",
    "invoice:approve",
  );
  const provider = String(form.get("provider") ?? "");
  if (!(CONNECTORS as readonly string[]).includes(provider)) {
    throw new Error("okänd anslutning.");
  }
  await saveConnectorSecret({
    pool,
    events,
    orgRef: session.org.ref,
    actorRef: session.sub,
    provider: provider as ConnectorId,
    secret: String(form.get("secret") ?? ""),
    requestId: `ekonomi-conn-${Date.now()}`,
  });
  revalidatePath("/ekonomi/anslutningar");
  revalidatePath("/ekonomi/kontoutdrag");
}

export async function syncRevolutAction() {
  const { session, pool, events } = await requireOrgAction(
    "/ekonomi/anslutningar",
    "invoice:approve",
  );
  await syncRevolut({
    pool,
    events,
    orgRef: session.org.ref,
    actorRef: session.sub,
    requestId: `ekonomi-revolut-${Date.now()}`,
  });
  revalidatePath("/ekonomi");
  revalidatePath("/ekonomi/anslutningar");
  revalidatePath("/ekonomi/kontoutdrag");
}

export async function refreshStatementAction() {
  const { session, pool, events } = await requireOrgAction(
    "/ekonomi/kontoutdrag",
    "invoice:approve",
  );
  await loadRevolutStatement({ pool, orgRef: session.org.ref, events });
  revalidatePath("/ekonomi/kontoutdrag");
}

/**
 * Ends the Revolut authorization. Revolut's Business API publishes no token
 * revocation endpoint for this flow, so we destroy the stored credentials and
 * tell the owner where to remove the app's consent in Revolut.
 */
export async function disconnectRevolutAction() {
  const { session, pool, events } = await requireOrgAction(
    "/ekonomi/anslutningar/revolut",
    "invoice:approve",
  );
  const environment = revolutEnvironment();
  await disconnectRevolut(pool, {
    orgRef: session.org.ref,
    environment,
    actorRef: session.sub,
  });
  logRevolut("connection.disconnected", { orgRef: session.org.ref, environment });
  await events
    .publish({
      system: "ekonomi",
      kind: "ekonomi.revolut.connection.disconnected",
      orgRef: session.org.ref,
      actorKind: "user",
      actorRef: session.sub,
      subjectRef: `ekonomi:connection:revolut:${environment}`,
      payload: { title: "Revolut kopplades bort", environment },
    })
    .catch(() => undefined);
  revalidatePath("/ekonomi/anslutningar");
  revalidatePath("/ekonomi/anslutningar/revolut");
  revalidatePath("/ekonomi/kontoutdrag");
}
