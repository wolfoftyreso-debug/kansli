import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import { addTask } from "./tasks.ts";
import {
  houseOrgRefFromEnv,
  insertIntake,
  parseIntakeForm,
  updateIntakeOutcome,
  type Intake,
} from "./intakes.ts";
import { PAYMENT_DAYS, priceOrder, VAT_RATE_BPS } from "./pricing.ts";
import { provisionWorkshopAccount, type ProvisionResult } from "./provision.ts";
import { createDraftInvoice, issueInvoice, type Invoice } from "../ekonomi/invoices.ts";

export interface SubmitIntakeResult {
  intake: Intake;
  passwordOnce: string | null;
  provision: ProvisionResult | null;
  invoice: Invoice | null;
}

/**
 * Self-service registration: the customer picks modules, gets a login, and an
 * invoice is issued with ten days to pay. No demo, no meeting. Paying the
 * invoice keeps the system running; an overdue one puts the rooms on hold.
 */
export async function submitIntake(input: {
  pool: pg.Pool;
  events: EventLog;
  form: FormData;
  ownerUrl?: string;
  houseOrgRef?: string;
}): Promise<SubmitIntakeResult> {
  const houseOrgRef = input.houseOrgRef ?? houseOrgRefFromEnv();
  const draft = parseIntakeForm(input.form, houseOrgRef);
  const order = priceOrder(draft.modules);
  draft.modules = order.modules;
  let intake = await insertIntake(input.pool, draft, order.monthlyNetOre);
  const blocked: string[] = [];
  let provision: ProvisionResult | null = null;
  let passwordOnce: string | null = null;
  let invoice: Invoice | null = null;

  await input.events.publish({
    system: "kansli",
    kind: "kansli.intake.received",
    orgRef: houseOrgRef,
    actorKind: "user",
    actorRef: intake.contactEmail,
    subjectRef: `kansli:intake:${intake.id}`,
    requestId: `intake-${intake.id}`,
    payload: {
      title: `${intake.companyName} — ny registrering`,
      companyName: intake.companyName,
      modules: intake.modules,
      monthlyNetOre: order.monthlyNetOre,
    },
  });

  await addTask(input.pool, {
    orgRef: houseOrgRef,
    title: `Ny registrering: ${intake.companyName} — ${intake.modules.join(", ")}`,
    owner: intake.contactName,
    createdBy: intake.contactEmail,
  });

  if (!input.ownerUrl) {
    blocked.push("PIXDRIFT_DB_OWNER_URL saknas. Kontot skapas inte här.");
  } else {
    try {
      provision = await provisionWorkshopAccount({
        ownerUrl: input.ownerUrl,
        companyName: intake.companyName,
        orgNumber: intake.orgNumber,
        contactName: intake.contactName,
        email: intake.contactEmail,
      });
      passwordOnce = provision.passwordOnce;
      await input.events.publish({
        system: "kansli",
        kind: "kansli.account.provisioned",
        orgRef: provision.orgRef,
        actorKind: "user",
        actorRef: provision.userId,
        subjectRef: `kansli:intake:${intake.id}`,
        requestId: `provision-${intake.id}`,
        payload: {
          title: provision.status === "created" ? "Konto skapat" : "Befintligt konto kopplat",
          companyName: intake.companyName,
          status: provision.status,
        },
      });
    } catch (error) {
      blocked.push(error instanceof Error ? error.message : "kontot kunde inte skapas.");
    }
  }

  const orgRefForInvoice = provision?.orgRef ?? houseOrgRef;
  try {
    const draftInvoice = await createDraftInvoice({
      pool: input.pool,
      events: input.events,
      orgRef: orgRefForInvoice,
      actorRef: provision?.userId ?? intake.contactEmail,
      customerName: intake.companyName,
      customerRef: intake.contactEmail,
      sourceSystem: "kansli",
      sourceRef: intake.id,
      requestId: `intake-inv-${intake.id}`,
      lines: order.lines.map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unitNetOre: line.unitNetOre,
        vatRateBps: VAT_RATE_BPS,
        kind: "service" as const,
      })),
    });
    invoice = await issueInvoice({
      pool: input.pool,
      events: input.events,
      orgRef: orgRefForInvoice,
      actorRef: provision?.userId ?? intake.contactEmail,
      invoiceId: draftInvoice.id,
      dueDays: PAYMENT_DAYS,
      requestId: `intake-issue-${intake.id}`,
    });
  } catch (error) {
    blocked.push(error instanceof Error ? error.message : "fakturan kunde inte utfärdas.");
  }

  const updated = await updateIntakeOutcome(input.pool, intake.id, {
    provisionedOrgId: provision?.orgId,
    provisionedOrgRef: provision?.orgRef,
    provisionedUserId: provision?.userId,
    provisionedEmail: provision?.email,
    invoiceId: invoice?.id,
    invoiceNumber: invoice?.number,
    passwordOnce,
    blocked,
  });
  if (updated) intake = updated;
  return { intake, passwordOnce, provision, invoice };
}
