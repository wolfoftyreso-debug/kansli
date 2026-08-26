import { randomUUID } from "node:crypto";
import type { EventLog } from "@pixdrift/events";
import type pg from "pg";

/**
 * Cross-system sync. A handler may write only the schema of the system it
 * belongs to. TORA/RITA/IRMA/ALVA/Kansli never write `britt.observations`
 * from their own API; BRITT learns by listening.
 */
/** BRITT body from the event only — never reads `rita.analyses`. */
export function ritaCompletedObservationBody(payload: Record<string, unknown>): string {
  const company = typeof payload.companyName === "string" ? payload.companyName.trim() : "";
  const raw = payload.findingCount;
  const count = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  const findings = Number.isFinite(count) ? `${count} fynd` : "fyndunderlag klart";
  const head = company ? `${company}: ${findings}` : findings;
  const model =
    payload.modelConfigured === true ? "Med AI-stöd." : "Utan AI-stöd — bara fasta regler.";
  return `${head}. ${model}`;
}

export function registerSyncHandlers(events: EventLog, pool: pg.Pool): void {
  const record = async (
    orgRef: string | null,
    source: string,
    title: string,
    body: string,
    subjectRef: string | null,
    severity = "info",
  ) => {
    if (!orgRef) return;
    const id = randomUUID();
    await pool.query(
      `insert into britt.observations (id, org_ref, source_system, title, body, severity, subject_ref)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [id, orgRef, source, title, body, severity, subjectRef],
    );
    await events.publish({
      system: "britt",
      kind: "britt.observation.recorded",
      orgRef,
      subjectRef: `britt:observation:${id}`,
      payload: { title, source },
    });
  };

  events.subscribe("tora.market.evaluated", async (event) => {
    const openNow = Number(event.payload["openNow"] ?? 0);
    await record(
      event.orgRef,
      "tora",
      "TORA har utvärderat den offentliga marknaden",
      `${openNow} öppna möjligheter. ${String(event.payload["headline"] ?? "")}`.trim(),
      event.subjectRef,
    );
  });

  events.subscribe("rita.analysis.completed", async (event) => {
    await record(
      event.orgRef,
      "rita",
      "RITA har slutfört en analys",
      ritaCompletedObservationBody(event.payload),
      event.subjectRef,
    );
  });

  events.subscribe("rita.analysis.blocked", async (event) => {
    await record(
      event.orgRef,
      "rita",
      "RITA kunde inte köra analysen",
      String(event.payload["reason"] ?? "Analysen är inte inkopplad än."),
      event.subjectRef,
    );
  });

  events.subscribe("irma.agreement.created", async (event) => {
    const reissued = event.payload["reissued"] === true;
    await record(
      event.orgRef,
      "irma",
      reissued ? "IRMA har återutfärdat länken" : "IRMA har skapat ett avtal",
      String(event.payload["title"] ?? "Ett underlag väntar på motparten."),
      event.subjectRef,
    );
  });

  events.subscribe("irma.agreement.viewed", async (event) => {
    await record(
      event.orgRef,
      "irma",
      "Motparten har öppnat IRMA-länken",
      String(event.payload["title"] ?? "Avtalet är sett."),
      event.subjectRef,
    );
  });

  events.subscribe("irma.agreement.signed", async (event) => {
    await record(
      event.orgRef,
      "irma",
      "Motparten har bekräftat IRMA-underlaget",
      String(event.payload["title"] ?? "Avtalet är bekräftat."),
      event.subjectRef,
    );
  });

  events.subscribe("britt.finding.recorded", async (event) => {
    const severity = String(event.payload["severity"] ?? "info");
    if (severity !== "high") return;
    await record(
      event.orgRef,
      "britt",
      String(event.payload["title"] ?? "BRITT har ett högt fynd"),
      "Ett högt fynd från demonstrationsanalysen.",
      event.subjectRef,
      "high",
    );
  });

  events.subscribe("irma.agreement.cancelled", async (event) => {
    await record(
      event.orgRef,
      "irma",
      "IRMA-länken är återkallad",
      String(event.payload["title"] ?? "Motparten kan inte längre öppna underlaget."),
      event.subjectRef,
    );
  });

  events.subscribe("tyra.case.created", async (event) => {
    await record(
      event.orgRef,
      "tyra",
      "TYRA har ett nytt ärende",
      String(event.payload["registrationNumber"] ?? "Ett däckärende är skapat."),
      event.subjectRef,
    );
  });

  events.subscribe("tyra.case.completed", async (event) => {
    await record(
      event.orgRef,
      "tyra",
      "TYRA-ärendet är klart",
      "Alla obligatoriska steg är markerade som klara.",
      event.subjectRef,
    );
  });

  events.subscribe("tyra.reminder.enqueued", async (event) => {
    await record(
      event.orgRef,
      "tyra",
      "TYRA har köat en påminnelse",
      "Meddelandet ligger i kö och är inte skickat än.",
      event.subjectRef,
    );
  });

  events.subscribe("tyra.reminder.blocked", async (event) => {
    await record(
      event.orgRef,
      "tyra",
      "TYRA kunde inte skicka en påminnelse",
      "Det finns ingen koppling till SMS eller e-post, så meddelandet är stoppat.",
      event.subjectRef,
    );
  });

  events.subscribe("tyra.hub.link.issued", async (event) => {
    await record(
      event.orgRef,
      "tyra",
      "TYRA har skapat en kundlänk",
      "Länken visas bara en gång och sparas inte i läsbar form.",
      event.subjectRef,
    );
  });

  events.subscribe("alva.case.created", async (event) => {
    await record(
      event.orgRef,
      "alva",
      "ALVA har registrerat ett ärende",
      String(event.payload["note"] ?? "Ärendet är registrerat. Diagnosen är inte inkopplad än."),
      event.subjectRef,
    );
  });

  events.subscribe("creditae.inquiry.created", async (event) => {
    await record(
      event.orgRef,
      "creditae",
      "CREDITAE har en ny motpart",
      String(
        event.payload["note"] ?? "Förfrågan är registrerad. CREDITAE sätter inget kreditbetyg.",
      ),
      event.subjectRef,
    );
  });

  events.subscribe("creditae.assessment.recorded", async (event) => {
    await record(
      event.orgRef,
      "creditae",
      "CREDITAE har en bedömning",
      String(event.payload["note"] ?? "Bedömningen är er, inte ett kreditbetyg från en byrå."),
      event.subjectRef,
    );
  });

  events.subscribe("creditae.report.fetched", async (event) => {
    await record(
      event.orgRef,
      "creditae",
      "CREDITAE har en rapport från kreditbyrån",
      String(
        event.payload["note"] ?? "Byråns rapport är hämtad. CREDITAE sätter inte er slutsats.",
      ),
      event.subjectRef,
    );
  });

  events.subscribe("creditae.report.failed", async (event) => {
    await record(
      event.orgRef,
      "creditae",
      "CREDITAE fick ingen rapport",
      String(event.payload["note"] ?? "Kreditbyrån svarade inte. Förfrågan finns kvar."),
      event.subjectRef,
    );
  });

  events.subscribe("kansli.intake.received", async (event) => {
    await record(
      event.orgRef,
      "kansli",
      "Ny registrering",
      String(event.payload["title"] ?? "En kund registrerade sig. Faktura med 10 dagars betalning."),
      event.subjectRef,
    );
  });

  events.subscribe("kansli.account.provisioned", async (event) => {
    await record(
      event.orgRef,
      "kansli",
      "Verkstadskonto skapat",
      String(event.payload["title"] ?? "Kontot finns. Lösenordet visades en gång."),
      event.subjectRef,
    );
  });

  events.subscribe("kansli.task.created", async (event) => {
    await record(
      event.orgRef,
      "kansli",
      "Kansli har en ny intern uppgift",
      String(event.payload["title"] ?? ""),
      event.subjectRef,
    );
  });

  events.subscribe("kansli.task.updated", async (event) => {
    const deleted = event.payload["deleted"] === true;
    const done = event.payload["done"] === true;
    await record(
      event.orgRef,
      "kansli",
      deleted
        ? "Kansli tog bort en intern uppgift"
        : done
          ? "Kansli markerade en uppgift som klar"
          : "Kansli uppdaterade en intern uppgift",
      String(event.payload["title"] ?? ""),
      event.subjectRef,
    );
  });
}
