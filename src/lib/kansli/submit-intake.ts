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
import {
  instalmentDueDays,
  moduleLine,
  ALL_MODULES_LABEL,
  orderSpecification,
  priceOrder,
  VAT_RATE_BPS,
  YEAR_INSTALMENTS,
} from "./pricing.ts";
import { provisionWorkshopAccount, type ProvisionResult } from "./provision.ts";
import { createDraftInvoice, issueInvoice, type Invoice } from "../ekonomi/invoices.ts";

export interface SubmitIntakeResult {
  intake: Intake;
  passwordOnce: string | null;
  provision: ProvisionResult | null;
  /** First instalment. */
  invoice: Invoice | null;
  /** All ten instalments, issued at once. */
  invoices: Invoice[];
}

/**
 * Self-service registration for one year: the customer picks modules and gets
 * a login. All ten instalment invoices are issued at once — one-row invoices
 * with the detailed order specification attached — the first due in ten days,
 * the rest every thirty days. No demo, no meeting. Paying on time keeps the
 * system running; an overdue instalment puts the rooms on hold.
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
  const invoices: Invoice[] = [];

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
    blocked.push("PIXDRIFT_DB_OWNER_URL is missing. The account is not created here.");
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
      blocked.push(error instanceof Error ? error.message : "The account could not be created.");
    }
  }

  const orgRefForInvoice = provision?.orgRef ?? houseOrgRef;
  const summary = order.capped ? ALL_MODULES_LABEL : order.modules.map(moduleLine).join(" · ");
  const specification = orderSpecification(order, {
    companyName: intake.companyName,
    orgNumber: intake.orgNumber,
    contactName: intake.contactName,
    contactEmail: intake.contactEmail,
    registeredAt: new Date(intake.createdAt),
  });
  try {
    for (let part = 1; part <= YEAR_INSTALMENTS; part += 1) {
      const draftInvoice = await createDraftInvoice({
        pool: input.pool,
        events: input.events,
        orgRef: orgRefForInvoice,
        actorRef: provision?.userId ?? intake.contactEmail,
        customerName: intake.companyName,
        customerRef: intake.contactEmail,
        sourceSystem: "kansli",
        sourceRef: intake.id,
        attachmentText: specification,
        requestId: `intake-inv-${intake.id}-${part}`,
        lines: [
          {
            description: `Pixdrift år 1, del ${part} av ${YEAR_INSTALMENTS} — ${summary}`,
            quantity: 1,
            unitNetOre: order.monthlyNetOre,
            vatRateBps: VAT_RATE_BPS,
            kind: "service" as const,
          },
        ],
      });
      invoices.push(
        await issueInvoice({
          pool: input.pool,
          events: input.events,
          orgRef: orgRefForInvoice,
          actorRef: provision?.userId ?? intake.contactEmail,
          invoiceId: draftInvoice.id,
          dueDays: instalmentDueDays(part),
          requestId: `intake-issue-${intake.id}-${part}`,
        }),
      );
    }
  } catch (error) {
    blocked.push(error instanceof Error ? error.message : "The invoices could not be issued.");
  }

  const first = invoices[0] ?? null;
  const updated = await updateIntakeOutcome(input.pool, intake.id, {
    provisionedOrgId: provision?.orgId,
    provisionedOrgRef: provision?.orgRef,
    provisionedUserId: provision?.userId,
    provisionedEmail: provision?.email,
    invoiceId: first?.id,
    invoiceNumber: first?.number,
    invoiceNumbers: invoices.map((item) => item.number),
    passwordOnce,
    blocked,
  });
  if (updated) intake = updated;
  return { intake, passwordOnce, provision, invoice: first, invoices };
}
