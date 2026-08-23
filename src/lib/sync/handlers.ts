import { randomUUID } from "node:crypto";
import type { EventLog } from "@pixdrift/events";
import type pg from "pg";

/**
 * Cross-system sync. A handler may write only the schema of the system it
 * belongs to. TORA/RITA never write `britt.observations` from their own API;
 * BRITT learns by listening.
 */
export function registerSyncHandlers(events: EventLog, pool: pg.Pool): void {
  const record = async (
    orgRef: string | null,
    source: string,
    title: string,
    body: string,
    subjectRef: string | null,
  ) => {
    if (!orgRef) return;
    const id = randomUUID();
    await pool.query(
      `insert into britt.observations (id, org_ref, source_system, title, body, severity, subject_ref)
       values ($1,$2,$3,$4,$5,'info',$6)`,
      [id, orgRef, source, title, body, subjectRef],
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
}
