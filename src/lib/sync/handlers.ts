import { randomUUID } from "node:crypto";
import type { EventLog } from "@pixdrift/events";
import type pg from "pg";

/**
 * Cross-system sync. A handler may write only the schema of the system it
 * belongs to. TORA/RITA/IRMA/ALVA/Kansli never write `britt.observations`
 * from their own API; BRITT learns by listening.
 */
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
      "Ett nytt fyndunderlag finns i RITA.",
      event.subjectRef,
    );
  });

  events.subscribe("rita.analysis.blocked", async (event) => {
    await record(
      event.orgRef,
      "rita",
      "RITA kunde inte köra analysmotorn",
      String(event.payload["reason"] ?? "Motorn är inte konfigurerad."),
      event.subjectRef,
    );
  });

  events.subscribe("irma.agreement.created", async (event) => {
    await record(
      event.orgRef,
      "irma",
      "IRMA har skapat ett avtal",
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

  events.subscribe("alva.case.created", async (event) => {
    await record(
      event.orgRef,
      "alva",
      "ALVA har registrerat ett fall",
      String(event.payload["note"] ?? "Diagnosmotorn saknas. Fallet är registrerat."),
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
}
