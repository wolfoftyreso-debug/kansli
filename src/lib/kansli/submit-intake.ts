import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import { addTask } from "./tasks.ts";
import {
  houseOrgRefFromEnv,
  insertIntake,
  meetingAtFrom,
  parseIntakeForm,
  updateIntakeOutcome,
  type Intake,
} from "./intakes.ts";
import { provisionWorkshopAccount, type ProvisionResult } from "./provision.ts";
import { createDraftInvoice, issueInvoice, type Invoice } from "../ekonomi/invoices.ts";

export interface SubmitIntakeResult {
  intake: Intake;
  passwordOnce: string | null;
  provision: ProvisionResult | null;
  invoice: Invoice | null;
}

export async function submitIntake(input: {
  pool: pg.Pool;
  events: EventLog;
  form: FormData;
  ownerUrl?: string;
  houseOrgRef?: string;
  now?: Date;
}): Promise<SubmitIntakeResult> {
  const houseOrgRef = input.houseOrgRef ?? houseOrgRefFromEnv();
  const draft = parseIntakeForm(input.form, houseOrgRef);
  const meetingAt = meetingAtFrom(input.now ?? new Date());
  let intake = await insertIntake(input.pool, draft, meetingAt);
  const blocked: string[] = [];
  let provision: ProvisionResult | null = null;
  let passwordOnce: string | null = null;
  let invoice: Invoice | null = null;

  const meetingTitle = `Förbered demo för ${intake.companyName} — möte ${meetingAt.toISOString().slice(0, 10)}`;

  await input.events.publish({
    system: "kansli",
    kind: "kansli.intake.received",
    orgRef: houseOrgRef,
    actorKind: "user",
    actorRef: intake.contactEmail,
    subjectRef: `kansli:intake:${intake.id}`,
    requestId: `intake-${intake.id}`,
    payload: {
      title: `${intake.companyName} — koncernupphandling`,
      companyName: intake.companyName,
      meetingAt: intake.meetingAt,
    },
  });

  await addTask(input.pool, {
    orgRef: houseOrgRef,
    title: meetingTitle,
    owner: intake.contactName,
    createdBy: intake.contactEmail,
  });

  if (draft.provisionAccount) {
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
        await addTask(input.pool, {
          orgRef: provision.orgRef,
          title: meetingTitle,
          owner: intake.contactName,
          createdBy: provision.userId,
        });
      } catch (error) {
        blocked.push(error instanceof Error ? error.message : "kontot kunde inte skapas.");
      }
    }
  }

  const orgRefForInvoice = provision?.orgRef ?? houseOrgRef;
  if (draft.issueInvoice) {
    const netOre = draft.invoiceNetOre && draft.invoiceNetOre > 0 ? draft.invoiceNetOre : 250_000;
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
        lines: [
          {
            description: "Demoförberedelse — möte om 10 dagar. Inte Stripe. Inte Swish.",
            quantity: 1,
            unitNetOre: netOre,
            vatRateBps: 2500,
            kind: "service",
          },
        ],
      });
      invoice = await issueInvoice({
        pool: input.pool,
        events: input.events,
        orgRef: orgRefForInvoice,
        actorRef: provision?.userId ?? intake.contactEmail,
        invoiceId: draftInvoice.id,
        dueDays: 10,
        requestId: `intake-issue-${intake.id}`,
      });
    } catch (error) {
      blocked.push(error instanceof Error ? error.message : "fakturan kunde inte utfärdas.");
    }
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
